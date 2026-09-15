import {
  StudentProfile,
  ClassScheduleItem,
  ExtraClassItem,
  ExamItem,
  HomeworkItem,
  SubjectGrade,
  SchoolNotice,
  Language,
  Theme,
  DeviceMode,
  PersonalNotification,
  NotificationPreferences,
} from '../types';
import {
  initialStudentProfile,
  initialClassSchedule,
  initialExtraClasses,
  initialExams,
  initialHomework,
  initialGrades,
  initialNotices,
  initialPersonalNotifications,
  initialNotificationPreferences,
} from '../data/seedData';

const STORAGE_KEYS = {
  PROFILE: 'student_app_profile_v1',
  TIMETABLE: 'student_app_timetable_v1',
  EXTRA_CLASSES: 'student_app_extra_classes_v1',
  EXAMS: 'student_app_exams_v1',
  HOMEWORK: 'student_app_homework_v1',
  GRADES: 'student_app_grades_v1',
  NOTICES: 'student_app_notices_v1',
  PERSONAL_NOTIFICATIONS: 'student_app_personal_notifications_v1',
  NOTIFICATION_PREFS: 'student_app_notification_prefs_v1',
  LANGUAGE: 'student_app_language_v1',
  THEME: 'student_app_theme_v1',
  DEVICE_MODE: 'student_app_device_mode_v1',
  SYNC_QUEUE: 'student_app_sync_queue_v1',
};

export const StorageService = {
  // Student Profile
  getProfile: (): StudentProfile => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PROFILE);
      return data ? JSON.parse(data) : initialStudentProfile;
    } catch {
      return initialStudentProfile;
    }
  },
  getStudentProfile: (): StudentProfile => {
    return StorageService.getProfile();
  },
  saveProfile: (profile: StudentProfile): void => {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  },
  saveStudentProfile: (profile: StudentProfile): void => {
    StorageService.saveProfile(profile);
  },

  // Class Schedule
  getTimetable: (): ClassScheduleItem[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TIMETABLE);
      return data ? JSON.parse(data) : initialClassSchedule;
    } catch {
      return initialClassSchedule;
    }
  },
  getClassSchedule: (): ClassScheduleItem[] => {
    return StorageService.getTimetable();
  },
  saveTimetable: (items: ClassScheduleItem[]): void => {
    localStorage.setItem(STORAGE_KEYS.TIMETABLE, JSON.stringify(items));
  },
  saveClassSchedule: (items: ClassScheduleItem[]): void => {
    StorageService.saveTimetable(items);
  },

  // Extra Classes
  getExtraClasses: (): ExtraClassItem[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.EXTRA_CLASSES);
      return data ? JSON.parse(data) : initialExtraClasses;
    } catch {
      return initialExtraClasses;
    }
  },
  saveExtraClasses: (items: ExtraClassItem[]): void => {
    localStorage.setItem(STORAGE_KEYS.EXTRA_CLASSES, JSON.stringify(items));
  },

  // Exams
  getExams: (): ExamItem[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.EXAMS);
      return data ? JSON.parse(data) : initialExams;
    } catch {
      return initialExams;
    }
  },
  saveExams: (items: ExamItem[]): void => {
    localStorage.setItem(STORAGE_KEYS.EXAMS, JSON.stringify(items));
  },

  // Homework
  getHomework: (): HomeworkItem[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.HOMEWORK);
      return data ? JSON.parse(data) : initialHomework;
    } catch {
      return initialHomework;
    }
  },
  saveHomework: (items: HomeworkItem[]): void => {
    localStorage.setItem(STORAGE_KEYS.HOMEWORK, JSON.stringify(items));
  },

  // Grades
  getGrades: (): SubjectGrade[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.GRADES);
      if (!data) return initialGrades;
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        // If saved grades only had sem1, complement with initial sem2 grades
        const hasSem2 = parsed.some((g: SubjectGrade) => g.semester === 'sem2');
        if (!hasSem2) {
          const sem2Defaults = initialGrades.filter((g) => g.semester === 'sem2');
          return [...parsed, ...sem2Defaults];
        }
        return parsed;
      }
      return initialGrades;
    } catch {
      return initialGrades;
    }
  },
  saveGrades: (items: SubjectGrade[]): void => {
    localStorage.setItem(STORAGE_KEYS.GRADES, JSON.stringify(items));
  },

  // Notices
  getNotices: (): SchoolNotice[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.NOTICES);
      if (!data) return initialNotices;
      const parsed: SchoolNotice[] = JSON.parse(data);
      if (Array.isArray(parsed)) {
        // Enrich any notices missing attachments or sender from initialNotices
        const enriched: SchoolNotice[] = parsed.map((item): SchoolNotice => {
          const match = initialNotices.find((i) => i.id === item.id);
          return {
            ...item,
            sender: item.sender || item.author || match?.sender || 'Ban Giám Hiệu',
            attachments:
              item.attachments && item.attachments.length > 0
                ? item.attachments
                : match?.attachments || [],
            isPinned: typeof item.isPinned === 'boolean' ? item.isPinned : !!match?.isPinned,
          };
        });

        // Ensure initial fee notice exists if not already present
        const hasFee = enriched.some((n) => n.category === 'fee');
        if (!hasFee) {
          const feeNotice = initialNotices.find((n) => n.category === 'fee');
          if (feeNotice) {
            enriched.push(feeNotice);
          }
        }
        return enriched;
      }
      return initialNotices;
    } catch {
      return initialNotices;
    }
  },
  saveNotices: (items: SchoolNotice[]): void => {
    localStorage.setItem(STORAGE_KEYS.NOTICES, JSON.stringify(items));
  },

  // Personal Notifications (Trung tâm Thông báo Cá nhân)
  getPersonalNotifications: (): PersonalNotification[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PERSONAL_NOTIFICATIONS);
      return data ? JSON.parse(data) : initialPersonalNotifications;
    } catch {
      return initialPersonalNotifications;
    }
  },
  savePersonalNotifications: (items: PersonalNotification[]): void => {
    localStorage.setItem(STORAGE_KEYS.PERSONAL_NOTIFICATIONS, JSON.stringify(items));
  },

  // Notification Preferences (Cấu hình Nhắc nhở)
  getNotificationPreferences: (): NotificationPreferences => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATION_PREFS);
      return data ? JSON.parse(data) : initialNotificationPreferences;
    } catch {
      return initialNotificationPreferences;
    }
  },
  saveNotificationPreferences: (prefs: NotificationPreferences): void => {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATION_PREFS, JSON.stringify(prefs));
  },

  // Language
  getLanguage: (): Language => {
    try {
      return (localStorage.getItem(STORAGE_KEYS.LANGUAGE) as Language) || 'vi';
    } catch {
      return 'vi';
    }
  },
  saveLanguage: (lang: Language): void => {
    localStorage.setItem(STORAGE_KEYS.LANGUAGE, lang);
  },

  // Theme
  getTheme: (): Theme => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.THEME);
      return (saved as Theme) === 'dark' ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  },
  saveTheme: (theme: Theme): void => {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  },

  // Device mode
  getDeviceMode: (): DeviceMode => {
    try {
      return (localStorage.getItem(STORAGE_KEYS.DEVICE_MODE) as DeviceMode) || 'responsive';
    } catch {
      return 'responsive';
    }
  },
  saveDeviceMode: (mode: DeviceMode): void => {
    localStorage.setItem(STORAGE_KEYS.DEVICE_MODE, mode);
  },

  // Reset to initial seed data
  resetAll: () => {
    localStorage.removeItem(STORAGE_KEYS.PROFILE);
    localStorage.removeItem(STORAGE_KEYS.TIMETABLE);
    localStorage.removeItem(STORAGE_KEYS.EXTRA_CLASSES);
    localStorage.removeItem(STORAGE_KEYS.EXAMS);
    localStorage.removeItem(STORAGE_KEYS.HOMEWORK);
    localStorage.removeItem(STORAGE_KEYS.GRADES);
    localStorage.removeItem(STORAGE_KEYS.NOTICES);
    localStorage.removeItem(STORAGE_KEYS.PERSONAL_NOTIFICATIONS);
    localStorage.removeItem(STORAGE_KEYS.NOTIFICATION_PREFS);
  },
  resetToSeedData: () => {
    StorageService.resetAll();
  },

  // Export JSON backup
  exportBackupJson: () => {
    const backup = {
      profile: StorageService.getProfile(),
      timetable: StorageService.getTimetable(),
      extraClasses: StorageService.getExtraClasses(),
      exams: StorageService.getExams(),
      homework: StorageService.getHomework(),
      grades: StorageService.getGrades(),
      notices: StorageService.getNotices(),
      personalNotifications: StorageService.getPersonalNotifications(),
      notificationPreferences: StorageService.getNotificationPreferences(),
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
    };
    return JSON.stringify(backup, null, 2);
  },

  // Import JSON backup
  importBackupJson: (jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.profile) StorageService.saveProfile(parsed.profile);
      if (parsed.timetable) StorageService.saveTimetable(parsed.timetable);
      if (parsed.extraClasses) StorageService.saveExtraClasses(parsed.extraClasses);
      if (parsed.exams) StorageService.saveExams(parsed.exams);
      if (parsed.homework) StorageService.saveHomework(parsed.homework);
      if (parsed.grades) StorageService.saveGrades(parsed.grades);
      if (parsed.notices) StorageService.saveNotices(parsed.notices);
      if (parsed.personalNotifications) StorageService.savePersonalNotifications(parsed.personalNotifications);
      if (parsed.notificationPreferences) StorageService.saveNotificationPreferences(parsed.notificationPreferences);
      return true;
    } catch (e) {
      console.error('Failed to import backup json', e);
      return false;
    }
  },
};
