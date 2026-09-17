import React from 'react';
import {
  CalendarDays,
  GraduationCap,
  NotebookPen,
  CheckSquare,
  Award,
  Bell,
  Megaphone,
  User,
  Settings,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  X,
  Compass,
} from 'lucide-react';
import { ActiveTab, Language, StudentProfile } from '../types';
import { translations } from '../i18n/translations';
import { useSwipeToCloseModal } from '../hooks/useSwipeToCloseModal';

interface NavigationProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  lang: Language;
  pendingHomeworkCount: number;
  unreadNoticesCount: number;
  unreadPersonalNotificationsCount?: number;
  isMobileDevice: boolean;
  profile?: StudentProfile;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

interface NavItem {
  id: ActiveTab;
  label: string;
  icon: React.ReactNode;
  badge?: number;
  badgeColor?: string;
  category: 'schedule' | 'academics' | 'personal' | 'system';
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onSelectTab,
  lang,
  pendingHomeworkCount,
  unreadNoticesCount,
  unreadPersonalNotificationsCount,
  isMobileDevice,
  profile,
  isCollapsed = false,
  onToggleCollapse,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const t = translations[lang];

  const { modalTouchHandlers: drawerTouchHandlers } = useSwipeToCloseModal({
    isOpen: isMobileOpen,
    onClose: onCloseMobile || (() => {}),
  });

  const items: NavItem[] = [
    {
      id: 'timetable',
      label: t.tabs.timetable,
      icon: <CalendarDays className="w-4.5 h-4.5 shrink-0" />,
      category: 'schedule',
    },
    {
      id: 'extra_class',
      label: t.tabs.extra_class,
      icon: <GraduationCap className="w-4.5 h-4.5 shrink-0" />,
      category: 'schedule',
    },
    {
      id: 'exams',
      label: t.tabs.exams,
      icon: <NotebookPen className="w-4.5 h-4.5 shrink-0" />,
      category: 'schedule',
    },
    {
      id: 'homework',
      label: t.tabs.homework,
      icon: <CheckSquare className="w-4.5 h-4.5 shrink-0" />,
      badge: pendingHomeworkCount > 0 ? pendingHomeworkCount : undefined,
      badgeColor: 'bg-rose-500',
      category: 'academics',
    },
    {
      id: 'grades',
      label: t.tabs.grades,
      icon: <Award className="w-4.5 h-4.5 shrink-0" />,
      category: 'academics',
    },
    {
      id: 'notices',
      label: t.tabs.notices,
      icon: <Megaphone className="w-4.5 h-4.5 shrink-0" />,
      badge: unreadNoticesCount > 0 ? unreadNoticesCount : undefined,
      badgeColor: 'bg-rose-500',
      category: 'academics',
    },
    {
      id: 'profile',
      label: t.tabs.profile,
      icon: <User className="w-4.5 h-4.5 shrink-0" />,
      category: 'personal',
    },
    {
      id: 'system',
      label: t.tabs.system,
      icon: <Settings className="w-4.5 h-4.5 shrink-0" />,
      category: 'system',
    },
    {
      id: 'notifications',
      label: t.tabs.notifications,
      icon: <Bell className="w-4.5 h-4.5 shrink-0" />,
      badge:
        unreadPersonalNotificationsCount && unreadPersonalNotificationsCount > 0
          ? unreadPersonalNotificationsCount
          : undefined,
      badgeColor: 'bg-rose-500',
      category: 'system',
    },
  ];

  const categories = [
    {
      key: 'schedule',
      title: lang === 'vi' ? 'LỊCH TRÌNH & THỜI KHÓA BIỂU' : 'SCHEDULE & TIMETABLE',
    },
    {
      key: 'academics',
      title: lang === 'vi' ? 'NHIỆM VỤ & ĐÁNH GIÁ' : 'TASKS & ASSESSMENTS',
    },
    {
      key: 'personal',
      title: lang === 'vi' ? 'TÀI KHOẢN HỌC SINH' : 'STUDENT ACCOUNT',
    },
    {
      key: 'system',
      title: lang === 'vi' ? 'HỆ THỐNG' : 'SYSTEM',
    },
  ];

  const getInitials = (name?: string) => {
    if (!name) return 'HS';
    const words = name.trim().split(' ');
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  };

  const handleItemClick = (id: ActiveTab) => {
    onSelectTab(id);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  // Content of Vertical Sidebar Menu
  const renderSidebarContent = (inDrawer = false) => (
    <div className="flex flex-col h-full select-none">
      {/* Top Sidebar Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
        {!isCollapsed || inDrawer ? (
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-[#ede3d8] dark:bg-[#34231b] text-[#5b3823] dark:text-[#d7b89f] flex items-center justify-center shrink-0">
              <Compass className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#6e5344] dark:text-[#c4ae9d] truncate">
              {lang === 'vi' ? 'Menu Học Tập' : 'Study Menu'}
            </span>
          </div>
        ) : (
          <div className="mx-auto text-[#5b3823] dark:text-[#d7b89f]">
            <Compass className="w-5 h-5" />
          </div>
        )}

        {/* Action button: Close for drawer, Collapse for desktop sidebar */}
        {inDrawer ? (
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Close Menu"
          >
            <X className="w-5 h-5" />
          </button>
        ) : (
          onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="hidden lg:flex p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title={
                isCollapsed
                  ? lang === 'vi'
                    ? 'Mở rộng Menu'
                    : 'Expand Menu'
                  : lang === 'vi'
                  ? 'Thu gọn Menu'
                  : 'Collapse Menu'
              }
            >
              {isCollapsed ? (
                <PanelLeftOpen className="w-4 h-4" />
              ) : (
                <PanelLeftClose className="w-4 h-4" />
              )}
            </button>
          )
        )}
      </div>

      {/* Main Vertical Nav Items List */}
      <div className="grow overflow-y-auto py-3 px-3 space-y-4 scrollbar-thin">
        {categories.map((cat) => {
          const catItems = items.filter((i) => i.category === cat.key);
          if (catItems.length === 0) return null;

          return (
            <div key={cat.key} className="space-y-0.5">
              {(!isCollapsed || inDrawer) && (
                <div className="px-3 py-1 text-[9.5px] font-bold text-[#877163] dark:text-[#ab9b8c] uppercase tracking-wider">
                  {cat.title}
                </div>
              )}

              {catItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    id={`vertical-menu-tab-${item.id}`}
                    onClick={() => handleItemClick(item.id)}
                    title={isCollapsed && !inDrawer ? item.label : undefined}
                    className={`w-full group flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium transition-all relative ${
                      isActive
                        ? 'bg-[#ede3d8] dark:bg-[#34231b] text-[#2c1810] dark:text-[#f8ede3] border-l-4 border-[#5b3823] dark:border-[#d7b89f] font-semibold shadow-xs'
                        : 'text-[#6e5344] dark:text-[#c4ae9d] hover:text-[#2c1810] dark:hover:text-[#ffffff] hover:bg-[#f4eee6] dark:hover:bg-[#2c1e17]/80'
                    } ${isCollapsed && !inDrawer ? 'justify-center px-2' : ''}`}
                  >
                    <span
                      className={`transition-colors shrink-0 ${
                        isActive
                          ? 'text-[#5b3823] dark:text-[#d7b89f]'
                          : 'text-[#877163] dark:text-[#ab9b8c] group-hover:text-[#2c1810] dark:group-hover:text-white'
                      }`}
                    >
                      {item.icon}
                    </span>

                    {(!isCollapsed || inDrawer) && (
                      <span className="truncate grow text-left">{item.label}</span>
                    )}

                    {/* Badge counter */}
                    {item.badge !== undefined && (
                      <span
                        title={
                          item.id === 'homework'
                            ? (lang === 'vi' ? `${item.badge} bài tập cần xử lý (Chưa làm & Đang làm)` : `${item.badge} tasks to complete`)
                            : item.id === 'notices'
                            ? (lang === 'vi' ? `${item.badge} thông báo chưa đọc` : `${item.badge} unread notices`)
                            : undefined
                        }
                        className={`${item.badgeColor || 'bg-rose-500'} text-white font-bold rounded-full ${
                          !isCollapsed || inDrawer
                            ? 'px-1.5 py-0.5 text-[10.5px] min-w-[18px] text-center'
                            : 'absolute top-1 right-1.5 w-3.5 h-3.5 text-[8.5px] flex items-center justify-center'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}

                    {/* Active highlight dot for collapsed mode */}
                    {isCollapsed && !inDrawer && isActive && (
                      <span className="absolute left-1 top-2 bottom-2 w-1 rounded-full bg-[#5b3823] dark:bg-[#d7b89f]" />
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Sidebar Footer: Student Profile Quick Card & Collapse Button */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
        {!isCollapsed || inDrawer ? (
          <div
            onClick={() => handleItemClick('profile')}
            className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-colors ${
              activeTab === 'profile'
                ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60'
                : 'hover:bg-gray-100 dark:hover:bg-gray-800/70 text-gray-700 dark:text-gray-300'
            }`}
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-xs overflow-hidden">
              {profile?.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt=""
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                getInitials(profile?.fullName)
              )}
            </div>
            <div className="min-w-0 grow">
              <div className="text-xs font-bold text-gray-900 dark:text-white truncate">
                {profile?.fullName || (lang === 'vi' ? 'Học sinh' : 'Student')}
              </div>
              <div className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                {profile?.classGrade ? `${profile.classGrade}` : 'Lớp 10A1'} •{' '}
                {profile?.academicYear || '2025-2026'}
              </div>
            </div>
          </div>
        ) : (
          <div
            onClick={() => handleItemClick('profile')}
            title={profile?.fullName || (lang === 'vi' ? 'Học sinh' : 'Student')}
            className="w-9 h-9 mx-auto rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-xs font-bold cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all shadow-xs overflow-hidden"
          >
            {profile?.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt=""
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              getInitials(profile?.fullName)
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* 1. DESKTOP & TABLET VERTICAL SIDEBAR MENU (Menu Dọc) */}
      {!isMobileDevice && (
        <aside
          id="vertical-sidebar-nav"
          className={`hidden md:flex flex-col shrink-0 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 sticky top-[57px] h-[calc(100vh-57px)] transition-all duration-300 z-20 ${
            isCollapsed ? 'w-20' : 'w-64 lg:w-72'
          }`}
        >
          {renderSidebarContent(false)}
        </aside>
      )}

      {/* 2. MOBILE OVERLAY VERTICAL DRAWER MENU */}
      {isMobileOpen && (
        <div data-mobile-drawer="true" {...drawerTouchHandlers} className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />

          {/* Drawer Canvas */}
          <aside
            onTouchStart={(e) => {
              (e.currentTarget as any)._startX = e.touches[0].clientX;
            }}
            onTouchEnd={(e) => {
              const startX = (e.currentTarget as any)._startX;
              if (startX !== undefined) {
                const endX = e.changedTouches[0].clientX;
                // If swiped left by more than 40px, close drawer
                if (startX - endX > 40 && onCloseMobile) {
                  onCloseMobile();
                }
              }
            }}
            className="relative w-72 max-w-[85vw] h-full bg-white dark:bg-gray-900 shadow-2xl z-10 flex flex-col border-r border-gray-200 dark:border-gray-800 animate-in slide-in-from-left duration-200"
          >
            {renderSidebarContent(true)}
          </aside>
        </div>
      )}

      {/* 3. MOBILE & TABLET BOTTOM QUICK NAV (Excluding notices and profile per user request) */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border-t border-gray-200 dark:border-gray-800 pb-safe md:hidden ${
          isMobileDevice ? 'block' : 'block'
        }`}
      >
        <div className="grid grid-cols-5 h-16 max-w-md mx-auto items-center px-1">
          {[
            {
              id: 'extra_class' as ActiveTab,
              label: lang === 'vi' ? 'Học thêm' : 'Tutoring',
              icon: <GraduationCap className="w-5 h-5 shrink-0" />,
            },
            {
              id: 'exams' as ActiveTab,
              label: lang === 'vi' ? 'Lịch thi' : 'Exams',
              icon: <NotebookPen className="w-5 h-5 shrink-0" />,
            },
            {
              id: 'timetable' as ActiveTab,
              label: lang === 'vi' ? 'TK Biểu' : 'Timetable',
              icon: <CalendarDays className="w-5 h-5 shrink-0" />,
              isHome: true,
            },
            {
              id: 'homework' as ActiveTab,
              label: lang === 'vi' ? 'Bài tập' : 'Homework',
              icon: <CheckSquare className="w-5 h-5 shrink-0" />,
              badge: pendingHomeworkCount > 0 ? pendingHomeworkCount : undefined,
            },
            {
              id: 'grades' as ActiveTab,
              label: lang === 'vi' ? 'Bảng điểm' : 'Grades',
              icon: <Award className="w-5 h-5 shrink-0" />,
            },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            const isHome = tab.isHome;
            return (
              <button
                key={tab.id}
                id={`mobile-nav-${tab.id}`}
                onClick={() => onSelectTab(tab.id)}
                className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-all relative ${
                  isActive
                    ? 'text-[#5b3823] dark:text-[#d7b89f]'
                    : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                }`}
              >
                {isHome ? (
                  <div
                    className={`w-9 h-9 -mt-2 rounded-xl flex items-center justify-center transition-all shadow-xs ${
                      isActive
                        ? 'bg-[#5b3823] text-white ring-2 ring-[#5b3823]/30 dark:ring-[#d7b89f]/30'
                        : 'bg-amber-100/80 dark:bg-gray-800 text-[#5b3823] dark:text-[#d7b89f]'
                    }`}
                  >
                    {tab.icon}
                  </div>
                ) : (
                  <div className="relative">
                    {tab.icon}
                    {tab.badge !== undefined && (
                      <span className="absolute -top-1 -right-2 w-3.5 h-3.5 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                        {tab.badge}
                      </span>
                    )}
                  </div>
                )}
                <span
                  className={`text-[10px] ${
                    isHome ? 'font-bold' : 'font-medium'
                  } mt-0.5 truncate max-w-[70px] leading-tight text-center`}
                >
                  {tab.label}
                </span>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#b88a68] dark:bg-[#ebd5c3] mt-0.5 shadow-2xs" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};
