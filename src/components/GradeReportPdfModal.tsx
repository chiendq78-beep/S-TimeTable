import React, { useState, useRef } from 'react';
import {
  FileText,
  Download,
  Printer,
  X,
  CheckCircle2,
  Calendar,
  User,
  GraduationCap,
  Sparkles,
  Edit3,
  Loader2,
  Share2,
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';
import { SubjectGrade, StudentProfile, Language } from '../types';
import { useSwipeToCloseModal } from '../hooks/useSwipeToCloseModal';

interface GradeReportPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  grades: SubjectGrade[];
  profile?: StudentProfile;
  initialSemester?: 'sem1' | 'sem2' | 'fullYear';
  lang: Language;
}

export const GradeReportPdfModal: React.FC<GradeReportPdfModalProps> = ({
  isOpen,
  onClose,
  grades,
  profile,
  initialSemester = 'sem1',
  lang,
}) => {
  const [reportSemester, setReportSemester] = useState<'sem1' | 'sem2' | 'fullYear'>(initialSemester);
  const [customRemark, setCustomRemark] = useState<string>(
    'Học sinh có tinh thần tự giác cao, chăm ngoan, chú ý nghe giảng và hoàn thành bài tập đầy đủ. Đề nghị gia đình tiếp tục phối hợp động viên em duy trì phong độ và rèn luyện thêm ở các môn tính toán phức tạp.'
  );
  const [conductGrade, setConductGrade] = useState<'Tốt' | 'Khá' | 'Đạt'>('Tốt');
  const [issueDate, setIssueDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportSuccess, setExportSuccess] = useState<boolean>(false);

  const printRef = useRef<HTMLDivElement>(null);

  // Swipe-to-close on mobile/tablet
  const { modalTouchHandlers } = useSwipeToCloseModal({
    isOpen,
    onClose,
  });

  if (!isOpen) return null;

  // Student info fallback
  const student = {
    fullName: profile?.fullName || 'Nguyễn Minh Quân',
    school: profile?.school || 'Trường THPT Chuyên Hà Nội - Amsterdam',
    classGrade: profile?.classGrade || '10 Tin',
    studentCode: profile?.studentCode || 'HS-2025-089',
    birthYear: profile?.birthYear || '2009',
    academicYear: profile?.academicYear || '2025 - 2026',
    homeroomTeacher: profile?.homeroomTeacher || 'Cô Vũ Thị Mai Hương',
    parentName: profile?.parentName || 'Nguyễn Văn Hùng',
    parentPhone: profile?.parentPhone || '0987 654 321',
  };

  // Helper functions for scoring
  const calculateSubjectAverage = (subject: SubjectGrade): number => {
    const oralSum = (subject.oralScores || []).reduce((a, b) => a + b, 0);
    const oralCount = (subject.oralScores || []).length;
    const quiz15Sum = (subject.quiz15Scores || []).reduce((a, b) => a + b, 0);
    const quiz15Count = (subject.quiz15Scores || []).length;
    const mid = subject.midTermScore !== null && subject.midTermScore !== undefined ? subject.midTermScore : null;
    const fin = subject.finalScore !== null && subject.finalScore !== undefined ? subject.finalScore : null;

    let totalPoints = oralSum + quiz15Sum;
    let totalWeights = oralCount + quiz15Count;

    if (mid !== null) {
      totalPoints += mid * 2;
      totalWeights += 2;
    }
    if (fin !== null) {
      totalPoints += fin * 3;
      totalWeights += 3;
    }

    if (totalWeights === 0) return 0;
    return Number((totalPoints / totalWeights).toFixed(1));
  };

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

  const getAcademicRank = (avg10: number) => {
    if (avg10 >= 9.0) return { label: 'Xuất sắc', en: 'Exemplary', badge: 'bg-emerald-100 text-emerald-800' };
    if (avg10 >= 8.0) return { label: 'Giỏi', en: 'Good', badge: 'bg-blue-100 text-blue-800' };
    if (avg10 >= 6.5) return { label: 'Khá', en: 'Average Good', badge: 'bg-orange-100 text-orange-800' };
    if (avg10 >= 5.0) return { label: 'Trung bình', en: 'Average', badge: 'bg-amber-100 text-amber-800' };
    return { label: 'Chưa đạt', en: 'Below Average', badge: 'bg-rose-100 text-rose-800' };
  };

  // Filter current grades according to selected semester
  const subjectList = grades.filter((g) => {
    if (reportSemester === 'fullYear') return true;
    return g.semester === reportSemester;
  });

  // Calculate overall weighted GPA
  let totalWeighted = 0;
  let totalCoef = 0;
  subjectList.forEach((g) => {
    const avg = calculateSubjectAverage(g);
    totalWeighted += avg * g.coefficient;
    totalCoef += g.coefficient;
  });

  const overallAvg10 = totalCoef > 0 ? Number((totalWeighted / totalCoef).toFixed(1)) : 0;
  const overallAvg4 = convertTo4Scale(overallAvg10);
  const overallRank = getAcademicRank(overallAvg10);

  // Subject highlights
  const sortedSubjects = [...subjectList].sort(
    (a, b) => calculateSubjectAverage(b) - calculateSubjectAverage(a)
  );
  const topSubjects = sortedSubjects.slice(0, 3);
  const lowerSubjects = sortedSubjects.filter((s) => calculateSubjectAverage(s) < 8.0);

  // Format issue date display
  const dateObj = new Date(issueDate);
  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const year = dateObj.getFullYear();

  // Export PDF handler using html2canvas & jsPDF
  const handleDownloadPdf = async () => {
    if (!printRef.current) return;
    setIsExporting(true);
    setExportSuccess(false);

    try {
      // Capture element with high dpi
      const element = printRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
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

      const cleanName = student.fullName.replace(/[^a-zA-Z0-9]/g, '_');
      pdf.save(`Bang-diem-bao-cao-${cleanName}-${reportSemester}.pdf`);

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (err) {
      console.error('Error generating PDF:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Native Print Handler
  const handlePrint = () => {
    window.print();
  };

  const semesterLabel =
    reportSemester === 'sem1'
      ? 'HỌC KỲ 1'
      : reportSemester === 'sem2'
      ? 'HỌC KỲ 2'
      : 'CẢ NĂM HỌC';

  return (
    <div
      data-app-modal="true"
      {...modalTouchHandlers}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto"
    >
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-5xl shadow-2xl border border-gray-200 dark:border-gray-800 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Modal Toolbar Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-850">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 shadow-2xs">
              <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="font-bold text-base text-gray-900 dark:text-white flex items-center gap-2">
                {lang === 'vi' ? 'Xuất Báo Cáo Học Tập & Bảng Điểm PDF' : 'Export Grade Report & Transcript (PDF)'}
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                  A4 Standard
                </span>
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {lang === 'vi'
                  ? 'Xem trước bản in chính thức gửi cho phụ huynh hoặc lưu hồ sơ học bạ'
                  : 'Official printable report for parents and personal records'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {/* Direct PDF Download Button */}
            <button
              onClick={handleDownloadPdf}
              disabled={isExporting}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 shadow-sm shadow-purple-500/20 active:scale-95 transition-all"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{lang === 'vi' ? 'Đang tạo PDF...' : 'Generating...'}</span>
                </>
              ) : exportSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>{lang === 'vi' ? 'Đã tải PDF!' : 'Downloaded!'}</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>{lang === 'vi' ? 'Tải file PDF (.pdf)' : 'Download PDF'}</span>
                </>
              )}
            </button>

            {/* Print / Save to PDF Button */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors"
              title={lang === 'vi' ? 'In hoặc lưu qua trình duyệt' : 'Print or Save via Browser'}
            >
              <Printer className="w-4 h-4 text-gray-500" />
              <span className="hidden sm:inline">{lang === 'vi' ? 'In ấn' : 'Print'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-xl hover:bg-gray-200/50 dark:hover:bg-gray-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Configuration Bar */}
        <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          {/* Semester Selector */}
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-600 dark:text-gray-400 shrink-0">
              {lang === 'vi' ? 'Học kỳ xuất:' : 'Semester:'}
            </span>
            <div className="flex bg-gray-100 dark:bg-gray-800 p-0.5 rounded-lg border border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setReportSemester('sem1')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  reportSemester === 'sem1'
                    ? 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-2xs font-bold'
                    : 'text-gray-500'
                }`}
              >
                HK 1
              </button>
              <button
                onClick={() => setReportSemester('sem2')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  reportSemester === 'sem2'
                    ? 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-2xs font-bold'
                    : 'text-gray-500'
                }`}
              >
                HK 2
              </button>
              <button
                onClick={() => setReportSemester('fullYear')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  reportSemester === 'fullYear'
                    ? 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-2xs font-bold'
                    : 'text-gray-500'
                }`}
              >
                Cả năm
              </button>
            </div>
          </div>

          {/* Conduct selection */}
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-600 dark:text-gray-400 shrink-0">
              {lang === 'vi' ? 'Hạnh kiểm:' : 'Conduct:'}
            </span>
            <select
              value={conductGrade}
              onChange={(e) => setConductGrade(e.target.value as any)}
              className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1 text-xs font-semibold text-gray-800 dark:text-gray-200 focus:outline-hidden focus:ring-1 focus:ring-purple-500"
            >
              <option value="Tốt">Tốt (Tốt nhất)</option>
              <option value="Khá">Khá</option>
              <option value="Đạt">Đạt</option>
            </select>
          </div>

          {/* Issue Date */}
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-600 dark:text-gray-400 shrink-0">
              {lang === 'vi' ? 'Ngày ký xuất:' : 'Date:'}
            </span>
            <input
              type="date"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1 text-xs font-medium text-gray-800 dark:text-gray-200 focus:outline-hidden focus:ring-1 focus:ring-purple-500"
            />
          </div>
        </div>

        {/* Modal Scrollable Body: Live Preview of Document */}
        <div className="grow overflow-y-auto p-4 sm:p-6 bg-gray-100 dark:bg-gray-950 flex justify-center">
          {/* A4 Sheet Container (Standard 210mm x 297mm proportions) */}
          <div
            ref={printRef}
            id="printable-grade-report"
            className="w-full max-w-[800px] bg-white text-gray-900 p-8 sm:p-10 rounded-sm shadow-md border border-gray-300 font-sans"
            style={{ minHeight: '1080px' }}
          >
            {/* National Emblem / School Header Standard */}
            <div className="flex justify-between items-start border-b-2 border-gray-800 pb-4 mb-6">
              <div className="text-left w-1/2">
                <p className="text-[11px] uppercase tracking-wider font-semibold text-gray-600">
                  {student.school ? student.school.toUpperCase() : 'TRƯỜNG THPT CHUYÊN'}
                </p>
                <p className="text-xs font-bold text-gray-900 mt-0.5">
                  LỚP: {student.classGrade.toUpperCase()} • NĂM HỌC {student.academicYear}
                </p>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  Mã số học sinh: <span className="font-bold text-gray-700">{student.studentCode}</span>
                </p>
              </div>

              <div className="text-center w-1/2">
                <p className="text-[11px] font-bold tracking-wider uppercase text-gray-900">
                  CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                </p>
                <p className="text-[11px] font-semibold text-gray-800 mt-0.5">
                  Độc lập - Tự do - Hạnh phúc
                </p>
                <div className="w-24 h-0.5 bg-gray-800 mx-auto mt-1.5" />
                <p className="text-[10px] italic text-gray-500 mt-1">
                  Ngày {day} tháng {month} năm {year}
                </p>
              </div>
            </div>

            {/* Document Title */}
            <div className="text-center mb-6">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-gray-950 uppercase">
                BÁO CÁO KẾT QUẢ HỌC TẬP & BẢNG ĐIỂM
              </h1>
              <p className="text-sm font-bold text-purple-800 uppercase tracking-wide mt-1">
                {semesterLabel} - NĂM HỌC {student.academicYear}
              </p>
              <div className="w-16 h-1 bg-purple-600 mx-auto mt-2 rounded-full" />
            </div>

            {/* Student Profile Information Box */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 mb-6 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-2.5 gap-x-4">
                <div>
                  <span className="text-gray-500 block text-[10px] font-medium uppercase">Họ và tên học sinh</span>
                  <span className="font-bold text-sm text-gray-950 uppercase">{student.fullName}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[10px] font-medium uppercase">Lớp</span>
                  <span className="font-bold text-gray-900">{student.classGrade}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[10px] font-medium uppercase">Năm sinh</span>
                  <span className="font-bold text-gray-900">{student.birthYear}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[10px] font-medium uppercase">Giáo viên chủ nhiệm</span>
                  <span className="font-bold text-gray-900">{student.homeroomTeacher}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[10px] font-medium uppercase">Phụ huynh học sinh</span>
                  <span className="font-bold text-gray-900">{student.parentName}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[10px] font-medium uppercase">Số điện thoại liên hệ</span>
                  <span className="font-bold text-gray-900">{student.parentPhone}</span>
                </div>
              </div>
            </div>

            {/* Summary Highlights Cards */}
            <div className="grid grid-cols-4 gap-3 mb-6">
              <div className="bg-purple-50/70 border border-purple-200 rounded-xl p-3 text-center">
                <span className="text-[10px] font-semibold text-purple-700 uppercase block mb-0.5">
                  ĐTB Học kỳ (10)
                </span>
                <span className="text-2xl font-black text-purple-900">{overallAvg10}</span>
                <span className="text-[10px] text-purple-600 block mt-0.5">Thang điểm 10</span>
              </div>

              <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3 text-center">
                <span className="text-[10px] font-semibold text-blue-700 uppercase block mb-0.5">
                  GPA Quy đổi (4.0)
                </span>
                <span className="text-2xl font-black text-blue-900">{overallAvg4.toFixed(1)}</span>
                <span className="text-[10px] text-blue-600 block mt-0.5">Thang điểm 4</span>
              </div>

              <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 text-center">
                <span className="text-[10px] font-semibold text-emerald-700 uppercase block mb-0.5">
                  Xếp loại học lực
                </span>
                <span className="text-base font-black text-emerald-900 block mt-1">{overallRank.label}</span>
                <span className="text-[10px] text-emerald-600 block mt-0.5">Theo quy chế BGD</span>
              </div>

              <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 text-center">
                <span className="text-[10px] font-semibold text-amber-700 uppercase block mb-0.5">
                  Hạnh kiểm
                </span>
                <span className="text-base font-black text-amber-900 block mt-1">{conductGrade}</span>
                <span className="text-[10px] text-amber-600 block mt-0.5">Rèn luyện đạo đức</span>
              </div>
            </div>

            {/* Main Grade Details Table */}
            <div className="mb-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-800 mb-2 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-xs bg-purple-600" />
                Bảng Điểm Chi Tiết Các Môn Học
              </h3>
              <table className="w-full border-collapse border border-gray-300 text-xs">
                <thead>
                  <tr className="bg-gray-100 text-gray-900 font-bold border-b border-gray-300">
                    <th className="border border-gray-300 py-2 px-2 text-center w-8">STT</th>
                    <th className="border border-gray-300 py-2 px-3 text-left">Môn học</th>
                    <th className="border border-gray-300 py-2 px-2 text-center w-12">Hệ số</th>
                    <th className="border border-gray-300 py-2 px-2 text-center">Miệng (hs 1)</th>
                    <th className="border border-gray-300 py-2 px-2 text-center">15 phút (hs 1)</th>
                    <th className="border border-gray-300 py-2 px-2 text-center">Giữa kỳ (hs 2)</th>
                    <th className="border border-gray-300 py-2 px-2 text-center">Cuối kỳ (hs 3)</th>
                    <th className="border border-gray-300 py-2 px-3 text-right font-black w-20 bg-gray-200/70">
                      ĐTB Môn
                    </th>
                    <th className="border border-gray-300 py-2 px-3 text-center w-24">Xếp loại</th>
                  </tr>
                </thead>
                <tbody>
                  {subjectList.map((g, idx) => {
                    const avg = calculateSubjectAverage(g);
                    const rank = getAcademicRank(avg);
                    return (
                      <tr key={g.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/70'}>
                        <td className="border border-gray-300 py-1.5 px-2 text-center text-gray-500 font-medium">
                          {idx + 1}
                        </td>
                        <td className="border border-gray-300 py-1.5 px-3 font-bold text-gray-900">
                          {g.subjectName}
                        </td>
                        <td className="border border-gray-300 py-1.5 px-2 text-center text-gray-600 font-semibold">
                          {g.coefficient}
                        </td>
                        <td className="border border-gray-300 py-1.5 px-2 text-center text-gray-700">
                          {g.oralScores && g.oralScores.length > 0 ? g.oralScores.join(', ') : '—'}
                        </td>
                        <td className="border border-gray-300 py-1.5 px-2 text-center text-gray-700">
                          {g.quiz15Scores && g.quiz15Scores.length > 0 ? g.quiz15Scores.join(', ') : '—'}
                        </td>
                        <td className="border border-gray-300 py-1.5 px-2 text-center font-semibold text-blue-700">
                          {g.midTermScore !== null && g.midTermScore !== undefined ? g.midTermScore : '—'}
                        </td>
                        <td className="border border-gray-300 py-1.5 px-2 text-center font-semibold text-purple-700">
                          {g.finalScore !== null && g.finalScore !== undefined ? g.finalScore : '—'}
                        </td>
                        <td className="border border-gray-300 py-1.5 px-3 text-right font-black text-gray-950 bg-gray-200/50">
                          {avg}
                        </td>
                        <td className="border border-gray-300 py-1.5 px-3 text-center">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${rank.badge}`}>
                            {rank.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {/* Summary Footer Row */}
                  <tr className="bg-gray-100/90 font-bold border-t-2 border-gray-400">
                    <td colSpan={7} className="border border-gray-300 py-2 px-3 text-right uppercase text-gray-800">
                      ĐIỂM TRUNG BÌNH CHUNG TOÀN DIỆN (ĐTB):
                    </td>
                    <td className="border border-gray-300 py-2 px-3 text-right font-black text-base text-purple-900 bg-purple-100">
                      {overallAvg10}
                    </td>
                    <td className="border border-gray-300 py-2 px-3 text-center font-black text-emerald-800 bg-emerald-50">
                      {overallRank.label}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Academic Evaluation & Recommendations */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 text-xs">
              <div className="border border-gray-200 rounded-xl p-3.5 bg-gray-50/50">
                <h4 className="font-bold text-gray-900 uppercase text-[11px] mb-1.5 flex items-center gap-1.5 text-emerald-800">
                  <Sparkles className="w-3.5 h-3.5" />
                  Môn thế mạnh nổi bật
                </h4>
                <div className="space-y-1">
                  {topSubjects.map((s) => (
                    <div key={s.id} className="flex items-center justify-between text-gray-700">
                      <span>• {s.subjectName}</span>
                      <span className="font-bold text-emerald-700">{calculateSubjectAverage(s)} / 10</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border border-gray-200 rounded-xl p-3.5 bg-gray-50/50">
                <h4 className="font-bold text-gray-900 uppercase text-[11px] mb-1.5 flex items-center gap-1.5 text-amber-800">
                  <GraduationCap className="w-3.5 h-3.5" />
                  Môn cần tiếp tục bồi dưỡng
                </h4>
                {lowerSubjects.length > 0 ? (
                  <div className="space-y-1">
                    {lowerSubjects.map((s) => (
                      <div key={s.id} className="flex items-center justify-between text-gray-700">
                        <span>• {s.subjectName}</span>
                        <span className="font-bold text-amber-700">{calculateSubjectAverage(s)} / 10</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">
                    Tất cả các môn đều đạt từ mức Giỏi (≥ 8.0) trở lên! Rất đáng khen ngợi.
                  </p>
                )}
              </div>
            </div>

            {/* Teacher's Remarks / Family Advice Editable Section */}
            <div className="border border-gray-300 rounded-xl p-3.5 mb-8 text-xs bg-white">
              <div className="flex items-center justify-between mb-1.5">
                <h4 className="font-bold uppercase text-[11px] text-gray-800 flex items-center gap-1.5">
                  <Edit3 className="w-3.5 h-3.5 text-purple-600" />
                  Nhận xét của Giáo viên Chủ nhiệm & Lời dặn dò gia đình:
                </h4>
                <span className="text-[10px] text-gray-400 italic">(Có thể chỉnh sửa trước khi tải PDF)</span>
              </div>
              <textarea
                value={customRemark}
                onChange={(e) => setCustomRemark(e.target.value)}
                rows={3}
                className="w-full text-xs text-gray-800 bg-transparent border-none p-0 focus:outline-hidden focus:ring-0 resize-none font-medium leading-relaxed italic"
                placeholder="Nhập nhận xét của giáo viên hoặc định hướng học tập..."
              />
            </div>

            {/* Signatures & Approvals Section */}
            <div className="grid grid-cols-3 gap-4 text-center text-xs pt-2">
              <div>
                <p className="font-bold text-gray-900 uppercase">HỌC SINH</p>
                <p className="text-[10px] italic text-gray-500 mt-0.5">(Ký và ghi rõ họ tên)</p>
                <div className="h-20 flex items-end justify-center">
                  <p className="font-bold text-gray-950 uppercase text-[11px]">{student.fullName}</p>
                </div>
              </div>

              <div>
                <p className="font-bold text-gray-900 uppercase">Ý KIẾN PHỤ HUYNH</p>
                <p className="text-[10px] italic text-gray-500 mt-0.5">(Ký và ghi rõ họ tên)</p>
                <div className="h-20 flex items-end justify-center">
                  <p className="font-semibold text-gray-700 text-[11px]">{student.parentName}</p>
                </div>
              </div>

              <div>
                <p className="font-bold text-gray-900 uppercase">GIÁO VIÊN CHỦ NHIỆM</p>
                <p className="text-[10px] italic text-gray-500 mt-0.5">(Ký và xác nhận)</p>
                <div className="h-20 flex items-end justify-center">
                  <p className="font-bold text-purple-900 text-[11px]">{student.homeroomTeacher}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
