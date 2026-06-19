/* global process */
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import { markingStylesPrompt } from './api/markingStyles.js';

// Obtener rutas relativas en entorno ES Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5174;
const PORT_DEV = process.env.PORT_DEV || 5175;
const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY || '';
const NODE_ENV = process.env.NODE_ENV || 'production';

// Configurar límite de tamaño para payloads de imágenes base64 grandes (máximo 15MB)
app.use(express.json({ limit: '30mb' }));

// Configurar CORS de forma segura
const corsOptions = {
  origin: NODE_ENV === 'development' ? '*' : false, // Deshabilitar CORS externo en producción
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-NVIDIA-API-Key'],
  credentials: true,
  optionsSuccessStatus: 204
};
app.use(cors(corsOptions));

// ── CABECERAS DE SEGURIDAD HTTP (HELMET PERSONALIZADO) ─────────────────────
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(self), microphone=(), geolocation=(), payment=()');
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  
  // Content Security Policy (CSP) robusta
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self' https://integrate.api.nvidia.com; frame-ancestors 'none'"
  );
  
  if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
    res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  }
  
  next();
});

// Bloquear métodos HTTP no deseados en la API
app.use('/api', (req, res, next) => {
  const allowedMethods = ['GET', 'POST', 'OPTIONS'];
  if (!allowedMethods.includes(req.method)) {
    return res.status(405).json({ error: `Método ${req.method} no permitido.` });
  }
  next();
});

// ── RATE LIMITER SERVER-SIDE (ANTI-DDOS / ANTI-DOS) ────────────────────────
// Implementación en memoria del algoritmo Token Bucket por dirección IP.
const ipBuckets = new Map();
const BUCKET_MAX_TOKENS = 5;
const REFILL_INTERVAL_MS = 10_000; // Recarga 1 token cada 10 segundos

function getIpBucket(ip) {
  const now = Date.now();
  if (!ipBuckets.has(ip)) {
    ipBuckets.set(ip, {
      tokens: BUCKET_MAX_TOKENS,
      lastRefill: now
    });
  }

  const bucket = ipBuckets.get(ip);
  const elapsed = now - bucket.lastRefill;
  const refillTokens = Math.floor(elapsed / REFILL_INTERVAL_MS);

  if (refillTokens > 0) {
    bucket.tokens = Math.min(BUCKET_MAX_TOKENS, bucket.tokens + refillTokens);
    bucket.lastRefill = now - (elapsed % REFILL_INTERVAL_MS);
  }

  return bucket;
}

// Limpiador periódico de memoria para evitar fugas de memoria con IPs inactivas
setInterval(() => {
  const now = Date.now();
  for (const [ip, bucket] of ipBuckets.entries()) {
    if (now - bucket.lastRefill > 10 * 60 * 1000) { // Inactivo por más de 10 minutos
      ipBuckets.delete(ip);
    }
  }
}, 5 * 60 * 1000);

const rateLimiterMiddleware = (req, res, next) => {
  // Obtener IP real del cliente (incluso detrás de proxies como Cloudflare o Nginx)
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  const bucket = getIpBucket(clientIp);

  if (bucket.tokens >= 1) {
    bucket.tokens -= 1;
    res.setHeader('X-RateLimit-Limit', BUCKET_MAX_TOKENS);
    res.setHeader('X-RateLimit-Remaining', bucket.tokens);
    next();
  } else {
    const retryAfter = Math.ceil(REFILL_INTERVAL_MS / 1000);
    res.setHeader('Retry-After', retryAfter);
    return res.status(429).json({
      error: '⚠️ Demasiadas peticiones detectadas (Servidor Protegido contra DDoS).',
      retryAfterSeconds: retryAfter
    });
  }
};

// ── SANITIZADOR DE RESPUESTA DE LA IA (SERVER-SIDE) ───────────────────────
function sanitizeString(str) {
  if (typeof str !== 'string') return String(str ?? '');
  // Solo escapar < y > para prevenir inyección HTML/XSS.
  // React ya escapa comillas y barras al renderizar.
  return str
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Normaliza el campo "correcta" que la IA puede devolver en múltiples formatos.
 */
function parseCorrectaField(value) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return ['true', 'verdadero', 'sí', 'si', 'correcto', 'correcta', '1'].includes(normalized);
  }
  return false;
}

/**
 * Extrae JSON robusto del contenido de la IA.
 */
function extractJSON(content) {
  try {
    return JSON.parse(content.trim());
  } catch { /* continuar */ }

  const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1].trim());
    } catch { /* continuar */ }
  }

  const start = content.indexOf('{');
  if (start === -1) return null;
  
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < content.length; i++) {
    const ch = content[i];
    if (escape) { escape = false; continue; }
    if (ch === '\\') { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '{') depth++;
    if (ch === '}') {
      depth--;
      if (depth === 0) {
        try {
          return JSON.parse(content.slice(start, i + 1));
        } catch { return null; }
      }
    }
  }
  return null;
}

function sanitizeAIResponse(rawData) {
  if (!rawData || typeof rawData !== 'object') {
    return { valid: false, error: 'Respuesta inválida del servidor de IA.' };
  }

  try {
    const sanitized = {
      nombreEstudiante: sanitizeString(rawData.nombreEstudiante || 'Desconocido'),
      totalPreguntas: typeof rawData.totalPreguntas === 'number'
        ? Math.max(0, Math.floor(rawData.totalPreguntas))
        : 0,
      preguntas: [],
      temasAFallar: [],
    };

    if (rawData.razonamiento_visual) {
      sanitized.razonamiento_visual = sanitizeString(rawData.razonamiento_visual);
    }

    if (Array.isArray(rawData.preguntas)) {
      sanitized.preguntas = rawData.preguntas
        .slice(0, 100)
        .map((p, idx) => ({
          id: typeof p.id === 'number' ? p.id : idx + 1,
          correcta: parseCorrectaField(p.correcta),
          comentario: sanitizeString(p.comentario || ''),
        }));
    }

    if (Array.isArray(rawData.temasAFallar)) {
      sanitized.temasAFallar = rawData.temasAFallar
        .slice(0, 20)
        .map((t) => sanitizeString(t));
    }

    return { valid: true, data: sanitized };
  } catch {
    return { valid: false, error: 'Error en la sanitización del backend.' };
  }
}

// ── ENDPOINTS DE LA API ───────────────────────────────────────────────────

// Endpoint para verificar la configuración del servidor
app.get('/api/config', (req, res) => {
  res.json({
    hasServerKey: NVIDIA_API_KEY !== '',
    nodeEnv: NODE_ENV
  });
});

// Endpoint seguro para evaluar los exámenes usando la IA
app.post('/api/evaluate', rateLimiterMiddleware, async (req, res) => {
  try {
    const { image, clientKey } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'La imagen del examen es obligatoria.' });
    }

    // Priorizar clave de servidor (.env) para seguridad máxima, si no, permitir clave de cliente
    const apiToken = NVIDIA_API_KEY || clientKey || req.headers['x-nvidia-api-key'];

    if (!apiToken) {
      return res.status(401).json({
        error: 'Llave de API no configurada. Configure la API Key en el servidor (.env) o en el cliente.'
      });
    }

    // Determinar la URL de la imagen de forma inteligente y con soporte para múltiples formatos
    let imageUrl = image;
    if (!image.startsWith('data:')) {
      imageUrl = `data:image/jpeg;base64,${image}`;
    }

    // Petición hacia NVIDIA con reintentos automáticos para errores transitorios
    const nvidiaUrl = 'https://integrate.api.nvidia.com/v1/chat/completions';
    const requestBody = JSON.stringify({
      model: 'meta/llama-3.2-90b-vision-instruct',
      messages: [
        {
          role: 'system',
          content: `Eres un docente experto en corrección de exámenes con visión artificial.
Tu misión es evaluar con MÁXIMA PRECISIÓN las respuestas de los estudiantes a partir de la imagen de su examen.

${markingStylesPrompt}

⚠️ REGLA ABSOLUTA — PROHIBIDA LA INVENCIÓN:
- NUNCA inventes respuestas correctas. Si la pregunta dice "2+2", la respuesta correcta es 4, NO 3.
- NUNCA marques una respuesta como incorrecta si el estudiante respondió bien.
- Si no puedes leer algo en la imagen, indica "No legible" en el comentario.

🔍 METODOLOGÍA OBLIGATORIA DE 3 PASOS por cada pregunta:

PASO 1 — LEER LA PREGUNTA: Lee el enunciado completo de la pregunta tal como aparece en la imagen. Escríbelo textualmente en tu razonamiento.

PASO 2 — RESOLVER TÚ MISMO: Antes de ver qué marcó el estudiante, RESUELVE la pregunta tú mismo. Por ejemplo:
  - Si dice "2+2 = ?", tú calculas: 2+2 = 4. La respuesta correcta es 4.
  - Si dice "Capital de Francia?", tú sabes: es París.
  - NUNCA asumas la respuesta sin verificar. CALCULA, RAZONA, VERIFICA.

PASO 3 — COMPARAR: Ahora observa qué opción marcó el estudiante en la imagen. Compara con tu resultado del Paso 2:
  - Si coincide → "correcta": true
  - Si NO coincide → "correcta": false
  - El comentario DEBE ser coherente con el booleano.

🚫 ERRORES PROHIBIDOS:
- Decir que 2+2=3 (ESTO ES INCORRECTO, 2+2=4)
- Marcar como incorrecta una respuesta que SÍ es correcta
- Inventar opciones que no existen en el examen
- Contradecir el comentario con el booleano "correcta"

Responde ÚNICAMENTE con este formato JSON (sin texto adicional):
{
  "razonamiento_visual": "Para cada pregunta describe: 1) qué dice el enunciado, 2) cuál es la respuesta correcta según tu cálculo/conocimiento, 3) qué opción marcó el estudiante, 4) si coincide o no.",
  "nombreEstudiante": "Nombre del alumno si aparece en la imagen, o 'No especificado'",
  "totalPreguntas": 0,
  "preguntas": [
    {
      "id": 1,
      "correcta": true,
      "comentario": "El enunciado pregunta X. La respuesta correcta es Y. El estudiante marcó Y. Es correcta."
    }
  ],
  "temasAFallar": []
}`
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Evalúa este examen. Para CADA pregunta: 1) lee el enunciado, 2) calcula/determina la respuesta correcta TÚ MISMO, 3) compara con lo que marcó el estudiante. Responde en JSON.' },
            {
              type: 'image_url',
              image_url: { url: imageUrl }
            }
          ]
        }
      ],
      max_tokens: 8000,
      temperature: 0,
      top_p: 1.0,
      response_format: { type: "json_object" }
    });

    // Reintento automático para errores transitorios (502, 503, 504)
    const MAX_RETRIES = 2;
    let nvidiaResponse;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      nvidiaResponse = await fetch(nvidiaUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiToken}`,
          'Accept': 'application/json'
        },
        body: requestBody
      });

      // Si no es un error transitorio, no reintentar
      if (![502, 503, 504].includes(nvidiaResponse.status)) break;

      // Si es transitorio y quedan reintentos, esperar antes de reintentar
      if (attempt < MAX_RETRIES) {
        const waitMs = (attempt + 1) * 1500; // 1.5s, 3s
        await new Promise(r => setTimeout(r, waitMs));
        console.log(`Reintentando petición a NVIDIA (intento ${attempt + 2}/${MAX_RETRIES + 1})...`);
      }
    }

    if (!nvidiaResponse.ok) {
      const code = nvidiaResponse.status;
      const safeError = code === 401
        ? 'API Key inválida o expirada en NVIDIA.'
        : code === 429
          ? 'Límite de peticiones de NVIDIA alcanzado.'
          : code === 502 || code === 503 || code === 504
            ? `Servicio de NVIDIA temporalmente no disponible (${code}). Intenta de nuevo en unos segundos.`
            : `Error en servicio de IA de NVIDIA (Código ${code})`;
      return res.status(code).json({ error: safeError });
    }

    const data = await nvidiaResponse.json();

    // Validar que la respuesta tiene la estructura esperada
    if (!data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
      return res.status(502).json({ error: 'La respuesta de NVIDIA no contiene datos válidos.' });
    }

    const content = data.choices[0].message.content;

    const parsed = extractJSON(content);
    if (!parsed) {
      return res.status(502).json({ error: 'La IA no retornó un formato JSON válido.' });
    }

    // Sanitizar antes de enviar al cliente
    const sanitized = sanitizeAIResponse(parsed);
    if (!sanitized.valid) {
      return res.status(502).json({ error: sanitized.error });
    }

    return res.json(sanitized.data);
  } catch (error) {
    console.error('Error de servidor en evaluate:', error);
    return res.status(500).json({ error: 'Ocurrió un error interno en el servidor seguro.' });
  }
});

// ── SERVIR APLICACIÓN FRONTEND COMPILADA ──────────────────────────────────
const distPath = path.join(__dirname, 'dist');

// Middleware para servir los assets estáticos
app.use(express.static(distPath));

// Rutas SPA - Enviar siempre index.html para cualquier ruta GET que no coincida
app.get('/{*splat}', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// Arrancar servidor seguro
const listenPort = NODE_ENV === 'development' ? PORT_DEV : PORT;
app.listen(listenPort, () => {
  console.log(`\n═══════════════════════════════════════════════════════════`);
  console.log(`🛡️  SERVIDOR SEGURO EVALUAIA CORRIENDO EN: http://localhost:${listenPort}`);
  console.log(`🛡️  Entorno: ${NODE_ENV}`);
  console.log(`🛡️  Clave de NVIDIA configurada en Servidor: ${NVIDIA_API_KEY ? '✅ SÍ' : '❌ NO (.env)'}`);
  console.log(`🛡️  Rate limiting por IP (anti-DDoS) activo.`);
  console.log(`═══════════════════════════════════════════════════════════\n`);
});
