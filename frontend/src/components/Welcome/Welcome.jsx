import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { Globe } from 'lucide-react';

const Welcome = () => {
    const navigate = useNavigate();
    const { t, language, toggleLanguage } = useLanguage();

    const handleAccess = () => {
        navigate('/dashboard');
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
            <div className="absolute top-4 right-4 flex items-center space-x-2">
                <Globe className="w-5 h-5 text-tamto-grey" />
                <button
                    onClick={() => toggleLanguage('en')}
                    className={`px-2 py-1 rounded ${language === 'en' ? 'font-bold text-tamto-yellow' : 'text-tamto-grey'}`}
                >
                    EN
                </button>
                <span className="text-gray-300">|</span>
                <button
                    onClick={() => toggleLanguage('es')}
                    className={`px-2 py-1 rounded ${language === 'es' ? 'font-bold text-tamto-yellow' : 'text-tamto-grey'}`}
                >
                    ES
                </button>
            </div>

            <div className="bg-white p-12 rounded-lg shadow-xl text-center max-w-lg w-full">
                {/* Placeholder for Logo */}
                <div className="mb-8">
                    {/* Using text representation for now as we don't have the logo asset in public yet */}
                    <h1 className="text-5xl font-bold text-black italic tracking-tighter">
                        Tamto
                        <sup className="text-sm not-italic align-top ml-1">®</sup>
                    </h1>
                    <p className="text-sm text-tamto-grey mt-2">Industrial Tamto de Puebla S.A. de C.V.</p>
                </div>

                <h2 className="text-2xl font-semibold mb-8 text-tamto-grey">
                    {t('welcome')}
                </h2>

                <button
                    onClick={handleAccess}
                    className="bg-tamto-yellow text-black font-bold py-3 px-8 rounded hover:bg-yellow-400 transition-colors duration-200 shadow-md transform hover:scale-105"
                >
                    {t('access')}
                </button>
            </div>
        </div>
    );
};

export default Welcome;
