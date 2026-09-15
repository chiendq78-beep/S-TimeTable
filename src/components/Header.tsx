import React from 'react';
import {
  BookOpen,
  Globe,
  Menu,
} from 'lucide-react';
import { Language, Theme } from '../types';
import { translations } from '../i18n/translations';

interface HeaderProps {
  lang: Language;
  onLanguageChange: (lang: Language) => void;
  theme?: Theme;
  onThemeToggle?: () => void;
  onToggleTheme?: () => void;
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  lang,
  onLanguageChange,
  onToggleSidebar,
}) => {
  const t = translations[lang];

  return (
    <header className="sticky top-0 z-30 w-full border-b border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md transition-colors">
      <div className="w-full px-4 sm:px-5 py-2.5 flex items-center justify-between gap-3">
        {/* Brand & Title */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          {onToggleSidebar && (
            <button
              id="header-toggle-sidebar-btn"
              onClick={onToggleSidebar}
              className="p-2 -ml-1.5 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-hidden shrink-0"
              title={lang === 'vi' ? 'Ẩn / Hiện Menu' : 'Toggle Menu'}
              aria-label="Toggle Navigation Sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#5b3823] to-[#8c5a38] text-white flex items-center justify-center shadow-md shadow-[#5b3823]/20 shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white truncate">
                {t.appTitle}
              </h1>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate hidden md:block">
              {t.appSubtitle}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Language Switch */}
          <button
            id="language-toggle-btn"
            onClick={() => onLanguageChange(lang === 'vi' ? 'en' : 'vi')}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 transition-colors"
            title="Đổi ngôn ngữ / Switch Language"
          >
            <Globe className="w-3.5 h-3.5 text-blue-500" />
            <span>{lang.toUpperCase()}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
