import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, ShieldCheck, AlertTriangle, ShieldAlert, BookOpen, Check, HelpCircle } from 'lucide-react';
import { markingStyles } from '../../api/markingStyles.js';

export const MarkingGuideModal = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompatibility, setSelectedCompatibility] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Obtener categorías únicas
  const categories = useMemo(() => {
    const cats = new Set(markingStyles.map(s => s.categoria));
    return ['all', ...Array.from(cats)];
  }, []);

  // Filtrar estilos según los criterios seleccionados
  const filteredStyles = useMemo(() => {
    return markingStyles.filter(style => {
      const matchesSearch = 
        style.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        style.descripcion.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (style.riesgoExplicacion && style.riesgoExplicacion.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesCompatibility = 
        selectedCompatibility === 'all' || style.compatibilidad === selectedCompatibility;

      const matchesCategory = 
        selectedCategory === 'all' || style.categoria === selectedCategory;

      return matchesSearch && matchesCompatibility && matchesCategory;
    });
  }, [searchQuery, selectedCompatibility, selectedCategory]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-5xl glass rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Cabecera */}
        <div className="p-6 md:p-8 border-b border-white/10 flex justify-between items-center bg-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-academic-teal/10 rounded-xl border border-academic-teal/20">
              <BookOpen className="w-6 h-6 text-academic-teal" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-white">
                Guía de Marcación de Exámenes e IA
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                50 formas de marcar respuestas analizadas y mapeadas para optimizar la detección por visión artificial.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Banner Informativo sobre Riesgos de Marcación */}
        <div className="bg-gradient-to-r from-amber-500/10 via-red-500/5 to-transparent px-6 py-4 border-b border-white/10 flex flex-col md:flex-row gap-4 items-start md:items-center text-xs">
          <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400 shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-amber-300">¿Cómo evitar que la IA interprete erróneamente un examen?</h4>
            <p className="text-gray-300 mt-0.5">
              Los errores más comunes ocurren por **marcas múltiples (borrados fantasmas)** o **métodos de descarte invertido** (tachar las incorrectas dejando la correcta libre). La IA está configurada para analizar estas situaciones complejas, pero aconsejar a tus alumnos usar marcas de **Alta Compatibilidad** garantizará el 100% de éxito.
            </p>
          </div>
        </div>

        {/* Filtros y Buscador */}
        <div className="p-6 border-b border-white/10 bg-white/5 space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Buscador */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar formas de marcar por nombre, palabra clave o riesgo..."
                className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-academic-teal text-white placeholder-gray-500 text-sm"
              />
            </div>

            {/* Selector de Categoría */}
            <div className="w-full md:w-56">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2.5 bg-academic-dark border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-academic-teal text-white text-sm cursor-pointer"
              >
                <option value="all">Todas las categorías</option>
                {categories.filter(c => c !== 'all').map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Filtros de Compatibilidad / Riesgo */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-gray-400 mr-2 font-bold uppercase tracking-wider text-[10px]">Filtrar por compatibilidad:</span>
            <button
              onClick={() => setSelectedCompatibility('all')}
              className={`px-3 py-1.5 rounded-lg border transition-all font-semibold ${selectedCompatibility === 'all' ? 'bg-academic-teal border-academic-teal text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white'}`}
            >
              Ver Todas ({markingStyles.length})
            </button>
            <button
              onClick={() => setSelectedCompatibility('alta')}
              className={`px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 font-semibold ${selectedCompatibility === 'alta' ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' : 'bg-white/5 border-white/10 text-emerald-400/70 hover:bg-white/10 hover:text-emerald-400'}`}
            >
              <ShieldCheck className="w-4 h-4" /> Alta / Recomendada ({markingStyles.filter(s => s.compatibilidad === 'alta').length})
            </button>
            <button
              onClick={() => setSelectedCompatibility('media')}
              className={`px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 font-semibold ${selectedCompatibility === 'media' ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' : 'bg-white/5 border-white/10 text-amber-400/70 hover:bg-white/10 hover:text-amber-400'}`}
            >
              <AlertTriangle className="w-4 h-4" /> Media / Tolerada ({markingStyles.filter(s => s.compatibilidad === 'media').length})
            </button>
            <button
              onClick={() => setSelectedCompatibility('baja')}
              className={`px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 font-semibold ${selectedCompatibility === 'baja' ? 'bg-red-500/20 border-red-500/40 text-red-300' : 'bg-white/5 border-white/10 text-red-400/70 hover:bg-white/10 hover:text-red-400'}`}
            >
              <ShieldAlert className="w-4 h-4" /> Baja / Crítica ({markingStyles.filter(s => s.compatibilidad === 'baja').length})
            </button>
          </div>
        </div>

        {/* Contenido principal - Grilla de estilos */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar bg-black/10">
          {filteredStyles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
              <HelpCircle className="w-12 h-12 text-gray-500 animate-pulse" />
              <div className="space-y-1">
                <p className="text-lg font-bold text-gray-300">No se encontraron estilos de marcación</p>
                <p className="text-sm text-gray-500">Prueba ajustando los filtros de búsqueda o compatibilidad.</p>
              </div>
            </div>
          ) : (
            <motion.div 
              layout
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <AnimatePresence>
                {filteredStyles.map((style) => (
                  <motion.div
                    key={style.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="p-5 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 hover:border-white/20 transition-all duration-300 flex flex-col justify-between group"
                  >
                    <div>
                      {/* Cabecera de la Tarjeta */}
                      <div className="flex justify-between items-start gap-2 mb-3">
                        <div>
                          <span className="text-xs font-mono font-bold text-academic-teal bg-academic-teal/10 px-2 py-0.5 rounded border border-academic-teal/20 mr-2">
                            #{style.id}
                          </span>
                          <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                            {style.categoria}
                          </span>
                          <h3 className="text-base font-bold text-white mt-1 group-hover:text-academic-teal transition-colors">
                            {style.nombre}
                          </h3>
                        </div>

                        {/* Badge de compatibilidad */}
                        <div className="shrink-0">
                          {style.compatibilidad === 'alta' && (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 uppercase">
                              <ShieldCheck className="w-3.5 h-3.5" /> Alta
                            </span>
                          )}
                          {style.compatibilidad === 'media' && (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 uppercase">
                              <AlertTriangle className="w-3.5 h-3.5" /> Media
                            </span>
                          )}
                          {style.compatibilidad === 'baja' && (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide flex items-center gap-1 bg-red-500/10 border border-red-500/20 text-red-400 uppercase">
                              <ShieldAlert className="w-3.5 h-3.5" /> Crítica
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Descripción */}
                      <p className="text-xs text-gray-300 leading-relaxed mb-4">
                        {style.descripcion}
                      </p>
                    </div>

                    {/* Sección de Riesgo y Recomendación */}
                    <div className="space-y-2.5 pt-3 border-t border-white/5 text-[11px]">
                      <div>
                        <span className="font-bold text-red-400/90 block">Análisis de Riesgo de Lectura:</span>
                        <span className="text-gray-400">{style.riesgoExplicacion}</span>
                      </div>
                      <div>
                        <span className="font-bold text-emerald-400/90 block">Recomendación / Solución:</span>
                        <span className="text-gray-400">{style.recomendacion}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>

        {/* Footer del Modal */}
        <div className="p-5 border-t border-white/10 bg-white/5 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-gray-400">
          <div className="flex items-center gap-1.5 text-academic-teal font-semibold">
            <Check className="w-4 h-4" /> IA configurada con tolerancia activa para estas 50 marcas
          </div>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-all border border-white/10"
          >
            Entendido
          </button>
        </div>
      </motion.div>
    </div>
  );
};
