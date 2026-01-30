'use client';

import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language.startsWith('pt') ? 'en' : 'pt';
    i18n.changeLanguage(newLang);
  };

  const currentLang = i18n.language.startsWith('pt') ? 'PT' : 'EN';

  return (
    <button
      onClick={toggleLanguage}
      className="btn btn-link text-decoration-none d-flex align-items-center gap-2 p-2 rounded-3 transition-all language-switcher"
      title="Alterar Idioma / Change Language"
    >
      <div className="bg-secondary bg-opacity-10 p-2 rounded-circle d-flex align-items-center justify-content-center">
        <Languages size={18} className="text-secondary" />
      </div>
      <span className="small fw-bold text-muted">{currentLang}</span>
    </button>
  );
}
