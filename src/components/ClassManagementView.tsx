import React, { useState, useEffect } from 'react';
import {
  School,
  Plus,
  Edit2,
  Trash2,
  Copy,
  Star,
  MapPin,
  UserCheck,
  BookOpen,
  X,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { Language, ClassTimetable } from '../types';
import { translations } from '../i18n/translations';
import { StorageService } from '../services/storage';
import { useSwipeToCloseModal } from '../hooks/useSwipeToCloseModal';

interface ClassManagementViewProps {
  lang: Language;
  onSyncTimetables?: () => void;
  onNavigateTimetable?: () => void;
  onShowToast?: (msg: string) => void;
}

export const ClassManagementView: React.FC<ClassManagementViewProps> = ({
  lang,
  onSyncTimetables,
  onNavigateTimetable,
  onShowToast,
}) => {
  const t = translations[lang];

  // Class Timetables State
  const [timetables, setTimetables] = useState<ClassTimetable[]>(() =>
    StorageService.getClassTimetables()
  );
  const [activeClassId, setActiveClassId] = useState<string>(() =>
    StorageService.getActiveClassId()
  );

  useEffect(() => {
    setTimetables(StorageService.getClassTimetables());
    setActiveClassId(StorageService.getActiveClassId());
  }, []);

  const activeClass: ClassTimetable =
    timetables.find((item) => item.id === activeClassId) ||
    timetables[0] || {
      id: 'class-default',
      className: '11 Chuyên Toán (11T1)',
      grade: 'Khối 11',
      academicYear: '2025 - 2026',
      room: 'Phòng 302',
      homeroomTeacher: 'Cô Trần Thị Mai Lan',
      isDefault: true,
      schedule: [],
    };

  // Modals state
  const [isCreateClassModalOpen, setIsCreateClassModalOpen] = useState(false);
  const [isEditClassModalOpen, setIsEditClassModalOpen] = useState(false);
  const [classToDelete, setClassToDelete] = useState<ClassTimetable | null>(null);

  // Forms
  const [newClassForm, setNewClassForm] = useState({
    className: '',
    grade: 'Khối 11',
    academicYear: '2025 - 2026',
    room: 'Phòng 302',
    homeroomTeacher: '',
    copyFromId: 'none',
    isDefault: false,
    notes: '',
  });

  const [editingTargetClass, setEditingTargetClass] = useState<ClassTimetable>(activeClass);
  const [editClassForm, setEditClassForm] = useState({
    className: '',
    grade: '',
    academicYear: '',
    room: '',
    homeroomTeacher: '',
    isDefault: false,
    notes: '',
  });

  // Modal touch & swipe handlers (Tier 1 Back gesture)
  const isAnyModalOpen = isCreateClassModalOpen || isEditClassModalOpen || !!classToDelete;

  const handleCloseAnyModal = () => {
    setIsCreateClassModalOpen(false);
    setIsEditClassModalOpen(false);
    setClassToDelete(null);
  };

  const { modalTouchHandlers } = useSwipeToCloseModal({
    isOpen: isAnyModalOpen,
    onClose: handleCloseAnyModal,
  });

  // Switch Active Class
  const handleSelectClass = (targetId: string) => {
    setActiveClassId(targetId);
    StorageService.saveActiveClassId(targetId);
    if (onSyncTimetables) {
      onSyncTimetables();
    }
    if (onShowToast) {
      const cls = timetables.find((c) => c.id === targetId);
      onShowToast(
        lang === 'vi'
          ? `Đã chọn ${cls ? cls.className : 'lớp'} để hiển thị Thời khóa biểu`
          : `Selected ${cls ? cls.className : 'class'} for Timetable view`
      );
    }
  };

  // Set Default Class
  const handleSetDefaultClass = (targetId: string) => {
    const updated = timetables.map((item) => ({
      ...item,
      isDefault: item.id === targetId,
    }));
    setTimetables(updated);
    StorageService.saveClassTimetables(updated);
    if (onSyncTimetables) {
      onSyncTimetables();
    }
    if (onShowToast) {
      onShowToast(
        lang === 'vi' ? 'Đã đặt làm lớp mặc định khi khởi động' : 'Set as default class'
      );
    }
  };

  // Create Class
  const handleOpenCreateClass = () => {
    setNewClassForm({
      className: '',
      grade: activeClass.grade || 'Khối 11',
      academicYear: activeClass.academicYear || '2025 - 2026',
      room: activeClass.room || 'Phòng 302',
      homeroomTeacher: '',
      copyFromId: activeClass.id,
      isDefault: false,
      notes: '',
    });
    setIsCreateClassModalOpen(true);
  };

  const handleConfirmCreateClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassForm.className.trim()) return;

    let initialItems: any[] = [];
    if (newClassForm.copyFromId && newClassForm.copyFromId !== 'none') {
      const src = timetables.find((item) => item.id === newClassForm.copyFromId);
      if (src) {
        initialItems = src.schedule.map((item) => ({
          ...item,
          id: `tkb-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        }));
      }
    }

    const newId = `class-${Date.now()}`;
    const newClassItem: ClassTimetable = {
      id: newId,
      className: newClassForm.className.trim(),
      grade: newClassForm.grade.trim() || undefined,
      academicYear: newClassForm.academicYear.trim() || undefined,
      room: newClassForm.room.trim() || undefined,
      homeroomTeacher: newClassForm.homeroomTeacher.trim() || undefined,
      isDefault: newClassForm.isDefault,
      notes: newClassForm.notes.trim() || undefined,
      schedule: initialItems,
      createdAt: new Date().toISOString(),
    };

    let updatedList = [...timetables];
    if (newClassForm.isDefault) {
      updatedList = updatedList.map((item) => ({ ...item, isDefault: false }));
    }
    updatedList.push(newClassItem);

    setTimetables(updatedList);
    StorageService.saveClassTimetables(updatedList);
    handleSelectClass(newId);
    setIsCreateClassModalOpen(false);
    if (onSyncTimetables) {
      onSyncTimetables();
    }
    if (onShowToast) {
      onShowToast(t.classTimetable.classCreated);
    }
  };

  // Edit Class
  const handleOpenEditClass = (targetClass: ClassTimetable = activeClass) => {
    setEditingTargetClass(targetClass);
    setEditClassForm({
      className: targetClass.className,
      grade: targetClass.grade || '',
      academicYear: targetClass.academicYear || '',
      room: targetClass.room || '',
      homeroomTeacher: targetClass.homeroomTeacher || '',
      isDefault: !!targetClass.isDefault,
      notes: targetClass.notes || '',
    });
    setIsEditClassModalOpen(true);
  };

  const handleConfirmEditClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editClassForm.className.trim()) return;

    const targetId = editingTargetClass.id;
    const updatedList = timetables.map((item) => {
      if (item.id === targetId) {
        return {
          ...item,
          className: editClassForm.className.trim(),
          grade: editClassForm.grade.trim() || undefined,
          academicYear: editClassForm.academicYear.trim() || undefined,
          room: editClassForm.room.trim() || undefined,
          homeroomTeacher: editClassForm.homeroomTeacher.trim() || undefined,
          notes: editClassForm.notes.trim() || undefined,
          isDefault: editClassForm.isDefault,
        };
      }
      if (editClassForm.isDefault) {
        return { ...item, isDefault: false };
      }
      return item;
    });

    setTimetables(updatedList);
    StorageService.saveClassTimetables(updatedList);
    setIsEditClassModalOpen(false);
    if (onSyncTimetables) {
      onSyncTimetables();
    }
    if (onShowToast) {
      onShowToast(t.classTimetable.classUpdated);
    }
  };

  // Duplicate Class
  const handleDuplicateClass = (targetClass: ClassTimetable) => {
    const newId = `class-${Date.now()}`;
    const duplicated: ClassTimetable = {
      ...targetClass,
      id: newId,
      className: `${targetClass.className} (${lang === 'vi' ? 'Bản sao' : 'Copy'})`,
      isDefault: false,
      createdAt: new Date().toISOString(),
      schedule: targetClass.schedule.map((item) => ({
        ...item,
        id: `tkb-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      })),
    };
    const nextList = [...timetables, duplicated];
    setTimetables(nextList);
    StorageService.saveClassTimetables(nextList);
    handleSelectClass(newId);
    if (onSyncTimetables) {
      onSyncTimetables();
    }
    if (onShowToast) {
      onShowToast(t.classTimetable.classCreated);
    }
  };

  // Delete Class
  const handleDeleteClass = (targetClass: ClassTimetable) => {
    if (timetables.length <= 1) return;
    const nextList = timetables.filter((item) => item.id !== targetClass.id);
    setTimetables(nextList);
    StorageService.saveClassTimetables(nextList);
    if (activeClassId === targetClass.id) {
      const nextActive = nextList[0].id;
      handleSelectClass(nextActive);
    }
    setClassToDelete(null);
    if (onSyncTimetables) {
      onSyncTimetables();
    }
    if (onShowToast) {
      onShowToast(
        lang === 'vi'
          ? `Đã xóa lớp "${targetClass.className}"`
          : `Deleted class "${targetClass.className}"`
      );
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4 animate-fadeIn pb-12">
      {/* 1. Header Banner */}
      <div className="bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-gray-800 p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#ebdcd0] dark:bg-gray-800 text-[#5b3823] dark:text-[#d7b89f] flex items-center justify-center shrink-0">
              <School className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                  {lang === 'vi' ? 'Quản lý lớp học' : 'Class Management'}
                </h1>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[#faf6f0] dark:bg-gray-800 text-[#5b3823] dark:text-[#d7b89f] border border-[#ebdcd0] dark:border-gray-700">
                  {timetables.length} {t.classTimetable.classCount}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {lang === 'vi'
                  ? 'Quản lý thông tin chi tiết lớp, thêm lớp mới, chỉnh sửa và chuyển đổi thời khóa biểu'
                  : 'Manage class details, add new classes, edit, duplicate, and switch timetables'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            {onNavigateTimetable && (
              <button
                type="button"
                onClick={onNavigateTimetable}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors cursor-pointer"
              >
                <span>{lang === 'vi' ? 'Xem Thời khóa biểu' : 'View Timetable'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              id="add-class-btn"
              onClick={handleOpenCreateClass}
              className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#5b3823] hover:bg-[#72462c] transition-all shadow-sm shadow-[#5b3823]/20 active:scale-[0.98] cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{t.classTimetable.createClass}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Main Content: Danh sách lớp */}
      <section className="bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-gray-800 p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            {lang === 'vi' ? 'Danh Sách Lớp & Thao Tác' : 'All Classes & Actions'}
          </h2>
          <span className="text-[11px] text-gray-400">
            {lang === 'vi'
              ? 'Bấm "Chọn lớp" để đổi lớp xem trên Thời khóa biểu'
              : 'Tap "Select" to switch active timetable'}
          </span>
        </div>

        <div className="space-y-2.5">
          {timetables.map((item) => {
            const isActive = item.id === activeClass.id;
            return (
              <div
                key={item.id}
                className={`p-3.5 sm:p-4 rounded-xl border transition-all ${
                  isActive
                    ? 'border-[#b89278] bg-[#faf6f0] dark:bg-[#2c1e17]/50 shadow-2xs'
                    : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-850 hover:border-gray-300'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Class Info */}
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm sm:text-base text-gray-900 dark:text-white">
                        {item.className}
                      </span>
                      {item.isDefault && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                          <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-500" />
                          {lang === 'vi' ? 'Mặc định' : 'Default'}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
                      {item.grade && <span>{item.grade}</span>}
                      {item.room && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-[#b89278]" />
                          {item.room}
                        </span>
                      )}
                      {item.homeroomTeacher && (
                        <span className="flex items-center gap-1">
                          <UserCheck className="w-3 h-3 text-[#b89278]" />
                          {item.homeroomTeacher}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-3 h-3 text-[#b89278]" />
                        {item.schedule.length} {t.classTimetable.periodsCount}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto flex-wrap">
                    {!isActive ? (
                      <button
                        type="button"
                        onClick={() => handleSelectClass(item.id)}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#5b3823] hover:bg-[#72462c] text-white transition-colors cursor-pointer"
                      >
                        {lang === 'vi' ? 'Chọn lớp này' : 'Select'}
                      </button>
                    ) : (
                      <span className="text-xs font-bold text-[#5b3823] dark:text-[#d7b89f] px-2.5 py-1 bg-[#5b3823]/10 dark:bg-[#5b3823]/30 rounded-lg">
                        ✓ {lang === 'vi' ? 'Đang chọn' : 'Selected'}
                      </span>
                    )}

                    {!item.isDefault && (
                      <button
                        type="button"
                        onClick={() => handleSetDefaultClass(item.id)}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800 transition-colors cursor-pointer"
                        title={t.classTimetable.setDefault}
                      >
                        <Star className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleOpenEditClass(item)}
                      className="p-1.5 rounded-lg text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-750 transition-colors cursor-pointer"
                      title={t.classTimetable.editClass}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDuplicateClass(item)}
                      className="p-1.5 rounded-lg text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-750 transition-colors cursor-pointer"
                      title={lang === 'vi' ? 'Nhân bản thời khóa biểu này' : 'Duplicate class'}
                    >
                      <Copy className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      disabled={timetables.length <= 1}
                      onClick={() => setClassToDelete(item)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                      title={
                        timetables.length <= 1
                          ? t.classTimetable.cannotDeleteOnlyClass
                          : t.classTimetable.deleteClass
                      }
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* MODAL 1: CREATE CLASS */}
      {isCreateClassModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
          {...modalTouchHandlers}
        >
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#ebdcd0] dark:bg-gray-800 text-[#5b3823] dark:text-[#d7b89f] flex items-center justify-center shrink-0">
                  <School className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    {t.classTimetable.createClass}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {lang === 'vi'
                      ? 'Khởi tạo thời khóa biểu riêng cho một lớp học mới'
                      : 'Initialize a distinct timetable for a new class'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateClassModalOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmCreateClass} className="p-4 sm:p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  {t.classTimetable.className} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newClassForm.className}
                  onChange={(e) => setNewClassForm({ ...newClassForm, className: e.target.value })}
                  placeholder="Ví dụ: 12 Chuyên Lý (12L1), 10A2, Khối 11..."
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#b89278]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    {t.classTimetable.grade}
                  </label>
                  <input
                    type="text"
                    value={newClassForm.grade}
                    onChange={(e) => setNewClassForm({ ...newClassForm, grade: e.target.value })}
                    placeholder="Khối 10, Khối 11, Khối 12..."
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#b89278]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    {t.classTimetable.academicYear}
                  </label>
                  <input
                    type="text"
                    value={newClassForm.academicYear}
                    onChange={(e) =>
                      setNewClassForm({ ...newClassForm, academicYear: e.target.value })
                    }
                    placeholder="2025 - 2026"
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#b89278]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    {t.classTimetable.room}
                  </label>
                  <input
                    type="text"
                    value={newClassForm.room}
                    onChange={(e) => setNewClassForm({ ...newClassForm, room: e.target.value })}
                    placeholder="Phòng 302, Tòa B..."
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#b89278]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    {t.classTimetable.homeroomTeacher}
                  </label>
                  <input
                    type="text"
                    value={newClassForm.homeroomTeacher}
                    onChange={(e) =>
                      setNewClassForm({ ...newClassForm, homeroomTeacher: e.target.value })
                    }
                    placeholder="Cô Mai Lan, Thầy Nam..."
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#b89278]"
                  />
                </div>
              </div>

              {/* Template Copy Option */}
              <div className="p-3 rounded-xl bg-[#faf6f0] dark:bg-gray-800/60 border border-[#ebdcd0] dark:border-gray-700 space-y-1.5">
                <label className="block font-bold text-[#5b3823] dark:text-[#f8ede3]">
                  {t.classTimetable.copyFromExisting}
                </label>
                <select
                  value={newClassForm.copyFromId}
                  onChange={(e) =>
                    setNewClassForm({ ...newClassForm, copyFromId: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-850 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#b89278]"
                >
                  <option value="none">✨ {t.classTimetable.emptyTimetable}</option>
                  {timetables.map((item) => (
                    <option key={item.id} value={item.id}>
                      📋 {lang === 'vi' ? 'Sao chép từ' : 'Copy from'}: {item.className} (
                      {item.schedule.length} {t.classTimetable.periodsCount})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  {lang === 'vi'
                    ? 'Bạn có thể kế thừa các tiết học và khung giờ từ lớp khác để chỉnh sửa nhanh hơn.'
                    : 'Inherit periods and time slots from an existing class to edit faster.'}
                </p>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  {lang === 'vi' ? 'Ghi chú lớp' : 'Notes'}
                </label>
                <textarea
                  rows={2}
                  value={newClassForm.notes}
                  onChange={(e) => setNewClassForm({ ...newClassForm, notes: e.target.value })}
                  placeholder="Ghi chú về khối, ban chuyên, lớp trưởng..."
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#b89278]"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="new-class-is-default"
                  checked={newClassForm.isDefault}
                  onChange={(e) =>
                    setNewClassForm({ ...newClassForm, isDefault: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-[#5b3823] focus:ring-[#b89278]"
                />
                <label
                  htmlFor="new-class-is-default"
                  className="font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
                >
                  {t.classTimetable.setDefault}
                </label>
              </div>

              <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCreateClassModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-semibold cursor-pointer"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#5b3823] hover:bg-[#72462c] text-white font-bold transition-colors cursor-pointer"
                >
                  {t.common.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT CLASS */}
      {isEditClassModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
          {...modalTouchHandlers}
        >
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#ebdcd0] dark:bg-gray-800 text-[#5b3823] dark:text-[#d7b89f] flex items-center justify-center shrink-0">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    {t.classTimetable.editClass}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {editingTargetClass.className}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditClassModalOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmEditClass} className="p-4 sm:p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  {t.classTimetable.className} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editClassForm.className}
                  onChange={(e) =>
                    setEditClassForm({ ...editClassForm, className: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#b89278]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    {t.classTimetable.grade}
                  </label>
                  <input
                    type="text"
                    value={editClassForm.grade}
                    onChange={(e) =>
                      setEditClassForm({ ...editClassForm, grade: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#b89278]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    {t.classTimetable.academicYear}
                  </label>
                  <input
                    type="text"
                    value={editClassForm.academicYear}
                    onChange={(e) =>
                      setEditClassForm({ ...editClassForm, academicYear: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#b89278]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    {t.classTimetable.room}
                  </label>
                  <input
                    type="text"
                    value={editClassForm.room}
                    onChange={(e) =>
                      setEditClassForm({ ...editClassForm, room: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#b89278]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    {t.classTimetable.homeroomTeacher}
                  </label>
                  <input
                    type="text"
                    value={editClassForm.homeroomTeacher}
                    onChange={(e) =>
                      setEditClassForm({ ...editClassForm, homeroomTeacher: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#b89278]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  {lang === 'vi' ? 'Ghi chú lớp' : 'Notes'}
                </label>
                <textarea
                  rows={2}
                  value={editClassForm.notes}
                  onChange={(e) =>
                    setEditClassForm({ ...editClassForm, notes: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#b89278]"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="edit-class-is-default"
                  checked={editClassForm.isDefault}
                  onChange={(e) =>
                    setEditClassForm({ ...editClassForm, isDefault: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-[#5b3823] focus:ring-[#b89278]"
                />
                <label
                  htmlFor="edit-class-is-default"
                  className="font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
                >
                  {t.classTimetable.setDefault}
                </label>
              </div>

              <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsEditClassModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-semibold cursor-pointer"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#5b3823] hover:bg-[#72462c] text-white font-bold transition-colors cursor-pointer"
                >
                  {t.common.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: CONFIRM DELETE CLASS */}
      {classToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
          {...modalTouchHandlers}
        >
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-sm shadow-2xl border border-gray-200 dark:border-gray-800 p-5 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                {lang === 'vi' ? 'Xác nhận xóa lớp học?' : 'Delete Class?'}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {lang === 'vi'
                  ? `Lớp "${classToDelete.className}" cùng ${classToDelete.schedule.length} tiết học liên quan sẽ bị xóa khỏi hệ thống.`
                  : `Class "${classToDelete.className}" and its ${classToDelete.schedule.length} periods will be deleted.`}
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setClassToDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
              >
                {t.common.cancel}
              </button>
              <button
                type="button"
                onClick={() => handleDeleteClass(classToDelete)}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-bold text-white shadow-xs cursor-pointer"
              >
                {lang === 'vi' ? 'Xóa lớp' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
