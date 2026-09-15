import React, { useState, useMemo } from 'react';
import {
  Award,
  Plus,
  Edit2,
  Trash2,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  BookOpen,
  BarChart2,
  BarChart3,
  X,
  FileText,
  Download,
  ChevronDown,
  ChevronUp,
  Target,
  ArrowUpRight,
} from 'lucide-react';
import { SubjectGrade, StudentProfile, Language } from '../types';
import { translations } from '../i18n/translations';
import { GradeReportPdfModal } from './GradeReportPdfModal';
import { useSwipeToCloseModal } from '../hooks/useSwipeToCloseModal';

interface GradebookViewProps {
  grades: SubjectGrade[];
  onSaveGrades: (items: SubjectGrade[]) => void;
  lang: Language;
  profile?: StudentProfile;
}

export const GradebookView: React.FC<GradebookViewProps> = ({
  grades,
  onSaveGrades,
  lang,
  profile,
}) => {
  const t = translations[lang];
  const [selectedSemester, setSelectedSemester] = useState<'sem1' | 'sem2' | 'fullYear'>('sem1');
  const [editingItem, setEditingItem] = useState<SubjectGrade | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  // Swipe-to-close on mobile/tablet
  const { modalTouchHandlers } = useSwipeToCloseModal({
    isOpen: isModalOpen,
    onClose: () => {
      setIsModalOpen(false);
      setEditingItem(null);
    },
  });
  const [oralInput, setOralInput] = useState<string>('');
  const [quiz15Input, setQuiz15Input] = useState<string>('');
  const [showAllStrong, setShowAllStrong] = useState(false);

  // Helper to parse comma/semicolon/space-separated scores list
  const parseScoreList = (val: string): number[] => {
    if (!val || !val.trim()) return [];

    // If user used semicolons: e.g. "8.5; 9; 10" or "8,5; 9,5"
    if (val.includes(';')) {
      return val
        .split(';')
        .map((s) => s.trim().replace(',', '.'))
        .map((s) => parseFloat(s))
        .filter((n) => !isNaN(n) && n >= 0 && n <= 10);
    }

    // If user used commas: e.g. "9, 9.5, 10" or "9.5, 10"
    if (val.includes(',')) {
      return val
        .split(',')
        .map((s) => s.trim())
        .map((s) => parseFloat(s))
        .filter((n) => !isNaN(n) && n >= 0 && n <= 10);
    }

    // Fallback to whitespace separation: e.g. "9 9.5 10"
    return val
      .trim()
      .split(/\s+/)
      .map((s) => s.trim().replace(',', '.'))
      .map((s) => parseFloat(s))
      .filter((n) => !isNaN(n) && n >= 0 && n <= 10);
  };

  // Helper to calculate subject average
  const calculateSubjectAverage = (g: SubjectGrade): number => {
    let totalScore = 0;
    let totalWeight = 0;

    // Oral scores (weight 1)
    g.oralScores.forEach((s) => {
      totalScore += s * 1;
      totalWeight += 1;
    });

    // 15-min quizzes (weight 1)
    g.quiz15Scores.forEach((s) => {
      totalScore += s * 1;
      totalWeight += 1;
    });

    // Midterm (weight 2)
    if (g.midTermScore !== null && g.midTermScore !== undefined) {
      totalScore += g.midTermScore * 2;
      totalWeight += 2;
    }

    // Final (weight 3)
    if (g.finalScore !== null && g.finalScore !== undefined) {
      totalScore += g.finalScore * 3;
      totalWeight += 3;
    }

    if (totalWeight === 0) return 0;
    return Math.round((totalScore / totalWeight) * 10) / 10;
  };

  // Convert 10-point scale to 4.0 GPA
  const convertTo4Scale = (score10: number): number => {
    if (score10 >= 9.0) return 4.0;
    if (score10 >= 8.5) return 3.7;
    if (score10 >= 8.0) return 3.5;
    if (score10 >= 7.0) return 3.0;
    if (score10 >= 6.5) return 2.5;
    if (score10 >= 5.5) return 2.0;
    if (score10 >= 5.0) return 1.5;
    if (score10 >= 4.0) return 1.0;
    return 0.0;
  };

  // Standardized 4-tier color system based on user specs:
  // >= 9.0 (Excellent): Emerald/Green
  // 8.0 - 8.9 (Good): Blue
  // 6.5 - 7.9 (Fair / Needs improvement warning): Orange/Amber
  // < 6.5 (Weak): Red/Rose
  const getGradeTheme = (avg: number) => {
    if (avg >= 9.0) {
      return {
        level: 'excellent',
        label: lang === 'vi' ? 'Xuất sắc' : 'Excellent',
        barGrad: 'from-emerald-600 to-teal-400 dark:from-emerald-700 dark:to-teal-400',
        barHover: 'group-hover:from-emerald-500 group-hover:to-teal-300',
        badgeBg: 'bg-emerald-500 text-white dark:bg-emerald-600',
        badgeLight: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60',
        text: 'text-emerald-600 dark:text-emerald-400',
        ring: 'group-hover:ring-emerald-400',
      };
    }
    if (avg >= 8.0) {
      return {
        level: 'good',
        label: lang === 'vi' ? 'Giỏi' : 'Good',
        barGrad: 'from-blue-600 to-sky-400 dark:from-blue-700 dark:to-sky-400',
        barHover: 'group-hover:from-blue-500 group-hover:to-sky-300',
        badgeBg: 'bg-blue-500 text-white dark:bg-blue-600',
        badgeLight: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60',
        text: 'text-blue-600 dark:text-blue-400',
        ring: 'group-hover:ring-blue-400',
      };
    }
    if (avg >= 6.5) {
      return {
        level: 'fair',
        label: lang === 'vi' ? 'Khá' : 'Fair',
        barGrad: 'from-amber-600 to-orange-400 dark:from-amber-700 dark:to-orange-400',
        barHover: 'group-hover:from-amber-500 group-hover:to-orange-300',
        badgeBg: 'bg-orange-500 text-white dark:bg-orange-600',
        badgeLight: 'bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300 border border-orange-200 dark:border-orange-800/60',
        text: 'text-orange-600 dark:text-orange-400',
        ring: 'group-hover:ring-orange-400',
      };
    }
    return {
      level: 'weak',
      label: lang === 'vi' ? 'Cần cố gắng' : 'Needs Work',
      barGrad: 'from-rose-600 to-red-400 dark:from-rose-700 dark:to-red-400',
      barHover: 'group-hover:from-rose-500 group-hover:to-red-300',
      badgeBg: 'bg-rose-500 text-white dark:bg-rose-600',
      badgeLight: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60',
      text: 'text-rose-600 dark:text-rose-400',
      ring: 'group-hover:ring-rose-400',
    };
  };

  // Determine Academic Ranking
  const getAcademicRank = (gpa10: number): { label: string; color: string } => {
    if (gpa10 >= 9.0) return { label: t.grades.rankExcellent, color: 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50' };
    if (gpa10 >= 8.0) return { label: t.grades.rankGood, color: 'text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/50' };
    if (gpa10 >= 6.5) return { label: t.grades.rankFair, color: 'text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800/50' };
    if (gpa10 >= 5.0) return { label: t.grades.rankAverage, color: 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50' };
    return { label: t.grades.rankWeak, color: 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50' };
  };

  // Filter or compute current list based on semester
  const currentGrades = useMemo(() => {
    if (selectedSemester === 'fullYear') {
      // Map unique subjects, merging sem1 and sem2 if available
      const subjectMap = new Map<string, SubjectGrade>();
      grades.forEach((g) => {
        if (!subjectMap.has(g.subjectName)) {
          const s1 = grades.find((x) => x.subjectName === g.subjectName && x.semester === 'sem1');
          const s2 = grades.find((x) => x.subjectName === g.subjectName && x.semester === 'sem2');
          if (s1 && s2) {
            const avg1 = calculateSubjectAverage(s1);
            const avg2 = calculateSubjectAverage(s2);
            // Consolidated full year: (HK1 + HK2 * 2) / 3
            const fullYearScore = Math.round(((avg1 + avg2 * 2) / 3) * 10) / 10;
            subjectMap.set(g.subjectName, {
              ...s2,
              id: `full-${g.subjectName}`,
              midTermScore: avg1,
              finalScore: avg2,
              oralScores: [],
              quiz15Scores: [],
            });
          } else {
            subjectMap.set(g.subjectName, g);
          }
        }
      });
      return Array.from(subjectMap.values());
    }

    const filtered = grades.filter((g) => g.semester === selectedSemester);
    return filtered.length > 0 ? filtered : grades.filter((g) => g.semester === 'sem1');
  }, [grades, selectedSemester]);

  // Helper to get display subject average (supports full year calculation)
  const getDisplaySubjectAverage = (g: SubjectGrade): number => {
    if (selectedSemester === 'fullYear') {
      const s1 = grades.find((x) => x.subjectName === g.subjectName && x.semester === 'sem1');
      const s2 = grades.find((x) => x.subjectName === g.subjectName && x.semester === 'sem2');
      if (s1 && s2) {
        const avg1 = calculateSubjectAverage(s1);
        const avg2 = calculateSubjectAverage(s2);
        return Math.round(((avg1 + avg2 * 2) / 3) * 10) / 10;
      }
    }
    return calculateSubjectAverage(g);
  };

  // Calculate weighted overall average
  let totalWeightedScore = 0;
  let totalCoefficient = 0;

  currentGrades.forEach((g) => {
    const avg = getDisplaySubjectAverage(g);
    totalWeightedScore += avg * (g.coefficient || 1);
    totalCoefficient += g.coefficient || 1;
  });

  const overallAverage10 =
    totalCoefficient > 0
      ? Math.round((totalWeightedScore / totalCoefficient) * 10) / 10
      : 0;
  const overallGpa4 = convertTo4Scale(overallAverage10);
  const rank = getAcademicRank(overallAverage10);

  // Identify strong subjects (>= 8.5) and need improvement (< 8.0)
  const strongSubjects = currentGrades
    .filter((g) => getDisplaySubjectAverage(g) >= 8.5)
    .sort((a, b) => getDisplaySubjectAverage(b) - getDisplaySubjectAverage(a));

  const weakSubjects = currentGrades
    .filter((g) => getDisplaySubjectAverage(g) < 8.0)
    .sort((a, b) => getDisplaySubjectAverage(a) - getDisplaySubjectAverage(b));

  const handleDelete = (id: string) => {
    onSaveGrades(grades.filter((g) => g.id !== id));
  };

  const handleOpenAdd = () => {
    setEditingItem({
      id: `gr-${Date.now()}`,
      subjectName: '',
      coefficient: 1,
      semester: selectedSemester === 'sem2' ? 'sem2' : 'sem1',
      oralScores: [9.0],
      quiz15Scores: [8.5],
      midTermScore: 8.5,
      finalScore: 9.0,
    });
    setOralInput('9');
    setQuiz15Input('8.5');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (g: SubjectGrade) => {
    setEditingItem(g);
    setOralInput(g.oralScores && g.oralScores.length > 0 ? g.oralScores.join(', ') : '');
    setQuiz15Input(g.quiz15Scores && g.quiz15Scores.length > 0 ? g.quiz15Scores.join(', ') : '');
    setIsModalOpen(true);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editingItem.subjectName.trim()) return;

    const parsedOral = parseScoreList(oralInput);
    const parsedQuiz15 = parseScoreList(quiz15Input);

    const itemToSave: SubjectGrade = {
      ...editingItem,
      oralScores: parsedOral,
      quiz15Scores: parsedQuiz15,
    };

    const exists = grades.some((i) => i.id === itemToSave.id);
    if (exists) {
      onSaveGrades(grades.map((i) => (i.id === itemToSave.id ? itemToSave : i)));
    } else {
      onSaveGrades([...grades, itemToSave]);
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
            <Award className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            {t.grades.title}
          </h2>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 w-full sm:w-auto">
          {/* Semester Selector */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-800 p-0.5 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-semibold self-start sm:self-auto">
            <button
              onClick={() => setSelectedSemester('sem1')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                selectedSemester === 'sem1'
                  ? 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-xs'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              {t.grades.semester1}
            </button>
            <button
              onClick={() => setSelectedSemester('sem2')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                selectedSemester === 'sem2'
                  ? 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-xs'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              {t.grades.semester2}
            </button>
            <button
              onClick={() => setSelectedSemester('fullYear')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                selectedSemester === 'fullYear'
                  ? 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-xs'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              {t.grades.fullYear}
            </button>
          </div>

          {/* Action Buttons: on mobile, space-between with Add button on the right */}
          <div className="flex items-center justify-between sm:justify-start gap-2 w-full sm:w-auto">
            {/* Export PDF Report Button */}
            <button
              id="export-grade-pdf-btn"
              type="button"
              onClick={() => setIsPdfModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-gray-800 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-950/40 shadow-2xs transition-all active:scale-[0.98]"
              title={lang === 'vi' ? 'Xuất báo cáo học tập & bảng điểm PDF gửi phụ huynh' : 'Export Grade Report & Transcript to PDF'}
            >
              <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>{lang === 'vi' ? 'Xuất Báo cáo' : 'Export Report'}</span>
            </button>

            <button
              id="add-subject-grade-btn"
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-purple-600 text-white hover:bg-purple-700 shadow-sm shadow-purple-500/20 transition-all active:scale-[0.98] sm:ml-auto"
            >
              <Plus className="w-4 h-4" />
              <span>{lang === 'vi' ? 'Thêm' : 'Add'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-3 gap-2 sm:gap-4">
        <div className="bg-white dark:bg-gray-900 px-3.5 py-2 sm:px-5 sm:py-4 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xs flex items-center gap-2.5 sm:gap-4">
          <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-2xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Award className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
          <div className="flex-1 min-w-0 flex items-center justify-between gap-2 sm:gap-3">
            <span className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 truncate">
              {selectedSemester === 'fullYear' ? t.grades.fullYearAverage : t.grades.averageScore}
            </span>
            <div className="text-base sm:text-xl font-black text-gray-900 dark:text-white flex items-baseline gap-1 shrink-0">
              {overallAverage10} <span className="text-[11px] sm:text-xs font-semibold text-gray-400">/ 10</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 px-3.5 py-2 sm:px-5 sm:py-4 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xs flex items-center gap-2.5 sm:gap-4">
          <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <TrendingUp className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
          <div className="flex-1 min-w-0 flex items-center justify-between gap-2 sm:gap-3">
            <span className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 truncate">
              {t.grades.convertedGPA}
            </span>
            <div className="text-base sm:text-xl font-black text-blue-600 dark:text-blue-400 flex items-baseline gap-1 shrink-0">
              {overallGpa4.toFixed(2)} <span className="text-[11px] sm:text-xs font-semibold text-gray-400">/ 4.0</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 px-3.5 py-2 sm:px-5 sm:py-4 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xs flex items-center gap-2.5 sm:gap-4">
          <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
          <div className="flex-1 min-w-0 flex items-center justify-between gap-2 sm:gap-3">
            <span className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 truncate">
              {t.grades.academicRank}
            </span>
            <div className="shrink-0">
              <span className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg text-[11px] sm:text-xs font-extrabold ${rank.color}`}>
                {rank.label}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Vertical Column Chart Visualization - Clean White Theme */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 sm:p-6 border border-gray-200 dark:border-gray-800 shadow-xs relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-4 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800/60 shadow-2xs">
              <BarChart3 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="font-bold text-sm text-gray-900 dark:text-white">
              {lang === 'vi' ? 'Biểu Đồ Cột Điểm Các Môn Học' : 'Subject GPA Column Chart'}
            </h3>
          </div>
        </div>

        {/* Vertical Chart Canvas with Y-Axis and Guide Lines */}
        <div className="relative z-10 pt-8 pb-4">
          <div className="relative flex">
            {/* Y-Axis scale numbers on the left */}
            <div className="w-8 sm:w-10 shrink-0 h-64 flex flex-col justify-between text-[10px] font-bold text-gray-400 dark:text-gray-500 pr-2 select-none border-r border-gray-200 dark:border-gray-800">
              <span className="leading-none text-right">10</span>
              <span className="leading-none text-right">8.0</span>
              <span className="leading-none text-right">6.5</span>
              <span className="leading-none text-right">5.0</span>
              <span className="leading-none text-right">2.0</span>
              <span className="leading-none text-right">0</span>
            </div>

            {/* Chart Columns Area */}
            <div className="relative flex-1 h-64 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800">
              {/* Benchmark Reference Lines (Grid) */}
              <div className="absolute inset-0 pointer-events-none flex flex-col justify-between">
                {/* 10.0 */}
                <div className="w-full border-b border-gray-100 dark:border-gray-800/60" />
                {/* 8.0 */}
                <div className="w-full border-b border-dashed border-blue-300/80 dark:border-blue-700/60" />
                {/* 6.5 */}
                <div className="w-full border-b border-dashed border-orange-300/70 dark:border-orange-700/50" />
                {/* 5.0 */}
                <div className="w-full border-b border-gray-100 dark:border-gray-800/40" />
                {/* 2.0 */}
                <div className="w-full border-b border-gray-100 dark:border-gray-800/30" />
                {/* Base 0 */}
                <div className="w-full border-b-2 border-gray-200 dark:border-gray-700" />
              </div>

              {/* Columns Container */}
              <div className="absolute inset-0 flex items-end justify-around gap-4 sm:gap-6 px-4 min-w-max">
                {currentGrades.map((g) => {
                  const avg = getDisplaySubjectAverage(g);
                  const heightPercent = Math.min(100, Math.max(8, (avg / 10) * 100));
                  const theme = getGradeTheme(avg);

                  return (
                    <div
                      key={g.id}
                      onClick={() => handleOpenEdit(g)}
                      title={lang === 'vi' ? `Bấm để sửa điểm môn ${g.subjectName}` : `Click to edit ${g.subjectName}`}
                      className="group flex flex-col items-center justify-end h-full relative cursor-pointer pt-8 transition-transform min-w-[56px] sm:min-w-[64px]"
                    >
                      {/* Interactive Tooltip on Hover */}
                      <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center z-30 pointer-events-none transition-opacity">
                        <div className="bg-gray-900/95 dark:bg-gray-950/95 text-white text-[11px] rounded-xl px-3 py-2 shadow-xl border border-purple-500/30 backdrop-blur-md min-w-[130px] text-center">
                          <p className="font-bold text-white border-b border-gray-700/80 pb-1 mb-1 flex items-center justify-center gap-1">
                            <span>{g.subjectName}</span>
                          </p>
                          <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10px] text-gray-300">
                            <span>{lang === 'vi' ? 'Miệng:' : 'Oral:'}</span>
                            <span className="font-mono text-white text-right">{g.oralScores?.join(', ') || '—'}</span>
                            <span>{lang === 'vi' ? '15 phút:' : '15m:'}</span>
                            <span className="font-mono text-white text-right">{g.quiz15Scores?.join(', ') || '—'}</span>
                            <span>{lang === 'vi' ? 'Giữa kỳ:' : 'Mid:'}</span>
                            <span className="font-mono text-white text-right">{g.midTermScore ?? '—'}</span>
                            <span>{lang === 'vi' ? 'Cuối kỳ:' : 'Final:'}</span>
                            <span className="font-mono text-white text-right">{g.finalScore ?? '—'}</span>
                          </div>
                          <div className="mt-1.5 pt-1 border-t border-gray-700/80 flex items-center justify-between text-[10px]">
                            <span className="font-bold text-cyan-400">{lang === 'vi' ? 'ĐTB:' : 'Avg:'} {avg}</span>
                            <span className="text-purple-300 flex items-center gap-0.5 font-semibold text-[9px]">
                              <Edit2 className="w-2.5 h-2.5" />
                              {lang === 'vi' ? 'Sửa điểm' : 'Edit'}
                            </span>
                          </div>
                        </div>
                        <div className="w-2 h-2 bg-gray-900/95 rotate-45 -mt-1" />
                      </div>

                      {/* Clean Flat Column Bar with Theme Colors */}
                      <div
                        className="relative flex flex-col items-center justify-end w-8 sm:w-10 md:w-11 group-hover:-translate-y-1 transition-transform duration-200 ease-out"
                        style={{ height: `${heightPercent}%` }}
                      >
                        {/* Score Badge on Top of Column */}
                        <div className="absolute -top-7 left-1/2 -translate-x-1/2 z-20">
                          <span
                            className={`text-[11px] font-bold px-1.5 py-0.5 rounded-md shadow-2xs whitespace-nowrap transition-all group-hover:scale-110 group-hover:shadow-sm ${theme.badgeBg}`}
                          >
                            {avg}
                          </span>
                        </div>

                        {/* Flat Column Body with 4-tier Gradient */}
                        <div
                          className={`w-full h-full rounded-t-lg transition-all duration-200 group-hover:brightness-110 group-hover:ring-2 ${theme.ring} group-hover:ring-offset-1 dark:group-hover:ring-offset-gray-900 bg-gradient-to-t ${theme.barGrad} ${theme.barHover}`}
                        />
                      </div>

                      {/* Subject Label Horizontal */}
                      <div className="h-11 flex flex-col items-center justify-start select-none pt-2 px-1 text-center w-full">
                        <span
                          className="text-[11px] sm:text-xs font-bold text-gray-700 dark:text-gray-300 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors whitespace-nowrap"
                          title={`${g.subjectName} (hs ${g.coefficient})`}
                        >
                          {g.subjectName}
                        </span>
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium leading-none mt-0.5">
                          (x{g.coefficient})
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grade Details Table */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-xs">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 bg-gray-50/80 dark:bg-gray-800/60 font-bold">
                <th className="py-3.5 px-4 text-left font-bold text-gray-900 dark:text-gray-100">{t.periods.subject}</th>
                <th className="py-3.5 px-3 text-center font-bold text-gray-700 dark:text-gray-300">{t.grades.oral}</th>
                <th className="py-3.5 px-3 text-center font-bold text-gray-700 dark:text-gray-300">{t.grades.quiz15}</th>
                <th className="py-3.5 px-3 text-center font-bold text-gray-700 dark:text-gray-300">{t.grades.midTerm}</th>
                <th className="py-3.5 px-3 text-center font-bold text-gray-700 dark:text-gray-300">{t.grades.final}</th>
                <th className="py-3.5 px-4 text-center font-extrabold text-gray-900 dark:text-white">{t.grades.subjectAverage}</th>
                <th className="py-3.5 px-3 text-center font-bold text-gray-700 dark:text-gray-300">{t.common.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {currentGrades.map((g) => {
              const avg = getDisplaySubjectAverage(g);
              const theme = getGradeTheme(avg);
              return (
                <tr
                  key={g.id}
                  onClick={() => handleOpenEdit(g)}
                  className="hover:bg-purple-50/40 dark:hover:bg-purple-950/20 transition-colors cursor-pointer group"
                  title={lang === 'vi' ? `Bấm để sửa điểm môn ${g.subjectName}` : `Click to edit ${g.subjectName}`}
                >
                  <td className="py-3 px-4 font-bold text-gray-900 dark:text-white">
                    <div className="flex items-center gap-2">
                      <span className="group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors font-bold">
                        {g.subjectName}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 font-medium">
                        x{g.coefficient}
                      </span>
                    </div>
                  </td>
                  {/* Oral Scores formatted as Badges */}
                  <td className="py-3 px-3 text-center">
                    <div className="flex items-center justify-center gap-1 flex-wrap">
                      {g.oralScores && g.oralScores.length > 0 ? (
                        g.oralScores.map((score, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center justify-center px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-mono font-semibold text-[11px] border border-gray-200/60 dark:border-gray-700"
                          >
                            {score}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </div>
                  </td>
                  {/* 15-Minute Scores formatted as Badges */}
                  <td className="py-3 px-3 text-center">
                    <div className="flex items-center justify-center gap-1 flex-wrap">
                      {g.quiz15Scores && g.quiz15Scores.length > 0 ? (
                        g.quiz15Scores.map((score, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center justify-center px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-mono font-semibold text-[11px] border border-gray-200/60 dark:border-gray-700"
                          >
                            {score}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </div>
                  </td>
                  {/* Mid-term formatted as Badge */}
                  <td className="py-3 px-3 text-center">
                    {g.midTermScore !== null && g.midTermScore !== undefined ? (
                      <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-mono font-bold text-[11px] border border-blue-200/70 dark:border-blue-800/60">
                        {g.midTermScore}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  {/* Final Exam formatted as Badge */}
                  <td className="py-3 px-3 text-center">
                    {g.finalScore !== null && g.finalScore !== undefined ? (
                      <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 font-mono font-bold text-[11px] border border-purple-200/70 dark:border-purple-800/60">
                        {g.finalScore}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  {/* Subject Average Column - Centered with Status Badge */}
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-lg font-black text-xs font-mono shadow-2xs ${theme.badgeLight}`}>
                        {avg}
                      </span>
                    </div>
                  </td>
                  {/* Actions Column */}
                  <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(g)}
                        title={lang === 'vi' ? 'Sửa môn này' : 'Edit subject'}
                        className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/50 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(g.id)}
                        title={lang === 'vi' ? 'Xóa môn' : 'Delete subject'}
                        className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      </div>

      {/* Insights & Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Strong Subjects with Top 3-5 Limit & Expand Toggle */}
        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                <CheckCircle className="w-4 h-4" />
                <span>{t.grades.strongSubjects} (≥ 8.5)</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200/60 dark:border-emerald-800/60">
                  {strongSubjects.length} {lang === 'vi' ? 'môn' : 'subjects'}
                </span>
              </div>
            </div>

            {strongSubjects.length === 0 ? (
              <div className="text-xs text-gray-400 py-6 text-center">
                {lang === 'vi' ? 'Chưa có môn nào đạt điểm từ 8.5 trở lên' : 'No subjects with scores 8.5 or higher yet'}
              </div>
            ) : (
              <div className="space-y-2 text-xs">
                {(showAllStrong ? strongSubjects : strongSubjects.slice(0, 4)).map((s) => {
                  const sAvg = calculateSubjectAverage(s);
                  return (
                    <div
                      key={s.id}
                      onClick={() => handleOpenEdit(s)}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 hover:bg-emerald-50 transition-colors cursor-pointer group"
                      title={lang === 'vi' ? 'Bấm để sửa điểm' : 'Click to edit'}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span className="font-semibold text-gray-800 dark:text-gray-200 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors">
                          {s.subjectName}
                        </span>
                        <span className="text-[10px] text-gray-400">hs {s.coefficient}</span>
                      </div>
                      <span className="font-black font-mono text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-md bg-white dark:bg-gray-800 border border-emerald-200/60 dark:border-emerald-800/40">
                        {sAvg} điểm
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* View More / Less Toggle Button for Strong Subjects */}
          {strongSubjects.length > 4 && (
            <button
              type="button"
              onClick={() => setShowAllStrong(!showAllStrong)}
              className="mt-3 w-full py-1.5 px-3 rounded-xl text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50/60 dark:bg-emerald-950/40 hover:bg-emerald-100/60 dark:hover:bg-emerald-900/50 border border-emerald-200/60 dark:border-emerald-800/40 transition-colors flex items-center justify-center gap-1"
            >
              {showAllStrong ? (
                <>
                  <span>{lang === 'vi' ? 'Thu gọn danh sách' : 'Show less'}</span>
                  <ChevronUp className="w-3.5 h-3.5" />
                </>
              ) : (
                <>
                  <span>
                    {lang === 'vi' ? `Xem thêm ${strongSubjects.length - 4} môn xuất sắc khác` : `View ${strongSubjects.length - 4} more strong subjects`}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          )}
        </div>

        {/* Needs Improvement with Action Suggestions & Next Term Goals */}
        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 font-bold text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span>{t.grades.needImprovement} (&lt; 8.0)</span>
                {weakSubjects.length > 0 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-50 dark:bg-orange-950/50 text-orange-700 dark:text-orange-300 font-bold border border-orange-200/60 dark:border-orange-800/60">
                    {weakSubjects.length} {lang === 'vi' ? 'môn' : 'subjects'}
                  </span>
                )}
              </div>
            </div>

            {weakSubjects.length === 0 ? (
              <div className="text-xs text-emerald-600 dark:text-emerald-400 p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 text-center font-medium">
                {lang === 'vi' ? 'Tất cả các môn đều đạt từ 8.0 trở lên. Bạn đang có học lực rất đồng đều và xuất sắc!' : 'All subjects are 8.0 or above. Excellent and well-rounded academic performance!'}
              </div>
            ) : (
              <div className="space-y-2 text-xs">
                {weakSubjects.map((s) => {
                  const sAvg = calculateSubjectAverage(s);
                  return (
                    <div
                      key={s.id}
                      onClick={() => handleOpenEdit(s)}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-orange-50/50 dark:bg-orange-950/30 border border-orange-100 dark:border-orange-900/40 hover:bg-orange-50 transition-colors cursor-pointer group"
                      title={lang === 'vi' ? 'Bấm để sửa điểm' : 'Click to edit'}
                    >
                      <div>
                        <div className="font-semibold text-gray-800 dark:text-gray-200 group-hover:text-orange-700 dark:group-hover:text-orange-300 transition-colors flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                          <span>{s.subjectName}</span>
                          <span className="text-[10px] text-gray-400 font-normal">hs {s.coefficient}</span>
                        </div>
                        <div className="text-[11px] text-orange-700/80 dark:text-orange-400/90 pl-3">
                          {s.finalScore === null || s.finalScore < 8
                            ? lang === 'vi'
                              ? 'Cần tăng điểm thi kiểm tra và bài thi cuối kỳ'
                              : 'Boost quiz scores and final exam preparation'
                            : lang === 'vi'
                            ? 'Cần gỡ điểm đánh giá thường xuyên miệng/15p'
                            : 'Improve oral and short quiz scores'}
                        </div>
                      </div>
                      <span className="font-black font-mono text-orange-700 dark:text-orange-400 px-2 py-0.5 rounded-md bg-white dark:bg-gray-800 border border-orange-200/60 dark:border-orange-800/40 shrink-0 ml-2">
                        {sAvg} điểm
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Action Suggestions & Next Term Goals Section */}
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900 dark:text-white mb-2">
              <Target className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span>{lang === 'vi' ? 'Gợi Ý Hành Động & Mục Tiêu Kỳ Tới' : 'Action Suggestions & Next Term Goals'}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div className="p-2.5 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/30">
                <p className="font-semibold text-purple-900 dark:text-purple-200 flex items-center gap-1 mb-0.5">
                  <ArrowUpRight className="w-3 h-3 text-purple-600" />
                  {lang === 'vi' ? 'Nâng điểm TB môn < 8.0' : 'Raise < 8.0 subjects'}
                </p>
                <p className="text-gray-500 dark:text-gray-400 leading-snug">
                  {lang === 'vi'
                    ? 'Dành thêm 30p mỗi ngày luyện đề các môn trọng điểm để kéo ĐTB chung lên ≥ 9.0.'
                    : 'Spend 30 mins daily practicing weak subject exams to achieve GPA ≥ 9.0.'}
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30">
                <p className="font-semibold text-blue-900 dark:text-blue-200 flex items-center gap-1 mb-0.5">
                  <ArrowUpRight className="w-3 h-3 text-blue-600" />
                  {lang === 'vi' ? 'Tối ưu hệ số điểm thi' : 'Optimize exam weights'}
                </p>
                <p className="text-gray-500 dark:text-gray-400 leading-snug">
                  {lang === 'vi'
                    ? 'Bài thi giữa kỳ (hs2) và cuối kỳ (hs3) chiếm hơn 70% tổng điểm tổng kết môn.'
                    : 'Mid-term (x2) & final (x3) exams constitute over 70% of the cumulative score.'}
                </p>
              </div>
            </div>
          </div>
        </div>
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
                  {editingItem.id && grades.some((i) => i.id === editingItem.id)
                    ? t.grades.editSubject
                    : t.grades.addSubject}
                </h3>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                  {lang === 'vi' ? 'Nhập môn học, hệ số và các đầu điểm chi tiết' : 'Enter subject, weight and score details'}
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
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      {t.periods.subject} *
                    </label>
                    <input
                      type="text"
                      required
                      value={editingItem.subjectName}
                      onChange={(e) => setEditingItem({ ...editingItem, subjectName: e.target.value })}
                      placeholder="Toán, Vật lý..."
                      className="w-full px-3 py-2 text-xs sm:text-[13px] rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-xs sm:placeholder:text-[12px] placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Hệ số
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={3}
                      value={editingItem.coefficient}
                      onChange={(e) => setEditingItem({ ...editingItem, coefficient: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-xs sm:text-[13px] rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    {lang === 'vi' ? 'Học kỳ' : 'Semester'}
                  </label>
                  <select
                    value={editingItem.semester}
                    onChange={(e) => setEditingItem({ ...editingItem, semester: e.target.value as 'sem1' | 'sem2' })}
                    className="w-full px-3 py-2 text-xs sm:text-[13px] rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="sem1">{t.grades.semester1}</option>
                    <option value="sem2">{t.grades.semester2}</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                        {lang === 'vi' ? 'Điểm miệng' : 'Oral Scores'}
                      </label>
                      <span className="text-[10px] text-gray-400">
                        {lang === 'vi' ? 'phân cách bằng dấu phẩy' : 'comma separated'}
                      </span>
                    </div>
                    <input
                      type="text"
                      value={oralInput}
                      onChange={(e) => setOralInput(e.target.value)}
                      placeholder="9, 9.5, 10"
                      className="w-full px-3 py-2 text-xs sm:text-[13px] rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-xs sm:placeholder:text-[12px] placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    {/* Live parsed badges indicator */}
                    <div className="mt-1 flex items-center gap-1 flex-wrap min-h-[20px]">
                      {parseScoreList(oralInput).length > 0 ? (
                        <>
                          <span className="text-[10px] text-gray-400">{lang === 'vi' ? 'Nhận diện:' : 'Parsed:'}</span>
                          {parseScoreList(oralInput).map((s, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-cyan-100 dark:bg-cyan-950/60 text-cyan-800 dark:text-cyan-200 border border-cyan-300/50"
                            >
                              {s}
                            </span>
                          ))}
                        </>
                      ) : (
                        <span className="text-[10px] text-gray-400 italic">
                          {lang === 'vi' ? 'Ví dụ: 9, 9.5, 10' : 'e.g. 9, 9.5, 10'}
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                        {lang === 'vi' ? 'Điểm 15p' : '15m Quiz Scores'}
                      </label>
                      <span className="text-[10px] text-gray-400">
                        {lang === 'vi' ? 'phân cách bằng dấu phẩy' : 'comma separated'}
                      </span>
                    </div>
                    <input
                      type="text"
                      value={quiz15Input}
                      onChange={(e) => setQuiz15Input(e.target.value)}
                      placeholder="8.5, 9, 9.5"
                      className="w-full px-3 py-2 text-xs sm:text-[13px] rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-xs sm:placeholder:text-[12px] placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    {/* Live parsed badges indicator */}
                    <div className="mt-1 flex items-center gap-1 flex-wrap min-h-[20px]">
                      {parseScoreList(quiz15Input).length > 0 ? (
                        <>
                          <span className="text-[10px] text-gray-400">{lang === 'vi' ? 'Nhận diện:' : 'Parsed:'}</span>
                          {parseScoreList(quiz15Input).map((s, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-cyan-100 dark:bg-cyan-950/60 text-cyan-800 dark:text-cyan-200 border border-cyan-300/50"
                            >
                              {s}
                            </span>
                          ))}
                        </>
                      ) : (
                        <span className="text-[10px] text-gray-400 italic">
                          {lang === 'vi' ? 'Ví dụ: 8.5, 9' : 'e.g. 8.5, 9'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Điểm Giữa kỳ (hệ số 2)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={10}
                      step={0.1}
                      value={editingItem.midTermScore ?? ''}
                      onChange={(e) => setEditingItem({ ...editingItem, midTermScore: e.target.value ? Number(e.target.value) : null })}
                      placeholder="8.5"
                      className="w-full px-3 py-2 text-xs sm:text-[13px] rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-xs sm:placeholder:text-[12px] placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Điểm Cuối kỳ (hệ số 3)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={10}
                      step={0.1}
                      value={editingItem.finalScore ?? ''}
                      onChange={(e) => setEditingItem({ ...editingItem, finalScore: e.target.value ? Number(e.target.value) : null })}
                      placeholder="9.0"
                      className="w-full px-3 py-2 text-xs sm:text-[13px] rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-xs sm:placeholder:text-[12px] placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
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
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white shadow-xs"
                >
                  {t.common.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grade Report & Transcript PDF Export Modal */}
      <GradeReportPdfModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        grades={grades}
        profile={profile}
        initialSemester={selectedSemester}
        lang={lang}
      />
    </div>
  );
};
