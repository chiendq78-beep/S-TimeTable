import React, { useState } from 'react';
import {
  Settings,
  Sun,
  Moon,
  Globe,
  Bell,
  CheckCircle2,
  Sparkles,
  School,
  BookOpen,
  RotateCcw,
  ExternalLink,
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
  onNavigateSubjects?: () => void;
  onNavigateClasses?: () => void;
  onSyncTimetables?: () => void;
  onShowToast?: (msg: string) => void;
}

export const SystemSettingsView: React.FC<SystemSettingsViewProps> = ({
  theme,
  onThemeChange,
  lang,
  onLanguageChange,
  onResetData,
  onNavigateNotifications,
  onNavigateSubjects,
  onNavigateClasses,
}) => {
  const t = translations[lang];

  // Notification permission state
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

  const timetables = StorageService.getClassTimetables();

  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-5 animate-fadeIn pb-12">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-gray-800 p-4 sm:p-5 shadow-xs">
        <div className="flex items-center gap-3">
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

      {/* 1. SHORTCUT: QUẢN LÝ LỚP HỌC */}
      <section className="bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-gray-800 p-4 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#ebdcd0] dark:bg-gray-800 text-[#5b3823] dark:text-[#d7b89f] flex items-center justify-center shrink-0 mt-0.5">
              <School className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">
                  {lang === 'vi' ? 'Quản Lý Lớp Học' : 'Class Management'}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#faf6f0] dark:bg-gray-800 text-[#5b3823] dark:text-[#d7b89f] border border-[#ebdcd0] dark:border-gray-700">
                  {timetables.length} {t.classTimetable.classCount}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 max-w-xl">
                {lang === 'vi'
                  ? 'Quản lý thông tin chi tiết lớp, thêm lớp mới, chỉnh sửa và chuyển đổi thời khóa biểu'
                  : 'Manage class details, add new classes, edit, duplicate, and switch timetables'}
              </p>
            </div>
          </div>

          {onNavigateClasses && (
            <button
              type="button"
              onClick={onNavigateClasses}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#5b3823] hover:bg-[#72462c] text-white transition-colors shadow-xs cursor-pointer shrink-0"
            >
              <School className="w-4 h-4" />
              <span>{lang === 'vi' ? 'Mở Quản lý lớp' : 'Manage Classes'}</span>
              <ExternalLink className="w-3.5 h-3.5 ml-0.5" />
            </button>
          )}
        </div>
      </section>

      {/* 2. GIAO DIỆN (TỐI / SÁNG) */}
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
            className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all text-left cursor-pointer ${
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
            className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all text-left cursor-pointer ${
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

      {/* 3. NGÔN NGỮ (LANGUAGE) */}
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
            className={`flex items-center justify-between p-2.5 sm:p-3 rounded-xl border text-left transition-all cursor-pointer ${
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
            className={`flex items-center justify-between p-2.5 sm:p-3 rounded-xl border text-left transition-all cursor-pointer ${
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

      {/* 4. DANH SÁCH MÔN HỌC */}
      <section className="bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-gray-800 p-4 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#ebdcd0]/70 dark:bg-gray-800 text-[#5b3823] dark:text-[#d7b89f] flex items-center justify-center shrink-0 mt-0.5">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">
                {lang === 'vi' ? 'Danh Sách Môn Học' : 'Subject Management'}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 max-w-xl">
                {lang === 'vi'
                  ? 'Quản lý danh mục các môn học, mã viết tắt, màu sắc nhận diện và áp dụng theo lớp'
                  : 'Manage list of subjects, codes, color tags, and per-class configurations'}
              </p>
            </div>
          </div>

          {onNavigateSubjects && (
            <button
              type="button"
              onClick={onNavigateSubjects}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#5b3823] hover:bg-[#72462c] text-white transition-colors shadow-xs cursor-pointer shrink-0"
            >
              <BookOpen className="w-4 h-4" />
              <span>{lang === 'vi' ? 'Quản lý Môn học' : 'Manage Subjects'}</span>
              <ExternalLink className="w-3.5 h-3.5 ml-0.5" />
            </button>
          )}
        </div>
      </section>

      {/* 5. THÔNG BÁO VÀ NHẮC NHỞ */}
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
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800 transition-colors shadow-xs cursor-pointer"
              >
                {lang === 'vi' ? 'Mở Quản lý thông báo' : 'Open Notification Management'}
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
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#5b3823] text-white hover:bg-[#72462c] transition-colors shadow-xs cursor-pointer"
              >
                {t.system.requestPermBtn}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 6. KHÔI PHỤC DỮ LIỆU */}
      {onResetData && (
        <section className="bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-gray-800 p-4 sm:p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 mt-0.5">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">
                  {lang === 'vi' ? 'Khôi phục Dữ liệu Mẫu' : 'Reset Sample Data'}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 max-w-xl">
                  {lang === 'vi'
                    ? 'Đặt lại toàn bộ dữ liệu thời khóa biểu, lịch học thêm, lịch thi, bài tập và bảng điểm về trạng thái ban đầu.'
                    : 'Reset all timetable, tutoring, exams, homework, and grade records back to initial sample state.'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onResetData}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800 transition-colors shadow-xs cursor-pointer shrink-0 self-start sm:self-auto"
            >
              {lang === 'vi' ? 'Khôi phục mặc định' : 'Reset Data'}
            </button>
          </div>
        </section>
      )}
    </div>
  );
};
