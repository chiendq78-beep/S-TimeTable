import React, { useState } from 'react';
import {
  Bell,
  Smartphone,
  Volume2,
  VolumeX,
  Send,
  GraduationCap,
  ScrollText,
  FileText,
  CheckCircle2,
  ListFilter,
  ArrowRight,
} from 'lucide-react';
import { Language, NotificationPreferences, ActiveTab } from '../types';
import { NotificationService } from '../services/notification';

interface NotificationManagementViewProps {
  preferences?: NotificationPreferences;
  onSavePreferences: (prefs: NotificationPreferences) => void;
  lang: Language;
  onNavigateTab?: (tab: ActiveTab) => void;
  onShowToast?: (message: string) => void;
  unreadCount?: number;
}

export const NotificationManagementView: React.FC<NotificationManagementViewProps> = ({
  preferences,
  onSavePreferences,
  lang,
  onNavigateTab,
  onShowToast,
  unreadCount = 0,
}) => {
  const [isTesting, setIsTesting] = useState(false);

  // Preference values with reliable defaults
  const currentPrefs: NotificationPreferences = preferences || {
    channels: {
      inApp: true,
      email: true,
      push: true,
      soundAndVibrate: true,
    },
    categories: {
      exam: true,
      timetable: true,
      homework: true,
    },
    rules: {
      examAdvanceDays: 3,
      homeworkAdvanceHours: 12,
      newGradeAlert: true,
    },
    quietHours: {
      enabled: false,
      startTime: '23:00',
      endTime: '06:00',
    },
  };

  const isPushEnabled = currentPrefs.channels?.push !== false;
  const isSoundEnabled = currentPrefs.channels?.soundAndVibrate !== false;
  const isExamEnabled = currentPrefs.categories?.exam !== false;
  const isTimetableEnabled = currentPrefs.categories?.timetable !== false;
  const isHomeworkEnabled = currentPrefs.categories?.homework !== false;

  // 1. Bật - tắt tất cả thông báo điện thoại
  const handleTogglePush = async () => {
    const nextVal = !isPushEnabled;
    if (nextVal) {
      const granted = await NotificationService.requestPermission();
      if (!granted && onShowToast) {
        onShowToast(
          lang === 'vi'
            ? 'Cần cấp quyền thông báo trong Cài đặt thiết bị để nhận thông báo'
            : 'Please grant notification permissions in system settings'
        );
      }
    }
    const updated: NotificationPreferences = {
      ...currentPrefs,
      channels: {
        ...currentPrefs.channels,
        push: nextVal,
      },
    };
    onSavePreferences(updated);
    if (onShowToast) {
      onShowToast(
        nextVal
          ? (lang === 'vi' ? 'Đã bật thông báo trên điện thoại' : 'Phone notifications enabled')
          : (lang === 'vi' ? 'Đã tắt thông báo trên điện thoại' : 'Phone notifications disabled')
      );
    }
  };

  // 2. Thử thông báo
  const handleTestNotification = async () => {
    if (!isPushEnabled) {
      if (onShowToast) {
        onShowToast(
          lang === 'vi'
            ? 'Vui lòng gạt Bật thông báo trên điện thoại trước khi thử'
            : 'Please enable phone notifications first'
        );
      }
      return;
    }
    setIsTesting(true);
    const success = await NotificationService.testPhoneNotification();
    setIsTesting(false);
    if (success) {
      if (onShowToast) {
        onShowToast(
          lang === 'vi'
            ? 'Đã gửi thông báo thử nghiệm thành công lên điện thoại!'
            : 'Test alert sent successfully to phone!'
        );
      }
    } else {
      if (onShowToast) {
        onShowToast(
          lang === 'vi'
            ? 'Vui lòng cấp quyền thông báo trên thiết bị'
            : 'Please grant notification permissions'
        );
      }
    }
  };

  // 3. Âm thanh và rung
  const handleToggleSoundAndVibrate = () => {
    const nextVal = !isSoundEnabled;
    const updated: NotificationPreferences = {
      ...currentPrefs,
      channels: {
        ...currentPrefs.channels,
        soundAndVibrate: nextVal,
      },
    };
    onSavePreferences(updated);
    if (nextVal) {
      NotificationService.playBellSound();
      NotificationService.vibrate();
    }
    if (onShowToast) {
      onShowToast(
        nextVal
          ? (lang === 'vi' ? 'Đã bật âm thanh và rung' : 'Sound & vibration enabled')
          : (lang === 'vi' ? 'Đã tắt âm thanh và rung' : 'Sound & vibration muted')
      );
    }
  };

  // 4. Bật - tắt thông báo "Lịch thi"
  const handleToggleExamCategory = () => {
    const nextVal = !isExamEnabled;
    const updated: NotificationPreferences = {
      ...currentPrefs,
      categories: {
        exam: nextVal,
        timetable: isTimetableEnabled,
        homework: isHomeworkEnabled,
      },
    };
    onSavePreferences(updated);
    if (onShowToast) {
      onShowToast(
        nextVal
          ? (lang === 'vi' ? 'Đã bật thông báo Lịch thi' : 'Exam notifications enabled')
          : (lang === 'vi' ? 'Đã tắt thông báo Lịch thi' : 'Exam notifications disabled')
      );
    }
  };

  // 5. Bật - tắt thông báo "Lịch học"
  const handleToggleTimetableCategory = () => {
    const nextVal = !isTimetableEnabled;
    const updated: NotificationPreferences = {
      ...currentPrefs,
      categories: {
        exam: isExamEnabled,
        timetable: nextVal,
        homework: isHomeworkEnabled,
      },
    };
    onSavePreferences(updated);
    if (onShowToast) {
      onShowToast(
        nextVal
          ? (lang === 'vi' ? 'Đã bật thông báo Lịch học' : 'Class schedule notifications enabled')
          : (lang === 'vi' ? 'Đã tắt thông báo Lịch học' : 'Class schedule notifications disabled')
      );
    }
  };

  // 6. Bật - tắt thông báo "Bài tập"
  const handleToggleHomeworkCategory = () => {
    const nextVal = !isHomeworkEnabled;
    const updated: NotificationPreferences = {
      ...currentPrefs,
      categories: {
        exam: isExamEnabled,
        timetable: isTimetableEnabled,
        homework: nextVal,
      },
    };
    onSavePreferences(updated);
    if (onShowToast) {
      onShowToast(
        nextVal
          ? (lang === 'vi' ? 'Đã bật thông báo Bài tập' : 'Homework notifications enabled')
          : (lang === 'vi' ? 'Đã tắt thông báo Bài tập' : 'Homework notifications disabled')
      );
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-5 animate-fadeIn pb-12">
      {/* 1. Header Card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-5 border border-gray-200 dark:border-gray-700 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#5b3823]/10 dark:bg-[#d7b89f]/20 text-[#5b3823] dark:text-[#d7b89f] flex items-center justify-center shrink-0">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
              {lang === 'vi' ? 'Quản lý thông báo' : 'Notification Management'}
            </h2>
          </div>
        </div>

        {onNavigateTab && (
          <button
            type="button"
            onClick={() => onNavigateTab('notifications')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#faf6f0] dark:bg-gray-700 text-[#5b3823] dark:text-[#f8ede3] border border-[#ebdcd0] dark:border-gray-600 hover:bg-[#f3ece4] transition-all cursor-pointer self-start sm:self-auto shrink-0 shadow-2xs"
          >
            <ListFilter className="w-4 h-4 text-[#5b3823] dark:text-[#d7b89f]" />
            <span>{lang === 'vi' ? 'Xem danh sách Thông báo' : 'View Notifications'}</span>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-[#c04328] text-white">
                {unreadCount}
              </span>
            )}
            <ArrowRight className="w-3.5 h-3.5 ml-0.5 opacity-60" />
          </button>
        )}
      </div>

      {/* 2. Cài đặt thông báo điện thoại */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-5 border border-gray-200 dark:border-gray-700 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-700/80">
          <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Smartphone className="w-4.5 h-4.5 text-[#5b3823] dark:text-[#d7b89f]" />
            <span>{lang === 'vi' ? 'Cài đặt thông báo điện thoại' : 'Phone Notification Settings'}</span>
          </h3>
        </div>

        {/* Row A: Bật - tắt thông báo trên điện thoại & Nút thử thông báo */}
        <div className="p-3.5 sm:p-4 rounded-xl bg-gray-50 dark:bg-gray-750/70 border border-gray-200/80 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                isPushEnabled
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                  : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
              }`}
            >
              <Bell className="w-4.5 h-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  {lang === 'vi' ? 'Bật thông báo trên điện thoại' : 'Enable Phone Notifications'}
                </span>
                {isPushEnabled ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                    <CheckCircle2 className="w-3 h-3" />
                    {lang === 'vi' ? 'Đang bật' : 'Enabled'}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-gray-500 bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                    {lang === 'vi' ? 'Đang tắt' : 'Disabled'}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            {/* Nút Thử thông báo */}
            <button
              type="button"
              id="btn-test-notification"
              onClick={handleTestNotification}
              disabled={isTesting || !isPushEnabled}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-gray-800 text-[#5b3823] dark:text-[#d7b89f] border border-[#ebdcd0] dark:border-gray-600 hover:bg-[#faf6f0] dark:hover:bg-gray-700 transition-all shadow-2xs cursor-pointer disabled:opacity-50"
              title={lang === 'vi' ? 'Gửi một thông báo thử nghiệm lên máy' : 'Send a test alert'}
            >
              <Send className="w-3.5 h-3.5" />
              <span>
                {isTesting
                  ? (lang === 'vi' ? 'Đang gửi...' : 'Testing...')
                  : (lang === 'vi' ? 'Thử thông báo' : 'Test Alert')}
              </span>
            </button>

            {/* Switch Toggle Bật - Tắt */}
            <button
              type="button"
              role="switch"
              aria-checked={isPushEnabled}
              onClick={handleTogglePush}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer focus:outline-hidden ${
                isPushEnabled ? 'bg-[#5b3823]' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`block w-4.5 h-4.5 rounded-full bg-white shadow-xs transition-transform absolute top-0.75 ${
                  isPushEnabled ? 'translate-x-5.5' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Row B: Nút Âm thanh và rung */}
        <div className="p-3.5 sm:p-4 rounded-xl bg-gray-50 dark:bg-gray-750/70 border border-gray-200/80 dark:border-gray-700 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                isSoundEnabled
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                  : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
              }`}
            >
              {isSoundEnabled ? <Volume2 className="w-4.5 h-4.5" /> : <VolumeX className="w-4.5 h-4.5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  {lang === 'vi' ? 'Âm thanh và rung' : 'Sound & Vibration'}
                </span>
                {isSoundEnabled ? (
                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                    {lang === 'vi' ? 'Bật chuông & rung' : 'Enabled'}
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold text-gray-500 bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                    {lang === 'vi' ? 'Im lặng' : 'Muted'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Switch Toggle */}
          <button
            type="button"
            role="switch"
            aria-checked={isSoundEnabled}
            onClick={handleToggleSoundAndVibrate}
            className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer focus:outline-hidden shrink-0 ${
              isSoundEnabled ? 'bg-[#5b3823]' : 'bg-gray-300 dark:bg-gray-600'
            }`}
          >
            <span
              className={`block w-4.5 h-4.5 rounded-full bg-white shadow-xs transition-transform absolute top-0.75 ${
                isSoundEnabled ? 'translate-x-5.5' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Row C: Danh mục bật - tắt thông báo (Lịch thi, Lịch học, Bài tập) */}
        <div className="space-y-2.5 pt-1">
          <div className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
            {lang === 'vi' ? 'Bật - tắt thông báo theo danh mục' : 'Category Notification Toggles'}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* 1. Lịch thi */}
            <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-750/70 border border-gray-200/80 dark:border-gray-700 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 flex items-center justify-center shrink-0">
                  <ScrollText className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">
                    {lang === 'vi' ? 'Lịch thi' : 'Exam Alerts'}
                  </div>
                  <span
                    className={`text-[10px] font-semibold ${
                      isExamEnabled ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'
                    }`}
                  >
                    {isExamEnabled ? (lang === 'vi' ? 'Đang bật' : 'Active') : (lang === 'vi' ? 'Đang tắt' : 'Disabled')}
                  </span>
                </div>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={isExamEnabled}
                onClick={handleToggleExamCategory}
                className={`w-10 h-5.5 rounded-full transition-colors relative cursor-pointer focus:outline-hidden shrink-0 ${
                  isExamEnabled ? 'bg-[#5b3823]' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`block w-4 h-4 rounded-full bg-white shadow-xs transition-transform absolute top-0.75 ${
                    isExamEnabled ? 'translate-x-5' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* 2. Lịch học */}
            <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-750/70 border border-gray-200/80 dark:border-gray-700 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 flex items-center justify-center shrink-0">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">
                    {lang === 'vi' ? 'Lịch học' : 'Class Alerts'}
                  </div>
                  <span
                    className={`text-[10px] font-semibold ${
                      isTimetableEnabled ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'
                    }`}
                  >
                    {isTimetableEnabled
                      ? (lang === 'vi' ? 'Đang bật' : 'Active')
                      : (lang === 'vi' ? 'Đang tắt' : 'Disabled')}
                  </span>
                </div>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={isTimetableEnabled}
                onClick={handleToggleTimetableCategory}
                className={`w-10 h-5.5 rounded-full transition-colors relative cursor-pointer focus:outline-hidden shrink-0 ${
                  isTimetableEnabled ? 'bg-[#5b3823]' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`block w-4 h-4 rounded-full bg-white shadow-xs transition-transform absolute top-0.75 ${
                    isTimetableEnabled ? 'translate-x-5' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* 3. Bài tập */}
            <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-750/70 border border-gray-200/80 dark:border-gray-700 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">
                    {lang === 'vi' ? 'Bài tập' : 'Homework Alerts'}
                  </div>
                  <span
                    className={`text-[10px] font-semibold ${
                      isHomeworkEnabled ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'
                    }`}
                  >
                    {isHomeworkEnabled
                      ? (lang === 'vi' ? 'Đang bật' : 'Active')
                      : (lang === 'vi' ? 'Đang tắt' : 'Disabled')}
                  </span>
                </div>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={isHomeworkEnabled}
                onClick={handleToggleHomeworkCategory}
                className={`w-10 h-5.5 rounded-full transition-colors relative cursor-pointer focus:outline-hidden shrink-0 ${
                  isHomeworkEnabled ? 'bg-[#5b3823]' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`block w-4 h-4 rounded-full bg-white shadow-xs transition-transform absolute top-0.75 ${
                    isHomeworkEnabled ? 'translate-x-5' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
