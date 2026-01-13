import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { LogIn, Lock, User as UserIcon } from 'lucide-react';

const Login = () => {
    const { login } = useAuth();
    const { t } = useLanguage();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(username, password);
        } catch (err) {
            setError(err.message || 'Error al iniciar sesión');
        } finally {
            setLoading(false);
        }
    };

    // Generate users from 1 to 10 for the dropdown
    const usersList = Array.from({ length: 10 }, (_, i) => `Usuario ${i + 1}`);

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#f3f4f6] p-4 relative overflow-hidden">
            {/* Background Accents */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#FBCC00] rounded-full filter blur-3xl opacity-20 -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#454547] rounded-full filter blur-3xl opacity-10 -ml-32 -mb-32"></div>

            <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl z-10 border border-gray-100">
                <div className="text-center">
                    <div className="flex justify-center mb-4">
                        <div className="bg-[#FBCC00] p-4 rounded-full shadow-inner">
                            <LogIn size={40} className="text-[#060405]" />
                        </div>
                    </div>
                    <h2 className="text-3xl font-black text-[#060405] uppercase tracking-tighter">
                        TAMTO <span className="text-gray-400 font-light text-xl tracking-normal">| QUALITY REPORT</span>
                    </h2>
                    <p className="mt-2 text-sm font-medium text-gray-500 uppercase tracking-widest">
                        {t('auth.loginTitle') || 'Acceso al Sistema'}
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div className="relative group">
                            <label className="text-[10px] font-bold text-gray-400 uppercase ml-2 mb-1 block">
                                {t('auth.username') || 'Usuario'}
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#FBCC00] transition-colors">
                                    <UserIcon size={18} />
                                </div>
                                <select
                                    required
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-3 border-b-2 border-gray-200 bg-gray-50 text-gray-900 font-bold focus:outline-none focus:border-[#FBCC00] focus:bg-white transition-all appearance-none rounded-t-lg"
                                >
                                    <option value="" disabled>{t('auth.selectUser') || 'Seleccionar Usuario'}</option>
                                    {usersList.map((user) => (
                                        <option key={user} value={user}>
                                            {user}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="relative group">
                            <label className="text-[10px] font-bold text-gray-400 uppercase ml-2 mb-1 block">
                                {t('auth.password') || 'Contraseña (4 dígitos)'}
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#FBCC00] transition-colors">
                                    <Lock size={18} />
                                </div>
                                <input
                                    type="password"
                                    required
                                    maxLength={4}
                                    pattern="\d{4}"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••"
                                    className="block w-full pl-10 pr-3 py-3 border-b-2 border-gray-200 bg-gray-50 text-gray-900 font-bold tracking-[0.5em] focus:outline-none focus:border-[#FBCC00] focus:bg-white transition-all rounded-t-lg"
                                />
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-50 border-l-4 border-red-500 p-3 flex items-center space-x-2 animate-shake">
                            <span className="text-xs font-bold text-red-700 uppercase tracking-tight">{error}</span>
                        </div>
                    )}

                    <div>
                        <button
                            type="submit"
                            disabled={loading || !username || password.length !== 4}
                            className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-sm font-black rounded-lg text-[#060405] bg-[#FBCC00] hover:bg-[#ebbf00] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FBCC00] transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:grayscale"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-[#060405] border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                t('auth.signIn') || 'INGRESAR'
                            )}
                        </button>
                    </div>
                </form>

                <div className="text-center mt-6">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                        TAMTO © 2026 | CALIDAD
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
