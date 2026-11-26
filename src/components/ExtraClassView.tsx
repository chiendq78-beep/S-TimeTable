import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  GraduationCap,
  Plus,
  Edit2,
  Trash2,
  Clock,
  MapPin,
  User,
  Bell,
  Wallet,
  X,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { ExtraClassItem, Language, SubjectItem } from '../types';
import { translations } from '../i18n/translations';
import { useSwipeToCloseModal } from '../hooks/useSwipeToCloseModal';
import { StorageService } from '../services/storage';
import { SubjectCombobox } from './SubjectCombobox';

interface ExtraClassViewProps {
  extraClasses: ExtraClassItem[];
  onSaveExtraClasses: (items: ExtraClassItem[]) => void;
  lang: Language;
  openDetailId?: string;
  openDetailSubject?: string;
  onClearOpenDetailId?: () => void;
  subjects?: SubjectItem[];
}

export const ExtraClassView: React.FC<ExtraClassViewProps> = ({
  extraClasses,
  onSaveExtraClasses,
  lang,
  openDetailId,
  openDetailSubject,
  onClearOpenDetailId,
  subjects,
}) => {
  const t = translations[lang];
  const [editingItem, setEditingItem] = useState<ExtraClassItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ExtraClassItem | null>(null);

  // Automatically open detail / edit modal when navigated from notification
  useEffect(() => {
    if (openDetailId || openDetailSubject) {
      const target =
        (openDetailId && extraClasses.find((c) => c.id === openDetailId)) ||
        (openDetailSubject &&
          extraClasses.find(
            (c) => c.subject.toLowerCase() === openDetailSubject.toLowerCase()
          ));
      if (target) {
        setEditingItem(target);
        setIsModalOpen(true);
      }
      if (onClearOpenDetailId) {
        onClearOpenDetailId();
      }
    }
  }, [openDetailId, openDetailSubject, extraClasses, onClearOpenDetailId]);

  // Swipe-to-close on mobile/tablet
  const { modalTouchHandlers } = useSwipeToCloseModal({
    isOpen: isModalOpen || itemToDelete !== null,
    onClose: () => {
      if (itemToDelete) {
        setItemToDelete(null);
      } else {
        setIsModalOpen(false);
        setEditingItem(null);
      }
    },
  });

  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(() => new Date());

  // Absence tracking: array of "classId_YYYY-MM-DD" keys
  const [absentSessionIds, setAbsentSessionIds] = useState<string[]>(() =>
    StorageService.getExtraClassAbsences()
  );

  const toggleAbsence = (classId: string, dateStr: string) => {
    const key = `${classId}_${dateStr}`;
    setAbsentSessionIds((prev) => {
      const next = prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key];
      StorageService.saveExtraClassAbsences(next);
      return next;
    });
  };

  const dayColumnRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  const currentDayOfWeek = new Date().getDay() === 0 ? 8 : new Date().getDay() + 1;

  const scrollToToday = (behavior: ScrollBehavior = 'smooth') => {
    const target = dayColumnRefs.current[currentDayOfWeek];
    if (target) {
      target.scrollIntoView({ behavior, block: 'nearest', inline: 'center' });
    }
  };

  // Always scroll to today when opening ExtraClassView or switching to week view
  useEffect(() => {
    if (viewMode === 'week') {
      const timer = setTimeout(() => {
        scrollToToday('smooth');
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [viewMode]);

  const daysOfWeek = [
    { num: 2, label: t.days.monday, short: lang === 'vi' ? 'Thứ 2' : 'Mon' },
    { num: 3, label: t.days.tuesday, short: lang === 'vi' ? 'Thứ 3' : 'Tue' },
    { num: 4, label: t.days.wednesday, short: lang === 'vi' ? 'Thứ 4' : 'Wed' },
    { num: 5, label: t.days.thursday, short: lang === 'vi' ? 'Thứ 5' : 'Thu' },
    { num: 6, label: t.days.friday, short: lang === 'vi' ? 'Thứ 6' : 'Fri' },
    { num: 7, label: t.days.saturday, short: lang === 'vi' ? 'Thứ 7' : 'Sat' },
    { num: 8, label: t.days.sunday, short: lang === 'vi' ? 'Chủ Nhật' : 'Sun' },
  ];

  // Calculate current week's dates (Monday to Sunday)
  const weekDays = useMemo(() => {
    const d = new Date();
    const day = d.getDay(); // 0 is Sunday, 1 is Monday...
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const monday = new Date(d);
    monday.setDate(d.getDate() + diffToMonday);

    return [2, 3, 4, 5, 6, 7, 8].map((dayNum, idx) => {
      const cur = new Date(monday);
      cur.setDate(monday.getDate() + idx);
      const y = cur.getFullYear();
      const m = String(cur.getMonth() + 1).padStart(2, '0');
      const dayOfMonth = String(cur.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${dayOfMonth}`;
      return {
        dayNum,
        date: cur,
        dateStr,
        displayDate: `${dayOfMonth}/${m}`,
      };
    });
  }, []);

  // Calculate month view calendar data
  const monthInfo = useMemo(() => {
    const year = currentMonthDate.getFullYear();
    const month = currentMonthDate.getMonth(); // 0-11
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const totalDays = lastDay.getDate();

    // Monday-based day of week for 1st day (Mon=1 ... Sun=7)
    const firstDayWeekday = firstDay.getDay() === 0 ? 7 : firstDay.getDay();

    // Previous month padding
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    const prevDays: { dayNum: number; dateStr: string; isCurrentMonth: boolean; dayOfWeek: number }[] = [];
    for (let i = firstDayWeekday - 1; i > 0; i--) {
      const d = prevMonthLastDay - i + 1;
      const prevDate = new Date(year, month - 1, d);
      const mStr = String(prevDate.getMonth() + 1).padStart(2, '0');
      const dStr = String(d).padStart(2, '0');
      const dow = prevDate.getDay() === 0 ? 8 : prevDate.getDay() + 1;
      prevDays.push({ dayNum: d, dateStr: `${prevDate.getFullYear()}-${mStr}-${dStr}`, isCurrentMonth: false, dayOfWeek: dow });
    }

    // Current month days
    const currentDays: { dayNum: number; dateStr: string; isCurrentMonth: boolean; dayOfWeek: number }[] = [];
    for (let d = 1; d <= totalDays; d++) {
      const curDate = new Date(year, month, d);
      const mStr = String(month + 1).padStart(2, '0');
      const dStr = String(d).padStart(2, '0');
      const dow = curDate.getDay() === 0 ? 8 : curDate.getDay() + 1;
      currentDays.push({ dayNum: d, dateStr: `${year}-${mStr}-${dStr}`, isCurrentMonth: true, dayOfWeek: dow });
    }

    // Next month padding to reach 35 or 42 cells
    const totalCells = prevDays.length + currentDays.length > 35 ? 42 : 35;
    const nextDaysCount = totalCells - (prevDays.length + currentDays.length);
    const nextDays: { dayNum: number; dateStr: string; isCurrentMonth: boolean; dayOfWeek: number }[] = [];
    for (let d = 1; d <= nextDaysCount; d++) {
      const nextDate = new Date(year, month + 1, d);
      const mStr = String(nextDate.getMonth() + 1).padStart(2, '0');
      const dStr = String(d).padStart(2, '0');
      const dow = nextDate.getDay() === 0 ? 8 : nextDate.getDay() + 1;
      nextDays.push({ dayNum: d, dateStr: `${nextDate.getFullYear()}-${mStr}-${dStr}`, isCurrentMonth: false, dayOfWeek: dow });
    }

    return {
      year,
      month,
      monthName: `${lang === 'vi' ? 'Tháng' : 'Month'} ${month + 1} / ${year}`,
      days: [...prevDays, ...currentDays, ...nextDays],
      currentMonthDaysCount: totalDays,
    };
  }, [currentMonthDate, lang]);

  // Selected class for tuition fee inspection
  const [selectedClassId, setSelectedClassId] = useState<string>('all');

  const selectedClass = useMemo(() => {
    if (selectedClassId === 'all') return null;
    return extraClasses.find((c) => c.id === selectedClassId) || null;
  }, [selectedClassId, extraClasses]);

  // Calculate tuition fees with absences deducted for the active view month
  const tuitionCalculation = useMemo(() => {
    const year = currentMonthDate.getFullYear();
    const month = currentMonthDate.getMonth(); // 0-11
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

    // Map each weekday (2..8) to all its dates in this month
    const weekdayDates: Record<number, string[]> = { 2: [], 3: [], 4: [], 5: [], 6: [], 7: [], 8: [] };
    for (let d = 1; d <= totalDaysInMonth; d++) {
      const cur = new Date(year, month, d);
      const dow = cur.getDay() === 0 ? 8 : cur.getDay() + 1;
      const mStr = String(month + 1).padStart(2, '0');
      const dStr = String(d).padStart(2, '0');
      weekdayDates[dow].push(`${year}-${mStr}-${dStr}`);
    }

    let baseFee = 0;
    let deductedAmount = 0;
    let absentSessionsCount = 0;

    const classesToCalculate = selectedClass ? [selectedClass] : extraClasses;

    classesToCalculate.forEach((cls) => {
      const sessionDates = weekdayDates[cls.dayOfWeek] || [];
      const sessionCount = sessionDates.length;

      let perSessionFee = 0;
      let clsNormalFee = 0;

      if (cls.feePeriod === 'session') {
        perSessionFee = cls.fee;
        clsNormalFee = cls.fee * (sessionCount || 4);
      } else {
        clsNormalFee = cls.fee;
        perSessionFee = Math.round(cls.fee / Math.max(sessionCount, 4));
      }

      baseFee += clsNormalFee;

      // Count absences in this month for this class
      sessionDates.forEach((dStr) => {
        const key = `${cls.id}_${dStr}`;
        if (absentSessionIds.includes(key)) {
          deductedAmount += perSessionFee;
          absentSessionsCount += 1;
        }
      });
    });

    const finalFee = Math.max(0, baseFee - deductedAmount);

    return {
      baseFee,
      deductedAmount,
      absentSessionsCount,
      finalFee,
    };
  }, [currentMonthDate, extraClasses, selectedClass, absentSessionIds]);

  const handleDelete = (item: ExtraClassItem) => {
    setItemToDelete(item);
  };

  const handleConfirmDelete = () => {
    if (!itemToDelete) return;
    onSaveExtraClasses(extraClasses.filter((i) => i.id !== itemToDelete.id));
    setItemToDelete(null);
  };

  const handleOpenAdd = (dayOfWeek?: number) => {
    setEditingItem({
      id: `extra-${Date.now()}`,
      title: '',
      subject: '',
      dayOfWeek: dayOfWeek || currentDayOfWeek,
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-gray-900 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-gray-200/90 border-b-2 border-b-gray-300/80 dark:border-gray-800 shadow-[0_3px_10px_-2px_rgba(15,23,42,0.08),0_1px_3px_rgba(15,23,42,0.05)]">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-gray-950 dark:text-white flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
            {t.extraClass.title}
          </h2>
          <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mt-0.5">
            {t.extraClass.subtitle}
          </p>
        </div>
      </div>

      {/* Monthly Tuition Summary Widget */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
        {/* Card 1: Danh sách học thêm (droplist) */}
        <div className="bg-white dark:bg-gray-900 p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border border-gray-200/90 border-b-2 border-b-gray-300/80 dark:border-gray-800 flex flex-col justify-between shadow-[0_3px_10px_-2px_rgba(15,23,42,0.08),0_1px_3px_rgba(15,23,42,0.05)] min-w-0">
          <div className="flex items-center justify-between gap-1 mb-1">
            <label htmlFor="extra-class-select" className="text-[11px] sm:text-xs text-gray-800 dark:text-gray-200 font-bold truncate">
              {lang === 'vi' ? 'Danh sách học thêm' : 'Tutoring Classes'}
            </label>
            <span className="text-[9px] sm:text-[10px] text-indigo-800 dark:text-indigo-300 font-extrabold bg-indigo-50 dark:bg-indigo-950/50 px-1.5 py-0.2 rounded-full border border-indigo-200 dark:border-indigo-900/40 shrink-0">
              {extraClasses.length} {lang === 'vi' ? 'lớp' : 'cls'}
            </span>
          </div>

          <div className="relative mt-0.5">
            <select
              id="extra-class-select"
              value={selectedClassId}
              onChange={(e) => {
                const newId = e.target.value;
                setSelectedClassId(newId);
                if (newId !== 'all') {
                  const targetCls = extraClasses.find((c) => c.id === newId);
                  if (targetCls) {
                    const colEl = dayColumnRefs.current[targetCls.dayOfWeek];
                    if (colEl) {
                      colEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                    }
                  }
                }
              }}
              className="w-full pl-2 sm:pl-2.5 pr-6 sm:pr-7 py-1.5 sm:py-2 text-[11px] sm:text-xs font-extrabold rounded-lg sm:rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800/80 text-gray-950 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer appearance-none truncate shadow-2xs"
            >
              <option value="all">
                {lang === 'vi' ? `Tất cả các lớp (${extraClasses.length} lớp)` : `All classes (${extraClasses.length})`}
              </option>
              {extraClasses.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.subject}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-gray-700 pointer-events-none absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        {/* Card 2: Học phí / tháng */}
        <div className="bg-white dark:bg-gray-900 p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border border-gray-200/90 border-b-2 border-b-gray-300/80 dark:border-gray-800 flex flex-col justify-between shadow-[0_3px_10px_-2px_rgba(15,23,42,0.08),0_1px_3px_rgba(15,23,42,0.05)] min-w-0">
          <div className="flex items-center justify-between gap-1 mb-1">
            <div className="text-[11px] sm:text-xs text-gray-800 dark:text-gray-200 font-bold truncate">
              {lang === 'vi' ? 'Học phí / tháng' : t.extraClass.totalMonthlyEstimate}
            </div>
            {selectedClass ? (
              <span className="text-[9px] sm:text-[10px] text-emerald-800 dark:text-emerald-300 font-extrabold bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.2 rounded-md border border-emerald-300 dark:border-emerald-800 truncate max-w-[80px] sm:max-w-[120px] shrink-0">
                {selectedClass.subject}
              </span>
            ) : (
              <span className="text-[9px] sm:text-[10px] font-semibold text-gray-700 dark:text-gray-300 shrink-0">
                {lang === 'vi' ? 'Tổng cộng' : 'Total'}
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-1.5 flex-wrap mt-0.5">
            <div className="text-sm sm:text-base md:text-lg font-extrabold text-emerald-700 dark:text-emerald-400 truncate">
              {tuitionCalculation.finalFee.toLocaleString('vi-VN')} ₫
            </div>
            {selectedClass && (
              <span className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 truncate">
                {selectedClass.feePeriod === 'session'
                  ? `(${selectedClass.fee.toLocaleString('vi-VN')} đ/buổi × 4)`
                  : `(cố định)`}
              </span>
            )}
          </div>
          {tuitionCalculation.absentSessionsCount > 0 && (
            <div className="mt-1 flex items-center gap-1 text-[10px] font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-200 dark:border-rose-900/40">
              <span className="truncate">
                {lang === 'vi'
                  ? `Đã trừ ${tuitionCalculation.absentSessionsCount} buổi nghỉ: -${tuitionCalculation.deductedAmount.toLocaleString('vi-VN')} ₫`
                  : `Deducted ${tuitionCalculation.absentSessionsCount} absences: -${tuitionCalculation.deductedAmount.toLocaleString('vi-VN')} ₫`}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Lịch học thêm container */}
      <div className="bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl border border-gray-200/90 border-b-2 border-b-gray-300/80 dark:border-gray-800 shadow-[0_3px_10px_-2px_rgba(15,23,42,0.08),0_1px_3px_rgba(15,23,42,0.05)] p-3.5 sm:p-4">
        {/* Action Header Bar */}
        <div className="flex items-center justify-between gap-2 mb-3 px-0.5 flex-wrap">
          <div className="flex items-center gap-2">
            {/* Clean Hôm nay button without icon */}
            <button
              onClick={() => {
                if (viewMode === 'month') {
                  setViewMode('week');
                }
                setTimeout(() => scrollToToday('smooth'), 50);
              }}
              className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#8c5e3c] text-white border border-[#70482d] hover:bg-[#7a5133] transition-all shadow-xs shrink-0 ring-2 ring-[#8c5e3c]/25 active:scale-95 cursor-pointer"
              title={lang === 'vi' ? 'Quay về hôm nay' : 'Go to today'}
            >
              {lang === 'vi' ? 'Hôm nay' : 'Today'}
            </button>

            {/* Nút Theo tháng (đã bỏ nút Theo tuần) */}
            <button
              type="button"
              onClick={() => setViewMode((prev) => (prev === 'month' ? 'week' : 'month'))}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'month'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs ring-2 ring-emerald-500/20'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-200/80 dark:hover:bg-gray-750'
              }`}
              title={lang === 'vi' ? (viewMode === 'month' ? 'Trở về lịch chính' : 'Xem lịch theo tháng') : (viewMode === 'month' ? 'Back to schedule' : 'View by month')}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>{lang === 'vi' ? 'Theo tháng' : 'By month'}</span>
            </button>
          </div>

          <button
            id="add-extra-class-btn"
            onClick={() => handleOpenAdd()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm shadow-emerald-500/20 transition-all active:scale-[0.98] shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t.extraClass.addClass}</span>
          </button>
        </div>

        {viewMode === 'week' ? (
          /* Chế độ Theo Tuần (cột) */
          <div className="overflow-x-auto pb-2 -mx-1 px-1 scroll-smooth">
            <div className="grid grid-cols-7 gap-2.5 sm:gap-3 min-w-[1470px]">
              {daysOfWeek.map((day) => {
                const isToday = day.num === currentDayOfWeek;
                const dayClasses = extraClasses
                  .filter((c) => c.dayOfWeek === day.num)
                  .sort((a, b) => a.timeStart.localeCompare(b.timeStart));
                const weekDayInfo = weekDays.find((w) => w.dayNum === day.num);
                const dayDateStr = weekDayInfo?.dateStr || '';

                return (
                  <div
                    key={day.num}
                    ref={(el) => {
                      dayColumnRefs.current[day.num] = el;
                    }}
                    id={`extra-day-col-${day.num}`}
                    className={`flex flex-col rounded-xl sm:rounded-2xl transition-all bg-white dark:bg-gray-900 border border-gray-200/95 border-b-2 border-b-gray-300/80 dark:border-gray-700/80 dark:border-b-gray-950/90 ${
                      isToday
                        ? 'shadow-[0_6px_18px_-3px_rgba(15,23,42,0.12),0_2px_6px_rgba(15,23,42,0.06)]'
                        : 'shadow-[0_4px_12px_-2px_rgba(15,23,42,0.08),0_1px_3px_rgba(15,23,42,0.05)]'
                    }`}
                  >
                    {/* Day Column Header */}
                    <div
                      className="p-2.5 sm:p-3 border-b border-gray-200/90 dark:border-gray-800 flex items-center justify-between gap-1.5 rounded-t-xl sm:rounded-t-2xl bg-white dark:bg-gray-900"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs sm:text-sm font-extrabold text-gray-950 dark:text-white truncate">
                            {day.short}
                          </span>
                          {weekDayInfo && (
                            <span className="text-[11px] text-gray-800 dark:text-gray-200 font-bold">
                              ({weekDayInfo.displayDate})
                            </span>
                          )}
                          {isToday && (
                            <span className="px-1.5 py-0.5 text-[9px] font-black uppercase rounded-full bg-emerald-600 text-white leading-none shrink-0 shadow-2xs">
                              {lang === 'vi' ? 'Nay' : 'Today'}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300 block truncate mt-0.5">
                          {dayClasses.length > 0
                            ? `${dayClasses.length} ${lang === 'vi' ? 'lớp' : 'cls'}`
                            : (lang === 'vi' ? 'Trống' : 'Free')}
                        </span>
                      </div>

                      <button
                        onClick={() => handleOpenAdd(day.num)}
                        title={lang === 'vi' ? `Thêm lớp cho ${day.short}` : `Add class for ${day.short}`}
                        className="w-7 h-7 rounded-lg bg-white dark:bg-gray-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-gray-200 border-b-2 border-b-gray-300/80 dark:border-gray-700 flex items-center justify-center transition-colors shrink-0 shadow-2xs cursor-pointer"
                      >
                        <Plus className="w-4 h-4 stroke-[2.5]" />
                      </button>
                    </div>

                    {/* Classes list inside this day column */}
                    <div className="p-2.5 space-y-2.5 flex-1 flex flex-col min-h-[160px] bg-white dark:bg-gray-900 rounded-b-xl sm:rounded-b-2xl">
                      {dayClasses.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-3 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-850/40 text-gray-800 dark:text-gray-200 text-xs font-bold">
                          <span>{t.extraClass.emptyDay}</span>
                          <button
                            onClick={() => handleOpenAdd(day.num)}
                            className="mt-2 px-3 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 text-xs text-emerald-800 dark:text-emerald-300 font-extrabold border border-emerald-200 dark:border-emerald-800 transition-colors cursor-pointer"
                          >
                            + {lang === 'vi' ? 'Thêm' : 'Add'}
                          </button>
                        </div>
                      ) : (
                        dayClasses.map((item) => {
                          const sessionKey = `${item.id}_${dayDateStr}`;
                          const isAbsent = absentSessionIds.includes(sessionKey);

                          return (
                            <div
                              key={item.id}
                              className={`rounded-xl p-2.5 sm:p-3 border transition-all group flex flex-col justify-between gap-1.5 ${
                                isAbsent
                                  ? 'border-rose-300 border-b-2 border-b-rose-400/70 dark:border-rose-800/70 bg-white dark:bg-rose-950/20 shadow-[0_3px_8px_-2px_rgba(225,29,72,0.1)]'
                                  : 'bg-white dark:bg-gray-800/95 border-gray-200/95 border-b-2 border-b-gray-300/80 dark:border-gray-700/80 dark:border-b-gray-950/90 shadow-[0_3px_10px_-2px_rgba(15,23,42,0.08),0_1px_3px_rgba(15,23,42,0.05)] hover:shadow-[0_6px_16px_-3px_rgba(15,23,42,0.12)] hover:-translate-y-0.5 hover:border-emerald-500 dark:hover:border-emerald-400'
                              }`}
                            >
                              {/* Subject Tag & Actions */}
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-950 dark:bg-emerald-950/80 dark:text-emerald-200 border border-emerald-300/80 dark:border-emerald-900/60 truncate max-w-[120px]">
                                  {item.subject}
                                </span>
                                <div className="flex items-center gap-0.5 opacity-95 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => {
                                      setEditingItem(item);
                                      setIsModalOpen(true);
                                    }}
                                    className="p-1 text-gray-700 dark:text-gray-300 hover:text-emerald-800 dark:hover:text-emerald-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                                    title={lang === 'vi' ? 'Sửa' : 'Edit'}
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDelete(item);
                                    }}
                                    className="p-1 text-gray-700 dark:text-gray-300 hover:text-rose-700 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                                    title={lang === 'vi' ? 'Xóa lớp học' : 'Delete'}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              {/* Class Title */}
                              <div className={`text-xs sm:text-[13px] font-extrabold leading-tight line-clamp-2 ${
                                isAbsent
                                  ? 'line-through text-gray-600 dark:text-gray-400 font-bold'
                                  : 'text-gray-950 dark:text-white'
                              }`}>
                                {item.title}
                              </div>

                              {/* Time */}
                              <div className="flex items-center gap-1 text-[11px] font-extrabold text-emerald-800 dark:text-emerald-300 whitespace-nowrap">
                                <Clock className="w-3.5 h-3.5 shrink-0" />
                                <span>
                                  {item.timeStart} - {item.timeEnd}
                                </span>
                              </div>


                              {/* Teacher & Location */}
                              <div className="space-y-0.5 text-[11px] font-semibold text-gray-900 dark:text-gray-100 border-t border-gray-200/80 dark:border-gray-800/80 pt-1.5">
                                {item.teacher && (
                                  <div className="flex items-center gap-1 truncate" title={item.teacher}>
                                    <User className="w-3 h-3 text-blue-700 dark:text-blue-400 shrink-0" />
                                    <span className="truncate">{item.teacher}</span>
                                  </div>
                                )}
                                {item.location && (
                                  <div className="flex items-center gap-1 truncate" title={item.location}>
                                    <MapPin className="w-3 h-3 text-rose-700 dark:text-rose-400 shrink-0" />
                                    <span className="truncate">{item.location}</span>
                                  </div>
                                )}
                              </div>

                              {/* Note pill if present */}
                              {item.note && (
                                <div
                                  className="text-[11px] font-semibold text-gray-900 dark:text-gray-100 bg-amber-50/80 dark:bg-gray-800/80 p-1.5 rounded-lg border border-amber-300/80 dark:border-gray-700 line-clamp-2"
                                  title={item.note}
                                >
                                  {item.note}
                                </div>
                              )}

                              {/* Absence toggle checkbox */}
                              <div className="pt-1.5 border-t border-gray-200/80 dark:border-gray-800">
                                <label
                                  onClick={(e) => e.stopPropagation()}
                                  className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-bold cursor-pointer select-none transition-colors ${
                                    isAbsent
                                      ? 'bg-rose-100 text-rose-900 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-300 dark:border-rose-900/40'
                                      : 'text-gray-900 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isAbsent}
                                    onChange={() => toggleAbsence(item.id, dayDateStr)}
                                    className="w-3.5 h-3.5 text-rose-600 rounded border-gray-400 focus:ring-rose-500 cursor-pointer"
                                  />
                                  <span className="truncate">
                                    {isAbsent
                                      ? (lang === 'vi' ? 'Nghỉ học (Đã trừ phí)' : 'Absent (Fee deducted)')
                                      : (lang === 'vi' ? 'Nghỉ học hôm nay' : 'Mark as absent')}
                                  </span>
                                </label>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Chế độ Theo Tháng */
          <div className="space-y-3">
            {/* Month Navigation Control */}
            <div className="flex items-center justify-between bg-gray-50/80 dark:bg-gray-850 p-2 sm:p-2.5 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-1 sm:gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                  className="p-1 sm:p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors cursor-pointer"
                  title={lang === 'vi' ? 'Tháng trước' : 'Previous month'}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white px-1">
                  {monthInfo.monthName}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
                  className="p-1 sm:p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors cursor-pointer"
                  title={lang === 'vi' ? 'Tháng sau' : 'Next month'}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] text-gray-500 dark:text-gray-400 hidden sm:inline">
                  {tuitionCalculation.absentSessionsCount > 0
                    ? (lang === 'vi' ? `Tháng này có ${tuitionCalculation.absentSessionsCount} buổi nghỉ` : `${tuitionCalculation.absentSessionsCount} absences this month`)
                    : (lang === 'vi' ? 'Chưa có buổi nghỉ nào' : 'No absences this month')}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentMonthDate(new Date())}
                  className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline px-2 py-1 rounded bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/30 cursor-pointer"
                >
                  {lang === 'vi' ? 'Về tháng này' : 'Current month'}
                </button>
              </div>
            </div>

            {/* Weekday Labels (7 columns) */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center">
              {daysOfWeek.map((d) => (
                <div
                  key={d.num}
                  className="text-[11px] sm:text-xs font-bold text-gray-600 dark:text-gray-300 py-1 bg-gray-100/70 dark:bg-gray-800 rounded-md"
                >
                  {d.short}
                </div>
              ))}
            </div>

            {/* Monthly Calendar Grid (7 columns) */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {monthInfo.days.map((cell, idx) => {
                const now = new Date();
                const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
                const isToday = cell.dateStr === todayStr;

                const cellClasses = extraClasses
                  .filter((c) => c.dayOfWeek === cell.dayOfWeek && (selectedClassId === 'all' || c.id === selectedClassId))
                  .sort((a, b) => a.timeStart.localeCompare(b.timeStart));

                return (
                  <div
                    key={`${cell.dateStr}-${idx}`}
                    className={`min-h-[100px] sm:min-h-[125px] p-1.5 sm:p-2 rounded-lg sm:rounded-xl border flex flex-col justify-between transition-colors ${
                      !cell.isCurrentMonth
                        ? 'bg-white/60 dark:bg-gray-900/40 border-gray-200 dark:border-gray-800/60 opacity-45'
                        : isToday
                        ? 'bg-white dark:bg-gray-900 border-gray-300 border-b-2 border-b-gray-400/80 dark:border-gray-700 shadow-[0_4px_12px_-2px_rgba(15,23,42,0.1)]'
                        : 'bg-white dark:bg-gray-900 border-gray-200/95 border-b-2 border-b-gray-300/75 dark:border-gray-800 shadow-[0_2px_6px_-1px_rgba(15,23,42,0.06)]'
                    }`}
                  >
                    {/* Date Cell Top */}
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`text-[11px] sm:text-xs font-extrabold leading-none ${
                          isToday
                            ? 'px-1.5 py-0.5 rounded-full bg-emerald-600 text-white'
                            : cell.isCurrentMonth
                            ? 'text-gray-950 dark:text-white'
                            : 'text-gray-500 dark:text-gray-600'
                        }`}
                      >
                        {cell.dayNum}
                      </span>

                      {cell.isCurrentMonth && (
                        <button
                          type="button"
                          onClick={() => handleOpenAdd(cell.dayOfWeek)}
                          title={lang === 'vi' ? 'Thêm lớp' : 'Add class'}
                          className="w-4 h-4 rounded text-gray-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 flex items-center justify-center opacity-80 hover:opacity-100 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    {/* Classes in this date */}
                    <div className="flex-1 space-y-1 overflow-y-auto max-h-[160px]">
                      {cellClasses.map((cls) => {
                        const sessionKey = `${cls.id}_${cell.dateStr}`;
                        const isAbsent = absentSessionIds.includes(sessionKey);

                        return (
                          <div
                            key={sessionKey}
                            className={`p-1 sm:p-1.5 rounded-md border text-left transition-all shadow-2xs ${
                              isAbsent
                                ? 'bg-rose-50/90 dark:bg-rose-950/60 border-rose-300 dark:border-rose-900/60 text-gray-600'
                                : 'bg-white dark:bg-gray-800/70 border-gray-200/90 border-b-gray-300/75 dark:border-gray-700/60 hover:border-emerald-500 dark:hover:border-emerald-600'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1 leading-tight">
                              <span className="text-[10px] font-extrabold text-emerald-800 dark:text-emerald-300 truncate">
                                {cls.subject}
                              </span>
                              <span className="text-[9px] text-gray-700 dark:text-gray-300 shrink-0 font-bold">
                                {cls.timeStart}
                              </span>
                            </div>

                            <div className={`text-[10px] truncate mt-0.5 ${
                              isAbsent ? 'line-through text-gray-500 dark:text-gray-500 font-medium' : 'text-gray-950 dark:text-white font-bold'
                            }`}>
                              {cls.title}
                            </div>

                            {/* Absence toggle in month cell */}
                            <label
                              onClick={(e) => e.stopPropagation()}
                              className={`mt-1 flex items-center gap-1 text-[9px] font-bold cursor-pointer select-none ${
                                isAbsent
                                  ? 'text-rose-700 dark:text-rose-400 font-extrabold'
                                  : 'text-gray-700 dark:text-gray-300 hover:text-gray-950 dark:hover:text-white'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isAbsent}
                                onChange={() => toggleAbsence(cls.id, cell.dateStr)}
                                className="w-3 h-3 text-rose-600 rounded border-gray-300 focus:ring-rose-500 cursor-pointer"
                              />
                              <span className="truncate">
                                {isAbsent
                                  ? (lang === 'vi' ? 'Nghỉ (Đã trừ)' : 'Absent (Deducted)')
                                  : (lang === 'vi' ? 'Báo nghỉ' : 'Absent')}
                              </span>
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

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
                    <label className="block text-[11px] sm:text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 leading-tight flex items-center justify-between">
                      <span>{t.periods.subject} <span className="text-rose-500">*</span></span>
                      <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-normal">Chọn từ danh mục</span>
                    </label>
                    <SubjectCombobox
                      required
                      value={editingItem.subject}
                      subjects={subjects}
                      onChange={(name, selectedSub) => {
                        setEditingItem({
                          ...editingItem,
                          subject: name,
                          teacher: selectedSub?.teacher || editingItem.teacher,
                        });
                      }}
                      placeholder="Toán, Tiếng Anh..."
                      className="w-full pl-2.5 pr-9 py-1.5 sm:py-2 text-xs sm:text-[13px] rounded-lg sm:rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-indigo-500"
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
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all active:scale-[0.98]"
                >
                  {t.common.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <div
          data-app-modal="true"
          {...modalTouchHandlers}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setItemToDelete(null)}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-2xl max-w-sm w-full p-5 border border-gray-200 dark:border-gray-800 shadow-2xl relative animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-200 dark:border-rose-900/50">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  {lang === 'vi' ? 'Xác nhận xóa lớp học thêm?' : 'Delete Extra Class?'}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {lang === 'vi' ? 'Hành động này không thể hoàn tác' : 'This action cannot be undone'}
                </p>
              </div>
            </div>

            <div className="p-3 my-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 text-xs space-y-1">
              <div className="font-bold text-gray-900 dark:text-white text-sm truncate">
                {itemToDelete.title}
              </div>
              <div className="text-gray-600 dark:text-gray-400 flex items-center gap-1.5 flex-wrap">
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                  {itemToDelete.subject}
                </span>
                <span>•</span>
                <span>
                  {daysOfWeek.find((d) => d.num === itemToDelete.dayOfWeek)?.label || `Thứ ${itemToDelete.dayOfWeek}`}
                </span>
                <span>•</span>
                <span>{itemToDelete.timeStart} - {itemToDelete.timeEnd}</span>
              </div>
              {(itemToDelete.teacher || itemToDelete.location) && (
                <div className="text-gray-500 dark:text-gray-400 text-[11px] truncate pt-0.5">
                  {itemToDelete.teacher && `GV: ${itemToDelete.teacher}`}
                  {itemToDelete.teacher && itemToDelete.location && ' • '}
                  {itemToDelete.location && itemToDelete.location}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
              >
                {t.common.cancel}
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors cursor-pointer active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{lang === 'vi' ? 'Xác nhận xóa' : 'Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
