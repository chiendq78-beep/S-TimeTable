import React, { useState, useEffect, useRef } from 'react';
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
  SubjectItem,
} from './types';
import { StorageService } from './services/storage';
import { NotificationService } from './services/notification';
import { syncAllDueNotifications } from './services/notificationSync';
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
import { NotificationManagementView } from './components/NotificationManagementView';
import { SubjectsManagementView } from './components/SubjectsManagementView';
import { ClassManagementView } from './components/ClassManagementView';
import { WifiOff, CheckCircle2, AlertCircle } from 'lucide-react';
import { App as CapApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { useMobileSwipe } from './hooks/useMobileSwipe';
import { GestureFeedbackIndicator } from './components/GestureFeedbackIndicator';
import {
  hasOpenModal,
  closeTopModal,
  isModalHistoryCleaning,
} from './hooks/useSwipeToCloseModal';

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
  const [subjects, setSubjects] = useState<SubjectItem[]>(() => StorageService.getSubjects());

  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Vertical Sidebar Navigation State
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('school_sidebar_collapsed') === 'true';
  });
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState<boolean>(false);

  // Navigation history across top-level views
  const activeTabRef = useRef(activeTab);
  activeTabRef.current = activeTab;

  const isDrawerOpenRef = useRef(isMobileDrawerOpen);
  isDrawerOpenRef.current = isMobileDrawerOpen;

  const [targetDetailId, setTargetDetailId] = useState<{
    tab: ActiveTab;
    id?: string;
    subject?: string;
  } | null>(null);

  const handleNavigateTab = (newTab: ActiveTab, targetId?: string, subject?: string) => {
    setActiveTab(newTab);
    if (targetId || subject) {
      setTargetDetailId({ tab: newTab, id: targetId, subject });
    } else {
      setTargetDetailId(null);
    }
  };

  // Mobile edge-swipe gesture listener for back navigation
  const { feedback } = useMobileSwipe({
    activeTab,
    tabHistory: [],
    onNavigateTab: handleNavigateTab,
    onPopHistory: () => null,
    isMobileDrawerOpen,
    onCloseMobileDrawer: () => setIsMobileDrawerOpen(false),
    lang,
  });

  // 3-Tier Back button & gesture management for root navigation:
  // - Tier 1: If any modal/form is open: close modal and stay on current tab/page.
  // - Tier 1b: If mobile drawer is open: close drawer.
  // - Tier 2: If on a secondary tab (e.g. homework, exams, extra_class, system): back returns to root menu ('timetable').
  // - Tier 3: If already on root menu ('timetable'): back exits/closes the app via CapApp.exitApp().
  useEffect(() => {
    let isCleanedUp = false;
    let listenerHandle: { remove: () => void } | null = null;

    if (typeof window !== 'undefined' && Capacitor.isNativePlatform()) {
      CapApp.addListener('backButton', () => {
        // Tier 1: Check if any modal is active
        if (hasOpenModal()) {
          closeTopModal();
          return;
        }

        // Tier 1b: Mobile navigation drawer
        if (isDrawerOpenRef.current) {
          setIsMobileDrawerOpen(false);
          return;
        }

        // Tier 2: Secondary tab -> return to root menu ('timetable')
        if (activeTabRef.current !== 'timetable') {
          setActiveTab('timetable');
          return;
        }

        // Tier 3: On root menu: exit application
        CapApp.exitApp();
      })
        .then((handle) => {
          if (isCleanedUp) {
            handle.remove();
          } else {
            listenerHandle = handle;
          }
        })
        .catch(() => {});
    }

    return () => {
      isCleanedUp = true;
      if (listenerHandle) {
        listenerHandle.remove();
      }
    };
  }, []);

  // Web / PWA popstate history handling:
  useEffect(() => {
    // Push history state whenever switching away from root 'timetable'
    if (activeTab !== 'timetable') {
      try {
        window.history.pushState({ tab: activeTab }, '');
      } catch {
        // ignore
      }
    }

    const handlePopState = (e: PopStateEvent) => {
      // 0. If modal cleanup triggered this popstate, ignore it completely
      if (isModalHistoryCleaning()) {
        return;
      }

      // 1. Tier 1: If any modal is active when Back was pressed, close it and stay on current tab
      if (hasOpenModal()) {
        closeTopModal();
        return;
      }

      // 2. Tier 1b: If mobile drawer is open, close it
      if (isDrawerOpenRef.current) {
        setIsMobileDrawerOpen(false);
        return;
      }

      // 3. If popped state belongs to the current tab, stay here
      if (e.state?.tab && e.state.tab === activeTabRef.current) {
        return;
      }

      // 4. If popped state specifies another tab, switch to it
      if (e.state?.tab) {
        setActiveTab(e.state.tab);
        return;
      }

      // 5. Tier 2: Secondary tab -> return to root menu ('timetable')
      if (activeTabRef.current !== 'timetable') {
        setActiveTab('timetable');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [activeTab]);

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

  // Synchronize due notifications on startup for homework, exams, and extra classes
  useEffect(() => {
    const synced = syncAllDueNotifications(homework, exams, extraClasses, personalNotifications);
    setPersonalNotifications(synced);
    StorageService.savePersonalNotifications(synced);
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
    const synced = syncAllDueNotifications(homework, exams, newClasses, personalNotifications);
    setPersonalNotifications(synced);
    StorageService.savePersonalNotifications(synced);
  };

  const handleSaveExams = (newExams: ExamItem[]) => {
    setExams(newExams);
    StorageService.saveExams(newExams);
    const synced = syncAllDueNotifications(homework, newExams, extraClasses, personalNotifications);
    setPersonalNotifications(synced);
    StorageService.savePersonalNotifications(synced);
  };

  const handleSaveHomework = (newHomework: HomeworkItem[]) => {
    setHomework(newHomework);
    StorageService.saveHomework(newHomework);
    const synced = syncAllDueNotifications(newHomework, exams, extraClasses, personalNotifications);
    setPersonalNotifications(synced);
    StorageService.savePersonalNotifications(synced);
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

  const handleSaveSubjects = (newSubjects: SubjectItem[]) => {
    setSubjects(newSubjects);
    StorageService.saveSubjects(newSubjects);
  };

  // Badges
  const pendingHomeworkCount = homework.filter((h) => h.status !== 'completed').length;
  const unreadNoticesCount = notices.filter((n) => !n.isRead).length;
  const unreadPersonalNotificationsCount = personalNotifications.filter(
    (n) => !n.isRead && (n.type === 'homework' || n.type === 'exam' || n.type === 'extra_class' || n.type === 'reminder')
  ).length;

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
          onNavigateNotifications={() => handleNavigateTab('notifications')}
          unreadNotificationsCount={unreadPersonalNotificationsCount}
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
          <main className="grow min-w-0 w-full overflow-y-auto px-2 sm:px-6 py-3.5 sm:py-5 pb-20 md:pb-12 transition-all bg-[#fbf9f6] dark:bg-[#1a120e]">
          {activeTab === 'timetable' && (
            <ClassScheduleView
              schedule={classSchedule}
              onSaveSchedule={handleSaveClassSchedule}
              lang={lang}
              onShowToast={(msg) => showToast(msg)}
              subjects={subjects}
            />
          )}

          {activeTab === 'extra_class' && (
            <ExtraClassView
              extraClasses={extraClasses}
              onSaveExtraClasses={handleSaveExtraClasses}
              lang={lang}
              openDetailId={targetDetailId?.tab === 'extra_class' ? targetDetailId.id : undefined}
              openDetailSubject={targetDetailId?.tab === 'extra_class' ? targetDetailId.subject : undefined}
              onClearOpenDetailId={() => setTargetDetailId(null)}
              subjects={subjects}
            />
          )}

          {activeTab === 'exams' && (
            <ExamScheduleView
              exams={exams}
              onSaveExams={handleSaveExams}
              lang={lang}
              openDetailId={targetDetailId?.tab === 'exams' ? targetDetailId.id : undefined}
              openDetailSubject={targetDetailId?.tab === 'exams' ? targetDetailId.subject : undefined}
              onClearOpenDetailId={() => setTargetDetailId(null)}
              subjects={subjects}
            />
          )}

          {activeTab === 'homework' && (
            <HomeworkView
              homeworkList={homework}
              onSaveHomework={handleSaveHomework}
              lang={lang}
              openDetailId={targetDetailId?.tab === 'homework' ? targetDetailId.id : undefined}
              openDetailSubject={targetDetailId?.tab === 'homework' ? targetDetailId.subject : undefined}
              onClearOpenDetailId={() => setTargetDetailId(null)}
              subjects={subjects}
            />
          )}

          {activeTab === 'grades' && (
            <GradebookView
              grades={grades}
              onSaveGrades={handleSaveGrades}
              lang={lang}
              profile={profile}
              subjects={subjects}
              onShowToast={(msg) => showToast(msg)}
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
              onNavigateNotifications={() => handleNavigateTab('notification_settings')}
              onNavigateSubjects={() => handleNavigateTab('subjects')}
              onNavigateClasses={() => handleNavigateTab('classes')}
              onSyncTimetables={() => {
                setClassSchedule(StorageService.getClassSchedule());
              }}
              onShowToast={(msg) => showToast(msg)}
              onResetData={() => {
                StorageService.resetToSeedData();
                const seedHw = StorageService.getHomework();
                const seedEx = StorageService.getExams();
                const seedEc = StorageService.getExtraClasses();
                setClassSchedule(StorageService.getClassSchedule());
                setExtraClasses(seedEc);
                setExams(seedEx);
                setHomework(seedHw);
                setGrades(StorageService.getGrades());
                setNotices(StorageService.getNotices());
                setProfile(StorageService.getStudentProfile());
                setSubjects(StorageService.getSubjects());
                const synced = syncAllDueNotifications(seedHw, seedEx, seedEc, StorageService.getPersonalNotifications());
                setPersonalNotifications(synced);
                StorageService.savePersonalNotifications(synced);
                setNotificationPreferences(StorageService.getNotificationPreferences());
                showToast(lang === 'vi' ? 'Đã khôi phục dữ liệu mẫu ban đầu' : 'Restored default sample data');
              }}
            />
          )}

          {activeTab === 'classes' && (
            <ClassManagementView
              lang={lang}
              onSyncTimetables={() => {
                setClassSchedule(StorageService.getClassSchedule());
              }}
              onNavigateTimetable={() => handleNavigateTab('timetable')}
              onShowToast={(msg) => showToast(msg)}
            />
          )}

          {activeTab === 'subjects' && (
            <SubjectsManagementView
              subjects={subjects}
              onSaveSubjects={handleSaveSubjects}
              lang={lang}
              onShowToast={(msg) => showToast(msg)}
            />
          )}

          {activeTab === 'notifications' && (
            <NotificationCenterView
              notifications={personalNotifications}
              onSaveNotifications={handleSavePersonalNotifications}
              lang={lang}
              onNavigateTab={(tab, targetId, subject) => handleNavigateTab(tab, targetId, subject)}
              onShowToast={(msg) => showToast(msg)}
            />
          )}

          {activeTab === 'notification_settings' && (
            <NotificationManagementView
              preferences={notificationPreferences}
              onSavePreferences={handleSaveNotificationPreferences}
              lang={lang}
              onNavigateTab={(tab) => handleNavigateTab(tab)}
              onShowToast={(msg) => showToast(msg)}
              unreadCount={personalNotifications.filter((n) => !n.isRead).length}
            />
          )}
        </main>
        </div>
      </div>

      {/* Floating touch gesture feedback pill */}
      <GestureFeedbackIndicator feedback={feedback} />
    </div>
  );
}
