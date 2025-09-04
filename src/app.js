// src/app.js
import Fastify from 'fastify';
import fetch from 'node-fetch';
import crypto from 'crypto';
import { readFileSync } from 'fs';
import path from 'path';
import url from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ===== CONFIGURAÇÃO SEGURA DO FASTIFY =====
const app = Fastify({ 
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    transport: process.env.NODE_ENV === 'development' ? {
      target: 'pino-pretty',
      options: { colorize: true }
    } : undefined
  }
});

// ===== PLUGINS DE SEGURANÇA =====
await app.register(import('@fastify/helmet'), {
  global: true,
  crossOriginResourcePolicy: { policy: 'cross-origin' }
});

await app.register(import('@fastify/cors'), {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || false,
  credentials: true
});

await app.register(import('@fastify/rate-limit'), {
  max: parseInt(process.env.RATE_LIMIT_MAX) || 10,
  timeWindow: parseInt(process.env.RATE_LIMIT_WINDOW) || 60000,
  skipOnError: true
});

// ===== VARIÁVEIS DE AMBIENTE =====
// ===== VARIÁVEIS DE AMBIENTE =====
const {
  WHATSAPP_TOKEN,
  PHONE_NUMBER_ID,
  VERIFY_TOKEN,
  APP_SECRET,
  OPENAI_API_KEY,
  ADMIN_PHONE,
  NODE_ENV
} = process.env;

// ===== VALIDAÇÃO DE CONFIGURAÇÃO =====
const requiredEnvVars = [
  'WHATSAPP_TOKEN',
  'PHONE_NUMBER_ID', 
  'VERIFY_TOKEN',
  'APP_SECRET',
  'OPENAI_API_KEY'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    app.log.error(`❌ Variável de ambiente obrigatória não configurada: ${envVar}`);
    if (NODE_ENV === 'production') {
      process.exit(1);
    }
  }
}

app.log.info('✅ Configuração validada com sucesso');

// ===== PROMPTS & CONTEXTO =====
const SYSTEM_PROMPT = readFileSync(path.join(__dirname, 'prompt_juli.md'), 'utf8');
const KIT_RESPOSTAS = readFileSync(path.join(__dirname, 'kit_respostas.md'), 'utf8');

// ===== ESTADO SEGURO EM MEMÓRIA =====
// IMPORTANTE: Em produção, substituir por Redis ou banco de dados
const state = new Map(); // key: waId, value: { human_active, last_intent, lead_source, created_at }
const messageCache = new Map(); // Cache para evitar duplicatas

function setState(waId, patch) {
  const prev = state.get(waId) || { 
    human_active: false, 
    last_intent: null, 
    lead_source: null,
    created_at: new Date().toISOString()
  };
  const updated = { ...prev, ...patch, updated_at: new Date().toISOString() };
  state.set(waId, updated);
  
  // Log de auditoria
  app.log.info({ 
    action: 'state_update', 
    waId: waId.slice(-4), // Log apenas últimos 4 dígitos por privacidade
    changes: patch 
  });
  
  return updated;
}

function getState(waId) {
  return state.get(waId) || { 
    human_active: false, 
    last_intent: null, 
    lead_source: null,
    created_at: new Date().toISOString()
  };
}

// ===== RATE LIMITING POR USUÁRIO =====
const userRateLimit = new Map(); // waId -> { count, resetTime }

function isRateLimited(waId) {
  const now = Date.now();
  const limit = userRateLimit.get(waId);
  
  if (!limit || now > limit.resetTime) {
    userRateLimit.set(waId, { count: 1, resetTime: now + 60000 }); // 1 minuto
    return false;
  }
  
  if (limit.count >= 5) { // Máximo 5 mensagens por minuto
    return true;
  }
  
  limit.count++;
  return false;
}

// ===== UTILS WHATSAPP SEGUROS =====
function isValidSignature(rawBody, signature) {
  if (!APP_SECRET || !signature) {
    app.log.warn('Assinatura inválida: APP_SECRET ou signature ausentes');
    return false;
  }
  
  try {
    const hmac = crypto.createHmac('sha256', APP_SECRET).update(rawBody, 'utf-8').digest('hex');
    const expectedSignature = `sha256=${hmac}`;
    const isValid = crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(signature)
    );
    
    if (!isValid) {
      app.log.warn('Assinatura de webhook inválida');
    }
    
    return isValid;
  } catch (error) {
    app.log.error({ error: error.message }, 'Erro ao validar assinatura');
    return false;
  }
}

async function sendWhatsAppText(toWaId, body, retries = 3) {
  const url = `https://graph.facebook.com/v20.0/${PHONE_NUMBER_ID}/messages`;
  const payload = {
    messaging_product: 'whatsapp',
    to: toWaId,
    type: 'text',
    text: { body: body.slice(0, 4096) } // Limite do WhatsApp
  };

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${WHATSAPP_TOKEN}`, 
          'Content-Type': 'application/json',
          'User-Agent': 'Juli-WhatsApp-Bot/1.0'
        },
        body: JSON.stringify(payload),
        timeout: 10000 // 10 segundos timeout
      });

      if (res.ok) {
        const data = await res.json();
        app.log.info({ 
          action: 'message_sent',
          toWaId: toWaId.slice(-4),
          messageId: data.messages?.[0]?.id
        });
        return data;
      } else {
        const errorText = await res.text();
        app.log.error({ 
          attempt,
          status: res.status,
          error: errorText 
        }, 'Falha ao enviar mensagem WhatsApp');
        
        if (attempt === retries) {
          throw new Error(`WhatsApp API error: ${res.status} - ${errorText}`);
        }
      }
    } catch (error) {
      app.log.error({ attempt, error: error.message }, 'Erro na tentativa de envio');
      
      if (attempt === retries) {
        throw error;
      }
      
      // Backoff exponencial
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
}

// ===== OPENAI CALL CORRIGIDA =====
async function llmReply(userText, waId) {
  const s = getState(waId);

  // Se humano ativo, não responder
  if (s.human_active) {
    app.log.info({ waId: waId.slice(-4) }, 'Humano ativo - IA em standby');
    return null;
  }

  try {
    // Detecção de intents e lead source
    const txt = (userText || '').toLowerCase();
    if (/facebook|instagram|anúncio|anuncio|ads|patrocinad[ao]/.test(txt)) {
      setState(waId, { lead_source: 'ads' });
    }
    
    let intent = null;
    if (/reembolso|estorno/.test(txt)) intent = 'reembolso';
    else if (/cr[eé]dito|digitar.*telefone|2.*d[ií]gitos/.test(txt)) intent = 'credito';
    else if (/comprovante|pagamento.*n[aã]o liberou|m[aá]quina.*n[aã]o/.test(txt)) intent = 'pagamento_nao_liberou';
    else if (/cupom|primeira.*vez|promo/.test(txt)) intent = 'lead_pago';

    if (intent) setState(waId, { last_intent: intent });

    // Construir mensagens para OpenAI
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      { 
        role: 'system', 
        content: `Contexto do usuário:\n- Estado: ${JSON.stringify(getState(waId))}\n- Kit de respostas (use apenas se a intenção bater):\n${KIT_RESPOSTAS}` 
      },
      { role: 'user', content: userText }
    ];

    // Chamada correta para OpenAI API
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${OPENAI_API_KEY}`, 
        'Content-Type': 'application/json',
        'User-Agent': 'Juli-WhatsApp-Bot/1.0'
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo', // Modelo correto e estável
        messages: messages,
        max_tokens: 500,
        temperature: 0.7,
        presence_penalty: 0.1,
        frequency_penalty: 0.1
      }),
      timeout: 15000 // 15 segundos timeout
    });

    if (!res.ok) {
      const errorText = await res.text();
      app.log.error({ 
        status: res.status, 
        error: errorText,
        waId: waId.slice(-4)
      }, 'Erro na API OpenAI');
      
      return 'Tive uma instabilidade agora, mas já me recuperei. Pode repetir em poucas palavras, por favor? 🤖';
    }

    const data = await res.json();
    const output = data.choices?.[0]?.message?.content;
    
    if (!output) {
      app.log.warn({ data }, 'Resposta vazia da OpenAI');
      return 'Como posso ajudar você hoje? 😊';
    }

    app.log.info({ 
      waId: waId.slice(-4),
      intent,
      outputLength: output.length
    }, 'Resposta gerada com sucesso');

    return output;

  } catch (error) {
    app.log.error({ 
      error: error.message,
      waId: waId.slice(-4)
    }, 'Erro ao gerar resposta LLM');
    
    return 'Ops, tive um probleminha técnico. Pode tentar novamente? 🔧';
  }
}

// ===== ROTEADORES SEGUROS =====
app.get('/', async () => ({ 
  ok: true, 
  name: 'Juli WhatsApp Bot', 
  version: '1.0.0',
  health: 'green',
  timestamp: new Date().toISOString()
}));

app.get('/health', async (req, reply) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    env: NODE_ENV
  };
  
  reply.code(200).send(health);
});

// ===== WEBHOOK VERIFY (GET) =====
app.get('/webhook', async (req, reply) => {
  try {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    app.log.info({ mode, token: token ? 'presente' : 'ausente' }, 'Verificação webhook');

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      app.log.info('✅ Webhook verificado com sucesso');
      return reply.code(200).send(challenge);
    }

    app.log.warn('❌ Token de verificação inválido');
    return reply.code(403).send('Forbidden');
  } catch (error) {
    app.log.error({ error: error.message }, 'Erro na verificação webhook');
    return reply.code(500).send('Internal Server Error');
  }
});

// ===== WEBHOOK RECEIVE (POST) - SEGURO =====
app.post('/webhook', async (req, reply) => {
  try {
    const signature = req.headers['x-hub-signature-256'];
    const rawBody = req.rawBody || JSON.stringify(req.body || {});
    
    // Validação rigorosa da assinatura
    if (!isValidSignature(rawBody, signature)) {
      app.log.warn({ 
        signature: signature ? 'presente' : 'ausente',
        ip: req.ip 
      }, 'Tentativa de acesso não autorizado');
      return reply.code(401).send('Unauthorized');
    }

    const body = req.body;
    const change = body?.entry?.[0]?.changes?.[0]?.value;
    const messages = change?.messages;

    if (!messages?.length) {
      return reply.code(200).send('EVENT_RECEIVED');
    }

    // Processar cada mensagem
    for (const m of messages) {
      const from = m.from; // E.164 sem '+'
      const messageId = m.id;
      
      // Evitar processar mensagens duplicadas
      if (messageCache.has(messageId)) {
        app.log.debug({ messageId }, 'Mensagem duplicada ignorada');
        continue;
      }
      messageCache.set(messageId, true);
      
      // Limpar cache antigo (manter apenas últimas 1000)
      if (messageCache.size > 1000) {
        const oldestKey = messageCache.keys().next().value;
        messageCache.delete(oldestKey);
      }

      // Rate limiting por usuário
      if (isRateLimited(from)) {
        app.log.warn({ waId: from.slice(-4) }, 'Rate limit atingido');
        await sendWhatsAppText(from, 'Por favor, aguarde um momento antes de enviar outra mensagem. 🕐');
        continue;
      }

      // Processar apenas mensagens de texto por enquanto
      if (m.type === 'text') {
        const text = m.text?.body?.trim() || '';
        
        app.log.info({ 
          waId: from.slice(-4),
          messageId,
          textLength: text.length
        }, 'Mensagem recebida');

        // Comandos administrativos para o time humano
        if (/^#humano_on$/i.test(text)) {
          setState(from, { human_active: true });
          await sendWhatsAppText(from, 'Ok! O time humano está com você agora. 👨‍💼');
          continue;
        }
        
        if (/^#humano_off$/i.test(text)) {
          setState(from, { human_active: false });
          await sendWhatsAppText(from, 'Voltei para te ajudar! 🤖 Como posso ajudar?');
          continue;
        }

        // Opt-out / Opt-in (conformidade WhatsApp)
        if (/^(sair|stop|cancelar|parar)$/i.test(text)) {
          setState(from, { opted_out: true });
          await sendWhatsAppText(from, 'Entendido! Você não receberá mais mensagens promocionais. Para voltar, digite VOLTA. 🚪');
          continue;
        }
        
        if (/^volta(r)?$/i.test(text)) {
          setState(from, { opted_out: false });
          await sendWhatsAppText(from, 'Que bom ter você de volta! ✅ Como posso ajudar?');
          continue;
        }

        // Verificar se usuário optou por não receber mensagens
        const userState = getState(from);
        if (userState.opted_out) {
          app.log.info({ waId: from.slice(-4) }, 'Usuário optou por não receber mensagens');
          continue;
        }

        // Resposta da IA
        try {
          const replyText = await llmReply(text, from);
          if (replyText) {
            await sendWhatsAppText(from, replyText);
          }
        } catch (error) {
          app.log.error({ 
            error: error.message,
            waId: from.slice(-4)
          }, 'Erro ao processar mensagem');
          
          await sendWhatsAppText(from, 'Ops, tive um problema técnico. Pode tentar novamente? 🔧');
        }
      } else {
        // Log de tipos de mensagem não suportados
        app.log.info({ 
          waId: from.slice(-4),
          messageType: m.type
        }, 'Tipo de mensagem não suportado');
      }
    }

    return reply.code(200).send('EVENT_RECEIVED');

  } catch (error) {
    app.log.error({ error: error.message }, 'Erro no webhook');
    return reply.code(500).send('Internal Server Error');
  }
});

// ===== MIDDLEWARE PARA CAPTURAR RAW BODY =====
app.addHook('onRequest', async (req, _res) => {
  if (req.method === 'POST' && req.url === '/webhook') {
    let data = '';
    try {
      await new Promise((resolve, reject) => {
        req.raw.on('data', chunk => (data += chunk));
        req.raw.on('end', resolve);
        req.raw.on('error', reject);
      });
      req.rawBody = data;
    } catch (error) {
      app.log.error({ error: error.message }, 'Erro ao capturar raw body');
      req.rawBody = JSON.stringify(req.body || {});
    }
  }
});

// ===== GRACEFUL SHUTDOWN =====
process.on('SIGTERM', async () => {
  app.log.info('🛑 Recebido SIGTERM, iniciando shutdown graceful...');
  try {
    await app.close();
    app.log.info('✅ Servidor encerrado com sucesso');
    process.exit(0);
  } catch (error) {
    app.log.error({ error: error.message }, '❌ Erro durante shutdown');
    process.exit(1);
  }
});

process.on('SIGINT', async () => {
  app.log.info('🛑 Recebido SIGINT, iniciando shutdown graceful...');
  try {
    await app.close();
    app.log.info('✅ Servidor encerrado com sucesso');
    process.exit(0);
  } catch (error) {
    app.log.error({ error: error.message }, '❌ Erro durante shutdown');
    process.exit(1);
  }
});

// ===== INICIALIZAÇÃO DO SERVIDOR =====
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

try {
  await app.listen({ port: PORT, host: HOST });
  app.log.info(`🚀 Juli WhatsApp Bot rodando na porta ${PORT}`);
  app.log.info(`📱 Webhook URL: http://localhost:${PORT}/webhook`);
  app.log.info(`🏥 Health check: http://localhost:${PORT}/health`);
} catch (error) {
  app.log.error({ error: error.message }, '❌ Falha ao iniciar servidor');
  process.exit(1);
}
