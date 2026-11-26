import {
  StudentProfile,
  ClassScheduleItem,
  ClassTimetable,
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
  SubjectItem,
} from '../types';
import {
  initialStudentProfile,
  initialClassSchedule,
  initialClassTimetables,
  initialExtraClasses,
  initialExams,
  initialHomework,
  initialGrades,
  initialNotices,
  initialPersonalNotifications,
  initialNotificationPreferences,
  initialSubjects,
} from '../data/seedData';

const STORAGE_KEYS = {
  PROFILE: 'student_app_profile_v1',
  TIMETABLE: 'student_app_timetable_v1',
  CLASS_TIMETABLES: 'student_app_class_timetables_v2',
  ACTIVE_CLASS_ID: 'student_app_active_class_id_v2',
  SUBJECTS: 'student_app_subjects_v1',
  EXTRA_CLASSES: 'student_app_extra_classes_v1',
  EXTRA_CLASS_ABSENCES: 'student_app_extra_class_absences_v1',
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

  // Multi-Class Timetables Management
  getClassTimetables: (): ClassTimetable[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CLASS_TIMETABLES);
      let timetables: ClassTimetable[] | null = null;
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          timetables = parsed;
        }
      }

      // Check legacy timetable migration
      if (!timetables) {
        const legacyData = localStorage.getItem(STORAGE_KEYS.TIMETABLE);
        if (legacyData) {
          try {
            const legacySchedule = JSON.parse(legacyData);
            if (Array.isArray(legacySchedule) && legacySchedule.length > 0) {
              const studentProfile = StorageService.getProfile();
              timetables = [
                {
                  id: 'class-migrated-1',
                  className: studentProfile.classGrade || '11 Chuyên Toán (11T1)',
                  grade: 'Khối 11',
                  academicYear: studentProfile.academicYear || '2025 - 2026',
                  room: 'Phòng 302',
                  homeroomTeacher: studentProfile.homeroomTeacher || 'Cô Trần Thị Mai Lan',
                  isDefault: true,
                  schedule: legacySchedule,
                  notes: 'Thời khóa biểu đã đồng bộ từ dữ liệu trước đó',
                  createdAt: new Date().toISOString(),
                },
                initialClassTimetables[1],
              ];
            }
          } catch {
            // ignore
          }
        }
      }

      if (!timetables || timetables.length === 0) {
        timetables = initialClassTimetables;
      }

      // Enrich all timetables with full morning periods from Monday to Friday (T2-T6, periods 1-5)
      let updated = false;
      const enriched = timetables.map((t) => {
        const existingSchedule = Array.isArray(t.schedule) ? [...t.schedule] : [];
        let classUpdated = false;

        // Check each standard morning period from initialClassSchedule (T2-T6, morning session, periods 1-5)
        initialClassSchedule.forEach((initItem) => {
          if (initItem.session === 'morning' && initItem.dayOfWeek >= 2 && initItem.dayOfWeek <= 6 && initItem.period <= 5) {
            const hasPeriod = existingSchedule.some(
              (p) => p.dayOfWeek === initItem.dayOfWeek && p.period === initItem.period && p.session === 'morning'
            );
            if (!hasPeriod) {
              existingSchedule.push(initItem);
              classUpdated = true;
            }
          }
        });

        // Ensure any period with old subject name 'Công nghệ' is updated to 'Công nghệ / STEM'
        const normalizedSchedule = existingSchedule.map((p) => {
          if (p.subject === 'Công nghệ') {
            classUpdated = true;
            return {
              ...p,
              subject: 'Công nghệ / STEM',
              room: p.room || 'Phòng Sáng chế STEM',
              teacher: p.teacher || 'Thầy Đặng Hoàng Long',
            };
          }
          return p;
        });

        if (classUpdated) {
          updated = true;
          return {
            ...t,
            schedule: normalizedSchedule,
          };
        }
        return t;
      });

      if (updated) {
        localStorage.setItem(STORAGE_KEYS.CLASS_TIMETABLES, JSON.stringify(enriched));
        const activeId = StorageService.getActiveClassId();
        const active = enriched.find((t) => t.id === activeId) || enriched[0];
        if (active) {
          localStorage.setItem(STORAGE_KEYS.TIMETABLE, JSON.stringify(active.schedule));
        }
        return enriched;
      }

      return timetables;
    } catch {
      return initialClassTimetables;
    }
  },

  saveClassTimetables: (timetables: ClassTimetable[]): void => {
    try {
      localStorage.setItem(STORAGE_KEYS.CLASS_TIMETABLES, JSON.stringify(timetables));
      // Keep legacy timetable synced with active class
      const activeId = StorageService.getActiveClassId();
      const current = timetables.find((t) => t.id === activeId) || timetables[0];
      if (current) {
        localStorage.setItem(STORAGE_KEYS.TIMETABLE, JSON.stringify(current.schedule));
      }
    } catch (e) {
      console.error('Failed to save class timetables', e);
    }
  },

  getActiveClassId: (): string => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_CLASS_ID);
      if (saved) return saved;
      return initialClassTimetables[0].id;
    } catch {
      return initialClassTimetables[0].id;
    }
  },

  saveActiveClassId: (id: string): void => {
    try {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_CLASS_ID, id);
      // Sync legacy timetable with the now active class
      const all = StorageService.getClassTimetables();
      const target = all.find((t) => t.id === id);
      if (target) {
        localStorage.setItem(STORAGE_KEYS.TIMETABLE, JSON.stringify(target.schedule));
      }
    } catch (e) {
      console.error('Failed to save active class id', e);
    }
  },

  // Class Schedule (Proxied to currently active class timetable)
  getTimetable: (): ClassScheduleItem[] => {
    try {
      const allTimetables = StorageService.getClassTimetables();
      const activeId = StorageService.getActiveClassId();
      const active = allTimetables.find((t) => t.id === activeId) || allTimetables[0];
      return active ? active.schedule : initialClassSchedule;
    } catch {
      return initialClassSchedule;
    }
  },
  getClassSchedule: (): ClassScheduleItem[] => {
    return StorageService.getTimetable();
  },
  saveTimetable: (items: ClassScheduleItem[]): void => {
    try {
      const allTimetables = StorageService.getClassTimetables();
      const activeId = StorageService.getActiveClassId();
      const index = allTimetables.findIndex((t) => t.id === activeId);
      if (index >= 0) {
        allTimetables[index] = {
          ...allTimetables[index],
          schedule: items,
        };
        StorageService.saveClassTimetables(allTimetables);
      } else {
        localStorage.setItem(STORAGE_KEYS.TIMETABLE, JSON.stringify(items));
      }
    } catch {
      localStorage.setItem(STORAGE_KEYS.TIMETABLE, JSON.stringify(items));
    }
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
  getExtraClassAbsences: (): string[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.EXTRA_CLASS_ABSENCES);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },
  saveExtraClassAbsences: (absences: string[]): void => {
    localStorage.setItem(STORAGE_KEYS.EXTRA_CLASS_ABSENCES, JSON.stringify(absences));
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

  // Subjects Management
  getSubjects: (): SubjectItem[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SUBJECTS);
      if (!data) return initialSubjects;
      const parsed = JSON.parse(data);
      if (!Array.isArray(parsed) || parsed.length === 0) return initialSubjects;

      let changed = false;
      const list = parsed.map((s: SubjectItem) => {
        if (s.name === 'Công nghệ' || s.id === 'sub-11') {
          if (s.name !== 'Công nghệ / STEM') {
            changed = true;
            return {
              ...s,
              name: 'Công nghệ / STEM',
              teacher: s.teacher === 'Thầy Nguyễn Hữu Hùng' ? 'Thầy Đặng Hoàng Long' : s.teacher,
              room: s.room === 'Xưởng Thực hành' ? 'Phòng Sáng chế STEM' : s.room,
            };
          }
        }
        return s;
      });

      // Ensure all standard subjects exist in the list
      initialSubjects.forEach((initSub) => {
        const exists = list.some(
          (s: SubjectItem) =>
            s.id === initSub.id ||
            s.name.toLowerCase() === initSub.name.toLowerCase()
        );
        if (!exists) {
          list.push(initSub);
          changed = true;
        }
      });

      if (changed) {
        StorageService.saveSubjects(list);
      }
      return list;
    } catch {
      return initialSubjects;
    }
  },
  saveSubjects: (items: SubjectItem[]): void => {
    localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(items));
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

  // Personal Notifications (Chỉ lưu và trả về các thông báo/nhắc nhở đến hẹn)
  getPersonalNotifications: (): PersonalNotification[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PERSONAL_NOTIFICATIONS);
      if (!data) return initialPersonalNotifications;
      const parsed: PersonalNotification[] = JSON.parse(data);
      if (Array.isArray(parsed)) {
        // Lọc chỉ giữ các thông báo/nhắc nhở đến hẹn (bài tập, lịch thi, lịch học)
        const dueOnly = parsed.filter(
          (n) => n.type === 'homework' || n.type === 'exam' || n.type === 'extra_class' || n.type === 'reminder'
        );
        return dueOnly.length > 0 ? dueOnly : initialPersonalNotifications;
      }
      return initialPersonalNotifications;
    } catch {
      return initialPersonalNotifications;
    }
  },
  savePersonalNotifications: (items: PersonalNotification[]): void => {
    const dueOnly = items.filter(
      (n) => n.type === 'homework' || n.type === 'exam' || n.type === 'extra_class' || n.type === 'reminder'
    );
    localStorage.setItem(STORAGE_KEYS.PERSONAL_NOTIFICATIONS, JSON.stringify(dueOnly));
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
    localStorage.removeItem(STORAGE_KEYS.CLASS_TIMETABLES);
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_CLASS_ID);
    localStorage.removeItem(STORAGE_KEYS.SUBJECTS);
    localStorage.removeItem(STORAGE_KEYS.EXTRA_CLASSES);
    localStorage.removeItem(STORAGE_KEYS.EXTRA_CLASS_ABSENCES);
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
      classTimetables: StorageService.getClassTimetables(),
      activeClassId: StorageService.getActiveClassId(),
      subjects: StorageService.getSubjects(),
      extraClasses: StorageService.getExtraClasses(),
      exams: StorageService.getExams(),
      homework: StorageService.getHomework(),
      grades: StorageService.getGrades(),
      notices: StorageService.getNotices(),
      personalNotifications: StorageService.getPersonalNotifications(),
      notificationPreferences: StorageService.getNotificationPreferences(),
      exportedAt: new Date().toISOString(),
      version: '2.0.0',
    };
    return JSON.stringify(backup, null, 2);
  },

  // Import JSON backup
  importBackupJson: (jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.profile) StorageService.saveProfile(parsed.profile);
      if (parsed.classTimetables && Array.isArray(parsed.classTimetables)) {
        StorageService.saveClassTimetables(parsed.classTimetables);
      } else if (parsed.timetable) {
        StorageService.saveTimetable(parsed.timetable);
      }
      if (parsed.activeClassId) StorageService.saveActiveClassId(parsed.activeClassId);
      if (parsed.subjects && Array.isArray(parsed.subjects)) StorageService.saveSubjects(parsed.subjects);
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
