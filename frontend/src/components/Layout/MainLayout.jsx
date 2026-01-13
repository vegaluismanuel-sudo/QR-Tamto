import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { Settings, FileText, PieChart, TrendingUp, History, Globe, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const MainLayout = ({ children }) => {
    const { t, language, toggleLanguage } = useLanguage();
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const isActive = (path) => location.pathname === path;

    const navItems = [
        { path: '/dashboard', label: t('modules.dataCapture'), icon: <FileText size={20} /> },
        { path: '/stats', label: t('modules.statsSummary'), icon: <PieChart size={20} /> },
        { path: '/capability', label: t('modules.capabilityIndices'), icon: <TrendingUp size={20} /> },
        { path: '/history', label: t('modules.history'), icon: <History size={20} /> },
    ];

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col">
            {/* Top Header */}
            <header className="bg-white shadow-sm z-10 no-print">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex">
                            <div className="flex-shrink-0 flex items-center">
                                <h1 className="text-2xl font-bold text-black italic tracking-tighter">
                                    Tamto
                                    <sup className="text-xs not-italic align-top ml-1">®</sup>
                                </h1>
                            </div>
                            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                                {navItems.map((item) => (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${isActive(item.path)
                                            ? 'border-tamto-yellow text-gray-900'
                                            : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                            }`}
                                    >
                                        <span className="mr-2">{item.icon}</span>
                                        {item.label}
                                    </Link>
                                ))}
                            </div>
                        </div>
                        <div className="flex items-center space-x-6">
                            {/* User Info */}
                            <div className="flex items-center space-x-2 border-l pl-6 border-gray-100 h-8">
                                <div className="flex flex-col items-end">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Usuario</span>
                                    <span className="text-sm font-black text-[#060405] leading-none mt-1">{user?.username}</span>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-[#454547] border border-gray-200">
                                    <span className="text-xs font-black uppercase">{user?.username?.split(' ')[1] || 'U'}</span>
                                </div>
                            </div>

                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => toggleLanguage(language === 'en' ? 'es' : 'en')}
                                    className="p-2 rounded-full text-gray-400 hover:text-[#FBCC00] focus:outline-none transition-colors group flex items-center"
                                    title="Change Language"
                                >
                                    <span className="font-bold text-xs mr-1 group-hover:text-gray-900">{language.toUpperCase()}</span>
                                    <Globe size={18} />
                                </button>

                                {showLogoutConfirm ? (
                                    <div className="flex items-center bg-red-50 rounded-lg p-1 border border-red-100 animate-in fade-in slide-in-from-right-4 duration-300">
                                        <span className="text-[10px] font-bold text-red-600 px-2 uppercase tracking-tight">¿Salir?</span>
                                        <button
                                            onClick={() => {
                                                console.log('Logout confirmed via UI');
                                                try {
                                                    logout();
                                                    sessionStorage.removeItem('tamto_user');
                                                    navigate('/login', { replace: true });
                                                } catch (error) {
                                                    console.error('Logout failed:', error);
                                                    window.location.href = '/login';
                                                }
                                            }}
                                            className="px-2 py-1 bg-red-600 text-white text-[10px] font-black rounded hover:bg-red-700 transition-colors uppercase"
                                        >
                                            Sí
                                        </button>
                                        <button
                                            onClick={() => setShowLogoutConfirm(false)}
                                            className="px-2 py-1 text-gray-500 text-[10px] font-bold hover:text-gray-700 transition-colors uppercase"
                                        >
                                            No
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => {
                                            console.log('Logout UI triggered');
                                            setShowLogoutConfirm(true);
                                        }}
                                        className="p-2 rounded-full text-gray-400 hover:text-red-500 focus:outline-none transition-colors"
                                        title="Logout"
                                    >
                                        <LogOut size={18} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children}
            </main>
        </div>
    );
};

export default MainLayout;
