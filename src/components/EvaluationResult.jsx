import { motion } from 'framer-motion';
import { Award, CheckCircle2, XCircle, BookOpen, User, Star } from 'lucide-react';

export const EvaluationResult = ({ result, onReset }) => {
  const { nombreEstudiante, totalPreguntas, preguntas = [], temasAFallar = [] } = result;
  
  // Aseguramos que 'correcta' se evalúe correctamente con múltiples formatos posibles
  const isCorrect = (val) => {
    if (typeof val === 'boolean') return val;
    if (typeof val === 'number') return val === 1;
    if (typeof val === 'string') {
      const n = val.trim().toLowerCase();
      return ['true', 'verdadero', 'sí', 'si', 'correcto', 'correcta', '1'].includes(n);
    }
    return false;
  };
  const correctas = preguntas.filter(p => isCorrect(p.correcta)).length;
  
  // Usamos el máximo entre totalPreguntas y el largo del array para evitar divisiones por cero o notas inconsistentes
  const totalEfectivo = Math.max(totalPreguntas, preguntas.length, 1);
  const notaFinal = ((correctas / totalEfectivo) * 5).toFixed(1);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 pb-12">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-[2rem] p-8 md:p-12 shadow-2xl overflow-hidden relative"
      >
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Award className="w-40 h-40 text-academic-teal" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row gap-12 items-center">
          {/* Score Ring */}
          <div className="relative w-48 h-48 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="96"
                cy="96"
                r="88"
                stroke="currentColor"
                strokeWidth="12"
                fill="transparent"
                className="text-white/5"
              />
              <motion.circle
                cx="96"
                cy="96"
                r="88"
                stroke="currentColor"
                strokeWidth="12"
                fill="transparent"
                strokeDasharray={553}
                initial={{ strokeDashoffset: 553 }}
                animate={{ strokeDashoffset: 553 - (553 * (notaFinal / 5)) }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="text-academic-teal"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-black text-white">{notaFinal}</span>
              <span className="text-sm text-gray-400 uppercase tracking-widest font-bold">Nota / 5.0</span>
            </div>
          </div>

          <div className="flex-1 space-y-4 text-center md:text-left">
            <h2 className="text-4xl font-bold text-white flex items-center justify-center md:justify-start gap-3">
              <User className="w-8 h-8 text-academic-light" />
              {nombreEstudiante || "Estudiante no identificado"}
            </h2>
            <div className="flex flex-wrap gap-4 justify-center md:justify-start">
              <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/10">
                <span className="text-gray-400 text-sm block">Total Preguntas</span>
                <span className="text-white font-bold">{totalEfectivo}</span>
              </div>
              <div className="px-4 py-2 bg-academic-emerald/10 rounded-xl border border-academic-emerald/20">
                <span className="text-academic-emerald text-sm block">Correctas</span>
                <span className="text-academic-emerald font-bold">{correctas}</span>
              </div>
              <div className="px-4 py-2 bg-red-500/10 rounded-xl border border-red-500/20">
                <span className="text-red-500 text-sm block">Incorrectas</span>
                <span className="text-red-500 font-bold">{totalEfectivo - correctas}</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Detail List */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-3xl p-8"
        >
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-academic-teal" />
            Desglose de Evaluación
          </h3>
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {preguntas.map((p, idx) => (
              <div key={idx} className="p-4 bg-white/5 rounded-2xl border border-white/10 flex items-start gap-4">
                {p.correcta ? (
                  <CheckCircle2 className="w-6 h-6 text-academic-emerald shrink-0 mt-1" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-500 shrink-0 mt-1" />
                )}
                <div>
                  <span className="block font-bold text-white">Pregunta {p.id || idx + 1}</span>
                  <p className="text-sm text-gray-400">{p.comentario}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Improvements */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="glass rounded-3xl p-8"
        >
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-academic-light" />
            Temas a Reforzar
          </h3>
          <div className="flex flex-wrap gap-3">
            {temasAFallar && temasAFallar.length > 0 ? (
              temasAFallar.map((tema, idx) => (
                <span key={idx} className="px-4 py-2 bg-academic-light/10 text-academic-light rounded-full border border-academic-light/20 font-medium">
                  {tema}
                </span>
              ))
            ) : (
              <p className="text-gray-400">No se detectaron temas críticos para mejorar. ¡Buen trabajo!</p>
            )}
          </div>
        </motion.div>
      </div>

      {/* Final Summary Card at the bottom */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-gradient-to-r from-academic-blue to-academic-teal p-1 rounded-3xl shadow-2xl shadow-academic-teal/20"
      >
        <div className="bg-academic-dark/90 backdrop-blur-xl p-8 rounded-[1.4rem] flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-academic-teal rounded-2xl shadow-lg shadow-academic-teal/30">
              <Star className="w-8 h-8 text-white fill-white" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Resumen de Evaluación</p>
              <h4 className="text-2xl font-bold text-white">{nombreEstudiante}</h4>
            </div>
          </div>
          
          <div className="flex items-center gap-8">
            <div className="text-center md:text-right">
              <p className="text-gray-400 text-sm">Puntaje Final</p>
              <p className="text-4xl font-black text-academic-teal">{notaFinal} <span className="text-xl text-gray-500">/ 5.0</span></p>
            </div>
            <button
              onClick={onReset}
              className="px-8 py-4 bg-white text-academic-dark font-bold rounded-2xl hover:bg-academic-teal hover:text-white transition-all shadow-xl active:scale-95"
            >
              Nueva Evaluación
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
