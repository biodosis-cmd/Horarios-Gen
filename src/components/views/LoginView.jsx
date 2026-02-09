import React, { useState } from 'react';
const LoginView = ({ onLogin }) => {
    const [pin, setPin] = useState('');
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!onLogin(pin)) alert("PIN Incorrecto");
    };
    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0f1221] p-4">
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-[30%] -left-[10%] w-[70%] h-[70%] rounded-full bg-indigo-500/10 blur-3xl"></div>
                <div className="absolute top-[20%] -right-[10%] w-[60%] h-[60%] rounded-full bg-violet-500/10 blur-3xl"></div>
            </div>

            <form onSubmit={handleSubmit} className="relative bg-slate-900/80 backdrop-blur-xl p-8 rounded-3xl border border-slate-700/50 text-center w-full max-w-sm shadow-2xl shadow-indigo-500/10">
                <div className="mb-6 inline-flex p-3 rounded-2xl bg-slate-800/50 border border-slate-700">
                    <span className="text-4xl">🔐</span>
                </div>

                <h1 className="text-2xl font-bold text-white mb-2">Bienvenido</h1>
                <p className="text-slate-400 mb-8 text-sm">Ingresa tu PIN de acceso para continuar</p>

                <div className="mb-6">
                    <input
                        type="password"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        autoComplete="off"
                        value={pin}
                        onChange={e => setPin(e.target.value)}
                        className="w-full bg-slate-800/50 border border-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white p-4 rounded-xl text-center tracking-[0.5em] text-2xl placeholder-transparent transition-all outline-none"
                        placeholder="PIN"
                        autoFocus
                    />
                </div>

                <button
                    type="submit"
                    className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white w-full py-3.5 rounded-xl font-bold text-lg shadow-lg shadow-indigo-500/25 active:scale-[0.98] transition-all"
                >
                    Acceder
                </button>
            </form>
        </div>
    );
}
export default LoginView;
