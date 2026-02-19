import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X } from 'lucide-react';

function ReloadPrompt() {
    const {
        offlineReady: [offlineReady, setOfflineReady],
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegistered(r) {
            console.log('SW Registered: ' + r);
        },
        onRegisterError(error) {
            console.log('SW registration error', error);
        },
    });

    const close = () => {
        setOfflineReady(false);
        setNeedRefresh(false);
    };

    return (
        <div className="fixed bottom-0 right-0 p-4 z-[100] flex flex-col gap-2">
            {(offlineReady || needRefresh) && (
                <div className="bg-slate-800 border border-indigo-500/30 shadow-2xl rounded-xl p-4 max-w-sm animate-in slide-in-from-bottom-5">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                            <h3 className="font-bold text-white mb-1">
                                {offlineReady ? 'App lista para trabajar offline' : 'Nueva versión disponible'}
                            </h3>
                            <p className="text-xs text-slate-400">
                                {offlineReady
                                    ? 'La aplicación ha sido guardada en caché y puede funcionar sin conexión.'
                                    : 'Hay una nueva actualización. Recarga para obtener las últimas mejoras.'}
                            </p>
                        </div>
                        <button onClick={close} className="text-slate-500 hover:text-white transition-colors">
                            <X size={18} />
                        </button>
                    </div>

                    {needRefresh && (
                        <button
                            className="mt-3 w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all shadow-lg flex items-center justify-center gap-2"
                            onClick={() => updateServiceWorker(true)}
                        >
                            <RefreshCw size={14} /> Actualizar ahora
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

export default ReloadPrompt;
