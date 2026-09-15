import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import { SubjectGrade, Language } from '../types';
import {
  TrendingUp,
  Award,
  Layers,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  CheckCircle2,
  Calendar,
  Filter,
} from 'lucide-react';

interface GradeTrendsChartProps {
  grades: SubjectGrade[];
  lang: Language;
  selectedSemester?: 'sem1' | 'sem2' | 'fullYear';
}

type TrendMode = 'semesters' | 'milestones' | 'subjects_comparison';

// Calculation helper
const calculateAvg = (g: SubjectGrade): number => {
  let totalScore = 0;
  let totalWeight = 0;

  g.oralScores?.forEach((s) => {
    totalScore += s * 1;
    totalWeight += 1;
  });

  g.quiz15Scores?.forEach((s) => {
    totalScore += s * 1;
    totalWeight += 1;
  });

  if (g.midTermScore !== null && g.midTermScore !== undefined) {
    totalScore += g.midTermScore * 2;
    totalWeight += 2;
  }

  if (g.finalScore !== null && g.finalScore !== undefined) {
    totalScore += g.finalScore * 3;
    totalWeight += 3;
  }

  if (totalWeight === 0) return 0;
  return Math.round((totalScore / totalWeight) * 10) / 10;
};

// Color palette for distinct subjects
const SUBJECT_COLORS = [
  '#8B5CF6', // Purple
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#6366F1', // Indigo
  '#14B8A6', // Teal
  '#F97316', // Orange
  '#84CC16', // Lime
];

export const GradeTrendsChart: React.FC<GradeTrendsChartProps> = ({
  grades,
  lang,
  selectedSemester = 'sem1',
}) => {
  const [trendMode, setTrendMode] = useState<TrendMode>('semesters');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
  const [showBenchmark, setShowBenchmark] = useState<boolean>(true);
  const [activeSemForMilestone, setActiveSemForMilestone] = useState<'sem1' | 'sem2'>(
    selectedSemester === 'sem2' ? 'sem2' : 'sem1'
  );

  // Group grades by semester
  const sem1Grades = useMemo(() => grades.filter((g) => g.semester === 'sem1'), [grades]);
  const sem2Grades = useMemo(() => grades.filter((g) => g.semester === 'sem2'), [grades]);

  // Unique subject names across all grades
  const uniqueSubjects = useMemo(() => {
    const map = new Map<string, SubjectGrade>();
    grades.forEach((g) => {
      if (!map.has(g.subjectName)) {
        map.set(g.subjectName, g);
      }
    });
    return Array.from(map.values()).sort((a, b) => (b.coefficient || 1) - (a.coefficient || 1));
  }, [grades]);

  // MODE 1 DATA: Across Semesters (So sánh học kỳ 1 vs học kỳ 2 cho từng môn)
  const semesterTrendData = useMemo(() => {
    const list: Array<{
      subject: string;
      shortName: string;
      sem1?: number;
      sem2?: number;
      fullYear?: number;
      diff?: number;
      coefficient: number;
    }> = [];

    uniqueSubjects.forEach((sub) => {
      const g1 = sem1Grades.find((g) => g.subjectName === sub.subjectName);
      const g2 = sem2Grades.find((g) => g.subjectName === sub.subjectName);

      const avg1 = g1 ? calculateAvg(g1) : undefined;
      const avg2 = g2 ? calculateAvg(g2) : undefined;

      let fullYearVal: number | undefined;
      let diffVal: number | undefined;

      if (avg1 !== undefined && avg2 !== undefined) {
        // Standard Vietnam Ministry formula: (HK1 + HK2 * 2) / 3
        fullYearVal = Math.round(((avg1 + avg2 * 2) / 3) * 10) / 10;
        diffVal = Math.round((avg2 - avg1) * 10) / 10;
      } else if (avg1 !== undefined) {
        fullYearVal = avg1;
      } else if (avg2 !== undefined) {
        fullYearVal = avg2;
      }

      // Generate compact display label
      let shortName = sub.subjectName;
      if (shortName.includes('Toán')) shortName = 'Toán';
      else if (shortName.includes('Vật lý')) shortName = 'Vật lý';
      else if (shortName.includes('Hóa')) shortName = 'Hóa';
      else if (shortName.includes('Ngữ văn')) shortName = 'Văn';
      else if (shortName.includes('Tiếng Anh')) shortName = 'Anh';
      else if (shortName.includes('Tin')) shortName = 'Tin học';
      else if (shortName.includes('Sinh')) shortName = 'Sinh';
      else if (shortName.includes('Lịch sử')) shortName = 'Lịch sử';
      else if (shortName.includes('Địa lý')) shortName = 'Địa lý';
      else if (shortName.includes('Giáo dục thể chất')) shortName = 'GDTC';

      list.push({
        subject: sub.subjectName,
        shortName,
        sem1: avg1,
        sem2: avg2,
        fullYear: fullYearVal,
        diff: diffVal,
        coefficient: sub.coefficient || 1,
      });
    });

    return list;
  }, [uniqueSubjects, sem1Grades, sem2Grades]);

  // Overall Statistics for Sem 1 & Sem 2
  const overallStats = useMemo(() => {
    const calcWeighted = (list: SubjectGrade[]) => {
      let totalW = 0;
      let totalC = 0;
      list.forEach((g) => {
        const avg = calculateAvg(g);
        const coeff = g.coefficient || 1;
        totalW += avg * coeff;
        totalC += coeff;
      });
      return totalC > 0 ? Math.round((totalW / totalC) * 10) / 10 : 0;
    };

    const gpa1 = calcWeighted(sem1Grades);
    const gpa2 = calcWeighted(sem2Grades);
    const diff = Math.round((gpa2 - gpa1) * 10) / 10;

    // Best improved subject
    let bestImprovement: { subject: string; diff: number } | null = null;
    semesterTrendData.forEach((item) => {
      if (item.diff !== undefined) {
        if (!bestImprovement || item.diff > bestImprovement.diff) {
          bestImprovement = { subject: item.subject, diff: item.diff };
        }
      }
    });

    return { gpa1, gpa2, diff, bestImprovement };
  }, [sem1Grades, sem2Grades, semesterTrendData]);

  // MODE 2 DATA: Evaluation Milestones Progression (Tiến trình điểm qua các đợt thi)
  const milestoneData = useMemo(() => {
    const activeGrades = activeSemForMilestone === 'sem2' ? sem2Grades : sem1Grades;

    const milestones = [
      { key: 'oral', labelVi: 'Điểm Miệng', labelEn: 'Oral' },
      { key: 'quiz15', labelVi: 'Kiểm tra 15p', labelEn: '15-min Quiz' },
      { key: 'midTerm', labelVi: 'Giữa Kỳ (hs 2)', labelEn: 'Midterm (x2)' },
      { key: 'final', labelVi: 'Cuối Kỳ (hs 3)', labelEn: 'Final (x3)' },
      { key: 'avg', labelVi: 'ĐTB Tổng kết', labelEn: 'Subject GPA' },
    ];

    return milestones.map((m) => {
      const row: Record<string, any> = {
        milestone: lang === 'vi' ? m.labelVi : m.labelEn,
        milestoneKey: m.key,
      };

      let allScoresSum = 0;
      let allScoresCount = 0;

      activeGrades.forEach((g) => {
        let score: number | null = null;
        if (m.key === 'oral') {
          if (g.oralScores && g.oralScores.length > 0) {
            score = Math.round((g.oralScores.reduce((a, b) => a + b, 0) / g.oralScores.length) * 10) / 10;
          }
        } else if (m.key === 'quiz15') {
          if (g.quiz15Scores && g.quiz15Scores.length > 0) {
            score = Math.round((g.quiz15Scores.reduce((a, b) => a + b, 0) / g.quiz15Scores.length) * 10) / 10;
          }
        } else if (m.key === 'midTerm') {
          score = g.midTermScore ?? null;
        } else if (m.key === 'final') {
          score = g.finalScore ?? null;
        } else if (m.key === 'avg') {
          score = calculateAvg(g);
        }

        if (score !== null) {
          row[g.subjectName] = score;
          allScoresSum += score;
          allScoresCount++;
        }
      });

      row['Trung bình chung'] =
        allScoresCount > 0 ? Math.round((allScoresSum / allScoresCount) * 10) / 10 : 0;

      return row;
    });
  }, [activeSemForMilestone, sem1Grades, sem2Grades, lang]);

  // MODE 3 DATA: Subjects Comparison across both Semesters
  const subjectsComparisonData = useMemo(() => {
    return semesterTrendData.map((d) => ({
      name: d.shortName,
      fullName: d.subject,
      [lang === 'vi' ? 'Học kỳ 1' : 'Semester 1']: d.sem1 ?? 0,
      [lang === 'vi' ? 'Học kỳ 2' : 'Semester 2']: d.sem2 ?? 0,
      [lang === 'vi' ? 'Cả năm' : 'Full Year']: d.fullYear ?? 0,
      diff: d.diff ?? 0,
    }));
  }, [semesterTrendData, lang]);

  // Selected subjects to display in Milestone mode
  const displayedMilestoneSubjects = useMemo(() => {
    if (selectedSubjectId === 'all') {
      // Show class average + top 4 core subjects
      const core = ['Toán học', 'Ngữ văn', 'Tiếng Anh', 'Vật lý'];
      return uniqueSubjects
        .filter((s) => core.some((c) => s.subjectName.includes(c)))
        .slice(0, 4)
        .map((s) => s.subjectName);
    }
    return [selectedSubjectId];
  }, [selectedSubjectId, uniqueSubjects]);

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    return (
      <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-xl text-xs space-y-2 min-w-[190px]">
        <div className="font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-1.5 flex items-center justify-between gap-2">
          <span>{label}</span>
          <span className="text-[10px] font-normal px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300">
            {lang === 'vi' ? 'Điểm số' : 'Grade'}
          </span>
        </div>

        <div className="space-y-1.5">
          {payload.map((entry: any, index: number) => {
            if (entry.value === undefined || entry.value === null) return null;
            return (
              <div
                key={`entry-${index}`}
                className="flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-gray-600 dark:text-gray-300 font-medium">
                    {entry.name}:
                  </span>
                </div>
                <span className="font-extrabold text-gray-900 dark:text-white">
                  {entry.value}{' '}
                  <span className="text-[10px] text-gray-400 font-normal">/10</span>
                </span>
              </div>
            );
          })}
        </div>

        {trendMode === 'semesters' && payload.length >= 2 && (
          <div className="pt-1.5 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-[11px]">
            <span className="text-gray-500">{lang === 'vi' ? 'Chênh lệch (HK2 - HK1):' : 'Difference:'}</span>
            {(() => {
              const v1 = payload.find((p: any) => p.dataKey === 'sem1')?.value;
              const v2 = payload.find((p: any) => p.dataKey === 'sem2')?.value;
              if (v1 !== undefined && v2 !== undefined) {
                const diff = Math.round((v2 - v1) * 10) / 10;
                return (
                  <span
                    className={`font-bold ${
                      diff > 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : diff < 0
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-gray-500'
                    }`}
                  >
                    {diff > 0 ? `+${diff}` : diff}
                  </span>
                );
              }
              return null;
            })()}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-200 dark:border-gray-800 shadow-xs space-y-5">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-gray-900 dark:text-white flex items-center gap-2">
                {lang === 'vi' ? 'Biểu Đồ Xu Hướng & Tiến Độ Học Tập' : 'Academic Grade Trends & Progress'}
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900 font-semibold">
                  Recharts
                </span>
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {lang === 'vi'
                  ? 'Theo dõi biến động điểm số qua các kỳ kiểm tra và đối chiếu các học kỳ'
                  : 'Track grade fluctuations across exams and compare multi-semester performance'}
              </p>
            </div>
          </div>
        </div>

        {/* View Mode Selector Tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-gray-100 dark:bg-gray-800 p-0.5 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-semibold">
            <button
              id="grade-trend-tab-semesters"
              onClick={() => setTrendMode('semesters')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                trendMode === 'semesters'
                  ? 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-xs font-bold'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>{lang === 'vi' ? 'Qua các Học kỳ' : 'Across Semesters'}</span>
            </button>

            <button
              id="grade-trend-tab-milestones"
              onClick={() => setTrendMode('milestones')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                trendMode === 'milestones'
                  ? 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-xs font-bold'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{lang === 'vi' ? 'Tiến trình Đánh giá' : 'Assessment Milestones'}</span>
            </button>

            <button
              id="grade-trend-tab-subjects"
              onClick={() => setTrendMode('subjects_comparison')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                trendMode === 'subjects_comparison'
                  ? 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-xs font-bold'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>{lang === 'vi' ? 'So sánh Môn học' : 'Subjects Overview'}</span>
            </button>
          </div>

          {/* Toggle Benchmark Line Button */}
          <button
            id="toggle-benchmark-btn"
            onClick={() => setShowBenchmark(!showBenchmark)}
            className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-colors flex items-center gap-1 ${
              showBenchmark
                ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-300'
                : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500'
            }`}
            title={lang === 'vi' ? 'Bật/Tắt mốc điểm chuẩn 8.0 & 9.0' : 'Toggle 8.0 & 9.0 benchmark lines'}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {showBenchmark
                ? lang === 'vi'
                  ? 'Mốc chuẩn: Bật'
                  : 'Target: On'
                : lang === 'vi'
                ? 'Mốc chuẩn: Tắt'
                : 'Target: Off'}
            </span>
          </button>
        </div>
      </div>

      {/* Sub-Filters based on Mode */}
      {trendMode === 'milestones' && (
        <div className="flex items-center justify-between gap-3 flex-wrap p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-700 dark:text-gray-300">
              {lang === 'vi' ? 'Học kỳ áp dụng:' : 'Semester:'}
            </span>
            <div className="flex items-center gap-1 bg-white dark:bg-gray-900 p-0.5 rounded-lg border border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setActiveSemForMilestone('sem1')}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                  activeSemForMilestone === 'sem1'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                {lang === 'vi' ? 'Học kỳ 1' : 'Semester 1'}
              </button>
              <button
                onClick={() => setActiveSemForMilestone('sem2')}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                  activeSemForMilestone === 'sem2'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                {lang === 'vi' ? 'Học kỳ 2' : 'Semester 2'}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-700 dark:text-gray-300">
              {lang === 'vi' ? 'Môn học khảo sát:' : 'Target Subject:'}
            </span>
            <select
              id="grade-trend-subject-select"
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 focus:outline-hidden focus:ring-1 focus:ring-purple-500"
            >
              <option value="all">
                {lang === 'vi' ? 'Tổng hợp (ĐTB chung & Top 4 môn chính)' : 'Combined (Overall & Core)'}
              </option>
              {uniqueSubjects.map((s) => (
                <option key={s.id} value={s.subjectName}>
                  {s.subjectName} (hs {s.coefficient})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Main Recharts Line Chart Container */}
      <div className="w-full h-[320px] sm:h-[350px] pt-2">
        <ResponsiveContainer width="100%" height="100%">
          {trendMode === 'semesters' ? (
            <LineChart
              data={semesterTrendData}
              margin={{ top: 15, right: 20, left: -10, bottom: 25 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#E5E7EB"
                className="dark:stroke-gray-800"
                vertical={false}
              />
              <XAxis
                dataKey="shortName"
                tick={{ fontSize: 11, fill: '#6B7280' }}
                interval={0}
                angle={-20}
                textAnchor="end"
                height={40}
              />
              <YAxis
                domain={[5, 10]}
                ticks={[5, 6, 7, 8, 9, 10]}
                tick={{ fontSize: 11, fill: '#6B7280' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: '12px', fontSize: '11px', fontWeight: 600 }}
              />

              {showBenchmark && (
                <>
                  <ReferenceLine
                    y={9.0}
                    stroke="#8B5CF6"
                    strokeDasharray="3 3"
                    label={{
                      value: lang === 'vi' ? 'Xuất sắc (9.0)' : 'Excellent (9.0)',
                      position: 'insideTopRight',
                      fill: '#8B5CF6',
                      fontSize: 10,
                      fontWeight: 600,
                    }}
                  />
                  <ReferenceLine
                    y={8.0}
                    stroke="#10B981"
                    strokeDasharray="3 3"
                    label={{
                      value: lang === 'vi' ? 'Giỏi (8.0)' : 'Good (8.0)',
                      position: 'insideBottomRight',
                      fill: '#10B981',
                      fontSize: 10,
                      fontWeight: 600,
                    }}
                  />
                </>
              )}

              {/* Line 1: Semester 1 */}
              <Line
                type="monotone"
                dataKey="sem1"
                name={lang === 'vi' ? 'Học kỳ 1' : 'Semester 1'}
                stroke="#8B5CF6"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#8B5CF6', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 7, strokeWidth: 2, stroke: '#fff' }}
              />

              {/* Line 2: Semester 2 */}
              <Line
                type="monotone"
                dataKey="sem2"
                name={lang === 'vi' ? 'Học kỳ 2' : 'Semester 2'}
                stroke="#10B981"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#10B981', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 7, strokeWidth: 2, stroke: '#fff' }}
              />

              {/* Line 3: Full Year consolidated */}
              <Line
                type="monotone"
                dataKey="fullYear"
                name={lang === 'vi' ? 'Cả năm (Dự kiến)' : 'Full Year'}
                stroke="#3B82F6"
                strokeWidth={1.75}
                strokeDasharray="4 4"
                dot={{ r: 3, fill: '#3B82F6' }}
              />
            </LineChart>
          ) : trendMode === 'milestones' ? (
            <LineChart
              data={milestoneData}
              margin={{ top: 15, right: 20, left: -10, bottom: 20 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#E5E7EB"
                className="dark:stroke-gray-800"
                vertical={false}
              />
              <XAxis
                dataKey="milestone"
                tick={{ fontSize: 11, fill: '#6B7280' }}
              />
              <YAxis
                domain={[5, 10]}
                ticks={[5, 6, 7, 8, 9, 10]}
                tick={{ fontSize: 11, fill: '#6B7280' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: '12px', fontSize: '11px', fontWeight: 600 }}
              />

              {showBenchmark && (
                <ReferenceLine
                  y={8.0}
                  stroke="#10B981"
                  strokeDasharray="3 3"
                  label={{
                    value: lang === 'vi' ? 'Mục tiêu Giỏi (8.0)' : 'Target (8.0)',
                    position: 'insideBottomRight',
                    fill: '#10B981',
                    fontSize: 10,
                  }}
                />
              )}

              {/* Class Average Line */}
              <Line
                type="monotone"
                dataKey="Trung bình chung"
                name={lang === 'vi' ? 'Điểm TB tất cả môn' : 'All Subjects Avg'}
                stroke="#6366F1"
                strokeWidth={3}
                dot={{ r: 5, fill: '#6366F1', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 8 }}
              />

              {/* Individual subject lines */}
              {displayedMilestoneSubjects.map((subName, idx) => (
                <Line
                  key={subName}
                  type="monotone"
                  dataKey={subName}
                  name={subName}
                  stroke={SUBJECT_COLORS[idx % SUBJECT_COLORS.length]}
                  strokeWidth={2}
                  dot={{ r: 4, strokeWidth: 1.5, stroke: '#fff' }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          ) : (
            /* MODE 3: Subjects Comparison */
            <LineChart
              data={subjectsComparisonData}
              margin={{ top: 15, right: 20, left: -10, bottom: 25 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#E5E7EB"
                className="dark:stroke-gray-800"
                vertical={false}
              />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: '#6B7280' }}
                interval={0}
                angle={-20}
                textAnchor="end"
                height={40}
              />
              <YAxis
                domain={[5, 10]}
                ticks={[5, 6, 7, 8, 9, 10]}
                tick={{ fontSize: 11, fill: '#6B7280' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: '12px', fontSize: '11px', fontWeight: 600 }}
              />

              <Line
                type="monotone"
                dataKey={lang === 'vi' ? 'Học kỳ 1' : 'Semester 1'}
                stroke="#8B5CF6"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#8B5CF6' }}
              />
              <Line
                type="monotone"
                dataKey={lang === 'vi' ? 'Học kỳ 2' : 'Semester 2'}
                stroke="#10B981"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#10B981' }}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Trend Insights & Progress Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-gray-100 dark:border-gray-800 text-xs">
        {/* Semester GPA Delta */}
        <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
              {lang === 'vi' ? 'Biến động ĐTB Học kỳ' : 'Semester GPA Growth'}
            </div>
            <div className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-1.5 mt-0.5">
              <span>{overallStats.gpa1} ➔ {overallStats.gpa2}</span>
            </div>
          </div>
          <div
            className={`flex items-center gap-0.5 px-2 py-1 rounded-lg text-xs font-bold ${
              overallStats.diff > 0
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                : overallStats.diff < 0
                ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300'
                : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
            }`}
          >
            {overallStats.diff > 0 ? (
              <ArrowUpRight className="w-3.5 h-3.5" />
            ) : overallStats.diff < 0 ? (
              <ArrowDownRight className="w-3.5 h-3.5" />
            ) : (
              <Minus className="w-3.5 h-3.5" />
            )}
            <span>{overallStats.diff > 0 ? `+${overallStats.diff}` : overallStats.diff}</span>
          </div>
        </div>

        {/* Most Improved Subject */}
        <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
              {lang === 'vi' ? 'Môn bứt phá nhiều nhất' : 'Most Improved Subject'}
            </div>
            <div className="text-xs font-bold text-gray-900 dark:text-white mt-0.5 truncate max-w-[140px]">
              {overallStats.bestImprovement?.subject || 'Toán học'}
            </div>
          </div>
          <span className="px-2 py-1 rounded-lg bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 text-xs font-bold">
            {overallStats.bestImprovement && overallStats.bestImprovement.diff > 0
              ? `+${overallStats.bestImprovement.diff}`
              : '+0.3'}{' '}
            {lang === 'vi' ? 'điểm' : 'pts'}
          </span>
        </div>

        {/* Actionable Advice */}
        <div className="p-3 rounded-xl bg-purple-50/50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/40 flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
          <div className="text-[11px] text-gray-600 dark:text-gray-300 leading-snug">
            <span className="font-bold text-purple-700 dark:text-purple-300">
              {lang === 'vi' ? 'Nhận định tiến trình: ' : 'Progress Insight: '}
            </span>
            {overallStats.diff >= 0
              ? lang === 'vi'
                ? 'Đà tăng trưởng tốt ở các bài thi cuối kỳ. Duy trì ổn định để đạt GPA Xuất sắc!'
                : 'Strong growth in final exams. Maintain consistency to retain Excellent standing!'
              : lang === 'vi'
              ? 'Lưu ý bổ sung ôn luyện các chuyên đề giữa kỳ để nâng cao điểm trung bình chung.'
              : 'Review midterm topics to improve cumulative semester grade point average.'}
          </div>
        </div>
      </div>
    </div>
  );
};
