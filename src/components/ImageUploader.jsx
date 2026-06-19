import { useRef, useState } from 'react';
import { Camera, Upload, RotateCcw, Sparkles, X, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { validateImageFile } from '../services/security';
import { compressImageForUpload } from '../services/nvidiaApi';

export const ImageUploader = ({ onAnalyze }) => {
  const [image, setImage] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [fileError, setFileError] = useState(null);
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileError(null);

    // ── Validación de seguridad del archivo ──
    const validation = await validateImageFile(file);
    if (!validation.valid) {
      setFileError(validation.error);
      // Resetear el input para permitir resubir
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result); // Carga la resolución original para renderizar
      setFileError(null);
    };
    reader.onerror = () => {
      setFileError('Error al leer el archivo.');
    };
    reader.readAsDataURL(file);
  };

  const startCamera = async () => {
    setIsCameraActive(true);
    setFileError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setIsCameraActive(false);
    }
  };

  const capturePhoto = async () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
      console.error('El video aún no está listo para capturar.');
      return;
    }
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    // Comprimir para respetar el límite de payload de Vercel (~4.5 MB)
    try {
      const compressed = await compressImageForUpload(dataUrl);
      setImage(compressed);
    } catch (err) {
      console.warn('Compresión falló, usando imagen original:', err);
      setImage(dataUrl);
    }
    stopCamera();
  };

  const handleAnalyzeClick = () => {
    onAnalyze(image);
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
    }
    setIsCameraActive(false);
  };

  const reset = () => {
    setImage(null);
    setIsCameraActive(false);
    setFileError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <AnimatePresence mode="wait">
        {!image && !isCameraActive && (
          <motion.div
            key="upload-options"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={startCamera}
                className="group glass p-10 rounded-3xl flex flex-col items-center gap-4 hover:bg-white/10 transition-all border-dashed border-2 border-white/20"
              >
                <div className="p-4 bg-academic-light/20 rounded-2xl group-hover:scale-110 transition-transform">
                  <Camera className="w-10 h-10 text-academic-light" />
                </div>
                <div className="text-center">
                  <span className="block text-xl font-bold text-white">Usar Cámara</span>
                  <span className="text-sm text-gray-400">Captura el examen ahora</span>
                </div>
              </button>

              <button
                onClick={() => fileInputRef.current.click()}
                className="group glass p-10 rounded-3xl flex flex-col items-center gap-4 hover:bg-white/10 transition-all border-dashed border-2 border-white/20"
              >
                <div className="p-4 bg-academic-teal/20 rounded-2xl group-hover:scale-110 transition-transform">
                  <Upload className="w-10 h-10 text-academic-teal" />
                </div>
                <div className="text-center">
                  <span className="block text-xl font-bold text-white">Subir Archivo</span>
                  <span className="text-sm text-gray-400">JPG, PNG, WebP (máx. 10 MB)</span>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileUpload}
                />
              </button>
            </div>

            {/* Error de validación de archivo */}
            {fileError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center gap-3 text-amber-400"
              >
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <p className="text-sm font-medium">{fileError}</p>
              </motion.div>
            )}
          </motion.div>
        )}

        {isCameraActive && (
          <motion.div
            key="camera-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative rounded-3xl overflow-hidden glass shadow-2xl"
          >
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full aspect-video object-cover"
            />
            <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-4 px-6">
              <button
                onClick={stopCamera}
                className="p-4 bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white rounded-2xl backdrop-blur-md transition-all"
              >
                <X className="w-6 h-6" />
              </button>
              <button
                onClick={capturePhoto}
                className="px-8 py-4 bg-white text-academic-dark font-bold rounded-2xl hover:bg-academic-teal hover:text-white transition-all shadow-xl"
              >
                Tomar Foto
              </button>
            </div>
          </motion.div>
        )}

        {image && (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            <div className="relative glass p-2 rounded-3xl overflow-hidden shadow-2xl">
              <img src={image} alt="Preview" className="w-full h-auto rounded-2xl" />
              <button
                onClick={reset}
                className="absolute top-4 right-4 p-3 bg-black/50 text-white rounded-full hover:bg-black/70 transition-all backdrop-blur-md"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>
            
            <button
              onClick={handleAnalyzeClick}
              className="w-full py-5 bg-gradient-to-r from-academic-light to-academic-teal text-white font-bold text-xl rounded-2xl shadow-xl hover:shadow-academic-teal/40 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
            >
              <Sparkles className="w-6 h-6" />
              Analizar Evaluación con IA
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
