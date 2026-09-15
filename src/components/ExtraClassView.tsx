import React, { useState, useRef } from 'react';
import {
  GraduationCap,
  Plus,
  Edit2,
  Trash2,
  Clock,
  MapPin,
  User,
  DollarSign,
  Bell,
  Wallet,
  Columns3,
  LayoutGrid,
  X,
  Calendar,
} from 'lucide-react';
import { ExtraClassItem, Language } from '../types';
import { translations } from '../i18n/translations';
import { useSwipeToCloseModal } from '../hooks/useSwipeToCloseModal';

interface ExtraClassViewProps {
  extraClasses: ExtraClassItem[];
  onSaveExtraClasses: (items: ExtraClassItem[]) => void;
  lang: Language;
}

export const ExtraClassView: React.FC<ExtraClassViewProps> = ({
  extraClasses,
  onSaveExtraClasses,
  lang,
}) => {
  const t = translations[lang];
  const [editingItem, setEditingItem] = useState<ExtraClassItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Swipe-to-close on mobile/tablet
  const { modalTouchHandlers } = useSwipeToCloseModal({
    isOpen: isModalOpen,
    onClose: () => {
      setIsModalOpen(false);
      setEditingItem(null);
    },
  });

  const [viewMode, setViewMode] = useState<'week' | 'cards'>('week');
  const dayColumnRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  const currentDayOfWeek = new Date().getDay() === 0 ? 8 : new Date().getDay() + 1;

  const scrollToToday = () => {
    const target = dayColumnRefs.current[currentDayOfWeek];
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  };

  const daysOfWeek = [
    { num: 2, label: t.days.monday, short: lang === 'vi' ? 'Thứ 2' : 'Mon' },
    { num: 3, label: t.days.tuesday, short: lang === 'vi' ? 'Thứ 3' : 'Tue' },
    { num: 4, label: t.days.wednesday, short: lang === 'vi' ? 'Thứ 4' : 'Wed' },
    { num: 5, label: t.days.thursday, short: lang === 'vi' ? 'Thứ 5' : 'Thu' },
    { num: 6, label: t.days.friday, short: lang === 'vi' ? 'Thứ 6' : 'Fri' },
    { num: 7, label: t.days.saturday, short: lang === 'vi' ? 'Thứ 7' : 'Sat' },
    { num: 8, label: t.days.sunday, short: lang === 'vi' ? 'Chủ Nhật' : 'Sun' },
  ];

  // Calculate estimated total monthly tuition (supports monthly or per-session fees)
  const totalMonthlyFee = extraClasses.reduce((acc, curr) => {
    const fee = curr.fee || 0;
    return acc + (curr.feePeriod === 'session' ? fee * 4 : fee);
  }, 0);

  const handleDelete = (id: string) => {
    onSaveExtraClasses(extraClasses.filter((i) => i.id !== id));
  };

  const handleOpenAdd = (dayOfWeek?: number) => {
    setEditingItem({
      id: `extra-${Date.now()}`,
      title: '',
      subject: '',
      dayOfWeek: dayOfWeek || 3,
      timeStart: '18:00',
      timeEnd: '20:00',
      location: '',
      teacher: '',
      fee: 300000,
      feePeriod: 'month',
      reminderMinutesBefore: 30,
      note: '',
    });
    setIsModalOpen(true);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editingItem.title.trim()) return;

    const exists = extraClasses.some((i) => i.id === editingItem.id);
    if (exists) {
      onSaveExtraClasses(extraClasses.map((i) => (i.id === editingItem.id ? editingItem : i)));
    } else {
      onSaveExtraClasses([...extraClasses, editingItem]);
    }
    setIsModalOpen(false);
    setEditingItem(null);
  };

  return (
    <div className="space-y-3.5 sm:space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-gray-900 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            {t.extraClass.title}
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {t.extraClass.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* View Mode Switcher */}
          <div className="flex items-center p-1 bg-gray-100 dark:bg-gray-800 rounded-xl border border-gray-200/80 dark:border-gray-700/80">
            <button
              onClick={() => setViewMode('week')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'week'
                  ? 'bg-white dark:bg-gray-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Columns3 className="w-3.5 h-3.5" />
              <span>{t.extraClass.weekView}</span>
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'cards'
                  ? 'bg-white dark:bg-gray-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>{t.extraClass.cardView}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Monthly Tuition Summary Widget */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
        <div className="bg-white dark:bg-gray-900 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-gray-800 flex flex-col justify-center shadow-xs min-w-0">
          <div className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium">
            {lang === 'vi' ? 'Tổng số lớp' : 'Total Classes'}
          </div>
          <div className="text-sm sm:text-base font-bold text-gray-900 dark:text-white truncate mt-0.5">
            {extraClasses.length} {lang === 'vi' ? 'lớp' : 'classes'}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-gray-800 flex flex-col justify-center shadow-xs min-w-0">
          <div className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium">
            {lang === 'vi' ? 'Học phí / tháng' : t.extraClass.totalMonthlyEstimate}
          </div>
          <div className="text-sm sm:text-base font-bold text-emerald-600 dark:text-emerald-400 truncate mt-0.5">
            {totalMonthlyFee.toLocaleString('vi-VN')} ₫
          </div>
        </div>
      </div>

      {/* VIEW MODE 1: WEEKLY COLUMNS (Ngày theo cột, không chia Sáng/Chiều) */}
      {viewMode === 'week' ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs p-3.5 sm:p-4">
          <div className="flex items-center justify-between gap-2 mb-3 px-0.5">
            <button
              onClick={scrollToToday}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors shadow-2xs shrink-0"
              title={lang === 'vi' ? 'Quay về lịch học thêm hôm nay' : "Go to today's schedule"}
            >
              <Calendar className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>{lang === 'vi' ? 'Hôm nay' : 'Today'}</span>
            </button>

            <button
              id="add-extra-class-btn"
              onClick={() => handleOpenAdd()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm shadow-indigo-500/20 transition-all active:scale-[0.98] shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>{t.extraClass.addClass}</span>
            </button>
          </div>

          <div className="overflow-x-auto pb-2 -mx-1 px-1 scroll-smooth">
            <div className="grid grid-cols-7 gap-2.5 sm:gap-3 min-w-[1470px]">
              {daysOfWeek.map((day) => {
                const isToday = day.num === currentDayOfWeek;
                const dayClasses = extraClasses
                  .filter((c) => c.dayOfWeek === day.num)
                  .sort((a, b) => a.timeStart.localeCompare(b.timeStart));

                return (
                  <div
                    key={day.num}
                    ref={(el) => {
                      dayColumnRefs.current[day.num] = el;
                    }}
                    id={`extra-day-col-${day.num}`}
                    className={`flex flex-col rounded-xl border transition-all ${
                      isToday
                        ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-300 dark:border-amber-700/60 ring-2 ring-amber-400/20'
                        : 'bg-gray-50/70 dark:bg-gray-800/40 border-gray-200/80 dark:border-gray-800'
                    }`}
                  >
                    {/* Day Column Header */}
                    <div
                      className={`p-2.5 border-b flex items-center justify-between gap-1.5 rounded-t-xl ${
                        isToday
                          ? 'bg-amber-100/60 dark:bg-amber-900/40 border-amber-200 dark:border-amber-800/60'
                          : 'bg-gray-100/70 dark:bg-gray-800/80 border-gray-200 dark:border-gray-800'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white truncate">
                            {day.short}
                          </span>
                          {isToday && (
                            <span className="px-1.5 py-0.5 text-[8px] font-black uppercase rounded-full bg-amber-500 text-white leading-none shrink-0">
                              {lang === 'vi' ? 'Nay' : 'Today'}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-gray-500 dark:text-gray-400 block truncate">
                          {dayClasses.length > 0
                            ? `${dayClasses.length} ${lang === 'vi' ? 'lớp' : 'cls'}`
                            : (lang === 'vi' ? 'Trống' : 'Free')}
                        </span>
                      </div>

                      <button
                        onClick={() => handleOpenAdd(day.num)}
                        title={lang === 'vi' ? `Thêm lớp cho ${day.short}` : `Add class for ${day.short}`}
                        className="w-6 h-6 rounded-lg bg-white dark:bg-gray-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-gray-500 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 border border-gray-200 dark:border-gray-600 flex items-center justify-center transition-colors shrink-0 shadow-2xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Classes list inside this day column (no morning/afternoon split) */}
                    <div className="p-2 space-y-2 flex-1 flex flex-col min-h-[160px]">
                      {dayClasses.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-2 rounded-lg border border-dashed border-gray-200 dark:border-gray-800 text-gray-400 dark:text-gray-500 text-[11px]">
                          <span>{t.extraClass.emptyDay}</span>
                          <button
                            onClick={() => handleOpenAdd(day.num)}
                            className="mt-1.5 text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                          >
                            + {lang === 'vi' ? 'Thêm' : 'Add'}
                          </button>
                        </div>
                      ) : (
                        dayClasses.map((item) => (
                          <div
                            key={item.id}
                            className="bg-white dark:bg-gray-900 rounded-lg p-2.5 border border-gray-200 dark:border-gray-800 hover:border-[#b89278]/60 dark:hover:border-[#b89278]/50 transition-all shadow-2xs group flex flex-col justify-between gap-1.5"
                          >
                            {/* Subject Tag & Actions */}
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/50 truncate max-w-[120px]">
                                {item.subject}
                              </span>
                              <div className="flex items-center gap-0.5 opacity-80 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => {
                                    setEditingItem(item);
                                    setIsModalOpen(true);
                                  }}
                                  className="p-0.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded"
                                  title={lang === 'vi' ? 'Sửa' : 'Edit'}
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => handleDelete(item.id)}
                                  className="p-0.5 text-gray-400 hover:text-rose-600 rounded"
                                  title={lang === 'vi' ? 'Xóa' : 'Delete'}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>

                            {/* Class Title */}
                            <div className="text-xs font-bold text-gray-900 dark:text-white leading-tight line-clamp-2">
                              {item.title}
                            </div>

                            {/* Time */}
                            <div className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                              <Clock className="w-3 h-3 shrink-0" />
                              <span>
                                {item.timeStart} - {item.timeEnd}
                              </span>
                            </div>

                            {/* Fee */}
                            <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                              <DollarSign className="w-3 h-3 shrink-0" />
                              <span>
                                {item.fee.toLocaleString('vi-VN')} đ/{item.feePeriod === 'session' ? (lang === 'vi' ? 'buổi' : 'ses') : (lang === 'vi' ? 'tháng' : 'mo')}
                              </span>
                            </div>

                            {/* Teacher & Location */}
                            <div className="space-y-0.5 text-[10px] text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-800/80 pt-1.5">
                              {item.teacher && (
                                <div className="flex items-center gap-1 truncate" title={item.teacher}>
                                  <User className="w-2.5 h-2.5 text-blue-500 shrink-0" />
                                  <span className="truncate">{item.teacher}</span>
                                </div>
                              )}
                              {item.location && (
                                <div className="flex items-center gap-1 truncate" title={item.location}>
                                  <MapPin className="w-2.5 h-2.5 text-rose-500 shrink-0" />
                                  <span className="truncate">{item.location}</span>
                                </div>
                              )}
                            </div>

                            {/* Note pill if present */}
                            {item.note && (
                              <div
                                className="text-[10px] text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/80 p-1 rounded border border-gray-100 dark:border-gray-800 line-clamp-2"
                                title={item.note}
                              >
                                {item.note}
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* VIEW MODE 2: CARDS GRID (Dạng thẻ chi tiết 2 cột) */
        <div className="space-y-3">
          <div className="flex items-center justify-end px-0.5">
            <button
              id="add-extra-class-btn-cards"
              onClick={() => handleOpenAdd()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm shadow-indigo-500/20 transition-all active:scale-[0.98] shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>{t.extraClass.addClass}</span>
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-3.5">
          {extraClasses.map((item) => {
            const dayObj = daysOfWeek.find((d) => d.num === item.dayOfWeek);
            return (
              <div
                key={item.id}
                className="bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 border border-gray-200 dark:border-gray-800 hover:border-[#b89278]/60 dark:hover:border-[#b89278]/40 transition-all shadow-2xs hover:shadow-xs flex flex-col justify-between gap-2.5"
              >
                <div>
                  {/* Header: Badges & Action Buttons */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/50">
                        {item.subject}
                      </span>
                      <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                        {dayObj?.label}
                      </span>
                      {item.reminderMinutesBefore > 0 && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded-md border border-amber-100 dark:border-amber-900/30">
                          <Bell className="w-2.5 h-2.5" />
                          <span>{item.reminderMinutesBefore}p</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        onClick={() => {
                          setEditingItem(item);
                          setIsModalOpen(true);
                        }}
                        title={lang === 'vi' ? 'Chỉnh sửa' : 'Edit'}
                        className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        title={lang === 'vi' ? 'Xóa lớp học' : 'Delete'}
                        className="p-1 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-sm sm:text-[15px] font-bold text-gray-900 dark:text-white mt-1.5 leading-snug">
                    {item.title}
                  </h3>

                  {/* Compact Info Grid (2 columns on sm/md) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1.5 text-xs text-gray-600 dark:text-gray-300 mt-2.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Clock className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span className="font-semibold text-gray-800 dark:text-gray-200 truncate">
                        {item.timeStart} - {item.timeEnd}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 min-w-0">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400 truncate">
                        {item.fee.toLocaleString('vi-VN')} đ/{item.feePeriod === 'session' ? (lang === 'vi' ? 'buổi' : 'sess') : (lang === 'vi' ? 'tháng' : 'mo')}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 min-w-0">
                      <User className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span className="truncate" title={item.teacher}>{item.teacher}</span>
                    </div>

                    <div className="flex items-center gap-1.5 min-w-0">
                      <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span className="truncate" title={item.location}>{item.location}</span>
                    </div>
                  </div>

                  {/* Compact Note if exists */}
                  {item.note && (
                    <div className="mt-2 text-[11px] text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/60 px-2.5 py-1.5 rounded-lg border border-gray-100 dark:border-gray-800 line-clamp-2">
                      {item.note}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
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
                  {editingItem.id && extraClasses.some((i) => i.id === editingItem.id)
                    ? t.extraClass.editClass
                    : (lang === 'vi' ? 'Thêm Lớp Học Thêm' : 'Add Tutoring Class')}
                </h3>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                  {lang === 'vi' ? 'Thiết lập môn học, thời khóa biểu và học phí' : 'Set up subject, schedule and tuition fee'}
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
              <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-3.5 sm:py-4 space-y-3 sm:space-y-3.5">
                <div>
                  <label className="block text-[11px] sm:text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 leading-tight">
                    Tên lớp / Mục tiêu học thêm *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingItem.title}
                    onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                    placeholder="Ôn thi ĐH Toán, Luyện IELTS 7.5..."
                    className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-[13px] rounded-lg sm:rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 placeholder:text-xs sm:placeholder:text-[12px] focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <div>
                    <label className="block text-[11px] sm:text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 leading-tight">
                      {t.periods.subject} *
                    </label>
                    <input
                      type="text"
                      required
                      value={editingItem.subject}
                      onChange={(e) => setEditingItem({ ...editingItem, subject: e.target.value })}
                      placeholder="Toán, Tiếng Anh..."
                      className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-[13px] rounded-lg sm:rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 placeholder:text-xs sm:placeholder:text-[12px] outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] sm:text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 leading-tight">
                      Thứ trong tuần
                    </label>
                    <select
                      value={editingItem.dayOfWeek}
                      onChange={(e) => setEditingItem({ ...editingItem, dayOfWeek: Number(e.target.value) })}
                      className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-[13px] rounded-lg sm:rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {daysOfWeek.map((d) => (
                        <option key={d.num} value={d.num}>
                          {d.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <div>
                    <label className="block text-[11px] sm:text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 leading-tight">
                      Bắt đầu
                    </label>
                    <input
                      type="time"
                      value={editingItem.timeStart}
                      onChange={(e) => setEditingItem({ ...editingItem, timeStart: e.target.value })}
                      className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-[13px] rounded-lg sm:rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] sm:text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 leading-tight">
                      Kết thúc
                    </label>
                    <input
                      type="time"
                      value={editingItem.timeEnd}
                      onChange={(e) => setEditingItem({ ...editingItem, timeEnd: e.target.value })}
                      className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-[13px] rounded-lg sm:rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <div>
                    <label className="block text-[11px] sm:text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 leading-tight truncate">
                      {t.extraClass.centerOrPlace}
                    </label>
                    <input
                      type="text"
                      value={editingItem.location}
                      onChange={(e) => setEditingItem({ ...editingItem, location: e.target.value })}
                      placeholder="Trung tâm 218 Lý Tự Trọng..."
                      className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-[13px] rounded-lg sm:rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 placeholder:text-xs sm:placeholder:text-[12px] outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] sm:text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 leading-tight truncate">
                      {t.extraClass.tutor}
                    </label>
                    <input
                      type="text"
                      value={editingItem.teacher}
                      onChange={(e) => setEditingItem({ ...editingItem, teacher: e.target.value })}
                      placeholder="Thầy Hùng, Cô Lan..."
                      className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-[13px] rounded-lg sm:rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 placeholder:text-xs sm:placeholder:text-[12px] outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <div>
                    <label className="block text-[11px] sm:text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 leading-tight truncate">
                      {lang === 'vi' ? 'Học phí (VNĐ)' : 'Tuition Fee (VND)'}
                    </label>
                    <div className="flex gap-1.5 sm:gap-2">
                      <input
                        type="number"
                        step={10000}
                        value={editingItem.fee}
                        onChange={(e) => setEditingItem({ ...editingItem, fee: Number(e.target.value) })}
                        className="flex-1 min-w-0 px-2 sm:px-2.5 py-1.5 sm:py-2 text-xs sm:text-[13px] rounded-lg sm:rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <select
                        value={editingItem.feePeriod || 'month'}
                        onChange={(e) => setEditingItem({ ...editingItem, feePeriod: e.target.value as 'month' | 'session' })}
                        className="px-1.5 sm:px-2 py-1.5 sm:py-2 text-[11px] sm:text-xs font-medium rounded-lg sm:rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 outline-none shrink-0 w-[74px] sm:w-[82px] text-center"
                      >
                        <option value="month">{lang === 'vi' ? '/ tháng' : '/ mo'}</option>
                        <option value="session">{lang === 'vi' ? '/ buổi' : '/ sess'}</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] sm:text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 leading-tight truncate">
                      {t.extraClass.reminder}
                    </label>
                    <select
                      value={editingItem.reminderMinutesBefore}
                      onChange={(e) => setEditingItem({ ...editingItem, reminderMinutesBefore: Number(e.target.value) })}
                      className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-[13px] rounded-lg sm:rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value={15}>15 phút</option>
                      <option value={30}>30 phút</option>
                      <option value={45}>45 phút</option>
                      <option value={60}>60 phút</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] sm:text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 leading-tight">
                    {t.common.notes}
                  </label>
                  <textarea
                    rows={2}
                    value={editingItem.note || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, note: e.target.value })}
                    placeholder="Ghi chú bài tập chuẩn bị trước khi đến lớp..."
                    className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-[13px] rounded-lg sm:rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 placeholder:text-xs sm:placeholder:text-[12px] outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-2 px-4 sm:px-5 py-3 sm:py-3.5 border-t border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-850 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-200/70 dark:hover:bg-gray-800 transition-colors"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-all active:scale-[0.98]"
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
