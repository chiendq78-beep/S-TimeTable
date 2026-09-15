import React, { useState, useRef } from 'react';
import {
  User,
  School,
  Phone,
  MapPin,
  Calendar,
  Save,
  CheckCircle2,
  QrCode,
  Users,
  Camera,
  Mail,
  GraduationCap,
  BookOpen,
} from 'lucide-react';
import { StudentProfile, Language } from '../types';
import { translations } from '../i18n/translations';

interface StudentProfileViewProps {
  profile: StudentProfile;
  onSaveProfile: (profile: StudentProfile) => void;
  lang: Language;
}

export const StudentProfileView: React.FC<StudentProfileViewProps> = ({
  profile,
  onSaveProfile,
  lang,
}) => {
  const t = translations[lang];
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize and sanitize any inconsistent studentCode/email from previous versions
  const [formData, setFormData] = useState<StudentProfile>(() => {
    const initial = { ...profile };

    // If studentCode mistakenly holds an email (contains '@')
    if (initial.studentCode && initial.studentCode.includes('@')) {
      if (!initial.email || initial.email.includes('nguyenvanan')) {
        initial.email = initial.studentCode;
      }
      initial.studentCode = 'HS-2025-10A5-018';
    }

    if (!initial.studentCode) {
      initial.studentCode = 'HS-2025-10A5-018';
    }

    // Unify classGrade / className
    if (!initial.classGrade && (initial as any).className) {
      initial.classGrade = (initial as any).className;
    }
    if (!initial.classGrade) {
      initial.classGrade = 'Lớp 10 A5';
    }

    // Gender fallback
    if (!initial.gender) {
      initial.gender = 'female';
    }

    // Teacher phone fallback
    if (!initial.teacherPhone && (initial as any).homeroomTeacherPhone) {
      initial.teacherPhone = (initial as any).homeroomTeacherPhone;
    }

    return initial;
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  // Avatar file upload handler
  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size < 3MB
    if (file.size > 3 * 1024 * 1024) {
      alert(lang === 'vi' ? 'Vui lòng chọn ảnh có kích thước dưới 3MB' : 'Please choose an image under 3MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const result = uploadEvent.target?.result as string;
      if (result) {
        setFormData((prev) => ({ ...prev, avatarUrl: result }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalProfile: StudentProfile = {
      ...formData,
      className: formData.classGrade,
      studentId: formData.studentCode,
      homeroomTeacherPhone: formData.teacherPhone,
    };
    onSaveProfile(finalProfile);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
    }, 2500);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Hidden File Input for Avatar Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleAvatarUpload}
      />

      {/* 1. TOP BALANCED HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            {t.profile.title}
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {t.profile.subtitle}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* 2. DIGITAL STUDENT CARD (LEFT COLUMN) */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#1e3a8a] rounded-3xl p-6 text-white shadow-xl shadow-blue-950/20 relative overflow-hidden border border-blue-900/30">
            {/* Background Graphic Accents */}
            <div className="absolute -top-12 -right-12 w-44 h-44 bg-blue-500/15 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-44 h-44 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10">
              {/* Card Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/15">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-400 to-amber-200 text-slate-900 flex items-center justify-center shadow-md shrink-0">
                    <BookOpen className="w-4 h-4 text-slate-900" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] uppercase font-bold tracking-wider text-blue-200/90">
                      THẺ HỌC SINH / STUDENT CARD
                    </div>
                    <div className="text-xs font-bold leading-tight truncate text-white">
                      {formData.school || 'Trường THPT'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Photo & Main Info */}
              <div className="flex items-center gap-4 my-5">
                {/* Avatar with Camera Overlay */}
                <div className="relative w-18 h-18 rounded-2xl bg-white/10 border-2 border-white/30 overflow-hidden shrink-0 shadow-inner group flex items-center justify-center">
                  {formData.avatarUrl ? (
                    <img
                      src={formData.avatarUrl}
                      alt={formData.fullName}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <User className="w-9 h-9 text-white/80" />
                  )}

                  {/* Hover Overlay */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity backdrop-blur-2xs cursor-pointer"
                    title={t.profile.changeAvatar || 'Đổi ảnh đại diện'}
                    aria-label="Đổi ảnh đại diện"
                  >
                    <Camera className="w-4 h-4" />
                    <span className="text-[9px] font-bold mt-0.5">Đổi ảnh</span>
                  </button>

                  {/* Corner Camera Button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-0.5 -right-0.5 p-1 rounded-full bg-blue-600 hover:bg-blue-500 text-white shadow-md border-2 border-slate-900 transition-transform active:scale-90 cursor-pointer"
                    title={t.profile.uploadPhoto || 'Tải ảnh từ máy'}
                    aria-label="Tải ảnh từ máy"
                  >
                    <Camera className="w-3 h-3" />
                  </button>
                </div>

                {/* Identity Text */}
                <div className="min-w-0 grow">
                  <h3 className="text-base font-extrabold text-white truncate leading-tight">
                    {formData.fullName || 'Đặng Khánh Vy'}
                  </h3>
                  <div className="text-xs text-blue-100 mt-1">
                    Lớp: <span className="font-bold text-amber-300">{formData.classGrade || 'Lớp 10 A5'}</span>
                  </div>
                  <div className="mt-1.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/15 border border-white/15 text-[11px] font-mono text-blue-100 font-medium">
                    <span>Mã số:</span>
                    <span className="font-bold text-white tracking-wide">
                      {formData.studentCode || 'HS-2025-10A5-018'}
                    </span>
                  </div>
                </div>
              </div>

              {/* QR Code & Footer Info */}
              <div className="pt-4 border-t border-white/15 flex items-center justify-between">
                <div className="text-[11px] text-blue-100 space-y-0.5">
                  <div>Niên khóa: <span className="font-medium text-white">{formData.academicYear || '2025 - 2026'}</span></div>
                  <div>
                    Giới tính:{' '}
                    <span className="font-medium text-white">
                      {formData.gender === 'male' ? 'Nam' : formData.gender === 'female' ? 'Nữ' : 'Khác'}
                    </span>
                  </div>
                </div>

                <div className="w-12 h-12 bg-white rounded-xl p-1 shadow-sm flex items-center justify-center shrink-0">
                  <QrCode className="w-full h-full text-slate-900" />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Photo Upload Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-300 transition-colors shadow-2xs cursor-pointer"
          >
            <Camera className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>{t.profile.uploadPhoto || 'Tải ảnh đại diện từ thiết bị'}</span>
          </button>
        </div>

        {/* 3. STRUCTURED EDIT FORM (RIGHT COLUMN) */}
        <div className="lg:col-span-2">
          <form
            onSubmit={handleSubmit}
            className="bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-7 border border-gray-200 dark:border-gray-800 shadow-xs space-y-6"
          >
            {/* Form Top Title and Save Alert */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
              <h3 className="font-bold text-base text-gray-900 dark:text-white">
                {lang === 'vi' ? 'Chỉnh sửa thông tin chi tiết' : 'Edit Student Details'}
              </h3>
              {savedSuccess && (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-3 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{t.profile.profileUpdated || 'Đã lưu thay đổi!'}</span>
                </div>
              )}
            </div>

            {/* SECTION 1: THÔNG TIN HỌC SINH */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                <div className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <User className="w-3.5 h-3.5" />
                </div>
                <span>{t.profile.sections?.student || 'Thông tin học sinh'}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4.5">
                {/* Họ và tên */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    {t.profile.fullName} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="Nguyễn Văn A..."
                    className="w-full px-3.5 py-2.5 text-xs sm:text-[13px] rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>

                {/* Mã số học sinh */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    {t.profile.studentCode || 'Mã học sinh / Số định danh'}
                  </label>
                  <input
                    type="text"
                    value={formData.studentCode}
                    onChange={(e) => setFormData({ ...formData, studentCode: e.target.value })}
                    placeholder="VD: LHP2023-11082..."
                    className="w-full px-3.5 py-2.5 text-xs sm:text-[13px] font-mono rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>

                {/* Ngày sinh */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    {t.profile.birthYear || 'Ngày sinh'}
                  </label>
                  <input
                    type="date"
                    value={formData.birthYear}
                    onChange={(e) => setFormData({ ...formData, birthYear: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-[13px] rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>

                {/* Giới tính */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    {t.profile.gender || 'Giới tính'}
                  </label>
                  <select
                    value={formData.gender || 'female'}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-[13px] rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value="male">{t.profile.male || 'Nam'}</option>
                    <option value="female">{t.profile.female || 'Nữ'}</option>
                    <option value="other">{t.profile.other || 'Khác'}</option>
                  </select>
                </div>
              </div>
            </div>

            <hr className="border-gray-100 dark:border-gray-800" />

            {/* SECTION 2: THÔNG TIN TRƯỜNG LỚP */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                <div className="w-6 h-6 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <GraduationCap className="w-3.5 h-3.5" />
                </div>
                <span>{t.profile.sections?.school || 'Thông tin trường lớp'}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4.5">
                {/* Trường học (Full row) */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    {t.profile.school} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.school}
                    onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                    placeholder="Trường THPT..."
                    className="w-full px-3.5 py-2.5 text-xs sm:text-[13px] rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>

                {/* Lớp học */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    {t.profile.classGrade || 'Lớp học'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.classGrade}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        classGrade: e.target.value,
                        className: e.target.value,
                      })
                    }
                    placeholder="Ví dụ: Lớp 10 A5"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-[13px] rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>

                {/* Niên khóa / Năm học */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    {t.profile.academicYear || 'Năm học'}
                  </label>
                  <input
                    type="text"
                    value={formData.academicYear}
                    onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                    placeholder="Ví dụ: 2025 - 2026"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-[13px] rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>
            </div>

            <hr className="border-gray-100 dark:border-gray-800" />

            {/* SECTION 3: THÔNG TIN LIÊN HỆ & PHỤ HUYNH */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                <div className="w-6 h-6 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                  <Users className="w-3.5 h-3.5" />
                </div>
                <span>{t.profile.sections?.contact || 'Thông tin liên hệ & Phụ huynh'}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4.5">
                {/* SĐT học sinh */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    {t.profile.phone}
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="0912 345 678"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-[13px] rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>

                {/* Email liên lạc */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    {t.profile.email}
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="chiendq78@gmail.com"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-[13px] rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>

                {/* Địa chỉ thường trú (Full width) */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    {t.profile.address}
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Số nhà, đường, quận/huyện, tỉnh/thành phố..."
                    className="w-full px-3.5 py-2.5 text-xs sm:text-[13px] rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>

                {/* Họ tên phụ huynh */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    {t.profile.parentName || 'Tên phụ huynh / Người giám hộ'}
                  </label>
                  <input
                    type="text"
                    value={formData.parentName}
                    onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                    placeholder="Họ tên bố / mẹ / người giám hộ..."
                    className="w-full px-3.5 py-2.5 text-xs sm:text-[13px] rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>

                {/* SĐT phụ huynh */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    {t.profile.parentPhone || 'Số điện thoại phụ huynh'}
                  </label>
                  <input
                    type="tel"
                    value={formData.parentPhone}
                    onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                    placeholder="0988 765 432"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-[13px] rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>

                {/* Giáo viên chủ nhiệm */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    {t.profile.homeroomTeacher || 'Giáo viên chủ nhiệm'}
                  </label>
                  <input
                    type="text"
                    value={formData.homeroomTeacher}
                    onChange={(e) => setFormData({ ...formData, homeroomTeacher: e.target.value })}
                    placeholder="Thầy / Cô giáo chủ nhiệm..."
                    className="w-full px-3.5 py-2.5 text-xs sm:text-[13px] rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>

                {/* SĐT GVCN */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    {t.profile.teacherPhone || 'Số điện thoại GVCN'}
                  </label>
                  <input
                    type="tel"
                    value={formData.teacherPhone || formData.homeroomTeacherPhone || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        teacherPhone: e.target.value,
                        homeroomTeacherPhone: e.target.value,
                      })
                    }
                    placeholder="0912 888 999"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-[13px] rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* FORM FOOTER WITH PRIMARY SAVE BUTTON */}
            <div className="flex items-center justify-end pt-4 border-t border-gray-100 dark:border-gray-800">
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white shadow-md shadow-blue-500/20 active:scale-[0.98] transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{t.profile.saveProfile || (lang === 'vi' ? 'Lưu' : 'Save')}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
