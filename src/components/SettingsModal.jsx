import { useState, useEffect } from 'react';
import { Settings, X, Key, ShieldCheck, AlertTriangle } from 'lucide-react';
import { getApiKeys, saveApiKeys, getServerConfig } from '../services/nvidiaApi';

export const SettingsModal = ({ isOpen, onClose }) => {
  const [keys, setKeys] = useState({ nvidia: '', provider: 'NVIDIA' });
  const [hasServerKey, setHasServerKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Cargar claves cuando el modal se abre (usando useEffect correctamente)
  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;
    setIsLoading(true);
    setSaved(false);

    Promise.all([getApiKeys(), getServerConfig()]).then(([loadedKeys, sCfg]) => {
      if (cancelled) return;
      setKeys(loadedKeys);
      setHasServerKey(sCfg.hasServerKey);
      setIsLoading(false);
    }).catch(() => {
      if (cancelled) return;
      setIsLoading(false);
    });

    return () => { cancelled = true; };
  }, [isOpen]);

  const handleSave = async () => {
    await saveApiKeys(keys);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md glass p-8 rounded-3xl shadow-2xl animate-in zoom-in duration-300">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-academic-teal" /> Configuración de Seguridad
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Indicador de clave en servidor */}
          {hasServerKey ? (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-start gap-2.5">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-emerald-300">Servidor Asegurado Activo</h4>
                <p className="text-xs text-emerald-300/80 mt-1">
                  La API Key de NVIDIA está configurada de forma segura del lado del servidor (`.env`). No es necesario ingresar ninguna clave en el navegador.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-300/80">
                Tu API Key se guardará cifrada con AES-256 de forma local en tu navegador. Para máxima seguridad, configúrala en el archivo `.env` del servidor.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase">
              NVIDIA API Key {hasServerKey && <span className="text-emerald-400 font-normal lowercase">(opcional - servidor configurado)</span>}
            </label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="password"
                value={isLoading ? '' : keys.nvidia}
                onChange={(e) => setKeys({...keys, nvidia: e.target.value})}
                placeholder={isLoading ? 'Cargando...' : hasServerKey ? '•••••••••••••••••••• (Servidor)' : 'nvapi-...'}
                disabled={isLoading}
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-academic-teal text-white disabled:opacity-50"
              />
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saved || isLoading}
            className={`w-full py-4 rounded-xl font-bold transition-all ${saved ? 'bg-academic-emerald text-white' : 'bg-academic-teal text-white shadow-lg shadow-academic-teal/20'} disabled:opacity-50`}
          >
            {saved ? 'Guardado ✓' : 'Guardar Configuración'}
          </button>
        </div>
      </div>
    </div>
  );
};
