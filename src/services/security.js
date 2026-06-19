// ============================================================================
// 🔒 MÓDULO DE SEGURIDAD — EvaluaIA
// Cifrado AES-GCM · Rate Limiter · Validador de Archivos · Sanitizador JSON
// ============================================================================

// ---------------------------------------------------------------------------
// 1. CIFRADO AES-GCM PARA LOCALSTORAGE
//    Protege las API keys en reposo usando Web Crypto API nativa del navegador.
//    La clave de cifrado se deriva de un passphrase fijo + salt aleatorio
//    mediante PBKDF2. Cada valor cifrado incluye su propio IV y salt.
// ---------------------------------------------------------------------------

const CRYPTO_PASSPHRASE = 'EvaluaIA-2026-SecureVault';
const PBKDF2_ITERATIONS = 100_000;

/**
 * Deriva una clave AES-GCM a partir de un passphrase usando PBKDF2.
 */
async function deriveKey(salt) {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(CRYPTO_PASSPHRASE),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Cifra un string usando AES-256-GCM.
 * Retorna un string base64 que incluye salt + iv + ciphertext.
 */
export async function encryptValue(plaintext) {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(salt);

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(plaintext)
  );

  // Empaquetamos: [16 bytes salt][12 bytes iv][N bytes ciphertext]
  const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(encrypted), salt.length + iv.length);

  return btoa(String.fromCharCode(...combined));
}

/**
 * Descifra un string cifrado con encryptValue.
 */
export async function decryptValue(encryptedBase64) {
  try {
    const decoder = new TextDecoder();
    const combined = Uint8Array.from(atob(encryptedBase64), (c) => c.charCodeAt(0));

    const salt = combined.slice(0, 16);
    const iv = combined.slice(16, 28);
    const ciphertext = combined.slice(28);

    const key = await deriveKey(salt);

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ciphertext
    );

    return decoder.decode(decrypted);
  } catch {
    // Si falla el descifrado (datos corruptos, clave antigua, etc.)
    return null;
  }
}

/**
 * Guarda un valor cifrado en localStorage.
 */
export async function secureStorageSet(key, value) {
  const encrypted = await encryptValue(value);
  localStorage.setItem(key, encrypted);
}

/**
 * Lee y descifra un valor de localStorage.
 * Si el valor no está cifrado (migración), lo cifra y guarda automáticamente.
 */
export async function secureStorageGet(key) {
  const stored = localStorage.getItem(key);
  if (!stored) return null;

  // Intentar descifrar
  const decrypted = await decryptValue(stored);
  if (decrypted !== null) return decrypted;

  // Si falla, puede ser un valor sin cifrar (migración desde versión anterior).
  // Cifrarlo ahora y devolver el valor original.
  await secureStorageSet(key, stored);
  return stored;
}

// ---------------------------------------------------------------------------
// 2. RATE LIMITER — Algoritmo Token Bucket
//    Protege contra DoS/DDoS limitando la cantidad de llamadas a la API.
// ---------------------------------------------------------------------------

export class RateLimiter {
  /**
   * @param {number} maxTokens — Máximo de peticiones permitidas en la ventana
   * @param {number} refillIntervalMs — Milisegundos para recargar 1 token
   */
  constructor(maxTokens = 5, refillIntervalMs = 12_000) {
    this.maxTokens = maxTokens;
    this.tokens = maxTokens;
    this.refillIntervalMs = refillIntervalMs;
    this.lastRefillTime = Date.now();
    this.cooldownUntil = 0; // Timestamp de pausa si se activa circuit breaker
    this.consecutiveErrors = 0;
    this.CIRCUIT_BREAKER_THRESHOLD = 3;
    this.CIRCUIT_BREAKER_COOLDOWN_MS = 30_000; // 30 segundos de pausa
  }

  /**
   * Recarga tokens según el tiempo transcurrido.
   */
  _refill() {
    const now = Date.now();
    const elapsed = now - this.lastRefillTime;
    const newTokens = Math.floor(elapsed / this.refillIntervalMs);
    if (newTokens > 0) {
      this.tokens = Math.min(this.maxTokens, this.tokens + newTokens);
      this.lastRefillTime = now;
    }
  }

  /**
   * Intenta consumir 1 token. Retorna true si se permite la petición.
   */
  tryConsume() {
    // Verificar circuit breaker
    if (Date.now() < this.cooldownUntil) {
      return {
        allowed: false,
        reason: 'circuit_breaker',
        retryAfterMs: this.cooldownUntil - Date.now(),
      };
    }

    this._refill();

    if (this.tokens >= 1) {
      this.tokens -= 1;
      return {
        allowed: true,
        remainingTokens: this.tokens,
        maxTokens: this.maxTokens,
      };
    }

    return {
      allowed: false,
      reason: 'rate_limited',
      retryAfterMs: this.refillIntervalMs,
    };
  }

  /**
   * Registra un error para el circuit breaker.
   */
  recordError() {
    this.consecutiveErrors += 1;
    if (this.consecutiveErrors >= this.CIRCUIT_BREAKER_THRESHOLD) {
      this.cooldownUntil = Date.now() + this.CIRCUIT_BREAKER_COOLDOWN_MS;
      this.consecutiveErrors = 0;
    }
  }

  /**
   * Registra un éxito — resetea el contador de errores.
   */
  recordSuccess() {
    this.consecutiveErrors = 0;
  }

  /**
   * Estado actual del limiter para la UI.
   */
  getStatus() {
    this._refill();
    const inCooldown = Date.now() < this.cooldownUntil;
    return {
      remainingTokens: this.tokens,
      maxTokens: this.maxTokens,
      inCooldown,
      cooldownRemainingMs: inCooldown ? this.cooldownUntil - Date.now() : 0,
      consecutiveErrors: this.consecutiveErrors,
    };
  }
}

// Instancia singleton del rate limiter (5 peticiones, recarga 1 cada 12 segundos)
export const apiRateLimiter = new RateLimiter(5, 12_000);

// ---------------------------------------------------------------------------
// 3. VALIDADOR DE ARCHIVOS
//    Verifica el tipo real del archivo usando magic bytes, no solo la extensión.
// ---------------------------------------------------------------------------

const ALLOWED_MAGIC_BYTES = [
  { mime: 'image/jpeg', bytes: [0xFF, 0xD8, 0xFF] },
  { mime: 'image/png', bytes: [0x89, 0x50, 0x4E, 0x47] },
  { mime: 'image/webp', bytes: [0x52, 0x49, 0x46, 0x46] }, // "RIFF"
];

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

/**
 * Valida un archivo subido verificando:
 * 1. Que no exceda el tamaño máximo (10 MB)
 * 2. Que sus magic bytes correspondan a JPEG, PNG o WebP
 * 3. Que NO sea un SVG (puede contener JavaScript embebido)
 *
 * @param {File} file — El objeto File del input
 * @returns {Promise<{valid: boolean, error?: string}>}
 */
export async function validateImageFile(file) {
  // Verificar tamaño
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `El archivo es demasiado grande (${(file.size / 1024 / 1024).toFixed(1)} MB). Máximo permitido: 10 MB.`,
    };
  }

  // Verificar que no sea SVG (puede contener <script>)
  if (file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg')) {
    return {
      valid: false,
      error: 'Los archivos SVG no están permitidos por razones de seguridad.',
    };
  }

  // Leer los primeros bytes para verificar magic bytes
  const headerBytes = await readFileHeader(file, 8);

  const isValidType = ALLOWED_MAGIC_BYTES.some(({ bytes }) =>
    bytes.every((byte, index) => headerBytes[index] === byte)
  );

  if (!isValidType) {
    return {
      valid: false,
      error: 'El archivo no es una imagen válida (JPEG, PNG o WebP). Verifica el formato.',
    };
  }

  return { valid: true };
}

/**
 * Lee los primeros N bytes de un archivo.
 */
function readFileHeader(file, numBytes) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const arr = new Uint8Array(reader.result);
      resolve(arr);
    };
    reader.onerror = () => reject(new Error('No se pudo leer el archivo.'));
    reader.readAsArrayBuffer(file.slice(0, numBytes));
  });
}

// ---------------------------------------------------------------------------
// 4. SANITIZADOR DE RESPUESTAS JSON DE LA IA
//    Valida la estructura del JSON y sanitiza strings para prevenir XSS.
// ---------------------------------------------------------------------------

/**
 * Sanitiza un string eliminando posibles scripts o HTML peligroso.
 */
export function sanitizeString(str) {
  if (typeof str !== 'string') return String(str ?? '');
  return str
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Valida y sanitiza la respuesta JSON de la IA.
 * Asegura que cumple con el schema esperado y que no contiene datos maliciosos.
 *
 * @param {object} rawData — El objeto parseado del JSON de la IA
 * @returns {{valid: boolean, data?: object, error?: string}}
 */
export function sanitizeAIResponse(rawData) {
  if (!rawData || typeof rawData !== 'object') {
    return { valid: false, error: 'La respuesta de la IA no es un objeto válido.' };
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

    // Sanitizar el razonamiento visual si existe
    if (rawData.razonamiento_visual) {
      sanitized.razonamiento_visual = sanitizeString(rawData.razonamiento_visual);
    }

    // Validar y sanitizar preguntas
    if (Array.isArray(rawData.preguntas)) {
      sanitized.preguntas = rawData.preguntas
        .slice(0, 100) // Limitar a 100 preguntas máximo
        .map((p, idx) => ({
          id: typeof p.id === 'number' ? p.id : idx + 1,
          correcta: p.correcta === true || p.correcta === 'true',
          comentario: sanitizeString(p.comentario || ''),
        }));
    }

    // Sanitizar temas a fallar
    if (Array.isArray(rawData.temasAFallar)) {
      sanitized.temasAFallar = rawData.temasAFallar
        .slice(0, 20) // Limitar a 20 temas máximo
        .map((t) => sanitizeString(t));
    }

    return { valid: true, data: sanitized };
  } catch {
    return { valid: false, error: 'Error al procesar la respuesta de la IA.' };
  }
}

/**
 * Redimensiona una imagen (File o dataURL) a un tamaño máximo de 1024px de ancho/alto
 * manteniendo el aspect ratio, y la exporta como JPEG comprimida.
 */
export function resizeImage(fileOrDataUrl, maxWidth = 1024, maxHeight = 1024) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = (err) => reject(err);

    if (fileOrDataUrl instanceof File) {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target.result;
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(fileOrDataUrl);
    } else {
      img.src = fileOrDataUrl;
    }
  });
}
