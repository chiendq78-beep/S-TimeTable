import React, { useState } from 'react';
import {
  CheckSquare,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  CheckCircle2,
  Circle,
  Check,
  Bell,
  Volume2,
  Flag,
  X,
} from 'lucide-react';
import { HomeworkItem, Priority, HomeworkStatus, Language } from '../types';
import { translations } from '../i18n/translations';
import { NotificationService } from '../services/notification';
import { useSwipeToCloseModal } from '../hooks/useSwipeToCloseModal';

interface HomeworkViewProps {
  homeworkList: HomeworkItem[];
  onSaveHomework: (items: HomeworkItem[]) => void;
  lang: Language;
}

export const HomeworkView: React.FC<HomeworkViewProps> = ({
  homeworkList,
  onSaveHomework,
  lang,
}) => {
  const t = translations[lang];
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [editingItem, setEditingItem] = useState<HomeworkItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Swipe-to-close on mobile/tablet
  const { modalTouchHandlers } = useSwipeToCloseModal({
    isOpen: isModalOpen,
    onClose: () => {
      setIsModalOpen(false);
      setEditingItem(null);
    },
  });

  // Status check for deadline - synchronized rules
  const getDeadlineStatus = (deadlineStr: string, isCompleted: boolean) => {
    if (isCompleted) {
      return {
        label: lang === 'vi' ? 'Đã hoàn thành' : 'Completed',
        color: 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800 font-semibold',
      };
    }

    const deadlineDate = new Date(deadlineStr);
    const now = new Date();

    // Start of calendar days to compute calendar day difference
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfDeadline = new Date(deadlineDate.getFullYear(), deadlineDate.getMonth(), deadlineDate.getDate()).getTime();
    const diffDays = Math.round((startOfDeadline - startOfToday) / (1000 * 60 * 60 * 24));
    const diffTime = deadlineDate.getTime() - now.getTime();

    // Overdue past today
    if (diffDays < 0) {
      const daysOverdue = Math.abs(diffDays);
      return {
        label: lang === 'vi' ? `Quá hạn ${daysOverdue} ngày` : `${daysOverdue}d overdue`,
        color: 'text-rose-700 bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 font-bold',
      };
    }

    // Due today
    if (diffDays === 0) {
      if (diffTime < 0) {
        return {
          label: lang === 'vi' ? 'Hôm nay (Quá giờ)' : 'Overdue today',
          color: 'text-rose-700 bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 font-bold',
        };
      }
      return {
        label: lang === 'vi' ? 'Hôm nay (Sắp đến hạn)' : 'Due today',
        color: 'text-rose-700 bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 font-bold animate-pulse',
      };
    }

    // Due tomorrow
    if (diffDays === 1) {
      return {
        label: lang === 'vi' ? 'Còn 1 ngày (Ngày mai)' : 'Tomorrow',
        color: 'text-amber-700 bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800 font-medium',
      };
    }

    // Future
    return {
      label: lang === 'vi' ? `Còn ${diffDays} ngày` : `${diffDays} days left`,
      color: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800 font-medium',
    };
  };

  const filteredItems = homeworkList.filter((item) => {
    if (filterStatus === 'all') return true;
    return item.status === filterStatus;
  });

  const countPending = homeworkList.filter((i) => i.status === 'pending').length;
  const countInProgress = homeworkList.filter((i) => i.status === 'in_progress').length;
  const countCompleted = homeworkList.filter((i) => i.status === 'completed').length;
  const countNeedAction = countPending + countInProgress;

  const handleToggleStatus = (item: HomeworkItem) => {
    const nextStatus: Record<HomeworkStatus, HomeworkStatus> = {
      pending: 'in_progress',
      in_progress: 'completed',
      completed: 'pending',
    };
    const updated = homeworkList.map((i) =>
      i.id === item.id ? { ...i, status: nextStatus[i.status] } : i
    );
    onSaveHomework(updated);

    if (item.status === 'in_progress') {
      NotificationService.playBellSound();
    }
  };

  const handleDelete = (id: string) => {
    onSaveHomework(homeworkList.filter((i) => i.id !== id));
  };

  const handleOpenAdd = () => {
    const tomorrow = new Date(Date.now() + 24 * 3600000);
    const tomorrowStr = tomorrow.toISOString().substring(0, 16);
    setEditingItem({
      id: `hw-${Date.now()}`,
      subject: 'Toán học',
      title: '',
      deadline: tomorrowStr,
      priority: 'medium',
      status: 'pending',
      description: '',
      reminderMinutesBefore: 60,
    });
    setIsModalOpen(true);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editingItem.title.trim()) return;

    const exists = homeworkList.some((i) => i.id === editingItem.id);
    if (exists) {
      onSaveHomework(homeworkList.map((i) => (i.id === editingItem.id ? editingItem : i)));
    } else {
      onSaveHomework([...homeworkList, editingItem]);
    }
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const priorityBadges: Record<Priority, { label: string; class: string }> = {
    low: { label: t.homework.priorityLow, class: 'text-gray-600 bg-gray-100 dark:bg-gray-800' },
    medium: { label: t.homework.priorityMedium, class: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40' },
    high: { label: t.homework.priorityHigh, class: 'text-rose-600 bg-rose-50 dark:bg-rose-950/40' },
  };

  return (
    <div className="space-y-3.5 sm:space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-gray-900 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            {t.homework.title}
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {t.homework.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Test Sound Bell - compact icon button */}
          <button
            type="button"
            onClick={() => NotificationService.playBellSound()}
            title={lang === 'vi' ? 'Thử âm chuông nhắc nhở bài tập' : 'Test reminder bell sound'}
            className="p-2 sm:px-2.5 sm:py-2 rounded-xl text-gray-500 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 bg-gray-100 dark:bg-gray-800 hover:bg-amber-50 dark:hover:bg-amber-950/40 border border-gray-200 dark:border-gray-700 transition-colors flex items-center gap-1.5 shadow-2xs active:scale-95"
          >
            <Bell className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="hidden md:inline text-xs font-medium text-gray-600 dark:text-gray-300">
              {lang === 'vi' ? 'Chuông báo' : 'Bell'}
            </span>
          </button>

          <button
            id="add-homework-btn"
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm shadow-emerald-500/20 transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>{t.homework.addHomework}</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 scrollbar-none">
        <div className="flex items-center gap-2 shrink-0">
          {[
            { id: 'all', label: t.common.all, count: homeworkList.length },
            { id: 'pending', label: t.homework.statusPending, count: countPending },
            { id: 'in_progress', label: t.homework.statusInProgress, count: countInProgress },
            { id: 'completed', label: t.homework.statusCompleted, count: countCompleted },
          ].map((f) => {
            const isActive = filterStatus === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setFilterStatus(f.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 border ${
                  isActive
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-800 hover:border-emerald-200'
                }`}
              >
                <span>{f.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-emerald-700 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                  }`}
                >
                  {f.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Note indicating pending count matches sidebar badge */}
        <div className="hidden lg:flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400 bg-gray-100/70 dark:bg-gray-800/60 px-2.5 py-1 rounded-lg border border-gray-200/60 dark:border-gray-700/60">
          <span>{lang === 'vi' ? 'Cần xử lý:' : 'Need action:'}</span>
          <span className="font-bold text-rose-600 dark:text-rose-400">{countNeedAction}</span>
        </div>
      </div>

      {/* Homework List */}
      <div className="space-y-3">
        {filteredItems.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-12 text-center border border-gray-200 dark:border-gray-800">
            <CheckSquare className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <div className="text-sm font-semibold text-gray-500">{t.common.empty}</div>
          </div>
        ) : (
          filteredItems.map((item) => {
            const isDone = item.status === 'completed';
            const urgency = getDeadlineStatus(item.deadline, isDone);

            return (
              <div
                key={item.id}
                className={`rounded-2xl p-4 sm:p-5 border transition-all shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isDone
                    ? 'opacity-55 bg-gray-50/80 dark:bg-gray-900/40 border-dashed border-gray-200 dark:border-gray-800 hover:opacity-80'
                    : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:border-emerald-300 dark:hover:border-emerald-800'
                }`}
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  {/* Status Toggle Button - Distinctive and clearly clickable with tooltip */}
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(item)}
                    title={
                      item.status === 'completed'
                        ? (lang === 'vi' ? 'Đã hoàn thành • Bấm để làm lại' : 'Completed • Click to reopen')
                        : item.status === 'in_progress'
                        ? (lang === 'vi' ? 'Đang làm • Bấm để chuyển sang "Đã hoàn thành"' : 'In progress • Click to complete')
                        : (lang === 'vi' ? 'Chưa làm • Bấm để chuyển sang "Đang làm"' : 'Pending • Click to start')
                    }
                    className={`mt-0.5 w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center shrink-0 transition-all cursor-pointer shadow-2xs group ${
                      item.status === 'completed'
                        ? 'bg-emerald-500 text-white border-2 border-emerald-500 hover:bg-emerald-600 hover:border-emerald-600 active:scale-95'
                        : item.status === 'in_progress'
                        ? 'bg-amber-50 dark:bg-amber-950/60 border-2 border-amber-500 text-amber-600 hover:border-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 active:scale-95'
                        : 'bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 hover:border-amber-500 text-gray-300 dark:text-gray-500 hover:text-amber-500 active:scale-95'
                    }`}
                  >
                    {item.status === 'completed' ? (
                      <Check className="w-4 h-4 stroke-[3]" />
                    ) : item.status === 'in_progress' ? (
                      <Clock className="w-4 h-4 text-amber-600 group-hover:text-emerald-600 transition-colors" />
                    ) : (
                      <Circle className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-amber-500 transition-colors" />
                    )}
                  </button>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                        isDone
                          ? 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                          : 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300'
                      }`}>
                        {item.subject}
                      </span>
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                        isDone
                          ? 'opacity-60 bg-gray-100 dark:bg-gray-800 text-gray-400'
                          : priorityBadges[item.priority].class
                      }`}>
                        {priorityBadges[item.priority].label}
                      </span>
                      <span className={`text-[11px] px-2 py-0.5 rounded-md border ${urgency.color}`}>
                        {urgency.label}
                      </span>
                    </div>

                    <h4
                      className={`text-sm transition-colors truncate ${
                        isDone
                          ? 'line-through text-gray-400 dark:text-gray-500 font-normal'
                          : 'font-bold text-gray-900 dark:text-white'
                      }`}
                    >
                      {item.title}
                    </h4>

                    {item.description && (
                      <p className={`text-xs mt-1 line-clamp-2 ${
                        isDone ? 'text-gray-400 dark:text-gray-500 line-through' : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {item.description}
                      </p>
                    )}

                    <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500 mt-2">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(item.deadline).toLocaleString('vi-VN', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-1.5 shrink-0 justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100 dark:border-gray-800">
                  <button
                    onClick={() => {
                      setEditingItem(item);
                      setIsModalOpen(true);
                    }}
                    className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-2 text-gray-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Add/Edit */}
      {isModalOpen && editingItem && (
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
                  {editingItem.id && homeworkList.some((i) => i.id === editingItem.id)
                    ? t.homework.editHomework
                    : t.homework.addHomework}
                </h3>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                  {lang === 'vi' ? 'Thiết lập bài tập, thời hạn và độ ưu tiên' : 'Set up task, deadline and priority'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-lg hover:bg-gray-200/60 dark:hover:bg-gray-800 transition-colors shrink-0"
                title={t.common.cancel}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body & Form */}
            <form onSubmit={handleSaveModal} className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    {t.homework.taskName} *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingItem.title}
                    onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                    placeholder="Làm bài tập trang 45, Viết bài luận..."
                    className="w-full px-3 py-2 text-xs sm:text-[13px] rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-xs sm:placeholder:text-[12px] placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      {t.periods.subject} *
                    </label>
                    <input
                      type="text"
                      required
                      value={editingItem.subject}
                      onChange={(e) => setEditingItem({ ...editingItem, subject: e.target.value })}
                      placeholder="Toán, Anh..."
                      className="w-full px-3 py-2 text-xs sm:text-[13px] rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-xs sm:placeholder:text-[12px] placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      {t.homework.priority}
                    </label>
                    <select
                      value={editingItem.priority}
                      onChange={(e) => setEditingItem({ ...editingItem, priority: e.target.value as Priority })}
                      className="w-full px-3 py-2 text-xs sm:text-[13px] rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="low">{t.homework.priorityLow}</option>
                      <option value="medium">{t.homework.priorityMedium}</option>
                      <option value="high">{t.homework.priorityHigh}</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      {t.homework.deadline} *
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={editingItem.deadline}
                      onChange={(e) => setEditingItem({ ...editingItem, deadline: e.target.value })}
                      className="w-full px-3 py-2 text-xs sm:text-[13px] rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      {t.common.status}
                    </label>
                    <select
                      value={editingItem.status}
                      onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value as HomeworkStatus })}
                      className="w-full px-3 py-2 text-xs sm:text-[13px] rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="pending">{t.homework.statusPending}</option>
                      <option value="in_progress">{t.homework.statusInProgress}</option>
                      <option value="completed">{t.homework.statusCompleted}</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Mô tả / Hướng dẫn làm bài
                  </label>
                  <textarea
                    rows={3}
                    value={editingItem.description || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                    placeholder="Yêu cầu chi tiết của giáo viên..."
                    className="w-full px-3 py-2 text-xs sm:text-[13px] rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-xs sm:placeholder:text-[12px] placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-2 px-4 sm:px-6 py-3 sm:py-3.5 border-t border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-850 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                >
                  {t.common.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
