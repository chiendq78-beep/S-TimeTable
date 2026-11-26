import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  Search,
  Filter,
  Users,
  Check,
  X,
  Sparkles,
  School,
  UserCheck,
  MapPin,
  Layers,
  GraduationCap,
} from 'lucide-react';
import { SubjectItem, ClassTimetable, Language } from '../types';
import { StorageService } from '../services/storage';
import { useSwipeToCloseModal } from '../hooks/useSwipeToCloseModal';

interface SubjectsManagementViewProps {
  subjects: SubjectItem[];
  onSaveSubjects: (items: SubjectItem[]) => void;
  lang: Language;
  timetables?: ClassTimetable[];
  onShowToast?: (msg: string) => void;
}

const PRESET_COLORS = [
  '#2563EB', // Blue
  '#9333EA', // Purple
  '#059669', // Emerald
  '#EA580C', // Orange
  '#DC2626', // Red
  '#D97706', // Amber
  '#0891B2', // Cyan
  '#4F46E5', // Indigo
  '#0D9488', // Teal
  '#E11D48', // Rose
  '#65A30D', // Lime
  '#64748B', // Slate
];

export const SubjectsManagementView: React.FC<SubjectsManagementViewProps> = ({
  subjects,
  onSaveSubjects,
  lang,
  timetables: timetablesProp,
  onShowToast,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  const [editingItem, setEditingItem] = useState<SubjectItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<SubjectItem | null>(null);

  // Load classes for filtering and assignment
  const timetables: ClassTimetable[] = useMemo(() => {
    if (timetablesProp && timetablesProp.length > 0) return timetablesProp;
    return StorageService.getClassTimetables();
  }, [timetablesProp]);

  // Swipe-to-close on mobile/tablet for modals
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

  // Filtered subjects based on search & class filter
  const filteredSubjects = useMemo(() => {
    return subjects.filter((item) => {
      // 1. Search query
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        (item.code && item.code.toLowerCase().includes(q)) ||
        (item.teacher && item.teacher.toLowerCase().includes(q));

      if (!matchSearch) return false;

      // 2. Class filter
      if (selectedClassFilter === 'all') return true;
      if (!item.classes || item.classes.includes('all')) return true;
      return item.classes.includes(selectedClassFilter);
    });
  }, [subjects, searchQuery, selectedClassFilter]);

  // Open add modal
  const handleOpenAdd = () => {
    setEditingItem({
      id: `sub-${Date.now()}`,
      name: '',
      code: '',
      classes: selectedClassFilter === 'all' ? ['all'] : [selectedClassFilter],
      color: PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)],
      notes: '',
    });
    setIsModalOpen(true);
  };

  // Open edit modal
  const handleOpenEdit = (item: SubjectItem) => {
    setEditingItem({
      ...item,
      classes: item.classes && item.classes.length > 0 ? [...item.classes] : ['all'],
    });
    setIsModalOpen(true);
  };

  // Save subject
  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editingItem.name.trim()) return;

    const exists = subjects.some((s) => s.id === editingItem.id);
    let updated: SubjectItem[];

    if (exists) {
      updated = subjects.map((s) => (s.id === editingItem.id ? editingItem : s));
      if (onShowToast) onShowToast(lang === 'vi' ? 'Đã cập nhật môn học' : 'Subject updated');
    } else {
      updated = [editingItem, ...subjects];
      if (onShowToast) onShowToast(lang === 'vi' ? 'Đã thêm môn học mới' : 'New subject added');
    }

    onSaveSubjects(updated);
    setIsModalOpen(false);
    setEditingItem(null);
  };

  // Confirm delete
  const handleConfirmDelete = () => {
    if (!itemToDelete) return;
    const updated = subjects.filter((s) => s.id !== itemToDelete.id);
    onSaveSubjects(updated);
    if (onShowToast) {
      onShowToast(
        lang === 'vi'
          ? `Đã xóa môn "${itemToDelete.name}"`
          : `Subject "${itemToDelete.name}" deleted`
      );
    }
    setItemToDelete(null);
  };

  // Toggle class selection for an editing subject
  const handleToggleClass = (classId: string) => {
    if (!editingItem) return;
    let current = editingItem.classes || ['all'];

    if (classId === 'all') {
      setEditingItem({ ...editingItem, classes: ['all'] });
      return;
    }

    // Remove 'all' if specific class is toggled
    current = current.filter((c) => c !== 'all');
    if (current.includes(classId)) {
      current = current.filter((c) => c !== classId);
      if (current.length === 0) current = ['all'];
    } else {
      current.push(classId);
    }

    setEditingItem({ ...editingItem, classes: current });
  };

  // Stats
  const allClassCount = subjects.filter((s) => !s.classes || s.classes.includes('all')).length;

  return (
    <div className="max-w-6xl mx-auto space-y-4 animate-fadeIn pb-12">
      {/* Header Banner */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 sm:p-6 border border-gray-200 dark:border-gray-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#5b3823] to-[#8c5e3c] text-white flex items-center justify-center shadow-md shadow-[#5b3823]/20 shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                {lang === 'vi' ? 'Danh Sách Môn Học' : 'Subject Management'}
              </h1>
              <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-[#f5ebe1] dark:bg-gray-800 text-[#5b3823] dark:text-[#d7b89f] border border-[#ebdcd0] dark:border-gray-700">
                {subjects.length} {lang === 'vi' ? 'môn học' : 'subjects'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {lang === 'vi'
                ? 'Quản lý danh sách các môn học, mã viết tắt, màu sắc nhận diện và lớp học áp dụng'
                : 'Manage subjects list across classes, codes, color tags and assignments'}
            </p>
          </div>
        </div>

        <button
          id="btn-add-subject"
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#5b3823] hover:bg-[#4a2d1c] text-white text-xs sm:text-sm font-bold shadow-sm shadow-[#5b3823]/20 transition-all active:scale-[0.98] shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{lang === 'vi' ? 'Thêm Môn Học' : 'Add Subject'}</span>
        </button>
      </div>

      {/* Summary Stats Widgets */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-white dark:bg-gray-900 rounded-xl p-3.5 sm:p-4 border border-gray-200 dark:border-gray-800 shadow-xs">
          <div className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
            {lang === 'vi' ? 'Tổng số môn học' : 'Total Subjects'}
          </div>
          <div className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mt-0.5">
            {subjects.length}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl p-3.5 sm:p-4 border border-gray-200 dark:border-gray-800 shadow-xs">
          <div className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
            {lang === 'vi' ? 'Môn áp dụng chung' : 'Common Subjects'}
          </div>
          <div className="text-lg sm:text-xl font-bold text-purple-600 dark:text-purple-400 mt-0.5">
            {allClassCount}
          </div>
        </div>

        <div className="col-span-2 sm:col-span-1 bg-white dark:bg-gray-900 rounded-xl p-3.5 sm:p-4 border border-gray-200 dark:border-gray-800 shadow-xs">
          <div className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
            {lang === 'vi' ? 'Lớp đang thiết lập' : 'Configured Classes'}
          </div>
          <div className="text-lg sm:text-xl font-bold text-blue-600 dark:text-blue-400 mt-0.5">
            {timetables.length} {lang === 'vi' ? 'lớp' : 'classes'}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-800 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                lang === 'vi'
                  ? 'Tìm kiếm môn học theo tên, mã môn, giáo viên...'
                  : 'Search subjects by name, code, teacher...'
              }
              className="w-full pl-9 pr-8 py-2 text-xs sm:text-[13px] rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8c5e3c]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Clear Filter if searching */}
          <span className="text-xs text-gray-400 dark:text-gray-500 self-center shrink-0">
            {lang === 'vi'
              ? `Hiển thị ${filteredSubjects.length} / ${subjects.length} môn`
              : `Showing ${filteredSubjects.length} / ${subjects.length}`}
          </span>
        </div>

        {/* Class Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none pt-1 border-t border-gray-100 dark:border-gray-800">
          <span className="text-xs font-bold text-gray-400 dark:text-gray-500 mr-1 flex items-center gap-1 shrink-0">
            <School className="w-3.5 h-3.5" />
            <span>{lang === 'vi' ? 'Lớp:' : 'Class:'}</span>
          </span>

          <button
            type="button"
            onClick={() => setSelectedClassFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              selectedClassFilter === 'all'
                ? 'bg-[#5b3823] text-white font-bold shadow-xs'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {lang === 'vi' ? 'Tất cả các lớp' : 'All Classes'}
          </button>

          {timetables.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSelectedClassFilter(t.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedClassFilter === t.id
                  ? 'bg-[#5b3823] text-white font-bold shadow-xs'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {t.className}
            </button>
          ))}
        </div>
      </div>

      {/* Subjects Grid */}
      {filteredSubjects.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-12 text-center border border-gray-200 dark:border-gray-800 shadow-xs space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-400 mx-auto flex items-center justify-center">
            <BookOpen className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-gray-800 dark:text-gray-200">
            {lang === 'vi' ? 'Không tìm thấy môn học nào' : 'No subjects found'}
          </h3>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
            {lang === 'vi'
              ? 'Thử thay đổi từ khóa tìm kiếm hoặc chọn lọc lớp học khác.'
              : 'Try adjusting your search query or class filter.'}
          </p>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#5b3823] text-white hover:bg-[#4a2d1c] shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{lang === 'vi' ? 'Thêm môn học mới' : 'Add new subject'}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredSubjects.map((item) => {
            const isAllClasses = !item.classes || item.classes.includes('all');
            const classNames = isAllClasses
              ? [lang === 'vi' ? 'Tất cả các lớp' : 'All Classes']
              : item.classes?.map((cId) => {
                  const found = timetables.find((t) => t.id === cId);
                  return found ? found.className : cId;
                }) || [];

            return (
              <div
                key={item.id}
                className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 transition-all shadow-xs hover:shadow-md flex flex-col justify-between gap-3 group relative overflow-hidden"
              >
                {/* Accent Color Left Bar */}
                <div
                  className="absolute left-0 top-0 bottom-0 w-1.5"
                  style={{ backgroundColor: item.color || '#2563EB' }}
                />

                <div className="space-y-2.5 pl-1.5">
                  {/* Top row: Badges & Action Buttons */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {item.code && (
                        <span
                          className="text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider text-white"
                          style={{ backgroundColor: item.color || '#2563EB' }}
                        >
                          {item.code}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(item)}
                        title={lang === 'vi' ? 'Chỉnh sửa môn học' : 'Edit subject'}
                        className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setItemToDelete(item)}
                        title={lang === 'vi' ? 'Xóa môn học' : 'Delete subject'}
                        className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Subject Name */}
                  <h3 className="text-base font-bold text-gray-900 dark:text-white leading-snug">
                    {item.name}
                  </h3>

                  {/* Notes if present */}
                  {item.notes && (
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2 italic bg-gray-50/80 dark:bg-gray-800/60 p-2 rounded-lg border border-gray-100 dark:border-gray-800">
                      {item.notes}
                    </p>
                  )}
                </div>

                {/* Bottom: Class Application Pill */}
                <div className="pt-2 border-t border-gray-100 dark:border-gray-800/80 flex items-center justify-between text-[11px] pl-1.5">
                  <span className="text-gray-400 dark:text-gray-500 flex items-center gap-1">
                    <School className="w-3 h-3" />
                    <span>{lang === 'vi' ? 'Áp dụng:' : 'Classes:'}</span>
                  </span>
                  <div className="flex items-center gap-1 flex-wrap justify-end">
                    {classNames.map((name, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium truncate max-w-[150px]"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Subject Modal */}
      {isModalOpen && editingItem && (
        <div
          data-app-modal="true"
          {...modalTouchHandlers}
          className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div className="bg-white dark:bg-gray-900 rounded-none sm:rounded-2xl max-w-lg w-full h-full sm:h-auto max-h-[100vh] sm:max-h-[92vh] border-0 sm:border border-gray-200 dark:border-gray-800 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-100 dark:border-gray-800 shrink-0 bg-gray-50/70 dark:bg-gray-850">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-9 h-9 rounded-xl text-white flex items-center justify-center shadow-xs shrink-0"
                  style={{ backgroundColor: editingItem.color || '#2563EB' }}
                >
                  <BookOpen className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    {subjects.some((s) => s.id === editingItem.id)
                      ? lang === 'vi'
                        ? 'Chỉnh Sửa Môn Học'
                        : 'Edit Subject'
                      : lang === 'vi'
                      ? 'Thêm Môn Học Mới'
                      : 'Add New Subject'}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {lang === 'vi'
                      ? 'Thiết lập tên môn học, màu sắc và lớp áp dụng'
                      : 'Set subject name, color tag and assigned classes'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-lg hover:bg-gray-200/60 dark:hover:bg-gray-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSaveModal} className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                {/* Tên môn học & Mã môn */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      {lang === 'vi' ? 'Tên môn học' : 'Subject Name'} <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={editingItem.name}
                      onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                      placeholder="Toán học, Ngữ văn..."
                      className="w-full px-3 py-2 text-xs sm:text-[13px] rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-[#8c5e3c]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      {lang === 'vi' ? 'Mã viết tắt' : 'Code'}
                    </label>
                    <input
                      type="text"
                      value={editingItem.code || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, code: e.target.value.toUpperCase() })}
                      placeholder="TOAN, LY..."
                      maxLength={8}
                      className="w-full px-3 py-2 text-xs sm:text-[13px] rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white uppercase placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-[#8c5e3c]"
                    />
                  </div>
                </div>

                {/* Màu nhận diện */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    {lang === 'vi' ? 'Màu nhận diện môn học' : 'Color Tag'}
                  </label>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setEditingItem({ ...editingItem, color: c })}
                        className={`w-7 h-7 rounded-xl transition-all shrink-0 cursor-pointer ${
                          editingItem.color === c
                            ? 'scale-110 ring-2 ring-offset-2 ring-black dark:ring-white shadow-xs'
                            : 'hover:scale-105 opacity-80 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>

                {/* Áp dụng cho các lớp */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center justify-between">
                    <span>{lang === 'vi' ? 'Áp dụng cho các lớp' : 'Applicable Classes'}</span>
                    <span className="text-[11px] text-gray-400 font-normal">
                      {editingItem.classes?.includes('all')
                        ? lang === 'vi' ? 'Tất cả các lớp' : 'All classes'
                        : `${editingItem.classes?.length || 0} lớp`}
                    </span>
                  </label>

                  <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-800 dark:text-gray-200 pb-2 border-b border-gray-200/80 dark:border-gray-700">
                      <input
                        type="checkbox"
                        checked={editingItem.classes?.includes('all')}
                        onChange={() => handleToggleClass('all')}
                        className="rounded text-[#5b3823] focus:ring-[#5b3823] w-4 h-4 cursor-pointer"
                      />
                      <span>{lang === 'vi' ? 'Tất cả các lớp trong trường' : 'All classes in school'}</span>
                    </label>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      {timetables.map((t) => {
                        const isChecked =
                          editingItem.classes?.includes('all') ||
                          editingItem.classes?.includes(t.id);
                        return (
                          <label
                            key={t.id}
                            className={`flex items-center gap-2 p-2 rounded-lg text-xs cursor-pointer border transition-colors ${
                              isChecked
                                ? 'bg-white dark:bg-gray-900 border-[#8c5e3c]/50 text-gray-900 dark:text-white font-semibold'
                                : 'bg-transparent border-transparent text-gray-600 dark:text-gray-400'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleClass(t.id)}
                              className="rounded text-[#5b3823] focus:ring-[#5b3823] w-3.5 h-3.5 cursor-pointer"
                            />
                            <span className="truncate">{t.className}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Ghi chú */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    {lang === 'vi' ? 'Ghi chú thêm' : 'Notes'}
                  </label>
                  <textarea
                    rows={2}
                    value={editingItem.notes || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, notes: e.target.value })}
                    placeholder="Môn thi tốt nghiệp, tài liệu cần chuẩn bị..."
                    className="w-full px-3 py-2 text-xs sm:text-[13px] rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-[#8c5e3c]"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-850 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-200/70 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                >
                  {lang === 'vi' ? 'Hủy' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#5b3823] hover:bg-[#4a2d1c] text-white shadow-xs transition-all active:scale-[0.98] cursor-pointer"
                >
                  {lang === 'vi' ? 'Lưu Môn Học' : 'Save Subject'}
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
                  {lang === 'vi' ? 'Xác nhận xóa môn học?' : 'Delete Subject?'}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {lang === 'vi'
                    ? 'Hành động này sẽ xóa môn học khỏi danh mục hệ thống.'
                    : 'This action will delete the subject from system directory.'}
                </p>
              </div>
            </div>

            <div className="p-3 my-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 text-xs space-y-1">
              <div className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-2">
                <span>{itemToDelete.name}</span>
                {itemToDelete.code && (
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-gray-200 dark:bg-gray-700">
                    {itemToDelete.code}
                  </span>
                )}
              </div>
              <div className="text-gray-600 dark:text-gray-400 flex items-center gap-1.5 flex-wrap">
                <span>{lang === 'vi' ? `Hệ số ${itemToDelete.coefficient}` : `Weight ${itemToDelete.coefficient}`}</span>
                {itemToDelete.teacher && <span>• {itemToDelete.teacher}</span>}
                {itemToDelete.room && <span>• {itemToDelete.room}</span>}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
              >
                {lang === 'vi' ? 'Hủy' : 'Cancel'}
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
