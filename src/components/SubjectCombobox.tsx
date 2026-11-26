import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Check, Plus, BookOpen, Search, X } from 'lucide-react';
import { SubjectItem } from '../types';
import { StorageService } from '../services/storage';

interface SubjectComboboxProps {
  value: string;
  onChange: (subjectName: string, selectedSubject?: SubjectItem) => void;
  subjects?: SubjectItem[];
  placeholder?: string;
  required?: boolean;
  className?: string;
  id?: string;
}

// Remove Vietnamese accents/diacritics for flexible fuzzy searching
const normalizeText = (str: string): string => {
  return (str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
};

export const SubjectCombobox: React.FC<SubjectComboboxProps> = ({
  value,
  onChange,
  subjects: propSubjects,
  placeholder = 'Chọn hoặc nhập môn học...',
  required = false,
  className = '',
  id,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownListRef = useRef<HTMLDivElement>(null);

  // Synchronized subjects list combining propSubjects and StorageService
  const subjectsList = useMemo(() => {
    const stored = StorageService.getSubjects();
    const map = new Map<string, SubjectItem>();

    // 1. Add all stored subjects
    stored.forEach((s) => {
      map.set(normalizeText(s.name), s);
    });

    // 2. Add or merge propSubjects if provided
    if (propSubjects && propSubjects.length > 0) {
      propSubjects.forEach((s) => {
        const key = normalizeText(s.name);
        if (!map.has(key)) {
          map.set(key, s);
        }
      });
    }

    return Array.from(map.values());
  }, [propSubjects]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setIsTyping(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // When value changes from external, keep searchQuery in sync if not typing
  useEffect(() => {
    if (!isTyping) {
      setSearchQuery('');
    }
  }, [value, isTyping]);

  const handleSelect = (s: SubjectItem) => {
    onChange(s.name, s);
    setIsOpen(false);
    setIsTyping(false);
    setSearchQuery('');
  };

  const handleUseCustomName = (customName: string) => {
    const clean = customName.trim();
    if (!clean) return;
    const matched = subjectsList.find(
      (s) => normalizeText(s.name) === normalizeText(clean)
    );
    onChange(clean, matched);
    setIsOpen(false);
    setIsTyping(false);
    setSearchQuery('');
  };

  // Find exact or closest subject match for the current value
  const matchedSubject = useMemo(() => {
    if (!value) return null;
    const normVal = normalizeText(value);
    return (
      subjectsList.find((s) => normalizeText(s.name) === normVal) ||
      subjectsList.find(
        (s) =>
          normVal.includes(normalizeText(s.name)) ||
          normalizeText(s.name).includes(normVal)
      ) ||
      null
    );
  }, [value, subjectsList]);

  // Intelligent filtering
  const filtered = useMemo(() => {
    // If user opened dropdown via Chevron or click without actively typing new search query,
    // show ALL system subjects so they can choose any subject directly!
    if (!isTyping || !searchQuery.trim()) {
      return subjectsList;
    }

    const normQuery = normalizeText(searchQuery);
    const queryTokens = normQuery.split(/\s+/).filter(Boolean);

    return subjectsList.filter((s) => {
      const sNameNorm = normalizeText(s.name);
      const sCodeNorm = s.code ? normalizeText(s.code) : '';
      const sTeacherNorm = s.teacher ? normalizeText(s.teacher) : '';

      // Direct substring match in either direction
      if (sNameNorm.includes(normQuery) || normQuery.includes(sNameNorm)) return true;
      if (sCodeNorm && (sCodeNorm.includes(normQuery) || normQuery.includes(sCodeNorm))) return true;
      if (sTeacherNorm && sTeacherNorm.includes(normQuery)) return true;

      // Token match: all query tokens appear in subject name or code
      const allTokensMatch = queryTokens.every(
        (token) => sNameNorm.includes(token) || sCodeNorm.includes(token)
      );
      return allTokensMatch;
    });
  }, [subjectsList, isTyping, searchQuery]);

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          id={id}
          type="text"
          required={required}
          value={value}
          onFocus={() => {
            setIsOpen(true);
            setIsTyping(false);
          }}
          onChange={(e) => {
            const val = e.target.value;
            setIsTyping(true);
            setSearchQuery(val);
            const matched = subjectsList.find(
              (s) => normalizeText(s.name) === normalizeText(val)
            );
            onChange(val, matched);
            setIsOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              if (filtered.length === 1) {
                handleSelect(filtered[0]);
              } else if (filtered.length > 0 && isTyping) {
                handleSelect(filtered[0]);
              } else if (value.trim()) {
                handleUseCustomName(value);
              }
            } else if (e.key === 'Escape') {
              setIsOpen(false);
              setIsTyping(false);
            }
          }}
          placeholder={placeholder}
          className={
            className ||
            'w-full pl-3 pr-10 py-2.5 text-xs sm:text-[13px] rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-[#8c5e3c]'
          }
        />

        <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
          {value && (
            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.stopPropagation();
                onChange('', undefined);
                setSearchQuery('');
                setIsTyping(true);
                setIsOpen(true);
                inputRef.current?.focus();
              }}
              title="Xóa nhanh để chọn lại"
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            tabIndex={-1}
            onClick={() => {
              setIsOpen((prev) => !prev);
              setIsTyping(false);
              setSearchQuery('');
            }}
            title="Mở danh sách môn học"
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer rounded"
          >
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${
                isOpen ? 'rotate-180 text-[#8c5e3c]' : ''
              }`}
            />
          </button>
        </div>
      </div>

      {/* Synchronized Subjects Dropdown */}
      {isOpen && (
        <div
          ref={dropdownListRef}
          className="absolute left-0 right-0 top-full mt-1.5 max-h-64 overflow-y-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl z-50 py-1 divide-y divide-gray-100 dark:divide-gray-800 animate-in fade-in zoom-in-95 duration-100"
        >
          {/* Header */}
          <div className="px-3 py-1.5 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 bg-gray-50/90 dark:bg-gray-800/80 sticky top-0 z-10 backdrop-blur-xs">
            <span className="flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-[#8c5e3c]" />
              Danh sách môn học hệ thống ({subjectsList.length})
            </span>
            {isTyping && searchQuery.trim() && (
              <span className="text-[10px] lowercase font-normal text-gray-400">
                khớp {filtered.length} kết quả
              </span>
            )}
          </div>

          {/* If search query entered and not found in list, offer quick add/use custom name */}
          {isTyping && searchQuery.trim() && filtered.length === 0 && (
            <div className="p-3 bg-amber-50/60 dark:bg-amber-950/20 text-xs">
              <p className="text-gray-600 dark:text-gray-300 mb-2">
                Không tìm thấy môn có từ khóa &quot;<strong>{searchQuery}</strong>&quot;.
              </p>
              <button
                type="button"
                onClick={() => handleUseCustomName(searchQuery)}
                className="w-full py-1.5 px-3 bg-[#8c5e3c] hover:bg-[#734b2f] text-white rounded-lg font-medium flex items-center justify-center gap-1.5 cursor-pointer text-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Dùng tên môn tự do &quot;{searchQuery}&quot;
              </button>
            </div>
          )}

          {/* List items */}
          <div className="py-1">
            {(filtered.length > 0 ? filtered : subjectsList).map((s) => {
              const normCurrentVal = normalizeText(value);
              const normSubjectName = normalizeText(s.name);
              const isExactSelected = normCurrentVal === normSubjectName;
              const isPartialMatched =
                !isExactSelected &&
                normCurrentVal &&
                (normCurrentVal.includes(normSubjectName) ||
                  normSubjectName.includes(normCurrentVal));

              const isHighlighted = isExactSelected || isPartialMatched;

              return (
                <button
                  key={s.id || s.name}
                  type="button"
                  onClick={() => handleSelect(s)}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between gap-2.5 hover:bg-[#f5ebe1]/80 dark:hover:bg-gray-800 transition-colors cursor-pointer ${
                    isHighlighted
                      ? 'bg-[#f5ebe1] dark:bg-gray-800/90 font-semibold text-[#5b3823] dark:text-[#f8ede3]'
                      : 'text-gray-800 dark:text-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <span
                      className="w-3 h-3 rounded-full shrink-0 shadow-xs"
                      style={{ backgroundColor: s.color || '#2563EB' }}
                    />
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate">{s.name}</span>
                        {s.code && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 shrink-0">
                            {s.code}
                          </span>
                        )}
                      </div>
                      {(s.teacher || s.room) && (
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 truncate font-normal">
                          {[s.teacher, s.room].filter(Boolean).join(' • ')}
                        </span>
                      )}
                    </div>
                  </div>

                  {isHighlighted && (
                    <span className="flex items-center gap-1 text-[#5b3823] dark:text-[#d7b89f] shrink-0 text-[11px] font-medium">
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      {isPartialMatched && !isExactSelected && (
                        <span className="text-[9px] opacity-75">(khớp)</span>
                      )}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Footer hint */}
          <div className="px-3 py-1.5 text-[10px] text-gray-400 dark:text-gray-500 bg-gray-50/70 dark:bg-gray-800/50 flex items-center justify-between">
            <span>Bấm môn học để chọn và tự động điền GV, phòng</span>
            <span className="font-mono">Enter để chọn</span>
          </div>
        </div>
      )}
    </div>
  );
};
