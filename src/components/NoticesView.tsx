import React, { useState } from 'react';
import {
  Bell,
  Plus,
  Trash2,
  Calendar,
  AlertTriangle,
  FileText,
  Paperclip,
  X,
  Pin,
  Pencil,
  Building2,
  Download,
} from 'lucide-react';
import { SchoolNotice, NoticeCategory, Language } from '../types';
import { translations } from '../i18n/translations';
import { useSwipeToCloseModal } from '../hooks/useSwipeToCloseModal';

interface NoticesViewProps {
  notices: SchoolNotice[];
  onSaveNotices: (items: SchoolNotice[]) => void;
  lang: Language;
}

export const NoticesView: React.FC<NoticesViewProps> = ({
  notices,
  onSaveNotices,
  lang,
}) => {
  const t = translations[lang];
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeNoticeModal, setActiveNoticeModal] = useState<SchoolNotice | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [downloadToast, setDownloadToast] = useState<string | null>(null);

  const [editNoticeData, setEditNoticeData] = useState<{
    id: string;
    title: string;
    sender: string;
    date: string;
    category: NoticeCategory;
    isUrgent: boolean;
    isPinned: boolean;
    content: string;
    attachmentInput: string;
  } | null>(null);

  // Swipe-to-close on mobile/tablet
  const { modalTouchHandlers } = useSwipeToCloseModal({
    isOpen: !!activeNoticeModal || isAddModalOpen || !!editNoticeData,
    onClose: () => {
      setActiveNoticeModal(null);
      setIsAddModalOpen(false);
      setEditNoticeData(null);
    },
  });

  const [newNotice, setNewNotice] = useState<{
    title: string;
    sender: string;
    date: string;
    category: NoticeCategory;
    isUrgent: boolean;
    isPinned: boolean;
    content: string;
    attachmentInput: string;
  }>({
    title: '',
    sender: 'Ban Giám Hiệu',
    date: new Date().toISOString().split('T')[0],
    category: 'general',
    isUrgent: false,
    isPinned: false,
    content: '',
    attachmentInput: '',
  });

  // 1. Category labels with fallback and 'fee' fully defined
  const categoryLabels: Record<NoticeCategory, { label: string; class: string }> = {
    urgent: {
      label: t.notices.categories.urgent,
      class: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800',
    },
    academic: {
      label: t.notices.categories.academic || (lang === 'vi' ? 'Học vụ & Lịch thi' : 'Academics & Exams'),
      class: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800',
    },
    activity: {
      label: t.notices.categories.activity || (lang === 'vi' ? 'Hoạt động - Đoàn Đội' : 'Extracurricular & Clubs'),
      class: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800',
    },
    holiday: {
      label: t.notices.categories.holiday || (lang === 'vi' ? 'Lịch nghỉ lễ / Tết' : 'Holidays & Breaks'),
      class: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800',
    },
    fee: {
      label: t.notices.categories.fee || (lang === 'vi' ? 'Học phí & Khoản thu' : 'Tuition & Fees'),
      class: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800',
    },
    general: {
      label: t.notices.categories.general || (lang === 'vi' ? 'Thông báo chung' : 'General Info'),
      class: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border border-gray-300 dark:border-gray-700',
    },
  };

  // 5. Total unread synchronization
  const totalUnreadCount = notices.filter((n) => !n.isRead).length;

  // Filter notices
  const filteredNotices = notices.filter((n) => {
    if (selectedCategory === 'all') return true;
    return n.category === selectedCategory;
  });

  // 4. Sort notices: Pinned notices stick to the top, then newest date
  const sortedNotices = [...filteredNotices].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  const handleMarkAsRead = (id: string) => {
    const updated = notices.map((n) => (n.id === id ? { ...n, isRead: true } : n));
    onSaveNotices(updated);
  };

  const handleMarkAllRead = () => {
    const updated = notices.map((n) => ({ ...n, isRead: true }));
    onSaveNotices(updated);
  };

  // 4. Pin/Unpin action
  const handleTogglePin = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = notices.map((n) =>
      n.id === id ? { ...n, isPinned: !n.isPinned } : n
    );
    onSaveNotices(updated);
    if (activeNoticeModal?.id === id) {
      setActiveNoticeModal((prev) => (prev ? { ...prev, isPinned: !prev.isPinned } : null));
    }
  };

  const handleDelete = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    onSaveNotices(notices.filter((n) => n.id !== id));
    if (activeNoticeModal?.id === id) {
      setActiveNoticeModal(null);
    }
  };

  const handleDownloadAttachment = (filename: string) => {
    setDownloadToast(filename);
    setTimeout(() => setDownloadToast(null), 3000);
  };

  const handleOpenEdit = (notice: SchoolNotice, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditNoticeData({
      id: notice.id,
      title: notice.title,
      sender: notice.sender || notice.author || 'Ban Giám Hiệu',
      date: notice.date,
      category: notice.category,
      isUrgent: !!notice.isUrgent,
      isPinned: !!notice.isPinned,
      content: notice.content,
      attachmentInput: (notice.attachments || []).join(', '),
    });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editNoticeData || !editNoticeData.title?.trim() || !editNoticeData.content?.trim()) return;

    const attachments = editNoticeData.attachmentInput
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const updatedNotices = notices.map((n) => {
      if (n.id === editNoticeData.id) {
        return {
          ...n,
          title: editNoticeData.title.trim(),
          sender: editNoticeData.sender?.trim() || 'Ban Giám Hiệu',
          author: editNoticeData.sender?.trim() || 'Ban Giám Hiệu',
          date: editNoticeData.date || n.date,
          category: editNoticeData.category,
          isUrgent: !!editNoticeData.isUrgent,
          isPinned: !!editNoticeData.isPinned,
          content: editNoticeData.content.trim(),
          attachments,
        };
      }
      return n;
    });

    onSaveNotices(updatedNotices);

    if (activeNoticeModal?.id === editNoticeData.id) {
      const refreshed = updatedNotices.find((n) => n.id === editNoticeData.id);
      if (refreshed) setActiveNoticeModal(refreshed);
    }

    setEditNoticeData(null);
  };

  const handleCreateNotice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNotice.title?.trim() || !newNotice.content?.trim()) return;

    // Parse attachments from text input
    const attachments = newNotice.attachmentInput
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const item: SchoolNotice = {
      id: `notice-${Date.now()}`,
      title: newNotice.title.trim(),
      author: newNotice.sender?.trim() || 'Ban Giám Hiệu',
      sender: newNotice.sender?.trim() || 'Ban Giám Hiệu',
      date: newNotice.date || new Date().toISOString().split('T')[0],
      category: newNotice.category,
      isUrgent: !!newNotice.isUrgent,
      content: newNotice.content.trim(),
      isPinned: !!newNotice.isPinned,
      isRead: true,
      attachments: attachments.length > 0 ? attachments : [],
    };

    onSaveNotices([item, ...notices]);
    setIsAddModalOpen(false);
    setNewNotice({
      title: '',
      sender: 'Ban Giám Hiệu',
      date: new Date().toISOString().split('T')[0],
      category: 'general',
      isUrgent: false,
      isPinned: false,
      content: '',
      attachmentInput: '',
    });
  };

  return (
    <div className="space-y-3.5 sm:space-y-4">
      {/* Download Toast */}
      {downloadToast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-xl shadow-xl border border-gray-700 text-xs font-medium">
            <Download className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              {lang === 'vi' ? 'Đang tải tệp về máy:' : 'Downloading file:'}{' '}
              <strong className="text-amber-300">{downloadToast}</strong>
            </span>
          </div>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-gray-900 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-500" />
            {t.notices.title}
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {t.notices.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            id="add-notice-btn"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-amber-600 text-white hover:bg-amber-700 shadow-sm shadow-amber-500/20 transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>{t.notices.addNotice}</span>
          </button>
        </div>
      </div>

      {/* 1 & 5. Category Filter Chips with Unread Badges synchronized */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {/* Tab Tất Cả */}
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 border inline-flex items-center gap-1.5 ${
            selectedCategory === 'all'
              ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
              : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-800 hover:border-amber-300'
          }`}
        >
          <span>
            {t.common.all} ({notices.length})
          </span>
          {/* 5. Clear red badge for unread count matching the left menu */}
          {totalUnreadCount > 0 && (
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-black leading-none ${
                selectedCategory === 'all'
                  ? 'bg-white text-rose-600 shadow-2xs'
                  : 'bg-rose-500 text-white animate-pulse'
              }`}
            >
              🔴 {totalUnreadCount} {lang === 'vi' ? 'mới' : 'new'}
            </span>
          )}
        </button>

        {/* Category Tabs */}
        {Object.entries(categoryLabels).map(([catKey, catVal]) => {
          if (!catVal || !catVal.label) return null; // Defend against empty ghost tab
          const catTotal = notices.filter((n) => n.category === catKey).length;
          const catUnread = notices.filter((n) => n.category === catKey && !n.isRead).length;
          const isSelected = selectedCategory === catKey;

          return (
            <button
              key={catKey}
              onClick={() => setSelectedCategory(catKey)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 border inline-flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                  : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-800 hover:border-amber-300'
              }`}
            >
              <span>
                {catVal.label} ({catTotal})
              </span>
              {/* Red dot badge for category unread count */}
              {catUnread > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-black leading-none ${
                    isSelected ? 'bg-white text-rose-600 shadow-2xs' : 'bg-rose-500 text-white'
                  }`}
                  title={`${catUnread} ${lang === 'vi' ? 'tin chưa đọc' : 'unread'}`}
                >
                  🔴 {catUnread}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Notices List */}
      <div className="space-y-3">
        {sortedNotices.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-12 text-center border border-gray-200 dark:border-gray-800">
            <Bell className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <div className="text-sm font-semibold text-gray-500">{t.common.empty}</div>
          </div>
        ) : (
          sortedNotices.map((item) => {
            const isUrgent = !!item.isUrgent;

            return (
              <div
                key={item.id}
                onClick={() => {
                  handleMarkAsRead(item.id);
                  setActiveNoticeModal(item);
                }}
                className={`group relative p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer shadow-xs flex items-start justify-between gap-3 sm:gap-4 ${
                  // 2. High-contrast Visual Hierarchy for URGENT notices
                  isUrgent
                    ? 'border-l-[6px] border-l-rose-500 bg-gradient-to-r from-rose-50/90 via-rose-50/40 to-white dark:from-rose-950/45 dark:via-rose-950/20 dark:to-gray-900 border-rose-300 dark:border-rose-900/80 hover:border-rose-500 ring-1 ring-rose-200/50 dark:ring-rose-900/40'
                    : item.isRead
                    ? 'border-l-[6px] border-l-transparent bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:border-amber-300 dark:hover:border-amber-700'
                    : 'border-l-[6px] border-l-amber-500 bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60 hover:border-amber-400'
                }`}
              >
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  {/* Icon */}
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      isUrgent
                        ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30 ring-2 ring-rose-200 dark:ring-rose-900 animate-pulse'
                        : item.isPinned
                        ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 ring-1 ring-amber-300'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {isUrgent ? (
                      <AlertTriangle className="w-5 h-5" />
                    ) : item.isPinned ? (
                      <Pin className="w-5 h-5 fill-amber-500" />
                    ) : (
                      <FileText className="w-5 h-5" />
                    )}
                  </div>

                  {/* Notice Content */}
                  <div className="min-w-0 flex-1">
                    {/* Top Badges Row */}
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      {/* Category Badge */}
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                          categoryLabels[item.category]?.class ||
                          'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {categoryLabels[item.category]?.label || item.category}
                      </span>

                      {/* 2. Urgent Badge */}
                      {isUrgent && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-md bg-rose-600 text-white uppercase tracking-wider shadow-2xs">
                          <AlertTriangle className="w-3 h-3" />
                          <span>{t.notices.categories.urgent}</span>
                        </span>
                      )}

                      {/* 4. Pinned Badge */}
                      {item.isPinned && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300/80 dark:border-amber-700/80 shadow-2xs">
                          <Pin className="w-3 h-3 fill-amber-500" />
                          <span>{t.notices.pinnedBadge || (lang === 'vi' ? 'Đã ghim' : 'Pinned')}</span>
                        </span>
                      )}

                      {/* Unread indicator */}
                      {!item.isRead && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 text-[10px] font-extrabold">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping" />
                          <span>{t.notices.unreadBadge || (lang === 'vi' ? 'Mới' : 'New')}</span>
                        </span>
                      )}
                    </div>

                    {/* Notice Title */}
                    <h3
                      className={`text-sm sm:text-base font-bold line-clamp-1 leading-snug ${
                        isUrgent
                          ? 'text-rose-950 dark:text-rose-100'
                          : 'text-gray-900 dark:text-white'
                      }`}
                    >
                      {item.title}
                    </h3>

                    {/* Notice Excerpt */}
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                      {item.content}
                    </p>

                    {/* 3 & 4. Metadata footer: No dangling bullets, beautiful alignment, attachments indicator */}
                    <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400 mt-2.5 pt-2 border-t border-gray-100 dark:border-gray-800/80">
                      {/* Sender */}
                      <span className="inline-flex items-center gap-1.5 font-medium text-gray-700 dark:text-gray-300">
                        <Building2 className="w-3.5 h-3.5 text-amber-600/90 dark:text-amber-500 shrink-0" />
                        <span>
                          {item.sender || item.author || (lang === 'vi' ? 'Ban Giám Hiệu' : 'School Admin')}
                        </span>
                      </span>

                      <span className="text-gray-300 dark:text-gray-700 select-none">•</span>

                      {/* Date */}
                      <span className="inline-flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                        <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span>{item.date}</span>
                      </span>

                      {/* 4. Attachment Indicator Chip */}
                      {item.attachments && item.attachments.length > 0 && (
                        <>
                          <span className="text-gray-300 dark:text-gray-700 select-none">•</span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold text-[11px] border border-blue-200 dark:border-blue-800">
                            <Paperclip className="w-3 h-3 text-blue-600 dark:text-blue-400 shrink-0" />
                            <span>
                              {item.attachments.length}{' '}
                              {lang === 'vi' ? 'tệp đính kèm' : 'attachments'}
                            </span>
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Right Actions (Pin button & Delete button) */}
                <div className="flex items-center gap-1 shrink-0">
                  {/* 4. Quick Pin / Unpin Button */}
                  <button
                    type="button"
                    onClick={(e) => handleTogglePin(item.id, e)}
                    title={
                      item.isPinned
                        ? t.notices.unpinNotice || 'Bỏ ghim'
                        : t.notices.pinNotice || 'Ghim lên đầu'
                    }
                    className={`p-1.5 rounded-lg transition-colors ${
                      item.isPinned
                        ? 'text-amber-600 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100'
                        : 'text-gray-400 hover:text-amber-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <Pin className={`w-4 h-4 ${item.isPinned ? 'fill-amber-500 text-amber-600' : ''}`} />
                  </button>

                  {/* Edit Button */}
                  <button
                    type="button"
                    onClick={(e) => handleOpenEdit(item, e)}
                    className="p-1.5 text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 rounded-lg hover:bg-amber-50 dark:hover:bg-gray-800 transition-colors"
                    title={t.notices.editNotice || (lang === 'vi' ? 'Chỉnh sửa thông báo' : 'Edit notice')}
                  >
                    <Pencil className="w-4 h-4" />
                  </button>

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={(e) => handleDelete(item.id, e)}
                    className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-gray-800 transition-colors"
                    title={t.common.delete}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Detail Notice Modal */}
      {activeNoticeModal && (
        <div
          data-app-modal="true"
          {...modalTouchHandlers}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-0 lg:p-4"
        >
          <div className="w-full h-full lg:h-auto lg:max-h-[90vh] lg:max-w-lg bg-white dark:bg-gray-900 rounded-none lg:rounded-2xl shadow-2xl border-0 lg:border border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-850 shrink-0">
              <div className="flex items-center gap-2 min-w-0 pr-2 flex-wrap">
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-md ${
                    categoryLabels[activeNoticeModal.category]?.class || 'bg-gray-100'
                  }`}
                >
                  {categoryLabels[activeNoticeModal.category]?.label || activeNoticeModal.category}
                </span>
                {activeNoticeModal.isUrgent && (
                  <span className="text-[10px] font-black px-2 py-0.5 rounded bg-rose-600 text-white uppercase flex items-center gap-1 shrink-0">
                    <AlertTriangle className="w-3 h-3" />
                    {t.notices.categories.urgent}
                  </span>
                )}
                {activeNoticeModal.isPinned && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300 flex items-center gap-1 shrink-0">
                    <Pin className="w-3 h-3 fill-amber-500" />
                    {t.notices.pinnedBadge || 'Đã ghim'}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setActiveNoticeModal(null)}
                className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-lg hover:bg-gray-200/60 dark:hover:bg-gray-800 transition-colors shrink-0"
                title={t.common.close}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2 leading-snug">
                {activeNoticeModal.title}
              </h2>

              {/* Clean meta row */}
              <div className="flex items-center flex-wrap gap-2 text-xs text-gray-500 pb-3.5 border-b border-gray-100 dark:border-gray-800 mb-4">
                <span className="font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-amber-500" />
                  {activeNoticeModal.sender || activeNoticeModal.author || 'Ban Giám Hiệu'}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  {activeNoticeModal.date}
                </span>
              </div>

              {/* Full Content */}
              <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed space-y-3 mb-6">
                {activeNoticeModal.content}
              </div>

              {/* 4. Attached Files Section in Detail Modal */}
              {activeNoticeModal.attachments && activeNoticeModal.attachments.length > 0 && (
                <div className="p-4 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700">
                  <div className="text-xs font-bold text-gray-800 dark:text-gray-200 mb-2.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Paperclip className="w-4 h-4 text-blue-500" />
                      <span>
                        {lang === 'vi' ? 'Tệp tin đính kèm chính thức:' : 'Official attached documents:'}{' '}
                        ({activeNoticeModal.attachments.length})
                      </span>
                    </span>
                  </div>
                  <div className="space-y-2">
                    {activeNoticeModal.attachments.map((file, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 text-xs hover:border-blue-400 transition-colors"
                      >
                        <span className="font-medium text-gray-800 dark:text-gray-200 truncate flex items-center gap-2 pr-2">
                          <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                          <span className="truncate">{file}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDownloadAttachment(file)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-300 hover:bg-blue-100 transition-colors shrink-0 shadow-2xs"
                        >
                          <Download className="w-3 h-3" />
                          <span>{lang === 'vi' ? 'Tải về' : 'Download'}</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer with Pin Toggle, Edit & Close */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-850 shrink-0">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleTogglePin(activeNoticeModal.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                    activeNoticeModal.isPinned
                      ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 text-amber-700 dark:text-amber-300'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100'
                  }`}
                >
                  <Pin className={`w-3.5 h-3.5 ${activeNoticeModal.isPinned ? 'fill-amber-500 text-amber-500' : ''}`} />
                  <span>
                    {activeNoticeModal.isPinned
                      ? t.notices.unpinNotice || 'Bỏ ghim'
                      : t.notices.pinNotice || 'Ghim lên đầu'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={(e) => handleOpenEdit(activeNoticeModal, e)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-gray-700 transition-colors"
                  title={t.notices.editNotice || (lang === 'vi' ? 'Chỉnh sửa thông báo' : 'Edit notice')}
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>{t.notices.editNotice || (lang === 'vi' ? 'Chỉnh sửa' : 'Edit')}</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setActiveNoticeModal(null)}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                {t.common.close}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Notice Modal */}
      {isAddModalOpen && (
        <div
          data-app-modal="true"
          {...modalTouchHandlers}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-0 lg:p-4"
        >
          <div className="w-full h-full lg:h-auto lg:max-h-[90vh] lg:max-w-lg bg-white dark:bg-gray-900 rounded-none lg:rounded-2xl shadow-2xl border-0 lg:border border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-3.5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-850 shrink-0">
              <div className="min-w-0 pr-2">
                <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white truncate">
                  {t.notices.addNotice}
                </h3>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                  {lang === 'vi' ? 'Thêm thông báo mới từ nhà trường' : 'Create a new school notice'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-lg hover:bg-gray-200/60 dark:hover:bg-gray-800 transition-colors shrink-0"
                title={t.common.cancel}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNotice} className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Tiêu đề thông báo *
                  </label>
                  <input
                    type="text"
                    required
                    value={newNotice.title}
                    onChange={(e) => setNewNotice({ ...newNotice, title: e.target.value })}
                    placeholder="Thông báo nghỉ học, nộp học phí..."
                    className="w-full px-3 py-2 text-xs sm:text-[13px] rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-xs sm:placeholder:text-[12px] placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Đơn vị gửi
                    </label>
                    <input
                      type="text"
                      value={newNotice.sender}
                      onChange={(e) => setNewNotice({ ...newNotice, sender: e.target.value })}
                      placeholder="Ban Giám Hiệu, GVCN..."
                      className="w-full px-3 py-2 text-xs sm:text-[13px] rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-xs sm:placeholder:text-[12px] placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      {t.exams.date}
                    </label>
                    <input
                      type="date"
                      value={newNotice.date}
                      onChange={(e) => setNewNotice({ ...newNotice, date: e.target.value })}
                      className="w-full px-3 py-2 text-xs sm:text-[13px] rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Phân loại danh mục
                    </label>
                    <select
                      value={newNotice.category}
                      onChange={(e) =>
                        setNewNotice({ ...newNotice, category: e.target.value as NoticeCategory })
                      }
                      className="w-full px-3 py-2 text-xs sm:text-[13px] rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="general">{categoryLabels.general.label}</option>
                      <option value="urgent">{categoryLabels.urgent.label}</option>
                      <option value="academic">{categoryLabels.academic.label}</option>
                      <option value="activity">{categoryLabels.activity.label}</option>
                      <option value="holiday">{categoryLabels.holiday.label}</option>
                      <option value="fee">{categoryLabels.fee.label}</option>
                    </select>
                  </div>

                  <div className="flex flex-col justify-end gap-2 pb-1">
                    {/* Urgent Checkbox */}
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-rose-600 dark:text-rose-400">
                      <input
                        type="checkbox"
                        checked={newNotice.isUrgent}
                        onChange={(e) => setNewNotice({ ...newNotice, isUrgent: e.target.checked })}
                        className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
                      />
                      <span>{t.notices.categories.urgent}</span>
                    </label>

                    {/* 4. Pin Checkbox */}
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-amber-600 dark:text-amber-400">
                      <input
                        type="checkbox"
                        checked={newNotice.isPinned}
                        onChange={(e) => setNewNotice({ ...newNotice, isPinned: e.target.checked })}
                        className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                      />
                      <span>{t.notices.pinNotice || 'Ghim lên đầu'}</span>
                    </label>
                  </div>
                </div>

                {/* 4. Attachment Input */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    {t.notices.attachments || 'Tệp đính kèm'} (cách nhau bằng dấu phẩy)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={newNotice.attachmentInput}
                      onChange={(e) => setNewNotice({ ...newNotice, attachmentInput: e.target.value })}
                      placeholder="Ke_hoach.pdf, Cong_van.docx..."
                      className="w-full pl-8 pr-3 py-2 text-xs sm:text-[13px] rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-xs placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <Paperclip className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5" />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">
                    Ví dụ: Ke_hoach_tuan_3.pdf, Danh_sach.xlsx
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Nội dung chi tiết *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={newNotice.content}
                    onChange={(e) => setNewNotice({ ...newNotice, content: e.target.value })}
                    placeholder="Nhập toàn văn thông báo..."
                    className="w-full px-3 py-2 text-xs sm:text-[13px] rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-xs sm:placeholder:text-[12px] placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-2 px-4 sm:px-6 py-3 sm:py-3.5 border-t border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-850 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white shadow-xs"
                >
                  {t.common.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Notice Modal */}
      {editNoticeData && (
        <div
          data-app-modal="true"
          {...modalTouchHandlers}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-0 lg:p-4"
        >
          <div className="w-full h-full lg:h-auto lg:max-h-[90vh] lg:max-w-lg bg-white dark:bg-gray-900 rounded-none lg:rounded-2xl shadow-2xl border-0 lg:border border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-3.5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-850 shrink-0">
              <div className="min-w-0 pr-2">
                <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white truncate flex items-center gap-2">
                  <Pencil className="w-4 h-4 text-amber-500" />
                  <span>{t.notices.editNotice || (lang === 'vi' ? 'Chỉnh Sửa Thông Báo' : 'Edit Notice')}</span>
                </h3>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                  {lang === 'vi' ? 'Cập nhật nội dung và phân loại thông báo' : 'Update notice content and category'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditNoticeData(null)}
                className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-lg hover:bg-gray-200/60 dark:hover:bg-gray-800 transition-colors shrink-0"
                title={t.common.cancel}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Tiêu đề thông báo *
                  </label>
                  <input
                    type="text"
                    required
                    value={editNoticeData.title}
                    onChange={(e) =>
                      setEditNoticeData({ ...editNoticeData, title: e.target.value })
                    }
                    placeholder="Thông báo..."
                    className="w-full px-3 py-2 text-xs sm:text-[13px] rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-xs placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Đơn vị gửi
                    </label>
                    <input
                      type="text"
                      value={editNoticeData.sender}
                      onChange={(e) =>
                        setEditNoticeData({ ...editNoticeData, sender: e.target.value })
                      }
                      placeholder="Ban Giám Hiệu..."
                      className="w-full px-3 py-2 text-xs sm:text-[13px] rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-xs placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      {t.exams.date}
                    </label>
                    <input
                      type="date"
                      value={editNoticeData.date}
                      onChange={(e) =>
                        setEditNoticeData({ ...editNoticeData, date: e.target.value })
                      }
                      className="w-full px-3 py-2 text-xs sm:text-[13px] rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Phân loại danh mục
                    </label>
                    <select
                      value={editNoticeData.category}
                      onChange={(e) =>
                        setEditNoticeData({
                          ...editNoticeData,
                          category: e.target.value as NoticeCategory,
                        })
                      }
                      className="w-full px-3 py-2 text-xs sm:text-[13px] rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="general">{categoryLabels.general.label}</option>
                      <option value="urgent">{categoryLabels.urgent.label}</option>
                      <option value="academic">{categoryLabels.academic.label}</option>
                      <option value="activity">{categoryLabels.activity.label}</option>
                      <option value="holiday">{categoryLabels.holiday.label}</option>
                      <option value="fee">{categoryLabels.fee.label}</option>
                    </select>
                  </div>

                  <div className="flex flex-col justify-end gap-2 pb-1">
                    {/* Urgent Checkbox */}
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-rose-600 dark:text-rose-400">
                      <input
                        type="checkbox"
                        checked={editNoticeData.isUrgent}
                        onChange={(e) =>
                          setEditNoticeData({ ...editNoticeData, isUrgent: e.target.checked })
                        }
                        className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
                      />
                      <span>{t.notices.categories.urgent}</span>
                    </label>

                    {/* Pin Checkbox */}
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-amber-600 dark:text-amber-400">
                      <input
                        type="checkbox"
                        checked={editNoticeData.isPinned}
                        onChange={(e) =>
                          setEditNoticeData({ ...editNoticeData, isPinned: e.target.checked })
                        }
                        className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                      />
                      <span>{t.notices.pinNotice || 'Ghim lên đầu'}</span>
                    </label>
                  </div>
                </div>

                {/* Attachment Input */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    {t.notices.attachments || 'Tệp đính kèm'} (cách nhau bằng dấu phẩy)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={editNoticeData.attachmentInput}
                      onChange={(e) =>
                        setEditNoticeData({
                          ...editNoticeData,
                          attachmentInput: e.target.value,
                        })
                      }
                      placeholder="Ke_hoach.pdf, Cong_van.docx..."
                      className="w-full pl-8 pr-3 py-2 text-xs sm:text-[13px] rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-xs placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <Paperclip className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5" />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">
                    Ví dụ: Ke_hoach_tuan_3.pdf, Danh_sach.xlsx
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Nội dung chi tiết *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={editNoticeData.content}
                    onChange={(e) =>
                      setEditNoticeData({ ...editNoticeData, content: e.target.value })
                    }
                    placeholder="Nhập toàn văn thông báo..."
                    className="w-full px-3 py-2 text-xs sm:text-[13px] rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-xs placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-2 px-4 sm:px-6 py-3 sm:py-3.5 border-t border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-850 shrink-0">
                <button
                  type="button"
                  onClick={() => setEditNoticeData(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white shadow-xs"
                >
                  {t.notices.saveNotice || t.common.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
