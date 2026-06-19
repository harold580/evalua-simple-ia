import {
  secureStorageSet,
  secureStorageGet,
  apiRateLimiter,
} from './security.js';

const STORAGE_KEYS = {
  NVIDIA: 'NVIDIA_API_KEY',
  PROVIDER: 'SELECTED_PROVIDER'
};

const DEFAULTS = {
  // ⚠️ No se incluye API key por defecto — el usuario DEBE configurar la suya.
  // La clave anterior fue expuesta y debe ser revocada.
  NVIDIA: '',
  PROVIDER: 'NVIDIA'
};

/**
 * Guarda las API keys cifradas en localStorage.
 */
export const saveApiKeys = async (keys) => {
  if (keys.nvidia) await secureStorageSet(STORAGE_KEYS.NVIDIA, keys.nvidia);
  if (keys.provider) localStorage.setItem(STORAGE_KEYS.PROVIDER, keys.provider);
};

/**
 * Lee las API keys descifradas de localStorage.
 */
export const getApiKeys = async () => ({
  nvidia: (await secureStorageGet(STORAGE_KEYS.NVIDIA)) || DEFAULTS.NVIDIA,
  provider: localStorage.getItem(STORAGE_KEYS.PROVIDER) || DEFAULTS.PROVIDER
});


let serverConfig = null;
let serverConfigTimestamp = 0;
const SERVER_CONFIG_TTL_MS = 60_000; // Refresca cada 60 segundos

/**
 * Obtiene la configuración del servidor de forma dinámica.
 * Cachea durante 60 segundos para evitar llamadas excesivas pero
 * permite detectar cambios en el servidor (ej. API key agregada al .env).
 */
export const getServerConfig = async () => {
  const now = Date.now();
  if (serverConfig && (now - serverConfigTimestamp) < SERVER_CONFIG_TTL_MS) {
    return serverConfig;
  }
  try {
    const res = await fetch('/api/config');
    if (res.ok) {
      serverConfig = await res.json();
    } else {
      serverConfig = { hasServerKey: false };
    }
  } catch {
    serverConfig = { hasServerKey: false };
  }
  serverConfigTimestamp = now;
  return serverConfig;
};

/**
 * Compresión ADAPTATIVA INTELIGENTE de imagen.
 * 
 * Resuelve el dilema calidad vs tamaño:
 * - Empieza con la MEJOR calidad posible (0.92)
 * - Va reduciendo progresivamente SOLO lo mínimo necesario
 * - Primero baja calidad JPEG, luego resolución como último recurso
 * - Garantiza que el payload quede bajo el límite de Vercel (4.5 MB)
 * 
 * Así el modelo de IA recibe la imagen más nítida posible para leer texto.
 */
const MAX_PAYLOAD_BASE64 = 3_500_000; // ~3.5 MB en base64 → ~4.2 MB en JSON (bajo el límite de 4.5 MB)

export const compressImageForUpload = (dataUrl) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        // Estrategia de compresión progresiva: de mejor a peor calidad
        const strategies = [
          { maxDim: 2048, quality: 0.92 },  // Máxima calidad
          { maxDim: 2048, quality: 0.80 },  // Alta calidad
          { maxDim: 1600, quality: 0.80 },  // Resolución media, alta calidad
          { maxDim: 1600, quality: 0.65 },  // Resolución media, calidad media
          { maxDim: 1200, quality: 0.65 },  // Resolución baja, calidad media
          { maxDim: 1200, quality: 0.50 },  // Resolución baja, calidad baja
          { maxDim: 1000, quality: 0.45 },  // Emergencia
        ];

        for (const { maxDim, quality } of strategies) {
          const scale = Math.min(maxDim / img.width, maxDim / img.height, 1);
          const w = Math.round(img.width * scale);
          const h = Math.round(img.height * scale);

          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          // Mejorar renderizado de texto con interpolación de alta calidad
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, w, h);

          const compressed = canvas.toDataURL('image/jpeg', quality);

          if (compressed.length <= MAX_PAYLOAD_BASE64) {
            console.log(`📷 Compresión adaptativa: ${w}x${h}, calidad ${(quality * 100).toFixed(0)}%, tamaño ${(compressed.length / 1024 / 1024).toFixed(2)} MB`);
            resolve(compressed);
            return;
          }
        }

        // Si ninguna estrategia funcionó, usar la última (más agresiva)
        const last = strategies[strategies.length - 1];
        const scale = Math.min(last.maxDim / img.width, last.maxDim / img.height, 1);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        console.warn('⚠️ Imagen muy grande, usando compresión de emergencia');
        resolve(canvas.toDataURL('image/jpeg', 0.35));
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = () => reject(new Error('Error al procesar la imagen para compresión.'));
    img.src = dataUrl;
  });
};

export const analyzeExam = async (base64Image) => {
  // ── Rate Limiting Anti-DoS (Client-Side) ──────────────────────────
  const rateCheck = apiRateLimiter.tryConsume();
  if (!rateCheck.allowed) {
    if (rateCheck.reason === 'circuit_breaker') {
      const secs = Math.ceil(rateCheck.retryAfterMs / 1000);
      throw new Error(
        `🛑 Circuit breaker activado. Demasiados errores consecutivos. Intenta de nuevo en ${secs} segundos.`
      );
    }
    throw new Error(
      '⚠️ Demasiadas solicitudes. Espera unos segundos antes de intentar de nuevo.'
    );
  }

  // ── Compresión de imagen para cumplir límite de Vercel (4.5 MB) ───
  let imageToSend = base64Image;
  try {
    imageToSend = await compressImageForUpload(base64Image);
  } catch (e) {
    console.warn('Compresión falló, enviando imagen original:', e);
  }

  // ── Detección de API Key ──────────────────────────────────────────
  const sCfg = await getServerConfig();
  let clientKey = '';

  if (!sCfg.hasServerKey) {
    // Si el servidor no tiene clave preconfigurada, leemos la clave local cifrada
    const keys = await getApiKeys();
    clientKey = keys.nvidia;
    if (!clientKey) {
      throw new Error(
        '🔑 No se ha configurado una API Key de NVIDIA. Agrega tu clave en Configuración para poder continuar.'
      );
    }
  }

  try {
    // ── Enviar petición al Backend Seguro Express ─────────────────────
    const response = await fetch('/api/evaluate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        image: imageToSend,
        clientKey: clientKey // Solo se transmite si el backend no la tiene en su .env
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      apiRateLimiter.recordError();
      throw new Error(errorData.error || `Error del servidor seguro (${response.status})`);
    }

    const data = await response.json();
    apiRateLimiter.recordSuccess();
    return data;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Error en analyzeExam:', error);
    }
    throw error;
  }
};

