import { markingStylesPrompt } from './markingStyles.js';

function sanitizeString(str) {
  if (typeof str !== 'string') return String(str ?? '');
  // Solo escapar < y > para prevenir inyección HTML/XSS.
  // React ya escapa comillas y barras al renderizar, así que no las tocamos
  // para evitar que los comentarios se muestren con entidades HTML visibles.
  return str
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Normaliza el campo "correcta" que la IA puede devolver en múltiples formatos.
 * Maneja: true, "true", "True", "Verdadero", "sí", "Correcto", "correcta", 1, etc.
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
 * Maneja: JSON directo, envuelto en ```json...```, o embebido en texto.
 */
function extractJSON(content) {
  // Intento 1: parsear directamente (si la IA respondió solo JSON)
  try {
    return JSON.parse(content.trim());
  } catch { /* continuar */ }

  // Intento 2: extraer de bloque markdown ```json ... ```
  const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1].trim());
    } catch { /* continuar */ }
  }

  // Intento 3: buscar el primer objeto JSON balanceado
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

export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, X-NVIDIA-API-Key, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { image, clientKey } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'La imagen del examen es obligatoria.' });
    }

    const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY || '';
    const apiToken = NVIDIA_API_KEY || clientKey || req.headers['x-nvidia-api-key'];

    if (!apiToken) {
      return res.status(401).json({
        error: 'Llave de API no configurada. Configure la API Key en el servidor o en el cliente.'
      });
    }

    let imageUrl = image;
    if (!image.startsWith('data:')) {
      imageUrl = `data:image/jpeg;base64,${image}`;
    }

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

      if (![502, 503, 504].includes(nvidiaResponse.status)) break;

      if (attempt < MAX_RETRIES) {
        await new Promise(r => setTimeout(r, (attempt + 1) * 1500));
      }
    }

    if (!nvidiaResponse.ok) {
      const code = nvidiaResponse.status;
      const safeError = code === 401
        ? 'API Key inválida o expirada en NVIDIA.'
        : code === 429
          ? 'Límite de peticiones de NVIDIA alcanzado.'
          : code === 502 || code === 503 || code === 504
            ? `Servicio de NVIDIA temporalmente no disponible (${code}). Intenta de nuevo.`
            : `Error en servicio de IA de NVIDIA (Código ${code})`;
      return res.status(code).json({ error: safeError });
    }

    const data = await nvidiaResponse.json();

    if (!data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
      return res.status(502).json({ error: 'La respuesta de NVIDIA no contiene datos válidos.' });
    }

    const content = data.choices[0].message.content;

    const parsed = extractJSON(content);
    if (!parsed) {
      return res.status(502).json({ error: 'La IA no retornó un formato JSON válido.' });
    }

    const sanitized = sanitizeAIResponse(parsed);
    if (!sanitized.valid) {
      return res.status(502).json({ error: sanitized.error });
    }

    return res.status(200).json(sanitized.data);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Ocurrió un error interno en la función serverless.' });
  }
}
