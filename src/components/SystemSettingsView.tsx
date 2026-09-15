import React, { useState } from 'react';
import {
  Settings,
  Sun,
  Moon,
  Globe,
  Bell,
  HardDrive,
  Download,
  RotateCcw,
  CheckCircle2,
  Info,
  Laptop,
  Sparkles,
} from 'lucide-react';
import { Language, Theme } from '../types';
import { translations } from '../i18n/translations';
import { NotificationService } from '../services/notification';
import { StorageService } from '../services/storage';

interface SystemSettingsViewProps {
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  lang: Language;
  onLanguageChange: (lang: Language) => void;
  onResetData?: () => void;
  onNavigateNotifications?: () => void;
}

export const SystemSettingsView: React.FC<SystemSettingsViewProps> = ({
  theme,
  onThemeChange,
  lang,
  onLanguageChange,
  onResetData,
  onNavigateNotifications,
}) => {
  const t = translations[lang];
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [hasNotificationPerm, setHasNotificationPerm] = useState(() => {
    return typeof window !== 'undefined' && 'Notification' in window
      ? Notification.permission === 'granted'
      : false;
  });

  const handleRequestNotification = async () => {
    const granted = await NotificationService.requestPermission();
    setHasNotificationPerm(granted);
    if (granted) {
      NotificationService.notify(
        lang === 'vi' ? 'Thông báo đã bật!' : 'Notifications Enabled!',
        lang === 'vi'
          ? 'Bạn sẽ nhận được nhắc nhở lịch học và bài tập kịp thời.'
          : 'You will receive timely alerts for classes and homework.'
      );
    }
  };

  const handleExportBackup = () => {
    try {
      const backupData = {
        exportedAt: new Date().toISOString(),
        profile: StorageService.getStudentProfile(),
        timetable: StorageService.getTimetable(),
        extraClasses: StorageService.getExtraClasses(),
        exams: StorageService.getExams(),
        homework: StorageService.getHomework(),
        grades: StorageService.getGrades(),
        notices: StorageService.getNotices(),
        theme,
        language: lang,
      };

      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute(
        'download',
        `sotay_hocsinh_backup_${new Date().toISOString().slice(0, 10)}.json`
      );
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch {
      // fallback
    }
  };

  const handleConfirmReset = () => {
    if (onResetData) {
      onResetData();
    } else {
      StorageService.resetToSeedData();
      window.location.reload();
    }
    setIsResetModalOpen(false);
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-3 bg-white dark:bg-gray-900 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#5b3823]/10 dark:bg-[#d7b89f]/20 text-[#5b3823] dark:text-[#d7b89f] flex items-center justify-center shrink-0">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-xl font-bold text-gray-900 dark:text-white">
              {t.system.title}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
              {t.system.subtitle}
            </p>
          </div>
        </div>
      </div>

      {/* 1. GIAO DIỆN (TỐI / SÁNG) - PRIMARY SECTION */}
      <section className="bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-gray-800 p-3.5 sm:p-4 shadow-xs">
        <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-gray-100 dark:border-gray-800">
          <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            {t.system.appearance}
          </h3>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {theme === 'light' ? t.system.lightMode : t.system.darkMode}
          </span>
        </div>

        {/* Theme Select Compact 2-col Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* Light Theme Card */}
          <button
            type="button"
            id="theme-light-card"
            onClick={() => onThemeChange('light')}
            className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all text-left ${
              theme === 'light'
                ? 'border-[#5b3823] bg-amber-50/50 dark:bg-amber-950/20 shadow-xs'
                : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 bg-gray-50/40 dark:bg-gray-850/40'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                <Sun className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white truncate">
                  {t.system.lightMode}
                </div>
                <div className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                  {t.system.lightModeDesc}
                </div>
              </div>
            </div>

            {theme === 'light' ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#5b3823] text-white shrink-0 ml-2">
                <CheckCircle2 className="w-3 h-3" />
                {t.system.themeActive}
              </span>
            ) : (
              <span className="text-[11px] font-semibold text-gray-400 shrink-0 ml-2">
                {t.system.selectTheme}
              </span>
            )}
          </button>

          {/* Dark Theme Card */}
          <button
            type="button"
            id="theme-dark-card"
            onClick={() => onThemeChange('dark')}
            className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all text-left ${
              theme === 'dark'
                ? 'border-[#d7b89f] bg-[#221711] shadow-xs'
                : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 bg-gray-50/40 dark:bg-gray-850/40'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-indigo-950/80 border border-indigo-800/60 text-indigo-400 flex items-center justify-center shrink-0">
                <Moon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white truncate">
                  {t.system.darkMode}
                </div>
                <div className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                  {t.system.darkModeDesc}
                </div>
              </div>
            </div>

            {theme === 'dark' ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#d7b89f] text-[#2c1810] shrink-0 ml-2">
                <CheckCircle2 className="w-3 h-3" />
                {t.system.themeActive}
              </span>
            ) : (
              <span className="text-[11px] font-semibold text-gray-400 shrink-0 ml-2">
                {t.system.selectTheme}
              </span>
            )}
          </button>
        </div>
      </section>

      {/* 2. NGÔN NGỮ (LANGUAGE) */}
      <section className="bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-gray-800 p-3.5 sm:p-4 shadow-xs">
        <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-gray-100 dark:border-gray-800">
          <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-500" />
            {t.system.languageSection}
          </h3>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {lang === 'vi' ? 'Tiếng Việt' : 'English'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => onLanguageChange('vi')}
            className={`flex items-center justify-between p-2.5 sm:p-3 rounded-xl border text-left transition-all ${
              lang === 'vi'
                ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 text-blue-900 dark:text-blue-200 ring-2 ring-blue-500/20 font-bold'
                : 'border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 text-gray-700 dark:text-gray-300'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className="text-base">🇻🇳</span>
              <span className="text-xs sm:text-sm font-semibold">{t.system.vietnamese}</span>
            </div>
            {lang === 'vi' && (
              <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            )}
          </button>

          <button
            type="button"
            onClick={() => onLanguageChange('en')}
            className={`flex items-center justify-between p-2.5 sm:p-3 rounded-xl border text-left transition-all ${
              lang === 'en'
                ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 text-blue-900 dark:text-blue-200 ring-2 ring-blue-500/20 font-bold'
                : 'border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 text-gray-700 dark:text-gray-300'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className="text-base">🇬🇧</span>
              <span className="text-xs sm:text-sm font-semibold">{t.system.english}</span>
            </div>
            {lang === 'en' && (
              <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            )}
          </button>
        </div>
      </section>

      {/* 3. THÔNG BÁO VÀ NHẮC NHỞ */}
      <section className="bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-gray-800 p-4 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">
                {t.system.notificationsSection}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 max-w-xl">
                {t.system.notificationsDesc}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {onNavigateNotifications && (
              <button
                type="button"
                onClick={onNavigateNotifications}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800 transition-colors shadow-xs"
              >
                {lang === 'vi' ? 'Mở Trung tâm Thông báo' : 'Open Notification Center'}
              </button>
            )}
            {hasNotificationPerm ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {t.system.notificationsEnabled}
              </span>
            ) : (
              <button
                type="button"
                onClick={handleRequestNotification}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#5b3823] text-white hover:bg-[#72462c] transition-colors shadow-xs"
              >
                {t.system.requestPermBtn}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 4. DỮ LIỆU & SAO LƯU */}
      <section className="bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-gray-800 p-4 sm:p-6 shadow-xs">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">
              {t.system.storageSection}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {t.system.storageDesc}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 pt-2">
          <button
            type="button"
            id="export-backup-btn"
            onClick={handleExportBackup}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-[#5b3823] dark:text-[#d7b89f]" />
            <span>{t.system.exportBackup}</span>
          </button>

          <button
            type="button"
            id="reset-data-btn"
            onClick={() => setIsResetModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t.system.resetData}</span>
          </button>
        </div>
      </section>

      {/* 5. THÔNG TIN HỆ THỐNG */}
      <section className="bg-gray-50/75 dark:bg-gray-850/60 rounded-xl sm:rounded-2xl border border-gray-200/80 dark:border-gray-800 p-4 sm:p-5 text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-2 font-bold text-gray-700 dark:text-gray-300 mb-3">
          <Info className="w-4 h-4 text-gray-500" />
          <span>{t.system.aboutSection}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
            <span className="block text-[11px] text-gray-400 font-medium">
              {t.system.version}
            </span>
            <span className="font-bold text-gray-900 dark:text-white text-xs sm:text-sm">
              v2.4.0 (2026 Edition)
            </span>
          </div>
          <div className="p-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
            <span className="block text-[11px] text-gray-400 font-medium">
              {t.system.platform}
            </span>
            <span className="font-bold text-gray-900 dark:text-white text-xs sm:text-sm flex items-center gap-1.5">
              <Laptop className="w-3.5 h-3.5 text-blue-500" />
              PWA / Web Local
            </span>
          </div>
          <div className="p-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
            <span className="block text-[11px] text-gray-400 font-medium">
              {t.system.status}
            </span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {t.system.statusReady}
            </span>
          </div>
        </div>
      </section>

      {/* Modal Confirm Reset */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 sm:p-6 max-w-sm w-full border border-gray-200 dark:border-gray-800 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 flex items-center justify-center mx-auto">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                {t.system.resetConfirmTitle}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
                {t.system.resetConfirmDesc}
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsResetModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                {t.common.cancel}
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-colors"
              >
                {t.system.resetData}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
