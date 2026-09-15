import React, { useState, useEffect } from 'react';
import {
  ActiveTab,
  Language,
  ClassScheduleItem,
  ExtraClassItem,
  ExamItem,
  HomeworkItem,
  SubjectGrade,
  SchoolNotice,
  StudentProfile,
  PersonalNotification,
  NotificationPreferences,
} from './types';
import { StorageService } from './services/storage';
import { NotificationService } from './services/notification';
import { translations } from './i18n/translations';

// Components
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { ClassScheduleView } from './components/ClassScheduleView';
import { ExtraClassView } from './components/ExtraClassView';
import { ExamScheduleView } from './components/ExamScheduleView';
import { HomeworkView } from './components/HomeworkView';
import { GradebookView } from './components/GradebookView';
import { NoticesView } from './components/NoticesView';
import { StudentProfileView } from './components/StudentProfileView';
import { SystemSettingsView } from './components/SystemSettingsView';
import { NotificationCenterView } from './components/NotificationCenterView';
import { GestureFeedbackIndicator } from './components/GestureFeedbackIndicator';
import { useMobileSwipe } from './hooks/useMobileSwipe';
import { WifiOff, CheckCircle2, AlertCircle } from 'lucide-react';

export default function App() {
  // Application State
  const [lang, setLang] = useState<Language>(() => StorageService.getLanguage());
  const [theme, setTheme] = useState<'light' | 'dark'>(() => StorageService.getTheme());
  const [activeTab, setActiveTab] = useState<ActiveTab>('timetable');
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  // Core Data Collections
  const [profile, setProfile] = useState<StudentProfile>(() => StorageService.getStudentProfile());
  const [classSchedule, setClassSchedule] = useState<ClassScheduleItem[]>(() => StorageService.getClassSchedule());
  const [extraClasses, setExtraClasses] = useState<ExtraClassItem[]>(() => StorageService.getExtraClasses());
  const [exams, setExams] = useState<ExamItem[]>(() => StorageService.getExams());
  const [homework, setHomework] = useState<HomeworkItem[]>(() => StorageService.getHomework());
  const [grades, setGrades] = useState<SubjectGrade[]>(() => StorageService.getGrades());
  const [notices, setNotices] = useState<SchoolNotice[]>(() => StorageService.getNotices());
  const [personalNotifications, setPersonalNotifications] = useState<PersonalNotification[]>(() =>
    StorageService.getPersonalNotifications()
  );
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences>(() =>
    StorageService.getNotificationPreferences()
  );

  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Vertical Sidebar Navigation State
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('school_sidebar_collapsed') === 'true';
  });
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState<boolean>(false);

  // Tab navigation history for mobile/tablet back swipe gesture
  const [tabHistory, setTabHistory] = useState<ActiveTab[]>([]);

  const handleNavigateTab = (newTab: ActiveTab) => {
    if (newTab === activeTab) return;
    setTabHistory((prev) => [...prev, activeTab]);
    setActiveTab(newTab);
  };

  const handlePopHistory = (): ActiveTab | null => {
    if (tabHistory.length === 0) return null;
    const prevTab = tabHistory[tabHistory.length - 1];
    setTabHistory((prev) => prev.slice(0, -1));
    setActiveTab(prevTab);
    return prevTab;
  };

  // Mobile & Tablet swipe gestures for native-like back / close / navigation
  const { feedback: gestureFeedback } = useMobileSwipe({
    activeTab,
    tabHistory,
    onNavigateTab: handleNavigateTab,
    onPopHistory: handlePopHistory,
    isMobileDrawerOpen,
    onCloseMobileDrawer: () => setIsMobileDrawerOpen(false),
    lang,
  });

  const handleToggleSidebar = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setIsMobileDrawerOpen((prev) => !prev);
    } else {
      setIsSidebarCollapsed((prev) => {
        const next = !prev;
        localStorage.setItem('school_sidebar_collapsed', String(next));
        return next;
      });
    }
  };

  const t = translations[lang];

  // Show Toast Helper
  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Sync theme with DOM
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    StorageService.saveTheme(theme);
  }, [theme]);

  // Persist language change
  useEffect(() => {
    StorageService.saveLanguage(lang);
  }, [lang]);

  // Network offline/online listener
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Request notification permission once softly
    NotificationService.requestPermission();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Save Handlers with offline StorageService
  const handleSaveProfile = (newProfile: StudentProfile) => {
    setProfile(newProfile);
    StorageService.saveStudentProfile(newProfile);
    showToast(lang === 'vi' ? 'Đã lưu hồ sơ học sinh' : 'Student profile saved');
  };

  const handleSaveClassSchedule = (newSchedule: ClassScheduleItem[]) => {
    setClassSchedule(newSchedule);
    StorageService.saveClassSchedule(newSchedule);
  };

  const handleSaveExtraClasses = (newClasses: ExtraClassItem[]) => {
    setExtraClasses(newClasses);
    StorageService.saveExtraClasses(newClasses);
  };

  const handleSaveExams = (newExams: ExamItem[]) => {
    setExams(newExams);
    StorageService.saveExams(newExams);
  };

  const handleSaveHomework = (newHomework: HomeworkItem[]) => {
    setHomework(newHomework);
    StorageService.saveHomework(newHomework);
  };

  const handleSaveGrades = (newGrades: SubjectGrade[]) => {
    setGrades(newGrades);
    StorageService.saveGrades(newGrades);
  };

  const handleSaveNotices = (newNotices: SchoolNotice[]) => {
    setNotices(newNotices);
    StorageService.saveNotices(newNotices);
  };

  const handleSavePersonalNotifications = (items: PersonalNotification[]) => {
    setPersonalNotifications(items);
    StorageService.savePersonalNotifications(items);
  };

  const handleSaveNotificationPreferences = (prefs: NotificationPreferences) => {
    setNotificationPreferences(prefs);
    StorageService.saveNotificationPreferences(prefs);
  };

  // Badges
  const pendingHomeworkCount = homework.filter((h) => h.status !== 'completed').length;
  const unreadNoticesCount = notices.filter((n) => !n.isRead).length;
  const unreadPersonalNotificationsCount = personalNotifications.filter((n) => !n.isRead).length;

  return (
    <div className="min-h-screen bg-white dark:bg-[#1a120e] text-[#2c1810] dark:text-[#faf2ea] flex flex-col font-sans transition-colors">
      {/* Offline Status Warning Bar */}
      {!isOnline && (
        <div className="bg-amber-600 text-white px-4 py-2 text-xs font-semibold flex items-center justify-center gap-2 shadow-xs z-30">
          <WifiOff className="w-4 h-4 shrink-0" />
          <span>{t.common.offlineNotice}</span>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 animate-in fade-in slide-in-from-top-3">
          <div
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl shadow-xl text-xs font-bold border ${
              toastMessage.type === 'success'
                ? 'bg-emerald-600 text-white border-emerald-500'
                : 'bg-rose-600 text-white border-rose-500'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Gesture Feedback Indicator on Mobile/Tablet Swipe */}
      <GestureFeedbackIndicator feedback={gestureFeedback} />

      {/* Main Application Container */}
      <div className="grow flex flex-col w-full">
        {/* Header */}
        <Header
          lang={lang}
          onLanguageChange={setLang}
          theme={theme}
          onThemeToggle={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          onToggleSidebar={handleToggleSidebar}
        />

        {/* Main Content Body with Left Vertical Sidebar & Right Main Views */}
        <div className="grow flex flex-row min-h-0 relative w-full overflow-hidden">
          {/* Vertical Menu Dọc */}
          <Navigation
            activeTab={activeTab}
            onSelectTab={handleNavigateTab}
            lang={lang}
            pendingHomeworkCount={pendingHomeworkCount}
            unreadNoticesCount={unreadNoticesCount}
            unreadPersonalNotificationsCount={unreadPersonalNotificationsCount}
            isMobileDevice={false}
            profile={profile}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => {
              setIsSidebarCollapsed((prev) => {
                const next = !prev;
                localStorage.setItem('school_sidebar_collapsed', String(next));
                return next;
              });
            }}
            isMobileOpen={isMobileDrawerOpen}
            onCloseMobile={() => setIsMobileDrawerOpen(false)}
          />

          {/* Main View Area */}
          <main className="grow min-w-0 w-full overflow-y-auto px-3.5 sm:px-6 py-4 sm:py-5 pb-20 md:pb-12 transition-all bg-[#fbf9f6] dark:bg-[#1a120e]">
          {activeTab === 'timetable' && (
            <ClassScheduleView
              schedule={classSchedule}
              onSaveSchedule={handleSaveClassSchedule}
              lang={lang}
            />
          )}

          {activeTab === 'extra_class' && (
            <ExtraClassView
              extraClasses={extraClasses}
              onSaveExtraClasses={handleSaveExtraClasses}
              lang={lang}
            />
          )}

          {activeTab === 'exams' && (
            <ExamScheduleView
              exams={exams}
              onSaveExams={handleSaveExams}
              lang={lang}
            />
          )}

          {activeTab === 'homework' && (
            <HomeworkView
              homeworkList={homework}
              onSaveHomework={handleSaveHomework}
              lang={lang}
            />
          )}

          {activeTab === 'grades' && (
            <GradebookView
              grades={grades}
              onSaveGrades={handleSaveGrades}
              lang={lang}
              profile={profile}
            />
          )}

          {activeTab === 'notices' && (
            <NoticesView
              notices={notices}
              onSaveNotices={handleSaveNotices}
              lang={lang}
            />
          )}

          {activeTab === 'profile' && (
            <StudentProfileView
              profile={profile}
              onSaveProfile={handleSaveProfile}
              lang={lang}
            />
          )}

          {activeTab === 'system' && (
            <SystemSettingsView
              theme={theme}
              onThemeChange={(newTheme) => {
                setTheme(newTheme);
                showToast(
                  lang === 'vi'
                    ? (newTheme === 'dark' ? 'Đã chuyển sang Giao diện Tối' : 'Đã chuyển sang Giao diện Sáng')
                    : (newTheme === 'dark' ? 'Switched to Dark Mode' : 'Switched to Light Mode')
                );
              }}
              lang={lang}
              onLanguageChange={setLang}
              onNavigateNotifications={() => handleNavigateTab('notifications')}
              onResetData={() => {
                StorageService.resetToSeedData();
                setClassSchedule(StorageService.getClassSchedule());
                setExtraClasses(StorageService.getExtraClasses());
                setExams(StorageService.getExams());
                setHomework(StorageService.getHomework());
                setGrades(StorageService.getGrades());
                setNotices(StorageService.getNotices());
                setProfile(StorageService.getStudentProfile());
                setPersonalNotifications(StorageService.getPersonalNotifications());
                setNotificationPreferences(StorageService.getNotificationPreferences());
                showToast(lang === 'vi' ? 'Đã khôi phục dữ liệu mẫu ban đầu' : 'Restored default sample data');
              }}
            />
          )}

          {activeTab === 'notifications' && (
            <NotificationCenterView
              notifications={personalNotifications}
              preferences={notificationPreferences}
              onSaveNotifications={handleSavePersonalNotifications}
              onSavePreferences={handleSaveNotificationPreferences}
              lang={lang}
              onNavigateTab={(tab) => handleNavigateTab(tab)}
              onShowToast={(msg) => showToast(msg)}
            />
          )}
        </main>
        </div>
      </div>
    </div>
  );
}
