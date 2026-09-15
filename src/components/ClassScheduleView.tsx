import React, { useState, useRef, useEffect } from 'react';
import {
  Calendar,
  Plus,
  Edit2,
  Trash2,
  Clock,
  MapPin,
  UserCheck,
  Sparkles,
  Sun,
  Sunset,
  Printer,
  Download,
  Copy,
  Check,
  FileText,
  X,
  FileDown,
  Loader2,
} from 'lucide-react';
import html2canvas from 'html2canvas-pro';
import jsPDF from 'jspdf';
import { StorageService } from '../services/storage';
import { ClassScheduleItem, Language } from '../types';
import { translations } from '../i18n/translations';
import { useSwipeToCloseModal } from '../hooks/useSwipeToCloseModal';

interface ClassScheduleViewProps {
  schedule: ClassScheduleItem[];
  onSaveSchedule: (items: ClassScheduleItem[]) => void;
  lang: Language;
}

// Gentle pastel palette variants for periods
const pastelPeriodVariants = [
  {
    bg: 'bg-[#faf6f0] dark:bg-[#251e18]/80',
    border: 'border-[#ebdcd0] dark:border-[#3f3024]',
    badgeBg: 'bg-[#ebdcd0] dark:bg-[#3a2c20]',
    badgeText: 'text-[#5b3823] dark:text-[#f8ede3]',
    badgeLabel: 'text-[#8b6852] dark:text-[#c4ae9d]',
  },
  {
    bg: 'bg-[#f3f7f4] dark:bg-[#1a241e]/80',
    border: 'border-[#dbe6dc] dark:border-[#2a3a2e]',
    badgeBg: 'bg-[#dce9de] dark:bg-[#253629]',
    badgeText: 'text-[#2c5339] dark:text-[#d1ecd7]',
    badgeLabel: 'text-[#4d755a] dark:text-[#9fc7ab]',
  },
  {
    bg: 'bg-[#f2f6fa] dark:bg-[#182129]/80',
    border: 'border-[#d5e3ed] dark:border-[#273542]',
    badgeBg: 'bg-[#d8e7f2] dark:bg-[#233240]',
    badgeText: 'text-[#264c6b] dark:text-[#cbe4f7]',
    badgeLabel: 'text-[#496f91] dark:text-[#9bc2e3]',
  },
  {
    bg: 'bg-[#f7f4fa] dark:bg-[#221c29]/80',
    border: 'border-[#e6deef] dark:border-[#342742]',
    badgeBg: 'bg-[#eadff5] dark:bg-[#2f223f]',
    badgeText: 'text-[#4f316b] dark:text-[#e4d1f7]',
    badgeLabel: 'text-[#745094] dark:text-[#c09de5]',
  },
  {
    bg: 'bg-[#faf4f2] dark:bg-[#291d1c]/80',
    border: 'border-[#eedbda] dark:border-[#422928]',
    badgeBg: 'bg-[#f6dfdc] dark:bg-[#3a2322]',
    badgeText: 'text-[#6b3531] dark:text-[#f7d3cf]',
    badgeLabel: 'text-[#93544f] dark:text-[#e5a09b]',
  },
];

const getPeriodVariant = (period: number) => {
  const index = Math.abs(period - 1) % pastelPeriodVariants.length;
  return pastelPeriodVariants[index];
};

export const ClassScheduleView: React.FC<ClassScheduleViewProps> = ({
  schedule,
  onSaveSchedule,
  lang,
}) => {
  const t = translations[lang];
  const [selectedDay, setSelectedDay] = useState<number>(2); // Default Monday (2)
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [editingItem, setEditingItem] = useState<ClassScheduleItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ClassScheduleItem | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printScope, setPrintScope] = useState<'day' | 'week'>('day');
  const [copied, setCopied] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [pdfSuccess, setPdfSuccess] = useState(false);
  const printScheduleRef = useRef<HTMLDivElement>(null);

  // Student profile for report header
  const studentProfile = StorageService.getStudentProfile();

  // Export timetable directly as a high-quality .pdf file
  const handleExportPdf = async () => {
    if (!printScheduleRef.current) return;
    setIsExportingPdf(true);
    setPdfSuccess(false);

    try {
      const element = printScheduleRef.current;
      const isLandscape = printScope === 'week';

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: isLandscape ? 'landscape' : 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgProps = pdf.getImageProperties(imgData);
      const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

      if (imgHeight <= pdfHeight) {
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeight);
      } else {
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfHeight;

        while (heightLeft > 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
          heightLeft -= pdfHeight;
        }
      }

      const daySuffix = printScope === 'day' ? `Thu_${selectedDay}` : 'Toan_tuan';
      pdf.save(`Thoi-khoa-bieu-${daySuffix}.pdf`);

      setPdfSuccess(true);
      setTimeout(() => setPdfSuccess(false), 3000);
    } catch (err) {
      console.error('Error exporting PDF:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Swipe-to-close on mobile/tablet for all modals in ClassScheduleView
  const { modalTouchHandlers } = useSwipeToCloseModal({
    isOpen: isModalOpen || isPrintModalOpen || !!itemToDelete,
    onClose: () => {
      setIsModalOpen(false);
      setIsPrintModalOpen(false);
      setItemToDelete(null);
    },
  });

  // Gesture and smooth scroll refs
  const dayPillsRef = useRef<HTMLDivElement>(null);
  const selectedPillRef = useRef<HTMLButtonElement>(null);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);

  const daysOfWeek = [
    { num: 2, label: t.days.monday, short: t.days.shortMon },
    { num: 3, label: t.days.tuesday, short: t.days.shortTue },
    { num: 4, label: t.days.wednesday, short: t.days.shortWed },
    { num: 5, label: t.days.thursday, short: t.days.shortThu },
    { num: 6, label: t.days.friday, short: t.days.shortFri },
    { num: 7, label: t.days.saturday, short: t.days.shortSat },
    { num: 8, label: t.days.sunday, short: t.days.shortSun },
  ];

  // Auto-scroll selected day pill into center view
  useEffect(() => {
    if (selectedPillRef.current) {
      selectedPillRef.current.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      });
    }
  }, [selectedDay]);

  const goToNextDay = () => {
    const currentIndex = daysOfWeek.findIndex((d) => d.num === selectedDay);
    if (currentIndex < daysOfWeek.length - 1) {
      setSelectedDay(daysOfWeek[currentIndex + 1].num);
    } else {
      setSelectedDay(daysOfWeek[0].num);
    }
  };

  const goToPrevDay = () => {
    const currentIndex = daysOfWeek.findIndex((d) => d.num === selectedDay);
    if (currentIndex > 0) {
      setSelectedDay(daysOfWeek[currentIndex - 1].num);
    } else {
      setSelectedDay(daysOfWeek[daysOfWeek.length - 1].num);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null || touchStartY === null) return;
    const diffX = e.changedTouches[0].clientX - touchStartX;
    const diffY = e.changedTouches[0].clientY - touchStartY;

    // Detect horizontal swipe gesture (at least 35px drag and predominantly horizontal)
    if (Math.abs(diffX) > 35 && Math.abs(diffX) > Math.abs(diffY) * 1.2) {
      if (diffX < 0) {
        goToNextDay();
      } else {
        goToPrevDay();
      }
    }
    setTouchStartX(null);
    setTouchStartY(null);
  };

  // Get today's day number (Monday = 2 ... Sunday = 8)
  const todayDayNum = (() => {
    const d = new Date().getDay();
    return d === 0 ? 8 : d + 1;
  })();

  const currentDayItems = schedule
    .filter((item) => item.dayOfWeek === selectedDay)
    .sort((a, b) => a.period - b.period);

  const morningItems = currentDayItems.filter((i) => i.session === 'morning');
  const afternoonItems = currentDayItems.filter((i) => i.session === 'afternoon');

  const handleDelete = (item: ClassScheduleItem) => {
    setItemToDelete(item);
  };

  const handleOpenAdd = () => {
    setEditingItem({
      id: `tkb-${Date.now()}`,
      dayOfWeek: selectedDay,
      period: 1,
      session: 'morning',
      timeStart: '07:15',
      timeEnd: '08:00',
      subject: '',
      room: 'Phòng 302',
      teacher: '',
      color: '#3B82F6',
      note: '',
    });
    setIsModalOpen(true);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editingItem.subject.trim()) return;

    const exists = schedule.some((i) => i.id === editingItem.id);
    if (exists) {
      onSaveSchedule(schedule.map((i) => (i.id === editingItem.id ? editingItem : i)));
    } else {
      onSaveSchedule([...schedule, editingItem]);
    }
    setIsModalOpen(false);
    setEditingItem(null);
  };

  return (
    <div className="space-y-3.5 sm:space-y-4">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-gray-900 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#5b3823] dark:text-[#d7b89f]" />
            {t.tabs.timetable}
          </h2>
        </div>

        <div className="flex items-center justify-between sm:justify-start gap-2 shrink-0">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-[#f7efe7] dark:bg-gray-800 p-0.5 rounded-xl border border-[#e8ded5] dark:border-gray-700 text-xs font-semibold shrink-0">
            <button
              onClick={() => setViewMode('day')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                viewMode === 'day'
                  ? 'bg-[#b89278] text-white shadow-xs'
                  : 'text-[#6e503e] hover:text-[#2c1810] dark:text-gray-400'
              }`}
            >
              {lang === 'vi' ? 'Theo Ngày' : 'By Day'}
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                viewMode === 'week'
                  ? 'bg-[#b89278] text-white shadow-xs'
                  : 'text-[#6e503e] hover:text-[#2c1810] dark:text-gray-400'
              }`}
            >
              {lang === 'vi' ? 'Toàn Tuần' : 'Full Week'}
            </button>
          </div>

          {/* Add Class Button */}
          <button
            id="add-class-period-btn"
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-semibold bg-[#b89278] text-white hover:bg-[#a68066] shadow-sm shadow-[#b89278]/20 transition-all active:scale-[0.98] shrink-0 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>{lang === 'vi' ? 'Thêm' : 'Add'}</span>
          </button>
        </div>
      </div>

      {/* Day Selector Bar with Horizontal Scroll and Navigation Arrows */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between px-0.5">
          {/* Left: Hôm nay button (Highlighted for student awareness) */}
          <button
            type="button"
            onClick={() => setSelectedDay(todayDayNum)}
            title={lang === 'vi' ? 'Chuyển nhanh về hôm nay' : 'Go to today'}
            className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border transition-all active:scale-95 shadow-xs ${
              selectedDay === todayDayNum
                ? 'bg-[#8c5e3c] text-white border-[#70482d] shadow-sm ring-2 ring-[#8c5e3c]/30'
                : 'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/60 dark:to-orange-950/50 text-amber-900 dark:text-amber-200 border-amber-400 dark:border-amber-600 hover:bg-amber-100 dark:hover:bg-amber-900/60 ring-2 ring-amber-400/25'
            }`}
          >
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  selectedDay === todayDayNum ? 'bg-amber-200' : 'bg-amber-500'
                }`}
              ></span>
            </span>
            <span>{lang === 'vi' ? 'Hôm nay' : 'Today'}</span>
          </button>

          {/* Right: Xuất PDF button */}
          <button
            type="button"
            onClick={() => {
              setPrintScope(viewMode === 'week' ? 'week' : 'day');
              setIsPrintModalOpen(true);
            }}
            title={lang === 'vi' ? 'Xuất Thời khóa biểu dạng file .pdf' : 'Export timetable as .pdf file'}
            className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border bg-white dark:bg-gray-800 text-[#5b3823] dark:text-gray-300 border-[#ebdcd0] dark:border-gray-700 hover:bg-[#f5ebe1] dark:hover:bg-gray-700 transition-all active:scale-95 shadow-2xs"
          >
            <FileDown className="w-3.5 h-3.5 text-[#8b6852] dark:text-[#c4ae9d]" />
            <span>{lang === 'vi' ? 'Xuất PDF' : 'Export PDF'}</span>
          </button>
        </div>

        {/* Horizontal Scrollable Day Pills */}
        <div
          ref={dayPillsRef}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="w-full flex items-center gap-1.5 sm:gap-2 overflow-x-auto py-1 px-0.5 scroll-smooth touch-pan-x scrollbar-thin"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {daysOfWeek.map((day) => {
            const isSelected = selectedDay === day.num;
            const isToday = day.num === todayDayNum;

            return (
              <button
                key={day.num}
                ref={isSelected ? selectedPillRef : null}
                onClick={() => setSelectedDay(day.num)}
                className={`flex flex-col items-center justify-center min-w-[52px] sm:min-w-[60px] px-3 py-2 rounded-xl font-bold transition-all border shrink-0 relative ${
                  isSelected
                    ? 'bg-[#b89278] text-white border-[#a88268] shadow-xs scale-[1.02]'
                    : 'bg-[#fdfaf7] dark:bg-gray-800 text-[#4a3528] dark:text-gray-200 border-[#ebdcd0] dark:border-gray-700 hover:bg-[#f7ede3] hover:border-[#dfc8b7]'
                }`}
              >
                {isToday && (
                  <span className="absolute -top-1.5 right-1 px-1.5 py-0.5 bg-amber-500 text-[8px] font-black text-white rounded-full leading-none ring-1.5 ring-white dark:ring-gray-900 shadow-2xs">
                    {lang === 'vi' ? 'Nay' : 'Today'}
                  </span>
                )}
                <span className={`text-xs sm:text-sm font-bold leading-tight ${isSelected ? 'text-white' : 'text-[#2c1810] dark:text-[#f8ede3]'}`}>
                  {day.short}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* View Content */}
      {viewMode === 'day' ? (
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5"
        >
          {/* Morning Session */}
          <div className="bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-gray-200 dark:border-gray-800 shadow-xs">
            <div className="flex items-center gap-2 pb-3.5 border-b border-gray-100 dark:border-gray-800 text-amber-600 dark:text-amber-400 font-bold text-sm">
              <Sun className="w-5 h-5" />
              <span>{t.periods.morning}</span>
            </div>

            <div className="space-y-2 sm:space-y-2.5 mt-3">
              {morningItems.length === 0 ? (
                <div className="py-8 text-center text-xs text-gray-400 dark:text-gray-500">
                  {t.periods.noClass}
                </div>
              ) : (
                morningItems.map((item) => {
                  const variant = getPeriodVariant(item.period);
                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        setEditingItem({ ...item });
                        setIsModalOpen(true);
                      }}
                      className={`p-3 sm:p-3.5 rounded-xl sm:rounded-2xl border ${variant.bg} ${variant.border} shadow-2xs flex items-start justify-between gap-3 group transition-all hover:shadow-xs hover:border-[#b89278]/60 cursor-pointer`}
                      title={lang === 'vi' ? 'Nhấn để chỉnh sửa tiết học này' : 'Click to edit this period'}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-9 h-9 rounded-xl ${variant.badgeBg} ${variant.badgeText} font-extrabold flex flex-col items-center justify-center shrink-0 border border-black/5 dark:border-white/5 shadow-2xs`}>
                          <span className={`text-[9px] uppercase font-bold leading-none ${variant.badgeLabel}`}>Tiết</span>
                          <span className="text-sm leading-none mt-0.5 font-black">{item.period}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                              {item.subject}
                            </h4>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400 mt-1 flex-wrap">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 opacity-70" />
                              {item.timeStart} - {item.timeEnd}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 opacity-70" />
                              {item.room}
                            </span>
                            <span className="flex items-center gap-1">
                              <UserCheck className="w-3.5 h-3.5 opacity-70" />
                              {item.teacher}
                            </span>
                          </div>
                          {item.note && (
                            <div className="mt-1.5 text-xs text-amber-800 dark:text-amber-200/90 bg-amber-50/80 dark:bg-amber-950/40 px-2.5 py-1 rounded-lg border border-amber-200/60 dark:border-amber-900/40">
                              {item.note}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingItem({ ...item });
                            setIsModalOpen(true);
                          }}
                          className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-lg hover:bg-white/80 dark:hover:bg-gray-800/80 transition-colors"
                          title={lang === 'vi' ? 'Chỉnh sửa tiết học' : 'Edit period'}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(item);
                          }}
                          className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50/80 dark:hover:bg-rose-950/40 transition-colors"
                          title={lang === 'vi' ? 'Xóa tiết học' : 'Delete period'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Afternoon Session */}
          <div className="bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-gray-200 dark:border-gray-800 shadow-xs">
            <div className="flex items-center gap-2 pb-3.5 border-b border-gray-100 dark:border-gray-800 text-indigo-600 dark:text-indigo-400 font-bold text-sm">
              <Sunset className="w-5 h-5" />
              <span>{t.periods.afternoon}</span>
            </div>

            <div className="space-y-2 sm:space-y-2.5 mt-3">
              {afternoonItems.length === 0 ? (
                <div className="py-8 text-center text-xs text-gray-400 dark:text-gray-500">
                  {t.periods.noClass}
                </div>
              ) : (
                afternoonItems.map((item) => {
                  const variant = getPeriodVariant(item.period);
                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        setEditingItem({ ...item });
                        setIsModalOpen(true);
                      }}
                      className={`p-3 sm:p-3.5 rounded-xl sm:rounded-2xl border ${variant.bg} ${variant.border} shadow-2xs flex items-start justify-between gap-3 group transition-all hover:shadow-xs hover:border-[#b89278]/60 cursor-pointer`}
                      title={lang === 'vi' ? 'Nhấn để chỉnh sửa tiết học này' : 'Click to edit this period'}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-9 h-9 rounded-xl ${variant.badgeBg} ${variant.badgeText} font-extrabold flex flex-col items-center justify-center shrink-0 border border-black/5 dark:border-white/5 shadow-2xs`}>
                          <span className={`text-[9px] uppercase font-bold leading-none ${variant.badgeLabel}`}>Tiết</span>
                          <span className="text-sm leading-none mt-0.5 font-black">{item.period}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                              {item.subject}
                            </h4>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400 mt-1 flex-wrap">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 opacity-70" />
                              {item.timeStart} - {item.timeEnd}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 opacity-70" />
                              {item.room}
                            </span>
                            <span className="flex items-center gap-1">
                              <UserCheck className="w-3.5 h-3.5 opacity-70" />
                              {item.teacher}
                            </span>
                          </div>
                          {item.note && (
                            <div className="mt-1.5 text-xs text-amber-800 dark:text-amber-200/90 bg-amber-50/80 dark:bg-amber-950/40 px-2.5 py-1 rounded-lg border border-amber-200/60 dark:border-amber-900/40">
                              {item.note}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingItem({ ...item });
                            setIsModalOpen(true);
                          }}
                          className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-lg hover:bg-white/80 dark:hover:bg-gray-800/80 transition-colors"
                          title={lang === 'vi' ? 'Chỉnh sửa tiết học' : 'Edit period'}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(item);
                          }}
                          className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50/80 dark:hover:bg-rose-950/40 transition-colors"
                          title={lang === 'vi' ? 'Xóa tiết học' : 'Delete period'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Full Week Grid View */
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-3 sm:p-4 border border-[#eee5dc] dark:border-gray-800 shadow-xs overflow-x-auto scrollbar-thin">
          <table className="w-full min-w-[640px] text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#ebdcd0] dark:border-gray-800 bg-[#fdfaf7]/80 dark:bg-gray-800/60">
                <th className="py-2.5 px-2 text-center text-xs font-bold text-[#8b6852] dark:text-[#cbab95] uppercase tracking-wider w-16 sm:w-20 min-w-[60px] border-r border-[#ebdcd0] dark:border-gray-800">
                  Tiết
                </th>
                {daysOfWeek.map((d, index) => {
                  const isToday = d.num === todayDayNum;
                  return (
                    <th
                      key={d.num}
                      className={`py-2 px-1 text-center w-[105px] sm:w-[125px] md:w-[135px] min-w-[100px] max-w-[140px] ${
                        index < daysOfWeek.length - 1 ? 'border-r border-[#ebdcd0] dark:border-gray-800' : ''
                      }`}
                    >
                      <div
                        className={`inline-flex items-center justify-center px-2.5 py-1 rounded-xl text-xs font-bold transition-colors ${
                          isToday
                            ? 'bg-[#b89278] text-white shadow-2xs'
                            : 'bg-[#fdfaf7] dark:bg-gray-800/80 border border-[#ebdcd0] dark:border-gray-700 text-[#2c1810] dark:text-[#f8ede3]'
                        }`}
                      >
                        <span>{d.short}</span>
                        {isToday && <span className="ml-1 w-1.5 h-1.5 rounded-full bg-amber-300 inline-block" />}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ebdcd0]/70 dark:divide-gray-800">
              {Array.from(
                { length: Math.min(10, Math.max(7, Math.max(0, ...schedule.map((s) => s.period)))) },
                (_, i) => i + 1
              ).map((period) => (
                <tr key={period} className="hover:bg-[#fbf7f2]/40 dark:hover:bg-gray-800/20 transition-colors">
                  <td className="py-2 px-1 text-center border-r border-[#ebdcd0] dark:border-gray-800 bg-[#fdfaf7]/40 dark:bg-gray-800/30 align-middle">
                    <div className="inline-flex items-center justify-center font-bold text-[11px] text-[#6e503e] dark:text-[#cbab95] bg-[#fbf7f2] dark:bg-gray-800/50 rounded-md px-1.5 py-0.5 border border-[#ebdcd0]/60 dark:border-gray-700 whitespace-nowrap">
                      Tiết {period}
                    </div>
                  </td>
                  {daysOfWeek.map((d, index) => {
                    const match = schedule.find(
                      (item) => item.dayOfWeek === d.num && item.period === period
                    );
                    const isLast = index === daysOfWeek.length - 1;
                    return (
                      <td
                        key={d.num}
                        className={`py-1.5 px-1.5 text-center align-middle w-[105px] sm:w-[125px] md:w-[135px] min-w-[100px] max-w-[140px] ${
                          !isLast ? 'border-r border-[#ebdcd0] dark:border-gray-800' : ''
                        }`}
                      >
                        {match ? (
                          <button
                            onClick={() => {
                              setEditingItem(match);
                              setIsModalOpen(true);
                            }}
                            className="w-full p-2 rounded-lg sm:rounded-xl bg-[#fdfaf7] dark:bg-[#2c1e17]/60 border border-[#ebdcd0] dark:border-gray-700/80 hover:border-[#cbab95] hover:bg-[#f5ebe1] dark:hover:bg-[#34231b] text-left transition-all group shadow-2xs cursor-pointer block"
                            title={`${match.subject} (${match.room})`}
                          >
                            <div className="font-bold text-[11px] sm:text-xs text-[#2c1810] dark:text-[#f8ede3] group-hover:text-[#5b3823] dark:group-hover:text-white line-clamp-2 leading-tight">
                              {match.subject}
                            </div>
                            <div className="text-[10px] font-medium text-[#8b6852] dark:text-[#c4ae9d] mt-0.5 truncate">
                              {match.room || (lang === 'vi' ? 'Lớp học' : 'Classroom')}
                            </div>
                          </button>
                        ) : (
                          <div className="h-7 flex items-center justify-center">
                            <span className="text-[#e2d5c8] dark:text-gray-700 font-light text-xs">-</span>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
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
                  {editingItem.id && schedule.some((i) => i.id === editingItem.id)
                    ? t.periods.editClass
                    : t.periods.addClass}
                </h3>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                  {lang === 'vi' ? 'Thiết lập môn học, thời gian và phòng học' : 'Set up subject, schedule and classroom'}
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
                    {t.periods.subject} *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingItem.subject}
                    onChange={(e) => setEditingItem({ ...editingItem, subject: e.target.value })}
                    placeholder="Toán học, Vật lý, Ngữ văn..."
                    className="w-full px-3 py-2 text-xs sm:text-[13px] rounded-xl border border-[#ebdcd0] dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-xs sm:placeholder:text-[12px] placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-[#b89278] focus:border-[#b89278] outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Ngày trong tuần
                    </label>
                    <select
                      value={editingItem.dayOfWeek}
                      onChange={(e) => setEditingItem({ ...editingItem, dayOfWeek: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-xs sm:text-[13px] rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#b89278]"
                    >
                      {daysOfWeek.map((d) => (
                        <option key={d.num} value={d.num}>
                          {d.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Tiết số
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={editingItem.period}
                      onChange={(e) => {
                        const p = Number(e.target.value);
                        setEditingItem({
                          ...editingItem,
                          period: p,
                          session: p <= 5 ? 'morning' : 'afternoon',
                        });
                      }}
                      className="w-full px-3 py-2 text-xs sm:text-[13px] rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#b89278]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Bắt đầu
                    </label>
                    <input
                      type="time"
                      value={editingItem.timeStart}
                      onChange={(e) => setEditingItem({ ...editingItem, timeStart: e.target.value })}
                      className="w-full px-3 py-2 text-xs sm:text-[13px] rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#b89278]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Kết thúc
                    </label>
                    <input
                      type="time"
                      value={editingItem.timeEnd}
                      onChange={(e) => setEditingItem({ ...editingItem, timeEnd: e.target.value })}
                      className="w-full px-3 py-2 text-xs sm:text-[13px] rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#b89278]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      {t.periods.room}
                    </label>
                    <input
                      type="text"
                      value={editingItem.room}
                      onChange={(e) => setEditingItem({ ...editingItem, room: e.target.value })}
                      placeholder="Phòng 302"
                      className="w-full px-3 py-2 text-xs sm:text-[13px] rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-xs sm:placeholder:text-[12px] placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-[#b89278]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      {t.periods.teacher}
                    </label>
                    <input
                      type="text"
                      value={editingItem.teacher}
                      onChange={(e) => setEditingItem({ ...editingItem, teacher: e.target.value })}
                      placeholder="Thầy Huy, Cô Lan..."
                      className="w-full px-3 py-2 text-xs sm:text-[13px] rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-xs sm:placeholder:text-[12px] placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-[#b89278]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    {t.common.notes}
                  </label>
                  <textarea
                    rows={2}
                    value={editingItem.note || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, note: e.target.value })}
                    placeholder="Ghi chú mang dụng cụ, kiểm tra..."
                    className="w-full px-3 py-2 text-xs sm:text-[13px] rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-xs sm:placeholder:text-[12px] placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-[#b89278]"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between gap-2 px-4 sm:px-6 py-3 sm:py-3.5 border-t border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-850 shrink-0">
                {editingItem && schedule.some((i) => i.id === editingItem.id) ? (
                  <button
                    type="button"
                    onClick={() => {
                      const toDelete = editingItem;
                      setIsModalOpen(false);
                      setItemToDelete(toDelete);
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{lang === 'vi' ? 'Xóa tiết này' : 'Delete'}</span>
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    {t.common.cancel}
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#b89278] hover:bg-[#a68066] text-white shadow-xs transition-colors"
                  >
                    {t.common.save}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation In-App Modal */}
      {itemToDelete && (
        <div
          data-app-modal="true"
          {...modalTouchHandlers}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl p-5 sm:p-6 shadow-2xl border border-gray-200 dark:border-gray-800 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">
                  {lang === 'vi' ? 'Xác nhận xóa tiết học?' : 'Delete Class Period?'}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {lang === 'vi' ? 'Hành động này không thể hoàn tác' : 'This action cannot be undone'}
                </p>
              </div>
            </div>

            <div className="p-3 my-3.5 rounded-xl bg-[#faf6f0] dark:bg-gray-800/60 border border-[#ebdcd0] dark:border-gray-700 text-xs space-y-1">
              <div className="font-bold text-[#5b3823] dark:text-[#f8ede3] text-sm">
                {itemToDelete.subject}
              </div>
              <div className="text-gray-600 dark:text-gray-400">
                Tiết {itemToDelete.period} ({itemToDelete.timeStart} - {itemToDelete.timeEnd})
                {itemToDelete.room && ` • ${itemToDelete.room}`}
                {itemToDelete.teacher && ` • ${itemToDelete.teacher}`}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                {t.common.cancel}
              </button>
              <button
                type="button"
                onClick={() => {
                  const id = itemToDelete.id;
                  onSaveSchedule(schedule.filter((i) => i.id !== id));
                  setItemToDelete(null);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{lang === 'vi' ? 'Xác nhận xóa' : 'Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print & Export Report Modal */}
      {isPrintModalOpen && (
        <div
          data-app-modal="true"
          {...modalTouchHandlers}
          className="fixed inset-0 z-50 flex items-center justify-center p-0 lg:p-4 bg-black/60 backdrop-blur-xs"
        >
          <div className="bg-white dark:bg-gray-900 rounded-none lg:rounded-2xl max-w-3xl w-full h-full lg:h-auto border-0 lg:border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden flex flex-col lg:max-h-[92vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-100 dark:border-gray-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#f5ebe1] dark:bg-gray-800 text-[#5b3823] dark:text-[#d7b89f] flex items-center justify-center">
                  <FileDown className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    {lang === 'vi' ? 'Xuất Thời Khóa Biểu (File .PDF)' : 'Export Timetable (.PDF)'}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {lang === 'vi' ? 'Xem trước và xuất thời khóa biểu thành file .pdf về máy hoặc in ấn' : 'Preview and export timetable as .pdf file or print'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPrintModalOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scope Selector & Quick Export Tools */}
            <div className="p-3.5 sm:p-4 bg-[#fbf9f6] dark:bg-gray-850 border-b border-gray-200/80 dark:border-gray-800 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
              {/* Scope Switcher */}
              <div className="flex items-center bg-white dark:bg-gray-800 p-1 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setPrintScope('day')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    printScope === 'day'
                      ? 'bg-[#b89278] text-white shadow-xs'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900'
                  }`}
                >
                  {lang === 'vi' ? 'Theo Ngày' : 'By Day'}
                </button>
                <button
                  type="button"
                  onClick={() => setPrintScope('week')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    printScope === 'week'
                      ? 'bg-[#b89278] text-white shadow-xs'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900'
                  }`}
                >
                  {lang === 'vi' ? 'Toàn Tuần' : 'Full Week'}
                </button>
              </div>

              {/* Day selection pills if in 'day' scope */}
              {printScope === 'day' && (
                <div className="flex items-center gap-1 overflow-x-auto py-0.5">
                  {daysOfWeek.map((d) => (
                    <button
                      key={d.num}
                      type="button"
                      onClick={() => setSelectedDay(d.num)}
                      className={`px-2 py-1 text-xs rounded-lg font-semibold transition-all border ${
                        selectedDay === d.num
                          ? 'bg-[#b89278] text-white border-[#a88268]'
                          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-[#f5ebe1]'
                      }`}
                    >
                      {d.short}
                    </button>
                  ))}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 ml-auto">
                <button
                  type="button"
                  onClick={() => {
                    const text = (() => {
                      if (printScope === 'day') {
                        const dayObj = daysOfWeek.find((d) => d.num === selectedDay) || daysOfWeek[0];
                        const dayItems = schedule
                          .filter((i) => i.dayOfWeek === selectedDay)
                          .sort((a, b) => a.period - b.period);
                        let t = `THỜI KHÓA BIỂU - ${dayObj.label.toUpperCase()}\n`;
                        t += `Ngày: ${new Date().toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US')}\n`;
                        t += `Tổng số: ${dayItems.length} tiết\n`;
                        t += `----------------------------------------\n`;
                        if (dayItems.length === 0) {
                          t += `(Không có tiết học)\n`;
                        } else {
                          dayItems.forEach((it) => {
                            t += `• Tiết ${it.period} (${it.timeStart} - ${it.timeEnd}): ${it.subject} | ${it.room || 'Phòng --'}${it.teacher ? ` | GV: ${it.teacher}` : ''}${it.note ? ` | Note: ${it.note}` : ''}\n`;
                          });
                        }
                        return t;
                      } else {
                        let t = `BÁO CÁO THỜI KHÓA BIỂU TOÀN TUẦN\n`;
                        t += `Tổng số tiết: ${schedule.length}\n`;
                        t += `========================================\n\n`;
                        daysOfWeek.forEach((d) => {
                          const items = schedule
                            .filter((i) => i.dayOfWeek === d.num)
                            .sort((a, b) => a.period - b.period);
                          t += `[${d.label.toUpperCase()} - ${items.length} tiết]\n`;
                          if (items.length === 0) {
                            t += `  (Nghỉ học)\n\n`;
                          } else {
                            items.forEach((it) => {
                              t += `  • Tiết ${it.period} (${it.timeStart} - ${it.timeEnd}): ${it.subject} | ${it.room || 'Phòng --'}${it.teacher ? ` | GV: ${it.teacher}` : ''}\n`;
                            });
                            t += `\n`;
                          }
                        });
                        return t;
                      }
                    })();
                    navigator.clipboard.writeText(text);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  title={lang === 'vi' ? 'Sao chép văn bản' : 'Copy text'}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 text-xs font-semibold text-gray-700 dark:text-gray-300 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-gray-500" />}
                  <span>{copied ? (lang === 'vi' ? 'Đã chép' : 'Copied') : (lang === 'vi' ? 'Sao chép' : 'Copy')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const text = (() => {
                      if (printScope === 'day') {
                        const dayObj = daysOfWeek.find((d) => d.num === selectedDay) || daysOfWeek[0];
                        const dayItems = schedule
                          .filter((i) => i.dayOfWeek === selectedDay)
                          .sort((a, b) => a.period - b.period);
                        let t = `THỜI KHÓA BIỂU - ${dayObj.label.toUpperCase()}\n`;
                        t += `Ngày: ${new Date().toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US')}\n`;
                        t += `Tổng số: ${dayItems.length} tiết\n`;
                        t += `----------------------------------------\n`;
                        dayItems.forEach((it) => {
                          t += `Tiết ${it.period} (${it.timeStart}-${it.timeEnd}): ${it.subject} | ${it.room} | ${it.teacher} ${it.note ? `| ${it.note}` : ''}\n`;
                        });
                        return t;
                      } else {
                        let t = `THỜI KHÓA BIỂU TOÀN TUẦN\n`;
                        daysOfWeek.forEach((d) => {
                          const items = schedule
                            .filter((i) => i.dayOfWeek === d.num)
                            .sort((a, b) => a.period - b.period);
                          t += `\n=== ${d.label} ===\n`;
                          items.forEach((it) => {
                            t += `Tiết ${it.period} (${it.timeStart}-${it.timeEnd}): ${it.subject} | ${it.room} | ${it.teacher}\n`;
                          });
                        });
                        return t;
                      }
                    })();
                    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `TKB_${printScope === 'day' ? `Thu_${selectedDay}` : 'Toan_Tuan'}.txt`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  }}
                  title={lang === 'vi' ? 'Tải tệp văn bản' : 'Download text file'}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 text-xs font-semibold text-gray-700 dark:text-gray-300 transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-gray-500" />
                  <span>{lang === 'vi' ? 'Tải .txt' : 'Download'}</span>
                </button>

                {/* Primary Action: Xuất PDF */}
                <button
                  type="button"
                  onClick={handleExportPdf}
                  disabled={isExportingPdf}
                  title={lang === 'vi' ? 'Xuất Thời khóa biểu thành file .pdf' : 'Export Timetable as .pdf file'}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#b89278] hover:bg-[#a68066] text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isExportingPdf ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>{lang === 'vi' ? 'Đang xuất...' : 'Exporting...'}</span>
                    </>
                  ) : pdfSuccess ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-200" />
                      <span>{lang === 'vi' ? 'Đã tải PDF!' : 'Downloaded!'}</span>
                    </>
                  ) : (
                    <>
                      <FileDown className="w-3.5 h-3.5" />
                      <span>{lang === 'vi' ? 'Xuất PDF' : 'Export PDF'}</span>
                    </>
                  )}
                </button>

                {/* Secondary Print Button */}
                <button
                  type="button"
                  onClick={() => window.print()}
                  title={lang === 'vi' ? 'In trực tiếp ra giấy' : 'Print to paper'}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 text-xs font-semibold text-gray-700 dark:text-gray-300 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5 text-gray-500" />
                  <span className="hidden sm:inline">{lang === 'vi' ? 'In ấn' : 'Print'}</span>
                </button>
              </div>
            </div>

            {/* Printable Preview Sheet Area */}
            <div className="p-4 sm:p-6 overflow-y-auto grow bg-gray-100/70 dark:bg-gray-950/70">
              <div
                ref={printScheduleRef}
                id="printable-schedule-area"
                className={`bg-white text-gray-900 p-5 sm:p-8 rounded-xl border border-gray-300 shadow-sm mx-auto font-sans transition-all ${
                  printScope === 'week' ? 'max-w-4xl w-full' : 'max-w-2xl w-full'
                }`}
              >
                {/* Print Sheet Header */}
                <div className="text-center pb-4 border-b-2 border-[#5b3823] mb-5">
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight text-[#2c1810] uppercase">
                    {lang === 'vi' ? 'THỜI KHÓA BIỂU HỌC TẬP' : 'CLASS SCHEDULE TIMETABLE'}
                  </h2>
                  {(studentProfile?.fullName || studentProfile?.school || studentProfile?.classGrade) && (
                    <div className="text-xs font-semibold text-gray-700 mt-1">
                      {studentProfile.school && <span className="uppercase">{studentProfile.school} • </span>}
                      {studentProfile.fullName && <span>{lang === 'vi' ? 'Học sinh: ' : 'Student: '}{studentProfile.fullName}</span>}
                      {studentProfile.classGrade && <span> • {lang === 'vi' ? 'Lớp: ' : 'Class: '}{studentProfile.classGrade}</span>}
                      {studentProfile.academicYear && <span> • NH: {studentProfile.academicYear}</span>}
                    </div>
                  )}
                  <div className="flex items-center justify-center gap-4 text-xs font-medium text-gray-600 mt-1.5 flex-wrap">
                    <span>
                      {printScope === 'day'
                        ? `${lang === 'vi' ? 'Thời khóa biểu' : 'Schedule'}: ${(daysOfWeek.find((d) => d.num === selectedDay) || daysOfWeek[0]).label}`
                        : `${lang === 'vi' ? 'Chế độ' : 'Mode'}: ${lang === 'vi' ? 'Toàn Tuần (Thứ 2 - Chủ Nhật)' : 'Full Week'}`}
                    </span>
                    <span>•</span>
                    <span>
                      {lang === 'vi' ? 'Ngày xuất' : 'Date'}: {new Date().toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US')}
                    </span>
                    <span>•</span>
                    <span>
                      {lang === 'vi' ? 'Tổng số' : 'Total'}:{' '}
                      {printScope === 'day'
                        ? `${schedule.filter((i) => i.dayOfWeek === selectedDay).length} ${lang === 'vi' ? 'tiết' : 'periods'}`
                        : `${schedule.length} ${lang === 'vi' ? 'tiết' : 'periods'}`}
                    </span>
                  </div>
                </div>

                {/* Day Scope Printable Content */}
                {printScope === 'day' && (() => {
                  const dayObj = daysOfWeek.find((d) => d.num === selectedDay) || daysOfWeek[0];
                  const dayItems = schedule
                    .filter((i) => i.dayOfWeek === selectedDay)
                    .sort((a, b) => a.period - b.period);

                  if (dayItems.length === 0) {
                    return (
                      <div className="py-12 text-center text-gray-400 text-sm italic">
                        {lang === 'vi' ? `Không có tiết học nào trong ngày ${dayObj.label}.` : `No classes scheduled for ${dayObj.label}.`}
                      </div>
                    );
                  }

                  return (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-left text-xs sm:text-sm">
                        <thead>
                          <tr className="bg-[#f7efe7] text-[#5b3823] font-bold border-b border-[#e4d0c1]">
                            <th className="py-2.5 px-3 w-16 text-center">{lang === 'vi' ? 'Tiết' : 'Period'}</th>
                            <th className="py-2.5 px-3 w-28">{lang === 'vi' ? 'Thời gian' : 'Time'}</th>
                            <th className="py-2.5 px-3">{lang === 'vi' ? 'Môn học' : 'Subject'}</th>
                            <th className="py-2.5 px-3 w-24">{lang === 'vi' ? 'Phòng' : 'Room'}</th>
                            <th className="py-2.5 px-3">{lang === 'vi' ? 'Giáo viên' : 'Teacher'}</th>
                            <th className="py-2.5 px-3">{lang === 'vi' ? 'Ghi chú' : 'Note'}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {dayItems.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50/70">
                              <td className="py-2.5 px-3 text-center font-bold text-[#5b3823]">
                                {item.period}
                              </td>
                              <td className="py-2.5 px-3 whitespace-nowrap text-gray-600">
                                {item.timeStart} - {item.timeEnd}
                              </td>
                              <td className="py-2.5 px-3 font-semibold text-gray-900">
                                {item.subject}
                              </td>
                              <td className="py-2.5 px-3 text-gray-700">
                                {item.room || '---'}
                              </td>
                              <td className="py-2.5 px-3 text-gray-700">
                                {item.teacher || '---'}
                              </td>
                              <td className="py-2.5 px-3 text-gray-500 text-xs">
                                {item.note || '---'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}

                {/* Week Scope Printable Content */}
                {printScope === 'week' && (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-xs border border-gray-300">
                      <thead>
                        <tr className="bg-[#f7efe7] text-[#5b3823] font-bold border-b border-gray-300">
                          <th className="py-2 px-2 text-center w-14 border-r border-gray-300">
                            {lang === 'vi' ? 'Tiết' : 'Period'}
                          </th>
                          {daysOfWeek.map((d) => (
                            <th key={d.num} className="py-2 px-2 text-center border-r last:border-r-0 border-gray-300">
                              {d.short}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {Array.from({ length: 10 }, (_, i) => i + 1).map((periodNum) => {
                          const isMorningBreak = periodNum === 5;
                          return (
                            <React.Fragment key={periodNum}>
                              <tr className="hover:bg-gray-50">
                                <td className="py-2 px-2 text-center font-bold text-[#5b3823] border-r border-gray-300 bg-gray-50/70">
                                  T{periodNum}
                                </td>
                                {daysOfWeek.map((d) => {
                                  const classItem = schedule.find(
                                    (item) => item.dayOfWeek === d.num && item.period === periodNum
                                  );

                                  return (
                                    <td
                                      key={d.num}
                                      className="py-1.5 px-2 text-center border-r last:border-r-0 border-gray-200 align-top min-w-[70px]"
                                    >
                                      {classItem ? (
                                        <div className="flex flex-col items-center justify-center">
                                          <span className="font-bold text-gray-900 leading-tight">
                                            {classItem.subject}
                                          </span>
                                          {classItem.room && (
                                            <span className="text-[10px] text-gray-500 leading-tight">
                                              {classItem.room}
                                            </span>
                                          )}
                                        </div>
                                      ) : (
                                        <span className="text-gray-300">-</span>
                                      )}
                                    </td>
                                  );
                                })}
                              </tr>
                              {isMorningBreak && (
                                <tr className="bg-amber-50 text-amber-900 text-[10px] font-semibold text-center">
                                  <td colSpan={8} className="py-1 border-y border-amber-200">
                                    {lang === 'vi' ? '--- NGHỈ TRƯA (CHUYỂN BUỔI CHIỀU) ---' : '--- LUNCH BREAK ---'}
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Print Sheet Sign-off */}
                <div className="mt-8 pt-4 border-t border-gray-300 flex items-center justify-between text-[11px] text-gray-500">
                  <span>Hệ thống Quản lý Thời Khóa Biểu & Học Tập</span>
                  <span>Ký nhận / Xác nhận của Giáo viên / Phụ huynh</span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 sm:p-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-3 shrink-0">
              <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:inline">
                💡 {lang === 'vi' ? 'Tự động tạo file .pdf chuẩn A4, sắc nét và sẵn sàng lưu trữ hoặc in ấn' : 'Generates standard crisp A4 .pdf file ready to save or print'}
              </span>
              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => setIsPrintModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="button"
                  onClick={handleExportPdf}
                  disabled={isExportingPdf}
                  className="flex items-center gap-1.5 px-4 sm:px-5 py-2 rounded-xl text-xs font-semibold bg-[#b89278] hover:bg-[#a68066] text-white shadow-xs transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isExportingPdf ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{lang === 'vi' ? 'Đang xuất PDF...' : 'Exporting PDF...'}</span>
                    </>
                  ) : pdfSuccess ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-200" />
                      <span>{lang === 'vi' ? 'Đã tải file .pdf!' : 'Downloaded .pdf!'}</span>
                    </>
                  ) : (
                    <>
                      <FileDown className="w-4 h-4" />
                      <span>{lang === 'vi' ? 'Xuất PDF' : 'Export PDF'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
