import React, { useState } from 'react';
import {
  Bell,
  Calendar,
  FileText,
  Award,
  ShieldAlert,
  CheckCheck,
  Trash2,
  Clock,
  Sliders,
  Volume2,
  Mail,
  Smartphone,
  Laptop,
  Moon,
  Check,
  ExternalLink,
  Inbox,
  Filter,
} from 'lucide-react';
import {
  Language,
  PersonalNotification,
  PersonalNotificationType,
  NotificationPreferences,
  ActiveTab,
} from '../types';
import { translations } from '../i18n/translations';
import { NotificationService } from '../services/notification';

interface NotificationCenterViewProps {
  notifications: PersonalNotification[];
  preferences: NotificationPreferences;
  onSaveNotifications: (items: PersonalNotification[]) => void;
  onSavePreferences: (prefs: NotificationPreferences) => void;
  lang: Language;
  onNavigateTab?: (tab: ActiveTab) => void;
  onShowToast?: (message: string) => void;
}

export const NotificationCenterView: React.FC<NotificationCenterViewProps> = ({
  notifications,
  preferences,
  onSaveNotifications,
  onSavePreferences,
  lang,
  onNavigateTab,
  onShowToast,
}) => {
  const t = translations[lang];
  const tNotif = t.notificationCenter;

  const [activeSubTab, setActiveSubTab] = useState<'center' | 'preferences'>('center');
  const [filterType, setFilterType] = useState<'all' | 'unread' | 'exams_homework' | 'grade' | 'system'>('all');
  const [prefsForm, setPrefsForm] = useState<NotificationPreferences>(preferences);
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'default';
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Filter logic
  const filteredNotifications = notifications.filter((item) => {
    if (filterType === 'unread') return !item.isRead;
    if (filterType === 'exams_homework') return item.type === 'exam' || item.type === 'homework';
    if (filterType === 'grade') return item.type === 'grade';
    if (filterType === 'system') return item.type === 'system';
    return true;
  });

  // Mark all as read
  const handleMarkAllAsRead = () => {
    const updated = notifications.map((n) => ({ ...n, isRead: true }));
    onSaveNotifications(updated);
    if (onShowToast) onShowToast(tNotif.markedAllReadToast);
  };

  // Clear read notifications
  const handleClearOld = () => {
    const updated = notifications.filter((n) => !n.isRead);
    onSaveNotifications(updated);
    if (onShowToast) onShowToast(tNotif.clearedOldToast);
  };

  // Toggle single notification read status
  const handleToggleRead = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const updated = notifications.map((n) =>
      n.id === id ? { ...n, isRead: !n.isRead } : n
    );
    onSaveNotifications(updated);
  };

  // Delete single notification
  const handleDeleteNotification = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const updated = notifications.filter((n) => n.id !== id);
    onSaveNotifications(updated);
  };

  // Request browser push notification permission
  const handleRequestPush = async () => {
    const granted = await NotificationService.requestPermission();
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setBrowserPermission(Notification.permission);
    }
    if (granted) {
      setPrefsForm((prev) => ({
        ...prev,
        channels: { ...prev.channels, push: true },
      }));
      NotificationService.notify(
        lang === 'vi' ? 'Thông báo Học sinh' : 'Student Notification',
        lang === 'vi' ? 'Đã bật thông báo đẩy thành công!' : 'Push notifications enabled successfully!'
      );
      if (onShowToast) {
        onShowToast(lang === 'vi' ? 'Đã kích hoạt thông báo đẩy trình duyệt' : 'Browser push notifications enabled');
      }
    } else {
      if (onShowToast) {
        onShowToast(lang === 'vi' ? 'Chưa được cấp quyền thông báo trình duyệt' : 'Push permission not granted');
      }
    }
  };

  // Test chime sound
  const handleTestChime = () => {
    NotificationService.playBellSound();
    if (onShowToast) {
      onShowToast(lang === 'vi' ? 'Đang phát chuông chuông thông báo thử nghiệm 🔔' : 'Playing test notification chime 🔔');
    }
  };

  // Save preferences
  const handleSavePreferencesSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSavePreferences(prefsForm);
    if (onShowToast) {
      onShowToast(tNotif.prefsSaved);
    }
  };

  // Get icon and color badge for notification type
  const getTypeBadge = (type: PersonalNotificationType) => {
    switch (type) {
      case 'exam':
        return {
          icon: <Calendar className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
          bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60',
          label: tNotif.typeExam,
          badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
        };
      case 'homework':
        return {
          icon: <FileText className="w-5 h-5 text-orange-600 dark:text-orange-400" />,
          bg: 'bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800/60',
          label: tNotif.typeHomework,
          badgeColor: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
        };
      case 'grade':
        return {
          icon: <Award className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
          bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60',
          label: tNotif.typeGrade,
          badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
        };
      case 'system':
      default:
        return {
          icon: <ShieldAlert className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
          bg: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/60',
          label: tNotif.typeSystem,
          badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
        };
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn pb-12">
      {/* Header Banner */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 sm:p-6 border border-gray-200 dark:border-gray-700 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-800/50 shrink-0">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  {tNotif.title}
                </h1>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-rose-500 text-white shadow-xs">
                    {unreadCount} {lang === 'vi' ? 'mới' : 'new'}
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {tNotif.subtitle}
              </p>
            </div>
          </div>

          {/* Sub-tab switcher */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-900 p-1 rounded-xl border border-gray-200/80 dark:border-gray-800 self-start sm:self-auto">
            <button
              id="subtab-notification-center-btn"
              onClick={() => setActiveSubTab('center')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeSubTab === 'center'
                  ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-xs font-bold'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <Inbox className="w-4 h-4" />
              <span>{tNotif.tabCenter}</span>
              {unreadCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-500" />
              )}
            </button>
            <button
              id="subtab-notification-prefs-btn"
              onClick={() => setActiveSubTab('preferences')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeSubTab === 'preferences'
                  ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-xs font-bold'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>{tNotif.tabPreferences}</span>
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: TRUNG TÂM THÔNG BÁO (NOTIFICATION CENTER) */}
      {activeSubTab === 'center' && (
        <div className="space-y-4">
          {/* Controls Bar: Filters & Quick Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Filter pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
              <span className="text-xs font-bold text-gray-400 dark:text-gray-500 mr-1 flex items-center gap-1 shrink-0">
                <Filter className="w-3.5 h-3.5" />
              </span>
              <button
                id="filter-notif-all"
                onClick={() => setFilterType('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  filterType === 'all'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {tNotif.filterAll} ({notifications.length})
              </button>
              <button
                id="filter-notif-unread"
                onClick={() => setFilterType('unread')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  filterType === 'unread'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {unreadCount > 0 && <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />}
                {tNotif.filterUnread} ({unreadCount})
              </button>
              <button
                id="filter-notif-exam-hw"
                onClick={() => setFilterType('exams_homework')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  filterType === 'exams_homework'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                📅 {tNotif.filterExamsAndHomework}
              </button>
              <button
                id="filter-notif-grades"
                onClick={() => setFilterType('grade')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  filterType === 'grade'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                📊 {tNotif.filterGrades}
              </button>
              <button
                id="filter-notif-system"
                onClick={() => setFilterType('system')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  filterType === 'system'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                ⚙️ {tNotif.filterSystem}
              </button>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 shrink-0 border-t md:border-t-0 pt-2 md:pt-0 border-gray-100 dark:border-gray-700/60">
              <button
                id="mark-all-read-btn"
                onClick={handleMarkAllAsRead}
                disabled={unreadCount === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-gray-50 dark:bg-gray-700/60 text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 dark:hover:text-blue-400 border border-gray-200 dark:border-gray-600 disabled:opacity-50 disabled:pointer-events-none transition-colors"
                title={tNotif.markAllRead}
              >
                <CheckCheck className="w-3.5 h-3.5 text-blue-500" />
                <span>{tNotif.markAllRead}</span>
              </button>
              <button
                id="clear-old-notifications-btn"
                onClick={handleClearOld}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-gray-50 dark:bg-gray-700/60 text-gray-700 dark:text-gray-200 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 dark:hover:text-rose-400 border border-gray-200 dark:border-gray-600 transition-colors"
                title={tNotif.clearOld}
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                <span>{tNotif.clearOld}</span>
              </button>
            </div>
          </div>

          {/* Notifications List */}
          {filteredNotifications.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center border border-gray-200 dark:border-gray-700 shadow-xs">
              <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto text-gray-400 mb-3">
                <Bell className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                {tNotif.noNotifications}
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto mt-1">
                {tNotif.noNotificationsDesc}
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredNotifications.map((item) => {
                const badge = getTypeBadge(item.type);
                return (
                  <div
                    key={item.id}
                    id={`personal-notification-item-${item.id}`}
                    onClick={() => handleToggleRead(item.id)}
                    className={`group relative rounded-2xl p-4 sm:p-5 border transition-all cursor-pointer ${
                      !item.isRead
                        ? 'bg-blue-50/40 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/60 shadow-xs hover:border-blue-300 dark:hover:border-blue-700'
                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700/80 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-start gap-3.5 sm:gap-4">
                      {/* Icon */}
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${badge.bg}`}
                      >
                        {badge.icon}
                      </div>

                      {/* Content */}
                      <div className="grow min-w-0 pr-6">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span
                            className={`px-2 py-0.5 text-[11px] font-bold rounded-md ${badge.badgeColor}`}
                          >
                            {badge.label}
                          </span>

                          <span className="text-[11px] text-gray-400 dark:text-gray-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {item.createdAt}
                          </span>

                          {!item.isRead && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-blue-500 text-white">
                              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                              {tNotif.unreadStatus}
                            </span>
                          )}
                        </div>

                        <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white leading-snug">
                          {item.title}
                        </h3>

                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">
                          {item.message}
                        </p>

                        {/* Meta Tags */}
                        {item.meta && (
                          <div className="flex flex-wrap items-center gap-2 mt-2.5">
                            {item.meta.subject && (
                              <span className="text-xs px-2.5 py-0.5 rounded-lg bg-gray-100 dark:bg-gray-700/70 text-gray-700 dark:text-gray-300 font-medium">
                                📚 {item.meta.subject}
                              </span>
                            )}
                            {item.meta.dueDate && (
                              <span className="text-xs px-2.5 py-0.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-medium border border-rose-100 dark:border-rose-900/50">
                                ⏰ Hạn: {item.meta.dueDate}
                              </span>
                            )}
                            {item.meta.examDate && (
                              <span className="text-xs px-2.5 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-medium border border-amber-100 dark:border-amber-900/50">
                                📅 Ngày thi: {item.meta.examDate}
                              </span>
                            )}
                            {item.meta.score !== undefined && (
                              <span className="text-xs px-2.5 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-100 dark:border-emerald-900/50">
                                ⭐ Điểm: {item.meta.score}
                              </span>
                            )}

                            {/* Quick Navigation Jump Button */}
                            {onNavigateTab && item.type === 'exam' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onNavigateTab('exams');
                                }}
                                className="text-xs px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-semibold hover:bg-blue-100 dark:hover:bg-blue-900/60 inline-flex items-center gap-1 transition-colors"
                              >
                                <span>{lang === 'vi' ? 'Xem Lịch thi' : 'View Exams'}</span>
                                <ExternalLink className="w-3 h-3" />
                              </button>
                            )}
                            {onNavigateTab && item.type === 'homework' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onNavigateTab('homework');
                                }}
                                className="text-xs px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-semibold hover:bg-blue-100 dark:hover:bg-blue-900/60 inline-flex items-center gap-1 transition-colors"
                              >
                                <span>{lang === 'vi' ? 'Xem Bài tập' : 'View Homework'}</span>
                                <ExternalLink className="w-3 h-3" />
                              </button>
                            )}
                            {onNavigateTab && item.type === 'grade' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onNavigateTab('grades');
                                }}
                                className="text-xs px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-semibold hover:bg-blue-100 dark:hover:bg-blue-900/60 inline-flex items-center gap-1 transition-colors"
                              >
                                <span>{lang === 'vi' ? 'Xem Bảng điểm' : 'View Grades'}</span>
                                <ExternalLink className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Right side individual actions */}
                      <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => handleToggleRead(item.id, e)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors"
                          title={item.isRead ? (lang === 'vi' ? 'Đánh dấu chưa đọc' : 'Mark as unread') : (lang === 'vi' ? 'Đánh dấu đã đọc' : 'Mark as read')}
                        >
                          <Check className={`w-4 h-4 ${item.isRead ? 'text-gray-400' : 'text-blue-600'}`} />
                        </button>
                        <button
                          onClick={(e) => handleDeleteNotification(item.id, e)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-gray-700 transition-colors"
                          title={tNotif.deleteItem}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CẤU HÌNH NHẮC NHỞ (NOTIFICATION PREFERENCES) */}
      {activeSubTab === 'preferences' && (
        <form onSubmit={handleSavePreferencesSubmit} className="space-y-6">
          {/* 1. Notification Channels */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 sm:p-6 border border-gray-200 dark:border-gray-700 shadow-xs space-y-4">
            <div className="border-b border-gray-100 dark:border-gray-700 pb-3">
              <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-blue-500" />
                {tNotif.channelsTitle}
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {tNotif.channelsDesc}
              </p>
            </div>

            <div className="space-y-3.5">
              {/* In-App Channel */}
              <label className="flex items-start gap-3 p-3.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  checked={prefsForm.channels.inApp}
                  onChange={(e) =>
                    setPrefsForm((prev) => ({
                      ...prev,
                      channels: { ...prev.channels, inApp: e.target.checked },
                    }))
                  }
                  className="mt-1 w-4 h-4 text-blue-600 rounded-md border-gray-300 focus:ring-blue-500"
                />
                <div className="grow">
                  <div className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <span>{tNotif.inAppChannel}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold">
                      {lang === 'vi' ? 'Khuyên dùng' : 'Recommended'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {tNotif.inAppChannelDesc}
                  </p>
                </div>
              </label>

              {/* Email Channel */}
              <div className="p-3.5 rounded-xl border border-gray-200 dark:border-gray-700 space-y-2.5">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prefsForm.channels.email}
                    onChange={(e) =>
                      setPrefsForm((prev) => ({
                        ...prev,
                        channels: { ...prev.channels, email: e.target.checked },
                      }))
                    }
                    className="mt-1 w-4 h-4 text-blue-600 rounded-md border-gray-300 focus:ring-blue-500"
                  />
                  <div>
                    <div className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <Mail className="w-4 h-4 text-blue-500" />
                      <span>{tNotif.emailChannel}</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {tNotif.emailChannelDesc}
                    </p>
                  </div>
                </label>

                {prefsForm.channels.email && (
                  <div className="pl-7 pt-1">
                    <input
                      type="email"
                      value={prefsForm.channels.emailAddress || ''}
                      onChange={(e) =>
                        setPrefsForm((prev) => ({
                          ...prev,
                          channels: { ...prev.channels, emailAddress: e.target.value },
                        }))
                      }
                      placeholder={tNotif.emailPlaceholder}
                      className="w-full sm:w-80 px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Push Notification Channel */}
              <div className="p-3.5 rounded-xl border border-gray-200 dark:border-gray-700 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <label className="flex items-start gap-3 cursor-pointer grow">
                    <input
                      type="checkbox"
                      checked={prefsForm.channels.push}
                      onChange={(e) =>
                        setPrefsForm((prev) => ({
                          ...prev,
                          channels: { ...prev.channels, push: e.target.checked },
                        }))
                      }
                      className="mt-1 w-4 h-4 text-blue-600 rounded-md border-gray-300 focus:ring-blue-500"
                    />
                    <div>
                      <div className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Laptop className="w-4 h-4 text-purple-500" />
                        <span>{tNotif.pushChannel}</span>
                        {browserPermission === 'granted' ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300 font-bold">
                            {tNotif.pushGranted}
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold">
                            {tNotif.pushNotGranted}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {tNotif.pushChannelDesc}
                      </p>
                    </div>
                  </label>

                  <div className="flex items-center gap-2 pl-7 sm:pl-0 shrink-0">
                    {browserPermission !== 'granted' && (
                      <button
                        type="button"
                        onClick={handleRequestPush}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-xs"
                      >
                        {tNotif.requestPushBtn}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleTestChime}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      title={tNotif.testChimeBtn}
                    >
                      <Volume2 className="w-3.5 h-3.5 text-blue-500" />
                      <span>{tNotif.testChimeBtn}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Reminder Rules */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 sm:p-6 border border-gray-200 dark:border-gray-700 shadow-xs space-y-4">
            <div className="border-b border-gray-100 dark:border-gray-700 pb-3">
              <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-500" />
                {tNotif.rulesTitle}
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {tNotif.rulesDesc}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Exam Rule */}
              <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 space-y-2 bg-gray-50/50 dark:bg-gray-900/30">
                <div className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white">
                  <Calendar className="w-4 h-4 text-amber-500" />
                  <span>{tNotif.examAdvanceTitle}</span>
                </div>
                <select
                  value={prefsForm.rules.examAdvanceDays}
                  onChange={(e) =>
                    setPrefsForm((prev) => ({
                      ...prev,
                      rules: {
                        ...prev.rules,
                        examAdvanceDays: Number(e.target.value),
                      },
                    }))
                  }
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                >
                  <option value={1}>{tNotif.examAdvance1}</option>
                  <option value={3}>{tNotif.examAdvance3}</option>
                  <option value={7}>{tNotif.examAdvance7}</option>
                </select>
              </div>

              {/* Homework Rule */}
              <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 space-y-2 bg-gray-50/50 dark:bg-gray-900/30">
                <div className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white">
                  <FileText className="w-4 h-4 text-orange-500" />
                  <span>{tNotif.homeworkAdvanceTitle}</span>
                </div>
                <select
                  value={prefsForm.rules.homeworkAdvanceHours}
                  onChange={(e) =>
                    setPrefsForm((prev) => ({
                      ...prev,
                      rules: {
                        ...prev.rules,
                        homeworkAdvanceHours: Number(e.target.value),
                      },
                    }))
                  }
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                >
                  <option value={2}>{tNotif.homeworkAdvance2}</option>
                  <option value={12}>{tNotif.homeworkAdvance12}</option>
                  <option value={24}>{tNotif.homeworkAdvance24}</option>
                </select>
              </div>
            </div>

            {/* New Grade Alert Toggle */}
            <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Award className="w-4 h-4 text-emerald-500" />
                  <span>{tNotif.newGradeAlertTitle}</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {tNotif.newGradeAlertDesc}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={prefsForm.rules.newGradeAlert}
                  onChange={(e) =>
                    setPrefsForm((prev) => ({
                      ...prev,
                      rules: { ...prev.rules, newGradeAlert: e.target.checked },
                    }))
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>
          </div>

          {/* 3. Quiet Hours */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 sm:p-6 border border-gray-200 dark:border-gray-700 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-700 pb-3">
              <div>
                <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Moon className="w-5 h-5 text-indigo-500" />
                  {tNotif.quietHoursTitle}
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  {tNotif.quietHoursDesc}
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={prefsForm.quietHours.enabled}
                  onChange={(e) =>
                    setPrefsForm((prev) => ({
                      ...prev,
                      quietHours: {
                        ...prev.quietHours,
                        enabled: e.target.checked,
                      },
                    }))
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            {prefsForm.quietHours.enabled && (
              <div className="flex flex-wrap items-center gap-4 pt-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                    {tNotif.from}:
                  </span>
                  <input
                    type="time"
                    value={prefsForm.quietHours.startTime}
                    onChange={(e) =>
                      setPrefsForm((prev) => ({
                        ...prev,
                        quietHours: {
                          ...prev.quietHours,
                          startTime: e.target.value,
                        },
                      }))
                    }
                    className="px-3 py-1.5 text-xs sm:text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                    {tNotif.to}:
                  </span>
                  <input
                    type="time"
                    value={prefsForm.quietHours.endTime}
                    onChange={(e) =>
                      setPrefsForm((prev) => ({
                        ...prev,
                        quietHours: {
                          ...prev.quietHours,
                          endTime: e.target.value,
                        },
                      }))
                    }
                    className="px-3 py-1.5 text-xs sm:text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <span className="text-xs text-gray-400 dark:text-gray-500">
                  ({lang === 'vi' ? 'Ví dụ: 23:00 - 06:00 sáng hôm sau' : 'e.g. 23:00 - 06:00 next morning'})
                </span>
              </div>
            )}
          </div>

          {/* Form Actions - Button title strictly "Lưu" per user preference */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              id="save-notification-prefs-btn"
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-xs hover:shadow-md transition-all flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>{t.common.save || 'Lưu'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
