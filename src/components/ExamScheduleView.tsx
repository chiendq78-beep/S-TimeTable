import React, { useState, useMemo } from 'react';
import {
  NotebookPen,
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
  Table as TableIcon,
  LayoutGrid,
  ChevronsUpDown,
  ChevronsDownUp,
  X,
  Sparkles,
  Check,
  Save,
  Search,
} from 'lucide-react';
import { ExamItem, ExamFormat, Language } from '../types';
import { translations } from '../i18n/translations';
import { useSwipeToCloseModal } from '../hooks/useSwipeToCloseModal';

const PRESET_SUBJECTS = [
  'Toán học',
  'Ngữ văn',
  'Tiếng Anh',
  'Vật lý',
  'Hóa học',
  'Sinh học',
  'Lịch sử',
  'Địa lý',
  'Tin học',
  'GDCD / Kinh tế & Pháp luật',
  'Công nghệ',
  'GDQP & An ninh',
];

interface ExamScheduleViewProps {
  exams: ExamItem[];
  onSaveExams: (items: ExamItem[]) => void;
  lang: Language;
}

export const ExamScheduleView: React.FC<ExamScheduleViewProps> = ({
  exams,
  onSaveExams,
  lang,
}) => {
  const t = translations[lang];
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [editingItem, setEditingItem] = useState<ExamItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [collapsedSubjects, setCollapsedSubjects] = useState<Record<string, boolean>>({});
  const [openSubjectMenu, setOpenSubjectMenu] = useState<string | null>(null);
  const [reviewPopupItem, setReviewPopupItem] = useState<ExamItem | null>(null);

  // Swipe-to-close on mobile/tablet
  const { modalTouchHandlers } = useSwipeToCloseModal({
    isOpen: isModalOpen || !!reviewPopupItem,
    onClose: () => {
      setIsModalOpen(false);
      setEditingItem(null);
      setReviewPopupItem(null);
    },
  });
  const [hoveredTopicId, setHoveredTopicId] = useState<string | null>(null);

  // States for searchable Subject select dropdown
  const [subjectQuery, setSubjectQuery] = useState('');
  const [isSubjectDropdownOpen, setIsSubjectDropdownOpen] = useState(false);

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

  // Helper to calculate days remaining
  const getDaysRemaining = (dateStr: string, timeStr: string) => {
    const examTime = new Date(`${dateStr}T${timeStr}:00`).getTime();
    const now = new Date().getTime();
    const diffMs = examTime - now;
    if (diffMs < 0) {
      // Check if same day
      const examDate = new Date(dateStr).toDateString();
      const today = new Date().toDateString();
      return examDate === today ? 0 : -1;
    }
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return days;
  };

  // All available subjects combining preset and user-created
  const availableSubjects = useMemo(() => {
    const set = new Set<string>(PRESET_SUBJECTS);
    exams.forEach((ex) => {
      if (ex.subject && ex.subject.trim()) {
        set.add(ex.subject.trim());
      }
    });
    return Array.from(set);
  }, [exams]);

  // Filtered subjects for autocomplete combobox
  const matchingSubjects = useMemo(() => {
    const q = subjectQuery.trim().toLowerCase();
    if (!q) return availableSubjects;
    return availableSubjects.filter((s) => s.toLowerCase().includes(q));
  }, [availableSubjects, subjectQuery]);

  const handleDelete = (id: string) => {
    onSaveExams(exams.filter((i) => i.id !== id));
    if (reviewPopupItem?.id === id) {
      setReviewPopupItem(null);
    }
  };

  const handleOpenAdd = (defaultSubject?: string) => {
    const sub = defaultSubject || '';
    setSubjectQuery(sub);
    setIsSubjectDropdownOpen(false);
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
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: ExamItem) => {
    setEditingItem({ ...item });
    setSubjectQuery(item.subject || '');
    setIsSubjectDropdownOpen(false);
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

  const formatLabels: Record<ExamFormat, string> = {
    essay: t.exams.formats.essay,
    multiple_choice: t.exams.formats.multiple_choice,
    oral: t.exams.formats.oral,
    practice: t.exams.formats.practice,
  };

  const formatBadges: Record<ExamFormat, { bg: string; text: string; border: string }> = {
    multiple_choice: {
      bg: 'bg-purple-50 dark:bg-purple-950/40',
      text: 'text-purple-700 dark:text-purple-300',
      border: 'border-purple-200 dark:border-purple-800/60',
    },
    essay: {
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      text: 'text-amber-700 dark:text-amber-300',
      border: 'border-amber-200 dark:border-amber-800/60',
    },
    oral: {
      bg: 'bg-sky-50 dark:bg-sky-950/40',
      text: 'text-sky-700 dark:text-sky-300',
      border: 'border-sky-200 dark:border-sky-800/60',
    },
    practice: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      text: 'text-emerald-700 dark:text-emerald-300',
      border: 'border-emerald-200 dark:border-emerald-800/60',
    },
  };

  // Group exams by Subject
  const groupedExams = useMemo(() => {
    const map: Record<string, ExamItem[]> = {};
    exams.forEach((item) => {
      const key = item.subject.trim() || (lang === 'vi' ? 'Môn khác' : 'Other');
      if (!map[key]) map[key] = [];
      map[key].push(item);
    });

    // Sort items within each subject by date & time
    Object.keys(map).forEach((sub) => {
      map[sub].sort(
        (a, b) =>
          new Date(`${a.examDate}T${a.timeStart}`).getTime() -
          new Date(`${b.examDate}T${b.timeStart}`).getTime()
      );
    });

    // Sort subjects by earliest upcoming exam
    const sortedSubjects = Object.keys(map).sort((subA, subB) => {
      const earliestA = map[subA][0];
      const earliestB = map[subB][0];
      if (!earliestA) return 1;
      if (!earliestB) return -1;
      return (
        new Date(`${earliestA.examDate}T${earliestA.timeStart}`).getTime() -
        new Date(`${earliestB.examDate}T${earliestB.timeStart}`).getTime()
      );
    });

    return { map, subjects: sortedSubjects };
  }, [exams, lang]);

  // Toggle single subject accordion
  const toggleSubject = (subject: string) => {
    setCollapsedSubjects((prev) => ({
      ...prev,
      [subject]: !prev[subject],
    }));
  };

  // Collapse all or Expand all
  const allCollapsed = groupedExams.subjects.length > 0 && groupedExams.subjects.every((s) => collapsedSubjects[s]);
  const handleToggleAll = () => {
    if (allCollapsed) {
      setCollapsedSubjects({});
    } else {
      const nextState: Record<string, boolean> = {};
      groupedExams.subjects.forEach((s) => {
        nextState[s] = true;
      });
      setCollapsedSubjects(nextState);
    }
  };

  // Sort by upcoming date for card view
  const sortedExams = useMemo(() => {
    return [...exams].sort(
      (a, b) =>
        new Date(`${a.examDate}T${a.timeStart}`).getTime() -
        new Date(`${b.examDate}T${b.timeStart}`).getTime()
    );
  }, [exams]);

  return (
    <div className="space-y-3.5 sm:space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 bg-white dark:bg-gray-900 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs">
        <div className="shrink-0">
          <h2 className="text-base sm:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 whitespace-nowrap">
            <NotebookPen className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
            {t.exams.title}
          </h2>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 flex-nowrap overflow-x-auto no-scrollbar">
          {/* View Mode Switcher */}
          <div className="flex items-center p-0.5 sm:p-1 bg-gray-100 dark:bg-gray-800/80 rounded-xl border border-gray-200 dark:border-gray-700/60 text-xs font-semibold shrink-0">
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-gray-900 text-rose-600 dark:text-rose-400 shadow-xs font-bold'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
              title={t.exams.tableView}
            >
              <TableIcon className="w-3.5 h-3.5 shrink-0" />
              <span>{t.exams.tableView}</span>
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
                viewMode === 'cards'
                  ? 'bg-white dark:bg-gray-900 text-rose-600 dark:text-rose-400 shadow-xs font-bold'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
              title={t.exams.cardView}
            >
              <LayoutGrid className="w-3.5 h-3.5 shrink-0" />
              <span>{t.exams.cardView}</span>
            </button>
          </div>

          <button
            id="add-exam-btn"
            onClick={() => handleOpenAdd()}
            className="flex items-center gap-1 sm:gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 shadow-sm shadow-rose-500/20 transition-all active:scale-[0.98] shrink-0 whitespace-nowrap"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>{t.exams.addExam}</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: ACCORDION / GROUPED TABLE BY SUBJECT */}
      {viewMode === 'table' ? (
        <div className="space-y-3">
          {/* Quick Sub-header Controls */}
          {groupedExams.subjects.length > 0 && (
            <div className="flex items-center justify-between px-1 text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <span>
                  {lang === 'vi'
                    ? `Tổng cộng ${groupedExams.subjects.length} môn • ${exams.length} bài thi`
                    : `Total ${groupedExams.subjects.length} subjects • ${exams.length} exams`}
                </span>
              </div>
              <button
                onClick={handleToggleAll}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                {allCollapsed ? (
                  <>
                    <ChevronsUpDown className="w-3.5 h-3.5" />
                    <span>{t.exams.expandAll}</span>
                  </>
                ) : (
                  <>
                    <ChevronsDownUp className="w-3.5 h-3.5" />
                    <span>{t.exams.collapseAll}</span>
                  </>
                )}
              </button>
            </div>
          )}

          {groupedExams.subjects.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 text-center border border-gray-200 dark:border-gray-800 shadow-xs">
              <NotebookPen className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {lang === 'vi' ? 'Chưa có lịch thi nào được tạo' : 'No exam schedule created yet'}
              </p>
              <button
                onClick={() => handleOpenAdd()}
                className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>{t.exams.addExam}</span>
              </button>
            </div>
          ) : (
            groupedExams.subjects.map((subject) => {
              const subjectExams = groupedExams.map[subject] || [];
              const isCollapsed = !!collapsedSubjects[subject];

              return (
                <div
                  key={subject}
                  className="bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs overflow-hidden transition-all"
                >
                  {/* Subject Accordion Header */}
                  <div
                    onClick={() => toggleSubject(subject)}
                    className="w-full flex items-center justify-between gap-3 p-3.5 sm:p-4 bg-gray-50/75 dark:bg-gray-800/40 hover:bg-gray-100/70 dark:hover:bg-gray-800/70 cursor-pointer select-none transition-colors border-b border-gray-100 dark:border-gray-800/60"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-6 h-6 rounded-md bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                        {isCollapsed ? (
                          <ChevronRight className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                      <span className="font-bold text-sm sm:text-base text-gray-900 dark:text-white truncate">
                        {subject}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/50">
                        {subjectExams.length} {lang === 'vi' ? 'bài thi' : 'exams'}
                      </span>
                    </div>

                    {/* Right Actions on Subject Header - Chỉ để biểu tượng Sửa và Xóa cho gọn */}
                    <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                      {subjectExams.length === 1 ? (
                        <>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEdit(subjectExams[0]);
                            }}
                            className="p-1.5 rounded-lg text-indigo-600 dark:text-indigo-400 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors shadow-2xs active:scale-[0.95]"
                            title={t.common.edit}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(subjectExams[0].id);
                            }}
                            className="p-1.5 rounded-lg text-rose-600 dark:text-rose-400 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:border-rose-300 dark:hover:border-rose-700 transition-colors shadow-2xs active:scale-[0.95]"
                            title={t.common.delete}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <div className="relative">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenSubjectMenu(openSubjectMenu === subject ? null : subject);
                            }}
                            className="inline-flex items-center gap-1 p-1.5 rounded-lg bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 border border-gray-200 dark:border-gray-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors shadow-2xs active:scale-[0.95]"
                            title={lang === 'vi' ? 'Sửa hoặc xóa bài thi' : 'Edit or delete exam'}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <ChevronDown className="w-3 h-3 text-gray-400" />
                          </button>

                          {openSubjectMenu === subject && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="absolute right-0 top-full mt-1.5 z-40 w-72 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-800 p-2 space-y-1 animate-in fade-in zoom-in-95 duration-100"
                            >
                              <div className="text-[11px] font-bold text-gray-500 dark:text-gray-400 px-2 py-1 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                                <span>{lang === 'vi' ? 'Chọn bài thi cần thao tác:' : 'Select exam:'}</span>
                                <button
                                  type="button"
                                  onClick={() => setOpenSubjectMenu(null)}
                                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-0.5"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                              {subjectExams.map((ex) => (
                                <div
                                  key={ex.id}
                                  className="flex items-center justify-between gap-2 p-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors"
                                >
                                  <div className="min-w-0 pr-1 text-left">
                                    <div className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">
                                      {ex.examName}
                                    </div>
                                    <div className="text-[10px] text-gray-500 dark:text-gray-400">
                                      {formatDateVN(ex.examDate)} - {ex.timeStart}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1 shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenSubjectMenu(null);
                                        handleOpenEdit(ex);
                                      }}
                                      className="p-1 text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/60 rounded"
                                      title={t.common.edit}
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenSubjectMenu(null);
                                        handleDelete(ex.id);
                                      }}
                                      className="p-1 text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/60 rounded"
                                      title={t.common.delete}
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Accordion Content: Table of Exams for this Subject */}
                  {!isCollapsed && (
                    <div>
                      {/* Mobile View: Cards for each exam with Sửa / Xóa at top */}
                      <div className="block sm:hidden divide-y divide-gray-100 dark:divide-gray-800/60">
                        {subjectExams.map((item) => {
                          const daysLeft = getDaysRemaining(item.examDate, item.timeStart);
                          const badgeConfig = formatBadges[item.format];

                          return (
                            <div key={item.id} className="p-3.5 space-y-2.5 bg-white dark:bg-gray-900">
                              {/* Top Bar of Mobile Exam: Name + Actions right at top */}
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <div className="font-bold text-gray-900 dark:text-white text-xs leading-snug">
                                    {item.examName}
                                  </div>
                                  <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                                    <span
                                      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border ${badgeConfig.bg} ${badgeConfig.text} ${badgeConfig.border}`}
                                    >
                                      {formatLabels[item.format]}
                                    </span>
                                    <span
                                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                        daysLeft === 0
                                          ? 'bg-rose-600 text-white animate-pulse'
                                          : daysLeft > 0 && daysLeft <= 3
                                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                          : daysLeft > 3
                                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                                          : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                                      }`}
                                    >
                                      <Timer className="w-3 h-3" />
                                      {daysLeft === 0
                                        ? t.exams.today
                                        : daysLeft > 0
                                        ? `${lang === 'vi' ? 'Còn' : ''} ${daysLeft} ${lang === 'vi' ? 'ngày' : 'days left'}`
                                        : t.exams.passed}
                                    </span>
                                  </div>
                                </div>

                                {/* Actions right on top */}
                                <div className="flex items-center gap-1 shrink-0 bg-gray-50 dark:bg-gray-800 p-1 rounded-lg border border-gray-100 dark:border-gray-700/60">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleOpenEdit(item);
                                    }}
                                    className="p-1.5 text-indigo-600 dark:text-indigo-400 hover:bg-white dark:hover:bg-gray-700 rounded transition-colors"
                                    title={t.common.edit}
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDelete(item.id)}
                                    className="p-1.5 text-rose-600 dark:text-rose-400 hover:bg-white dark:hover:bg-gray-700 rounded transition-colors"
                                    title={t.common.delete}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              {/* Mobile Exam Info */}
                              <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-300 pt-1">
                                <div className="flex items-center gap-1.5">
                                  <Calendar className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                  <span className="truncate">{formatDateVN(item.examDate)} - {item.timeStart}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                  <span className="truncate">{item.room}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <IdCard className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                                  <span className="font-mono text-[11px] truncate">{item.candidateNumber}</span>
                                </div>
                              </div>

                              {item.reviewTopics && (
                                <div
                                  onClick={() => setReviewPopupItem(item)}
                                  className="text-xs bg-gray-50 dark:bg-gray-800/60 p-2 rounded-lg border border-gray-100 dark:border-gray-800 cursor-pointer hover:border-indigo-200 transition-colors"
                                >
                                  <span className="font-semibold text-gray-700 dark:text-gray-300 mr-1">
                                    {t.exams.reviewTopics}:
                                  </span>
                                  <span className="text-gray-600 dark:text-gray-400 line-clamp-1">
                                    {item.reviewTopics}
                                  </span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Tablet/Desktop Table View */}
                      <div className="hidden sm:block overflow-x-auto">
                        <table className="w-full text-left text-xs text-gray-600 dark:text-gray-300 min-w-[760px]">
                        <thead>
                          <tr className="bg-gray-50/50 dark:bg-gray-800/20 text-gray-500 dark:text-gray-400 uppercase text-[10px] tracking-wider font-bold border-b border-gray-200/80 dark:border-gray-800">
                            <th className="py-2.5 px-3.5 sm:px-4 w-[26%]">
                              {t.exams.tableHeaders.testNameFormat}
                            </th>
                            <th className="py-2.5 px-3 w-[24%]">
                              {t.exams.tableHeaders.timeCountdown}
                            </th>
                            <th className="py-2.5 px-3 w-[20%]">
                              {t.exams.tableHeaders.locationSbd}
                            </th>
                            <th className="py-2.5 px-3 w-[10%] text-center">
                              {t.exams.tableHeaders.target}
                            </th>
                            <th className="py-2.5 px-3.5 sm:px-4 w-[20%]">
                              {t.exams.tableHeaders.reviewFocus}
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
                          {subjectExams.map((item) => {
                            const daysLeft = getDaysRemaining(item.examDate, item.timeStart);
                            const badgeConfig = formatBadges[item.format];

                            return (
                              <tr
                                key={item.id}
                                className="hover:bg-gray-50/75 dark:hover:bg-gray-800/30 transition-colors group"
                              >
                                {/* Cột 1: Tên bài kiểm tra / Hình thức */}
                                <td className="py-3 px-3.5 sm:px-4">
                                  <div className="font-semibold text-gray-900 dark:text-white text-xs sm:text-[13px] leading-snug">
                                    {item.examName}
                                  </div>
                                  <div className="mt-1">
                                    <span
                                      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border ${badgeConfig.bg} ${badgeConfig.text} ${badgeConfig.border}`}
                                    >
                                      {formatLabels[item.format]}
                                    </span>
                                  </div>
                                </td>

                                {/* Cột 2: Thời gian & Đếm ngược */}
                                <td className="py-3 px-3">
                                  <div className="font-medium text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                    <span>
                                      {formatDateVN(item.examDate)} - {item.timeStart}
                                    </span>
                                  </div>
                                  <div className="mt-1 flex items-center gap-2 flex-wrap text-[11px]">
                                    <span className="text-gray-500 dark:text-gray-400">
                                      {item.durationMinutes} {lang === 'vi' ? 'phút' : 'mins'}
                                    </span>
                                    <span className="text-gray-300 dark:text-gray-600">•</span>
                                    <span
                                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                        daysLeft === 0
                                          ? 'bg-rose-600 text-white animate-pulse'
                                          : daysLeft > 0 && daysLeft <= 3
                                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                          : daysLeft > 3
                                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                                          : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                                      }`}
                                    >
                                      <Timer className="w-3 h-3" />
                                      {daysLeft === 0
                                        ? t.exams.today
                                        : daysLeft > 0
                                        ? `${lang === 'vi' ? 'Còn' : ''} ${daysLeft} ${lang === 'vi' ? 'ngày' : 'days left'}`
                                        : t.exams.passed}
                                    </span>
                                  </div>
                                </td>

                                {/* Cột 3: Địa điểm & SBD */}
                                <td className="py-3 px-3">
                                  <div className="flex items-center gap-1 text-gray-800 dark:text-gray-200 truncate font-medium">
                                    <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                    <span className="truncate">{item.room}</span>
                                  </div>
                                  <div className="mt-1 flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400">
                                    <IdCard className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                                    <span className="font-mono bg-gray-100 dark:bg-gray-800 px-1.5 py-0.2 rounded font-medium">
                                      {item.candidateNumber}
                                    </span>
                                  </div>
                                </td>

                                {/* Cột 4: Mục tiêu */}
                                <td className="py-3 px-3 text-center">
                                  {item.targetScore !== undefined ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-bold text-xs border border-emerald-200/60 dark:border-emerald-800/50">
                                      <Target className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                      {item.targetScore}đ
                                    </span>
                                  ) : (
                                    <span className="text-gray-400 dark:text-gray-600">—</span>
                                  )}
                                </td>

                                {/* Cột 5: Trọng tâm ôn tập */}
                                <td className="py-3 px-3 relative">
                                  {item.reviewTopics ? (
                                    <div
                                      className="relative group/topic cursor-pointer"
                                      onMouseEnter={() => setHoveredTopicId(item.id)}
                                      onMouseLeave={() => setHoveredTopicId(null)}
                                      onClick={() => setReviewPopupItem(item)}
                                    >
                                      <div className="flex items-center gap-1">
                                        <span className="truncate max-w-[130px] lg:max-w-[180px] text-gray-700 dark:text-gray-300">
                                          {item.reviewTopics}
                                        </span>
                                        <span
                                          className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 font-bold text-xs underline decoration-dotted shrink-0"
                                          title={lang === 'vi' ? 'Bấm để xem đầy đủ trọng tâm ôn tập' : 'Click to view full topics'}
                                        >
                                          ...
                                        </span>
                                      </div>

                                      {/* Desktop Hover Tooltip */}
                                      {hoveredTopicId === item.id && (
                                        <div className="absolute bottom-full left-0 mb-2 z-40 w-64 p-3 bg-gray-900 text-white dark:bg-gray-800 dark:text-gray-100 rounded-xl shadow-xl border border-gray-700 text-xs pointer-events-none transition-all">
                                          <div className="font-semibold text-rose-300 flex items-center gap-1 mb-1">
                                            <BookOpen className="w-3.5 h-3.5" />
                                            <span>{t.exams.reviewTopics}:</span>
                                          </div>
                                          <p className="leading-relaxed whitespace-pre-wrap font-normal">
                                            {item.reviewTopics}
                                          </p>
                                          <div className="absolute top-full left-5 -mt-1 border-4 border-transparent border-t-gray-900 dark:border-t-gray-800" />
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-gray-400 dark:text-gray-600">—</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* VIEW 2: CARDS GRID (DANH SÁCH THẺ GỐC) */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sortedExams.map((item) => {
            const daysLeft = getDaysRemaining(item.examDate, item.timeStart);
            return (
              <div
                key={item.id}
                className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-200 dark:border-gray-800 hover:border-rose-300 dark:hover:border-rose-900 transition-all shadow-xs flex flex-col justify-between relative overflow-hidden"
              >
                {/* Countdown Top Ribbon */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-extrabold text-gray-900 dark:text-white">
                      {item.subject}
                    </span>
                    <span className="text-xs px-2.5 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-medium">
                      {item.examName}
                    </span>
                  </div>

                  {/* Countdown Badge */}
                  <div
                    className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-xl shrink-0 ${
                      daysLeft === 0
                        ? 'bg-rose-600 text-white animate-pulse'
                        : daysLeft > 0 && daysLeft <= 3
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                        : daysLeft > 3
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                        : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                    }`}
                  >
                    <Timer className="w-3.5 h-3.5" />
                    <span>
                      {daysLeft === 0
                        ? t.exams.today
                        : daysLeft > 0
                        ? `${daysLeft} ${lang === 'vi' ? 'ngày nữa' : 'days left'}`
                        : t.exams.passed}
                    </span>
                  </div>
                </div>

                {/* Exam Info */}
                <div className="space-y-2 text-xs text-gray-600 dark:text-gray-300">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="flex items-center gap-1 font-semibold text-gray-800 dark:text-gray-200">
                      <Calendar className="w-3.5 h-3.5 text-rose-500" />
                      {formatDateVN(item.examDate)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-blue-500" />
                      {item.timeStart} ({item.durationMinutes} phút)
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                      {item.room}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap pt-1">
                    <span className="flex items-center gap-1">
                      <IdCard className="w-3.5 h-3.5 text-indigo-500" />
                      <span className="font-mono font-medium">{item.candidateNumber}</span>
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 font-semibold text-[11px]">
                      {formatLabels[item.format]}
                    </span>
                  </div>

                  {item.reviewTopics && (
                    <div className="mt-2 text-xs bg-gray-50 dark:bg-gray-800/60 p-2.5 rounded-xl border border-gray-100 dark:border-gray-800">
                      <div className="font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1 mb-1">
                        <BookOpen className="w-3 h-3 text-blue-500" />
                        <span>{t.exams.reviewTopics}:</span>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                        {item.reviewTopics}
                      </p>
                    </div>
                  )}
                </div>

                {/* Bottom Actions */}
                <div className="flex items-center justify-end pt-4 mt-4 border-t border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        handleOpenEdit(item);
                      }}
                      className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      title={t.common.edit}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title={t.common.delete}
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
                  <div className="relative">
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 flex items-center justify-between">
                      <span>{t.periods.subject} <span className="text-red-500">*</span></span>
                      <span className="text-[10px] text-blue-600 dark:text-blue-400 font-normal">Gõ tìm hoặc chọn</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={editingItem.subject}
                        onFocus={() => {
                          setSubjectQuery(editingItem.subject || '');
                          setIsSubjectDropdownOpen(true);
                        }}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSubjectQuery(val);
                          setEditingItem({ ...editingItem, subject: val });
                          setIsSubjectDropdownOpen(true);
                        }}
                        placeholder={t.exams.selectSubjectPlaceholder || 'Toán học, Tiếng Anh...'}
                        className="w-full pl-3 pr-9 py-2.5 text-xs sm:text-[13px] rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-rose-500 transition-colors"
                      />
                      <button
                        type="button"
                        tabIndex={-1}
                        onClick={() => setIsSubjectDropdownOpen(!isSubjectDropdownOpen)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer"
                      >
                        <ChevronDown className={`w-4 h-4 transition-transform duration-150 ${isSubjectDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>
                    </div>

                    {/* Autocomplete / Select Dropdown */}
                    {isSubjectDropdownOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-30"
                          onClick={() => setIsSubjectDropdownOpen(false)}
                        />
                        <div className="absolute left-0 right-0 top-full mt-1.5 z-40 bg-white dark:bg-gray-850 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl max-h-52 overflow-y-auto py-1 animate-in fade-in zoom-in-95 duration-100">
                          {matchingSubjects.map((sub) => (
                            <button
                              key={sub}
                              type="button"
                              onClick={() => {
                                setEditingItem({ ...editingItem, subject: sub });
                                setSubjectQuery(sub);
                                setIsSubjectDropdownOpen(false);
                              }}
                              className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer ${
                                editingItem.subject === sub
                                  ? 'bg-rose-50/70 dark:bg-rose-950/60 font-bold text-rose-700 dark:text-rose-300'
                                  : 'text-gray-700 dark:text-gray-300'
                              }`}
                            >
                              <span>{sub}</span>
                              {editingItem.subject === sub && <Check className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />}
                            </button>
                          ))}

                          {/* Quick Option to Add Custom Subject */}
                          {subjectQuery.trim() && !availableSubjects.some((s) => s.toLowerCase() === subjectQuery.trim().toLowerCase()) && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingItem({ ...editingItem, subject: subjectQuery.trim() });
                                setIsSubjectDropdownOpen(false);
                              }}
                              className="w-full text-left px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border-t border-gray-100 dark:border-gray-800 flex items-center gap-1.5 cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>{t.exams.addNewSubject || 'Thêm môn'}: "{subjectQuery.trim()}"</span>
                            </button>
                          )}
                        </div>
                      </>
                    )}
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
                </div>

                {/* HÀNG 5: TRỌNG TÂM ÔN TẬP */}
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
    </div>
  );
};
