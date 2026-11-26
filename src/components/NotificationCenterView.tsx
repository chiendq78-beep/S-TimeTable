import React, { useState } from 'react';
import {
  Calendar,
  FileText,
  CheckCheck,
  Trash2,
  Clock,
  Check,
  Inbox,
  Filter,
  ChevronDown,
} from 'lucide-react';
import {
  Language,
  PersonalNotification,
  PersonalNotificationType,
  ActiveTab,
} from '../types';
import { translations } from '../i18n/translations';
import { useSwipeToCloseModal } from '../hooks/useSwipeToCloseModal';

interface NotificationCenterViewProps {
  notifications: PersonalNotification[];
  onSaveNotifications: (items: PersonalNotification[]) => void;
  lang: Language;
  onNavigateTab?: (tab: ActiveTab, targetId?: string, subject?: string) => void;
  onShowToast?: (message: string) => void;
}

export const NotificationCenterView: React.FC<NotificationCenterViewProps> = ({
  notifications,
  onSaveNotifications,
  lang,
  onNavigateTab,
  onShowToast,
}) => {
  const t = translations[lang];
  const tNotif = t.notificationCenter;

  const [filterType, setFilterType] = useState<'all' | 'unread' | 'homework' | 'exam' | 'extra_class'>('all');
  const [itemToDelete, setItemToDelete] = useState<PersonalNotification | null>(null);

  // Swipe-to-close modal hook for Android / Mobile gestures
  const { modalTouchHandlers } = useSwipeToCloseModal({
    isOpen: itemToDelete !== null,
    onClose: () => setItemToDelete(null),
  });

  // Filter ONLY notifications and reminders that are due / scheduled
  const dueNotifications = notifications.filter(
    (item) => item.type === 'homework' || item.type === 'exam' || item.type === 'extra_class' || item.type === 'reminder'
  );

  const unreadCount = dueNotifications.filter((n) => !n.isRead).length;

  // Filter logic
  const filteredNotifications = dueNotifications.filter((item) => {
    if (filterType === 'unread') return !item.isRead;
    if (filterType === 'homework') return item.type === 'homework';
    if (filterType === 'exam') return item.type === 'exam';
    if (filterType === 'extra_class') return item.type === 'extra_class' || item.type === 'reminder';
    return true;
  });

  // Mark all as read
  const handleMarkAllAsRead = () => {
    if (unreadCount === 0) {
      if (onShowToast) onShowToast(lang === 'vi' ? 'Tất cả thông báo đã được đọc' : 'All notifications already read');
      return;
    }
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

  // Delete single notification with confirmation dialog
  const handleDeleteClick = (item: PersonalNotification, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setItemToDelete(item);
  };

  const handleConfirmDelete = () => {
    if (!itemToDelete) return;
    const updated = notifications.filter((n) => n.id !== itemToDelete.id);
    onSaveNotifications(updated);
    setItemToDelete(null);
    if (onShowToast) {
      onShowToast(lang === 'vi' ? 'Đã xóa thông báo' : 'Notification deleted');
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
      case 'extra_class':
      case 'reminder':
      default:
        return {
          icon: <Clock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
          bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60',
          label: tNotif.typeExtraClass,
          badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
        };
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4 animate-fadeIn pb-12">
      {/* Controls Bar: Filters & Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-3 sm:p-4 border border-gray-200 dark:border-gray-700 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Dropdown Filter */}
        <div className="relative inline-flex items-center w-full sm:w-auto">
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700/80 hover:bg-gray-200/70 dark:hover:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600/70 text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-200 transition-colors w-full sm:w-56 relative cursor-pointer">
            <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400 shrink-0" />
            <select
              id="filter-notification-select"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="bg-transparent text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-200 outline-none cursor-pointer appearance-none pr-6 w-full"
            >
              <option value="all" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                {lang === 'vi' ? 'Tất cả' : 'All'}
              </option>
              <option value="unread" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                {lang === 'vi' ? 'Chưa đọc' : 'Unread'}
              </option>
              <option value="exam" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                {lang === 'vi' ? 'Lịch thi' : 'Exams'}
              </option>
              <option value="homework" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                {lang === 'vi' ? 'Bài tập' : 'Homework'}
              </option>
              <option value="extra_class" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                {lang === 'vi' ? 'Học thêm' : 'Extra Tutoring'}
              </option>
            </select>
            <ChevronDown className="w-4 h-4 text-gray-400 pointer-events-none absolute right-3" />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto shrink-0">
          <button
            id="btn-mark-all-read"
            onClick={handleMarkAllAsRead}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <CheckCheck className="w-4 h-4 text-blue-500 shrink-0" />
            <span>{lang === 'vi' ? 'Đánh dấu đã đọc' : 'Mark as read'}</span>
          </button>
          <button
            id="btn-clear-old"
            onClick={handleClearOld}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{lang === 'vi' ? 'Xóa' : 'Delete'}</span>
          </button>
        </div>
      </div>

      {/* 3. Notifications List */}
      {filteredNotifications.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center border border-gray-200 dark:border-gray-700 shadow-xs space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-700 text-gray-400 mx-auto flex items-center justify-center">
            <Inbox className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-gray-800 dark:text-gray-200">
            {tNotif.emptyTitle}
          </h3>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
            {tNotif.emptyDesc}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredNotifications.map((item) => {
            const badge = getTypeBadge(item.type);
            return (
              <div
                key={item.id}
                onClick={() => handleToggleRead(item.id)}
                className={`group bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-4.5 border transition-all cursor-pointer relative shadow-xs hover:shadow-md ${
                  !item.isRead
                    ? 'border-blue-300 dark:border-blue-800 bg-blue-50/20 dark:bg-blue-950/20'
                    : 'border-gray-200 dark:border-gray-700/80 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  {/* Icon Box */}
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border mt-0.5 ${badge.bg}`}
                  >
                    {badge.icon}
                  </div>

                  {/* Content */}
                  <div className="grow min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${badge.badgeColor}`}
                      >
                        {badge.label}
                      </span>
                      <span className="text-[11px] text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{item.timeAgo || item.createdAt}</span>
                      </span>
                      {!item.isRead && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-950 px-2 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                          {lang === 'vi' ? 'Chưa đọc' : 'Unread'}
                        </span>
                      )}
                    </div>

                    <h4
                      className={`text-sm sm:text-base font-bold ${
                        !item.isRead
                          ? 'text-gray-900 dark:text-white'
                          : 'text-gray-700 dark:text-gray-300 font-medium'
                      }`}
                    >
                      {item.title}
                    </h4>

                    {/* Reminder Meta Badges */}
                    {(item.meta?.dueDate || item.meta?.examDate) && (
                      <div className="pt-1.5 flex items-center gap-2 flex-wrap">
                        {item.meta?.dueDate && (
                          <span className="text-xs px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium inline-flex items-center gap-1">
                            📅 {item.meta.dueDate}
                          </span>
                        )}
                        {item.meta?.examDate && (
                          <span className="text-xs px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium inline-flex items-center gap-1">
                            📅 {item.meta.examDate}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right side individual actions */}
                  <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                    {/* Toggle read/unread */}
                    <button
                      type="button"
                      onClick={(e) => handleToggleRead(item.id, e)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors cursor-pointer"
                      title={
                        item.isRead
                          ? (lang === 'vi' ? 'Đánh dấu chưa đọc' : 'Mark as unread')
                          : (lang === 'vi' ? 'Đánh dấu đã đọc' : 'Mark as read')
                      }
                    >
                      <Check
                        className={`w-4 h-4 ${
                          item.isRead ? 'text-gray-400' : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      />
                    </button>

                    {/* Delete notification */}
                    <button
                      type="button"
                      onClick={(e) => handleDeleteClick(item, e)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
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

      {/* Confirm Delete Single Notification Modal */}
      {itemToDelete && (
        <div
          data-app-modal="true"
          {...modalTouchHandlers}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setItemToDelete(null)}
        >
          <div
            className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-2xl border border-gray-200 dark:border-gray-800 space-y-4 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-bold text-gray-900 dark:text-white leading-tight">
                  {lang === 'vi' ? 'Xác nhận xóa thông báo' : 'Confirm Delete Notification'}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {lang === 'vi' ? 'Hành động này không thể hoàn tác' : 'This action cannot be undone'}
                </p>
              </div>
            </div>

            <div className="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-800 text-xs space-y-1">
              <div className="font-bold text-gray-900 dark:text-white line-clamp-2">
                {itemToDelete.title}
              </div>
              <div className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
                <span>{itemToDelete.timeAgo || itemToDelete.createdAt}</span>
                {itemToDelete.meta?.dueDate && (
                  <>
                    <span>•</span>
                    <span>{itemToDelete.meta.dueDate}</span>
                  </>
                )}
                {itemToDelete.meta?.examDate && (
                  <>
                    <span>•</span>
                    <span>{itemToDelete.meta.examDate}</span>
                  </>
                )}
              </div>
            </div>

            <p className="text-xs text-gray-600 dark:text-gray-300">
              {lang === 'vi'
                ? 'Bạn có chắc chắn muốn xóa thông báo này không?'
                : 'Are you sure you want to delete this notification?'}
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"
              >
                {t.common.cancel}
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-sm shadow-rose-600/20 cursor-pointer"
              >
                {lang === 'vi' ? 'Xác nhận xóa' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
