import React, { useState, useMemo, useEffect } from 'react';
import {
  ScrollText,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  Clock,
  MapPin,
  IdCard,
  Target,
  BookOpen,
  Timer,
  ChevronDown,
  ChevronRight,
  X,
  Sparkles,
  Check,
  Save,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { ExamItem, ExamFormat, Language, SubjectItem } from '../types';
import { translations } from '../i18n/translations';
import { useSwipeToCloseModal } from '../hooks/useSwipeToCloseModal';
import { StorageService } from '../services/storage';
import { SubjectCombobox } from './SubjectCombobox';

interface ExamScheduleViewProps {
  exams: ExamItem[];
  onSaveExams: (items: ExamItem[]) => void;
  lang: Language;
  openDetailId?: string;
  openDetailSubject?: string;
  onClearOpenDetailId?: () => void;
  subjects?: SubjectItem[];
}

export const ExamScheduleView: React.FC<ExamScheduleViewProps> = ({
  exams,
  onSaveExams,
  lang,
  openDetailId,
  openDetailSubject,
  onClearOpenDetailId,
  subjects,
}) => {
  const t = translations[lang];
  const [editingItem, setEditingItem] = useState<ExamItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reviewPopupItem, setReviewPopupItem] = useState<ExamItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<ExamItem | null>(null);
  const [isDeleteAllPassedOpen, setIsDeleteAllPassedOpen] = useState(false);
  const [targetEditItem, setTargetEditItem] = useState<ExamItem | null>(null);
  const [targetScoreInput, setTargetScoreInput] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'upcoming' | 'passed'>('upcoming');
  const [isPassedCollapsed, setIsPassedCollapsed] = useState(false);

  // Automatically open detail / edit modal when navigated from notification
  useEffect(() => {
    if (openDetailId || openDetailSubject) {
      const target =
        (openDetailId && exams.find((e) => e.id === openDetailId)) ||
        (openDetailSubject &&
          exams.find(
            (e) => e.subject.toLowerCase() === openDetailSubject.toLowerCase()
          ));
      if (target) {
        setEditingItem(target);
        setIsModalOpen(true);
      }
      if (onClearOpenDetailId) {
        onClearOpenDetailId();
      }
    }
  }, [openDetailId, openDetailSubject, exams, onClearOpenDetailId]);

  // Swipe-to-close on mobile/tablet (handles edit modal, review popup, target score modal, and confirm delete modals)
  const { modalTouchHandlers } = useSwipeToCloseModal({
    isOpen:
      isModalOpen ||
      !!reviewPopupItem ||
      itemToDelete !== null ||
      isDeleteAllPassedOpen ||
      targetEditItem !== null,
    onClose: () => {
      if (targetEditItem) {
        setTargetEditItem(null);
      } else if (isDeleteAllPassedOpen) {
        setIsDeleteAllPassedOpen(false);
      } else if (itemToDelete) {
        setItemToDelete(null);
      } else if (reviewPopupItem) {
        setReviewPopupItem(null);
      } else {
        setIsModalOpen(false);
        setEditingItem(null);
      }
    },
  });
  const [hoveredTopicId, setHoveredTopicId] = useState<string | null>(null);

  // Helper to format date YYYY-MM-DD -> DD/MM/YYYY
  const formatDateVN = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  // Helper to get Vietnamese day of week
  const getDayOfWeekVN = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
        return days[d.getDay()] || '';
      }
      return '';
    } catch {
      return '';
    }
  };

  // Helper to parse date & time into local timestamp reliably
  const getExamTimestamp = (dateStr: string, timeStr = '00:00'): number => {
    if (!dateStr) return NaN;
    const dateParts = dateStr.split('-');
    if (dateParts.length !== 3) return NaN;
    const y = parseInt(dateParts[0], 10);
    const m = parseInt(dateParts[1], 10);
    const d = parseInt(dateParts[2], 10);
    const timeParts = (timeStr || '00:00').split(':');
    const h = parseInt(timeParts[0], 10) || 0;
    const min = parseInt(timeParts[1], 10) || 0;
    return new Date(y, m - 1, d, h, min, 0, 0).getTime();
  };

  // Helper to check if an exam has passed / is completed
  const isExamPassed = (item: ExamItem): boolean => {
    if (item.isCompleted) return true;
    if (!item.examDate) return false;
    const duration = item.durationMinutes || 60;
    const examStart = getExamTimestamp(item.examDate, item.timeStart || '23:59');
    if (isNaN(examStart)) return false;
    const examEnd = examStart + duration * 60 * 1000;
    return examEnd < Date.now();
  };

  // Helper to calculate calendar days remaining (strictly matching calendar dates)
  const getDaysRemaining = (dateStr: string, timeStr?: string, durationMinutes = 60) => {
    if (!dateStr) return -1;
    const parts = dateStr.split('-');
    if (parts.length !== 3) return -1;
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    const d = parseInt(parts[2], 10);
    if (isNaN(y) || isNaN(m) || isNaN(d)) return -1;

    const now = new Date();
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).getTime();
    const examMidnight = new Date(y, m - 1, d, 0, 0, 0, 0).getTime();

    const calendarDaysDiff = Math.round((examMidnight - todayMidnight) / (1000 * 60 * 60 * 24));

    // If calendar date is in the past
    if (calendarDaysDiff < 0) {
      return -1;
    }

    // If calendar date is TODAY (0)
    if (calendarDaysDiff === 0) {
      const examStart = getExamTimestamp(dateStr, timeStr || '23:59');
      const examEnd = examStart + (durationMinutes || 60) * 60 * 1000;
      if (!isNaN(examEnd) && examEnd < now.getTime()) {
        return -1; // already ended today
      }
      return 0; // Exam is today!
    }

    // Future days (1 for tomorrow, 2, 3...)
    return calendarDaysDiff;
  };

  // All available subjects combining system subjects and exams
  const availableSubjects = useMemo(() => {
    const list = subjects && subjects.length > 0 ? subjects : StorageService.getSubjects();
    const set = new Set<string>(list.map((s) => s.name));
    exams.forEach((ex) => {
      if (ex.subject && ex.subject.trim()) {
        set.add(ex.subject.trim());
      }
    });
    return Array.from(set);
  }, [exams, subjects]);

  // Toggle completed status manually
  const handleToggleComplete = (item: ExamItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const currentlyPassed = isExamPassed(item);
    const updated = exams.map((ex) =>
      ex.id === item.id ? { ...ex, isCompleted: !currentlyPassed } : ex
    );
    onSaveExams(updated);
  };

  // Delete with confirmation
  const handleDeleteClick = (item: ExamItem) => {
    setItemToDelete(item);
  };

  const handleConfirmDelete = () => {
    if (!itemToDelete) return;
    onSaveExams(exams.filter((i) => i.id !== itemToDelete.id));
    if (reviewPopupItem?.id === itemToDelete.id) {
      setReviewPopupItem(null);
    }
    setItemToDelete(null);
  };

  const handleConfirmDeleteAllPassed = () => {
    const remaining = exams.filter((i) => !isExamPassed(i));
    onSaveExams(remaining);
    if (reviewPopupItem && isExamPassed(reviewPopupItem)) {
      setReviewPopupItem(null);
    }
    setIsDeleteAllPassedOpen(false);
  };

  const handleOpenAdd = (defaultSubject?: string) => {
    const sub = defaultSubject || '';
    setEditingItem({
      id: `exam-${Date.now()}`,
      subject: sub,
      examName: 'Kiểm tra Giữa kỳ 1',
      examDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      timeStart: '07:30',
      durationMinutes: 90,
      room: 'Hội trường C - Tầng 2',
      candidateNumber: 'SBD-11T1-018',
      format: 'multiple_choice',
      reviewTopics: '',
      targetScore: 9.5,
      isCompleted: false,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: ExamItem) => {
    setEditingItem({ ...item });
    setIsModalOpen(true);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editingItem.subject.trim()) return;

    const exists = exams.some((i) => i.id === editingItem.id);
    if (exists) {
      onSaveExams(exams.map((i) => (i.id === editingItem.id ? editingItem : i)));
    } else {
      onSaveExams([...exams, editingItem]);
    }
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleOpenTargetEdit = (item: ExamItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setTargetEditItem(item);
    setTargetScoreInput(item.targetScore !== undefined ? String(item.targetScore) : '');
  };

  const handleSaveTargetEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetEditItem) return;
    const trimmed = targetScoreInput.trim().replace(',', '.');
    let parsedScore: number | undefined = undefined;
    if (trimmed !== '') {
      const num = Number(trimmed);
      if (!Number.isNaN(num)) {
        parsedScore = Math.min(10, Math.max(0, Math.round(num * 100) / 100));
      }
    }
    onSaveExams(
      exams.map((ex) =>
        ex.id === targetEditItem.id ? { ...ex, targetScore: parsedScore } : ex
      )
    );
    setTargetEditItem(null);
  };

  const formatLabels: Record<ExamFormat, string> = {
    essay: t.exams.formats.essay,
    multiple_choice: t.exams.formats.multiple_choice,
    oral: t.exams.formats.oral,
    practice: t.exams.formats.practice,
  };

  // Split exams into Upcoming & Passed
  const { upcomingExams, passedExams } = useMemo(() => {
    const upcoming: ExamItem[] = [];
    const passed: ExamItem[] = [];

    exams.forEach((item) => {
      if (isExamPassed(item)) {
        passed.push(item);
      } else {
        upcoming.push(item);
      }
    });

    // Upcoming: nearest first
    upcoming.sort(
      (a, b) =>
        getExamTimestamp(a.examDate, a.timeStart) -
        getExamTimestamp(b.examDate, b.timeStart)
    );

    // Passed: most recently passed first
    passed.sort(
      (a, b) =>
        getExamTimestamp(b.examDate, b.timeStart) -
        getExamTimestamp(a.examDate, a.timeStart)
    );

    return { upcomingExams: upcoming, passedExams: passed };
  }, [exams]);

  // Card renderer component
  const renderExamCard = (item: ExamItem) => {
    const isPassed = isExamPassed(item);
    const daysLeft = getDaysRemaining(item.examDate, item.timeStart, item.durationMinutes);

    return (
      <div
        key={item.id}
        className={`rounded-2xl p-4 sm:p-5 border transition-all shadow-xs flex flex-col justify-between relative overflow-hidden ${
          isPassed
            ? 'opacity-65 hover:opacity-95 bg-gray-50/75 dark:bg-gray-850/50 border-gray-200/80 dark:border-gray-800'
            : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:border-rose-300 dark:hover:border-rose-900/60'
        }`}
      >
        {/* Top Header: Subject & Exam Name + Status Badge */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex flex-col min-w-0 pr-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-sm sm:text-base font-extrabold truncate ${
                  isPassed ? 'text-gray-700 dark:text-gray-300' : 'text-gray-950 dark:text-white'
                }`}
              >
                {item.subject}
              </span>
              <span className="text-[11px] sm:text-xs px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 font-bold truncate border border-gray-200/70 dark:border-gray-700">
                {item.examName}
              </span>
            </div>
          </div>

          {/* Status Badge */}
          {isPassed ? (
            <div className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-xl shrink-0 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{lang === 'vi' ? 'Đã thi' : 'Passed'}</span>
            </div>
          ) : daysLeft === 0 ? (
            <div className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-xl shrink-0 bg-rose-600 text-white animate-pulse shadow-xs">
              <Timer className="w-3.5 h-3.5" />
              <span>{t.exams.today}</span>
            </div>
          ) : daysLeft === 1 ? (
            <div className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-xl shrink-0 bg-amber-500 text-white shadow-xs">
              <Timer className="w-3.5 h-3.5" />
              <span>{lang === 'vi' ? 'Ngày mai thi!' : 'Tomorrow!'}</span>
            </div>
          ) : daysLeft > 1 && daysLeft <= 3 ? (
            <div className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-xl shrink-0 bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200 border border-amber-300 dark:border-amber-900/40">
              <Timer className="w-3.5 h-3.5" />
              <span>
                {daysLeft} {lang === 'vi' ? 'ngày nữa' : 'days left'}
              </span>
            </div>
          ) : daysLeft > 3 ? (
            <div className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-xl shrink-0 bg-blue-50 text-blue-800 dark:bg-blue-950/40 dark:text-blue-200 border border-blue-200 dark:border-blue-900/40">
              <Timer className="w-3.5 h-3.5" />
              <span>
                {daysLeft} {lang === 'vi' ? 'ngày nữa' : 'days left'}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-xl shrink-0 bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
              <Check className="w-3.5 h-3.5" />
              <span>{t.exams.passed}</span>
            </div>
          )}
        </div>

        {/* Exam Details */}
        <div className="space-y-2 text-xs font-medium text-gray-800 dark:text-gray-200">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 sm:gap-x-4 gap-y-2">
            {/* Hàng 1: Ngày thi (trái) & Giờ thi (phải) */}
            <span className="flex items-center gap-1 font-bold text-gray-950 dark:text-white min-w-0">
              <Calendar className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              <span className="truncate">
                {formatDateVN(item.examDate)} {getDayOfWeekVN(item.examDate) && `(${getDayOfWeekVN(item.examDate)})`}
              </span>
            </span>
            <span className="flex items-center gap-1 font-semibold text-gray-800 dark:text-gray-100 whitespace-nowrap justify-self-start">
              <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>{item.timeStart} ({item.durationMinutes} phút)</span>
            </span>

            {/* Hàng 2: Phòng thi (trái) & Số báo danh (phải) */}
            {(item.room || item.candidateNumber) && (
              <>
                {item.room ? (
                  <span className="flex items-center gap-1 font-semibold text-gray-800 dark:text-gray-100 min-w-0">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate">{item.room}</span>
                  </span>
                ) : (
                  <span />
                )}
                {item.candidateNumber ? (
                  <span className="flex items-center gap-1 text-gray-900 dark:text-gray-100 whitespace-nowrap justify-self-start">
                    <IdCard className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span className="font-mono font-bold">{item.candidateNumber}</span>
                  </span>
                ) : (
                  <span />
                )}
              </>
            )}

            {/* Hàng 3: Hình thức thi (trái) & Mục tiêu (phải) */}
            <div className="min-w-0">
              <span className="inline-flex px-2 py-0.5 rounded-md bg-purple-50 text-purple-800 dark:bg-purple-950/50 dark:text-purple-200 font-bold text-[11px] border border-purple-200/70 dark:border-purple-800/50 whitespace-nowrap">
                {formatLabels[item.format]}
              </span>
            </div>
            <button
              type="button"
              onClick={(e) => handleOpenTargetEdit(item, e)}
              className={`justify-self-start flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md border transition-colors cursor-pointer whitespace-nowrap ${
                item.targetScore !== undefined
                  ? 'text-emerald-800 dark:text-emerald-300 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800/50'
                  : 'text-gray-700 dark:text-gray-300 bg-gray-100 hover:bg-emerald-50 hover:text-emerald-800 dark:bg-gray-800 dark:hover:bg-emerald-950/40 border-gray-200 dark:border-gray-700 hover:border-emerald-200'
              }`}
              title={lang === 'vi' ? 'Bấm để chỉnh sửa điểm mục tiêu' : 'Click to edit target score'}
            >
              <Target className="w-3 h-3 text-emerald-700 dark:text-emerald-400 shrink-0" />
              <span>
                {item.targetScore !== undefined
                  ? `${lang === 'vi' ? 'Mục tiêu' : 'Target'}: ${item.targetScore}đ`
                  : (lang === 'vi' ? 'Đặt mục tiêu' : 'Set target')}
              </span>
              <Edit2 className="w-2.5 h-2.5 opacity-70 shrink-0" />
            </button>
          </div>

          {/* Review Topics */}
          {item.reviewTopics && (
            <div
              onClick={() => setReviewPopupItem(item)}
              className="mt-2 text-xs bg-gray-50 dark:bg-gray-850 p-2.5 rounded-xl border border-gray-200/80 dark:border-gray-700 cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-700/60 transition-colors group/review"
            >
              <div className="font-bold text-gray-900 dark:text-white flex items-center justify-between gap-1 mb-0.5">
                <div className="flex items-center gap-1">
                  <BookOpen className="w-3 h-3 text-blue-600" />
                  <span>{t.exams.reviewTopics}:</span>
                </div>
                <span className="text-[10px] text-indigo-700 dark:text-indigo-400 group-hover/review:underline font-semibold">
                  Xem thêm
                </span>
              </div>
              <p className="text-gray-800 dark:text-gray-200 font-medium leading-relaxed line-clamp-2">
                {item.reviewTopics}
              </p>
            </div>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-100 dark:border-gray-800/80">
          {/* Toggle complete button */}
          <button
            type="button"
            onClick={(e) => handleToggleComplete(item, e)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              isPassed
                ? 'text-gray-700 dark:text-gray-300 hover:text-indigo-700 dark:hover:text-indigo-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                : 'text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/40'
            }`}
            title={isPassed ? 'Bấm để đánh dấu chưa thi' : 'Đánh dấu môn này đã thi xong'}
          >
            <Check className={`w-3.5 h-3.5 ${isPassed ? 'text-emerald-600' : 'text-emerald-700'}`} />
            <span>
              {isPassed
                ? (lang === 'vi' ? 'Đã thi xong' : 'Completed')
                : (lang === 'vi' ? 'Đánh dấu đã thi' : 'Mark as done')}
            </span>
          </button>

          {/* Edit & Delete (with confirm) */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleOpenEdit(item)}
              className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-indigo-700 dark:hover:text-indigo-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
              title={t.common.edit}
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => handleDeleteClick(item)}
              className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
              title={t.common.delete}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3.5 sm:space-y-4">
      {/* Header Bar: Title and Action Buttons */}
      <div className="bg-white dark:bg-gray-900 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs space-y-3">
        <div>
          <h2 className="text-base sm:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ScrollText className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
            {t.exams.title}
          </h2>
        </div>

        {/* Action Row: Thêm (nền xanh) ở bên trái, Xóa ở lề bên phải */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-gray-100 dark:border-gray-800/60">
          <button
            id="add-exam-btn"
            onClick={() => handleOpenAdd()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-500/20 transition-all active:scale-[0.98] cursor-pointer"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>{t.exams.addExam}</span>
          </button>

          <button
            type="button"
            id="delete-all-passed-exams-btn"
            onClick={() => setIsDeleteAllPassedOpen(true)}
            disabled={passedExams.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400 dark:hover:bg-rose-900/50 border border-rose-200/80 dark:border-rose-800/60 shadow-xs transition-all active:scale-[0.98] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            title={lang === 'vi' ? 'Xóa tất cả các danh mục môn đã thi' : 'Delete all completed exams'}
          >
            <Trash2 className="w-4 h-4 shrink-0" />
            <span>{lang === 'vi' ? 'Xóa' : 'Delete'}</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs: Sắp thi / Đã thi */}
      {exams.length > 0 && (
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center p-1 bg-gray-100 dark:bg-gray-800/80 rounded-xl border border-gray-200 dark:border-gray-700/60 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setStatusFilter("upcoming")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                statusFilter === "upcoming"
                  ? "bg-white dark:bg-gray-900 text-rose-600 dark:text-rose-400 shadow-xs font-bold"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              {lang === "vi"
                ? (upcomingExams.length > 0 ? `Sắp thi (${upcomingExams.length})` : "Sắp thi")
                : (upcomingExams.length > 0 ? `Upcoming (${upcomingExams.length})` : "Upcoming")}
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("passed")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                statusFilter === "passed"
                  ? "bg-white dark:bg-gray-900 text-rose-600 dark:text-rose-400 shadow-xs font-bold"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              {lang === "vi" ? `Đã thi (${passedExams.length})` : `Passed (${passedExams.length})`}
            </button>
          </div>
        </div>
      )}

      {/* Main Content: Card-based view */}
      {exams.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 text-center border border-gray-200 dark:border-gray-800 shadow-xs">
          <ScrollText className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {lang === "vi" ? "Chưa có lịch thi nào được tạo" : "No exam schedule created yet"}
          </p>
          <button
            onClick={() => handleOpenAdd()}
            className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t.exams.addExam}</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Section 1: Upcoming Exams (Lịch thi sắp tới) */}
          {statusFilter === "upcoming" && (
            <div className="space-y-3">
              {upcomingExams.length === 0 ? (
                <div className="p-6 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 text-center text-xs text-gray-400 dark:text-gray-500 bg-gray-50/50 dark:bg-gray-850/30">
                  {lang === "vi" ? "Hiện tại không có môn thi nào sắp tới." : "No upcoming exams."}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
                  {upcomingExams.map(renderExamCard)}
                </div>
              )}
            </div>
          )}

          {/* Section 2: Passed Exams (Danh mục môn đã thi) */}
          {statusFilter === "passed" && (
            <div className="space-y-3">
              {passedExams.length === 0 ? (
                <div className="p-6 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 text-center text-xs text-gray-400 dark:text-gray-500 bg-gray-50/50 dark:bg-gray-850/30">
                  {lang === "vi" ? "Chưa có môn thi nào đã hoàn thành." : "No completed exams yet."}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
                  {passedExams.map(renderExamCard)}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Confirm Delete Single Exam Modal */}
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
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-bold text-gray-900 dark:text-white leading-tight">
                  {lang === 'vi' ? 'Xác nhận xóa lịch thi' : 'Confirm Delete Exam'}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {lang === 'vi' ? 'Hành động này không thể hoàn tác' : 'This action cannot be undone'}
                </p>
              </div>
            </div>

            <div className="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-800 text-xs space-y-1">
              <div className="font-bold text-gray-900 dark:text-white">
                {itemToDelete.subject} - {itemToDelete.examName}
              </div>
              <div className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
                <span>{formatDateVN(itemToDelete.examDate)}</span>
                <span>•</span>
                <span>{itemToDelete.timeStart} ({itemToDelete.durationMinutes} phút)</span>
              </div>
              {itemToDelete.room && (
                <div className="text-gray-500 dark:text-gray-400">
                  {lang === 'vi' ? 'Phòng thi' : 'Room'}: {itemToDelete.room}
                </div>
              )}
            </div>

            <p className="text-xs text-gray-600 dark:text-gray-300">
              {lang === 'vi'
                ? 'Bạn có chắc chắn muốn xóa bài thi này khỏi lịch thi không?'
                : 'Are you sure you want to delete this exam schedule?'}
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

      {/* Confirm Delete All Passed Exams Modal */}
      {isDeleteAllPassedOpen && (
        <div
          data-app-modal="true"
          {...modalTouchHandlers}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setIsDeleteAllPassedOpen(false)}
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
                  {lang === 'vi' ? 'Xác nhận xóa môn đã thi' : 'Confirm Delete Completed Exams'}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {lang === 'vi' ? 'Hành động này không thể hoàn tác' : 'This action cannot be undone'}
                </p>
              </div>
            </div>

            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-100 dark:border-rose-900/50 text-xs text-rose-800 dark:text-rose-300">
              {lang === 'vi'
                ? `Hệ thống sẽ xóa toàn bộ ${passedExams.length} môn thi trong danh mục "Đã thi".`
                : `This will remove all ${passedExams.length} exams in the "Passed" category.`}
            </div>

            <p className="text-xs text-gray-600 dark:text-gray-300">
              {lang === 'vi'
                ? 'Bạn có chắc chắn muốn tiếp tục thực hiện xóa không?'
                : 'Are you sure you want to proceed with deleting all completed exams?'}
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setIsDeleteAllPassedOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"
              >
                {t.common.cancel}
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteAllPassed}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-sm shadow-rose-600/20 cursor-pointer"
              >
                {lang === 'vi' ? `Xóa tất cả (${passedExams.length})` : `Delete all (${passedExams.length})`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP / MODAL REVIEW TOPICS (Khi bấm vào ...) */}
      {reviewPopupItem && (
        <div
          data-app-modal="true"
          {...modalTouchHandlers}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setReviewPopupItem(null)}
        >
          <div
            className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-2xl border border-gray-200 dark:border-gray-800 space-y-3.5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                    {reviewPopupItem.subject} - {reviewPopupItem.examName}
                  </h4>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    {formatDateVN(reviewPopupItem.examDate)} • {reviewPopupItem.timeStart}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setReviewPopupItem(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>{t.exams.reviewTopics}</span>
              </div>
              <div className="text-xs leading-relaxed text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-800/70 p-3.5 rounded-xl border border-gray-200/70 dark:border-gray-700 whitespace-pre-wrap">
                {reviewPopupItem.reviewTopics || (lang === 'vi' ? 'Chưa nhập nội dung ôn tập' : 'No review topics added')}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 text-[11px] text-gray-500 dark:text-gray-400">
              <span>{reviewPopupItem.room} • {reviewPopupItem.candidateNumber}</span>
              <button
                onClick={() => setReviewPopupItem(null)}
                className="px-3.5 py-1.5 rounded-lg font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                {lang === 'vi' ? 'Đóng' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Add/Edit */}
      {isModalOpen && editingItem && (
        <div
          data-app-modal="true"
          {...modalTouchHandlers}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-0 lg:p-4"
        >
          <div className="w-full h-full lg:h-auto lg:max-h-[90vh] lg:max-w-xl bg-white dark:bg-gray-900 rounded-none lg:rounded-2xl shadow-2xl border-0 lg:border border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/75 dark:bg-gray-850 shrink-0">
              <div className="min-w-0 pr-2">
                <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white truncate">
                  {editingItem.id && exams.some((i) => i.id === editingItem.id)
                    ? t.exams.editExam
                    : t.exams.addExamModal || t.exams.addExam}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {lang === 'vi' ? 'Thiết lập kỳ thi, thời gian và địa điểm' : 'Set up exam schedule, time and venue'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-xl hover:bg-gray-200/60 dark:hover:bg-gray-800 transition-colors shrink-0 cursor-pointer"
                title={t.exams.closeBtn || t.common.cancel}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body & Form */}
            <form onSubmit={handleSaveModal} className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 sm:py-5 space-y-4">
                {/* 2-Column Responsive Form Layout */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                  {/* HÀNG 1: MÔN HỌC (DROPDOWN TÌM KIẾM / CHỌN) */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 flex items-center justify-between">
                      <span>{t.periods.subject} <span className="text-red-500">*</span></span>
                      <span className="text-[10px] text-rose-600 dark:text-rose-400 font-normal">Chọn từ danh mục</span>
                    </label>
                    <SubjectCombobox
                      required
                      value={editingItem.subject}
                      subjects={subjects}
                      onChange={(name) => setEditingItem({ ...editingItem, subject: name })}
                      placeholder={t.exams.selectSubjectPlaceholder || 'Toán học, Tiếng Anh...'}
                      className="w-full pl-3 pr-9 py-2.5 text-xs sm:text-[13px] rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-rose-500 transition-colors"
                    />
                  </div>

                  {/* HÀNG 1: TÊN ĐỢT THI / KỲ THI */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      {t.exams.examName} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={editingItem.examName}
                      onChange={(e) => setEditingItem({ ...editingItem, examName: e.target.value })}
                      placeholder="Ví dụ: Giữa kỳ 1, Cuối kỳ 1..."
                      className="w-full px-3 py-2.5 text-xs sm:text-[13px] rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>

                  {/* HÀNG 2: NGÀY THI (ĐỊNH DẠNG VIỆT NAM DD/MM/YYYY) */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 flex items-center justify-between">
                      <span>{t.exams.dateVN || 'Ngày thi (DD/MM/YYYY)'} <span className="text-red-500">*</span></span>
                      {editingItem.examDate && (
                        <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400">
                          {formatDateVN(editingItem.examDate)}
                        </span>
                      )}
                    </label>
                    <input
                      type="date"
                      required
                      value={editingItem.examDate}
                      onChange={(e) => setEditingItem({ ...editingItem, examDate: e.target.value })}
                      className="w-full px-3 py-2.5 text-xs sm:text-[13px] rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500"
                    />
                    {editingItem.examDate && (
                      <div className="mt-1 flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-[10px] font-semibold border border-rose-200/60 dark:border-rose-800/60">
                          {getDayOfWeekVN(editingItem.examDate)}, {formatDateVN(editingItem.examDate)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* HÀNG 2: GIỜ BẮT ĐẦU (HỆ 24 GIỜ CHUẨN) */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 flex items-center justify-between">
                      <span>{t.exams.time24h || 'Giờ bắt đầu (Hệ 24h)'} <span className="text-red-500">*</span></span>
                      <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500">24H</span>
                    </label>
                    <input
                      type="time"
                      step={60}
                      required
                      value={editingItem.timeStart}
                      onChange={(e) => setEditingItem({ ...editingItem, timeStart: e.target.value })}
                      className="w-full px-3 py-2.5 text-xs sm:text-[13px] rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500"
                    />
                    {/* Quick 24h Slot Chips */}
                    <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] text-gray-400 dark:text-gray-500">Gợi ý ca thi:</span>
                      {['07:30', '08:00', '09:00', '13:30', '14:00'].map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setEditingItem({ ...editingItem, timeStart: slot })}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-medium transition-colors cursor-pointer ${
                            editingItem.timeStart === slot
                              ? 'bg-rose-600 text-white font-bold'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                          }`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* HÀNG 3: THỜI LƯỢNG (PHÚT) */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      {t.exams.duration} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min={15}
                        max={300}
                        step={5}
                        required
                        value={editingItem.durationMinutes}
                        onChange={(e) => setEditingItem({ ...editingItem, durationMinutes: Number(e.target.value) })}
                        className="w-full px-3 py-2.5 text-xs sm:text-[13px] rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">
                        phút
                      </span>
                    </div>
                  </div>

                  {/* HÀNG 3: PHÒNG THI (RỘNG RÃI, KHÔNG BỊ TRÀN CHỮ) */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      {t.exams.room}
                    </label>
                    <input
                      type="text"
                      value={editingItem.room}
                      onChange={(e) => setEditingItem({ ...editingItem, room: e.target.value })}
                      placeholder="Ví dụ: Hội trường C - Tầng 2, Phòng 302..."
                      className="w-full px-3 py-2.5 text-xs sm:text-[13px] rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>

                  {/* HÀNG 4: SỐ BÁO DANH (SBD) */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      {t.exams.sbd}
                    </label>
                    <input
                      type="text"
                      value={editingItem.candidateNumber}
                      onChange={(e) => setEditingItem({ ...editingItem, candidateNumber: e.target.value })}
                      placeholder="SBD-11T1-018..."
                      className="w-full px-3 py-2.5 text-xs sm:text-[13px] font-mono rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>

                  {/* HÀNG 4: HÌNH THỨC THI */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      {t.exams.format}
                    </label>
                    <select
                      value={editingItem.format}
                      onChange={(e) => setEditingItem({ ...editingItem, format: e.target.value as ExamFormat })}
                      className="w-full px-3 py-2.5 text-xs sm:text-[13px] rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer"
                    >
                      <option value="multiple_choice">{t.exams.formats.multiple_choice}</option>
                      <option value="essay">{t.exams.formats.essay}</option>
                      <option value="oral">{t.exams.formats.oral}</option>
                      <option value="practice">{t.exams.formats.practice}</option>
                    </select>
                  </div>

                  {/* HÀNG 5: ĐIỂM MỤC TIÊU */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 flex items-center justify-between">
                      <span>{lang === 'vi' ? 'Điểm mục tiêu (Thang 10)' : 'Target Score (0 - 10)'}</span>
                      <span className="text-[10px] text-gray-400 dark:text-gray-500">
                        {lang === 'vi' ? 'Để trống nếu không đặt' : 'Leave blank to skip'}
                      </span>
                    </label>
                    <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                      <div className="relative w-32 shrink-0">
                        <input
                          type="number"
                          min={0}
                          max={10}
                          step={0.1}
                          value={editingItem.targetScore ?? ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditingItem({
                              ...editingItem,
                              targetScore:
                                val === '' ? undefined : Math.min(10, Math.max(0, Number(val))),
                            });
                          }}
                          placeholder="8.8"
                          className="w-full px-3 py-2 text-xs sm:text-[13px] font-bold rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-rose-500"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">
                          đ
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {[7.5, 8.0, 8.5, 9.0, 9.5, 10].map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setEditingItem({ ...editingItem, targetScore: preset })}
                            className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                              editingItem.targetScore === preset
                                ? 'bg-emerald-600 text-white shadow-2xs'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-emerald-50 hover:text-emerald-800 dark:hover:bg-emerald-950/40'
                            }`}
                          >
                            {preset}đ
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* HÀNG 6: TRỌNG TÂM ÔN TẬP */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    {t.exams.reviewTopics}
                  </label>
                  <textarea
                    rows={3}
                    value={editingItem.reviewTopics}
                    onChange={(e) => setEditingItem({ ...editingItem, reviewTopics: e.target.value })}
                    placeholder="Kiến thức trọng tâm chương 1, bài tập dạng khó, công thức cần ghi nhớ..."
                    className="w-full px-3 py-2.5 text-xs sm:text-[13px] rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-rose-500 leading-relaxed"
                  />
                </div>
              </div>

              {/* Modal Footer: Secondary 'Đóng' button & Primary 'Lưu' button */}
              <div className="flex items-center justify-end gap-3 px-5 sm:px-6 py-3.5 sm:py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-850 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 transition-colors shadow-2xs cursor-pointer"
                >
                  {t.exams.closeBtn || (lang === 'vi' ? 'Đóng' : 'Close')}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white shadow-md shadow-rose-500/20 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>{lang === 'vi' ? 'Lưu' : 'Save'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Target Score Edit Modal */}
      {targetEditItem && (
        <div
          data-app-modal="true"
          {...modalTouchHandlers}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setTargetEditItem(null)}
        >
          <div
            className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-2xl border border-gray-200 dark:border-gray-800 space-y-4 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Target className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-bold text-gray-950 dark:text-white leading-tight truncate">
                    {lang === 'vi' ? 'Chỉnh sửa điểm mục tiêu' : 'Edit Target Score'}
                  </h3>
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 truncate">
                    {targetEditItem.subject} • {targetEditItem.examName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTargetEditItem(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 shrink-0 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTargetEdit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-gray-800 dark:text-gray-200 mb-1.5">
                  {lang === 'vi' ? 'Điểm mục tiêu (0 - 10)' : 'Target score (0 - 10)'}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    max={10}
                    step={0.1}
                    autoFocus
                    value={targetScoreInput}
                    onChange={(e) => setTargetScoreInput(e.target.value)}
                    placeholder="8.8"
                    className="w-full px-3.5 py-2.5 text-sm font-bold rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-950 dark:text-white placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-500 pointer-events-none">
                    điểm
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-semibold text-gray-600 dark:text-gray-400 mr-0.5">
                  {lang === 'vi' ? 'Chọn nhanh:' : 'Quick:'}
                </span>
                {[7.5, 8.0, 8.5, 9.0, 9.5, 10].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setTargetScoreInput(String(preset))}
                    className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                      Number(targetScoreInput) === preset && targetScoreInput !== ''
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-emerald-50 hover:text-emerald-800 dark:hover:bg-emerald-950/40'
                    }`}
                  >
                    {preset}đ
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
                {targetScoreInput !== '' ? (
                  <button
                    type="button"
                    onClick={() => setTargetScoreInput('')}
                    className="text-xs font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 cursor-pointer"
                  >
                    {lang === 'vi' ? 'Xóa mục tiêu' : 'Clear target'}
                  </button>
                ) : (
                  <span />
                )}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setTargetEditItem(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                  >
                    {t.common.cancel}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-600/20 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{lang === 'vi' ? 'Lưu' : 'Save'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
