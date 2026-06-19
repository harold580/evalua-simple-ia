import { useState, useCallback } from 'react';
import { Settings, BrainCircuit, Loader2, AlertCircle, Shield, ShieldAlert, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ImageUploader } from './components/ImageUploader';
import { EvaluationResult } from './components/EvaluationResult';
import { SettingsModal } from './components/SettingsModal';
import { MarkingGuideModal } from './components/MarkingGuideModal';
import { analyzeExam } from './services/nvidiaApi';
import { apiRateLimiter } from './services/security';

function App() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMarkingGuideOpen, setIsMarkingGuideOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [rateLimitInfo, setRateLimitInfo] = useState(() => apiRateLimiter.getStatus());

  const updateRateLimitInfo = useCallback(() => {
    const status = apiRateLimiter.getStatus();
    setRateLimitInfo(status);
  }, []);

  const handleAnalyze = async (base64Image) => {
    setIsLoading(true);
    setError(null);
    updateRateLimitInfo();
    try {
      const evaluation = await analyzeExam(base64Image);
      setResult(evaluation);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
      updateRateLimitInfo();
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
    updateRateLimitInfo();
  };

  return (
    <div className="min-h-screen gradient-bg text-white font-sans selection:bg-academic-teal selection:text-white">
      {/* Header */}
      <header className="p-6 flex justify-between items-center max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md border border-white/20">
            <BrainCircuit className="w-8 h-8 text-academic-teal" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              EvaluaIA
            </h1>
            <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-academic-teal">AI Teacher Assistant</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* 🔒 Indicador de seguridad / Rate Limit */}
          {rateLimitInfo && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-xl border border-white/10 text-xs">
              {rateLimitInfo.inCooldown ? (
                <>
                  <ShieldAlert className="w-4 h-4 text-red-400" />
                  <span className="text-red-400 font-semibold">Pausa de seguridad</span>
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 text-academic-emerald" />
                  <span className="text-gray-400">
                    {rateLimitInfo.remainingTokens}/{rateLimitInfo.maxTokens} consultas
                  </span>
                </>
              )}
            </div>
          )}

          <button
            onClick={() => setIsMarkingGuideOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/10 group text-sm font-semibold text-gray-300 hover:text-white"
            title="Guía de Marcación de Exámenes"
          >
            <BookOpen className="w-5 h-5 text-academic-teal group-hover:scale-110 transition-transform duration-300" />
            <span className="hidden sm:inline">Guía de Marcación</span>
          </button>

          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/10 group"
          >
            <Settings className="w-6 h-6 group-hover:rotate-90 transition-transform duration-500" />
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12 flex flex-col items-center">
        <AnimatePresence mode="wait">
          {!result && !isLoading && (
            <motion.div
              key="landing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center space-y-12"
            >
              <div className="space-y-4">
                <h2 className="text-5xl md:text-7xl font-black max-w-4xl mx-auto leading-tight">
                  Evalúa exámenes en <span className="text-academic-teal">segundos</span> con IA
                </h2>
                <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto">
                  Sube una foto o captura directamente la evaluación de tu estudiante. 
                  Nuestro agente detectará el nombre, calificará y dará feedback instantáneo.
                </p>
              </div>

              <ImageUploader onAnalyze={handleAnalyze} />

              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400 max-w-md mx-auto"
                >
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p className="text-sm font-medium">{error}</p>
                </motion.div>
              )}

              {/* 🛡️ Indicador de rate limit en móvil y estado de circuit breaker */}
              {rateLimitInfo && rateLimitInfo.inCooldown && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center gap-3 text-amber-400 max-w-md mx-auto"
                >
                  <ShieldAlert className="w-5 h-5 shrink-0" />
                  <p className="text-sm font-medium">
                    Circuit breaker activo — Demasiados errores consecutivos. El sistema se ha pausado temporalmente para proteger tu cuenta.
                  </p>
                </motion.div>
              )}
            </motion.div>
          )}

          {isLoading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center space-y-6 py-20"
            >
              <div className="relative">
                <Loader2 className="w-16 h-16 text-academic-teal animate-spin" />
                <div className="absolute inset-0 blur-xl bg-academic-teal/20 animate-pulse"></div>
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-bold">Analizando Evaluación...</h3>
                <p className="text-gray-400">El agente de NVIDIA NIM está procesando la imagen y calculando la nota.</p>
              </div>
            </motion.div>
          )}

          {result && (
            <EvaluationResult result={result} onReset={handleReset} />
          )}
        </AnimatePresence>
      </main>

      <footer className="py-8 text-center text-gray-500 text-sm">
        <p>© 2026 EvaluaIA - Potenciado por NVIDIA GeForce NIM</p>
      </footer>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <MarkingGuideModal isOpen={isMarkingGuideOpen} onClose={() => setIsMarkingGuideOpen(false)} />
    </div>
  );
}

export default App;
