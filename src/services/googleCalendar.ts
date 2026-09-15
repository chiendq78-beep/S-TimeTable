import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  ClassScheduleItem,
  ExtraClassItem,
  ExamItem,
  HomeworkItem,
} from '../types';

// Initialize Firebase App
const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
const auth = getAuth(app);

const provider = new GoogleAuthProvider();
export const SCOPES = ['https://www.googleapis.com/auth/calendar.events'];
SCOPES.forEach((scope) => provider.addScope(scope));

// In-memory token cache (NEVER stored in localStorage per security guidelines)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // Cached token lost on reload; user will prompt or click connect
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{
  user: User;
  accessToken: string;
} | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to obtain Google Calendar access token');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Sign-in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logout = async (): Promise<void> => {
  await signOut(auth);
  cachedAccessToken = null;
};

// Helper to calculate the next upcoming date for a specific day of week (2 = Monday, ..., 8 = Sunday)
function getNextDateForDayOfWeek(dayOfWeek: number): string {
  const now = new Date();
  const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday ... 6 = Saturday
  const targetDay = dayOfWeek === 8 ? 0 : dayOfWeek - 1; // Convert 2->1(Mon), 8->0(Sun)
  let diff = targetDay - currentDay;
  if (diff <= 0) diff += 7; // Next occurrence
  const targetDate = new Date(now.getTime() + diff * 24 * 60 * 60 * 1000);
  return targetDate.toISOString().split('T')[0];
}

export interface GoogleCalendarEventPayload {
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  recurrence?: string[];
  reminders?: {
    useDefault: boolean;
    overrides?: { method: 'popup' | 'email'; minutes: number }[];
  };
}

// Google Calendar API operations
export const CalendarService = {
  // Create a single event in user's primary calendar
  createEvent: async (
    token: string,
    eventPayload: GoogleCalendarEventPayload
  ): Promise<{ id: string; htmlLink?: string }> => {
    const response = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventPayload),
      }
    );

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || 'Failed to create Google Calendar event');
    }

    return await response.json();
  },

  // Sync a class schedule item
  syncClassPeriod: async (
    token: string,
    item: ClassScheduleItem
  ): Promise<{ id: string }> => {
    const targetDate = getNextDateForDayOfWeek(item.dayOfWeek);
    const startDateTime = `${targetDate}T${item.timeStart}:00`;
    const endDateTime = `${targetDate}T${item.timeEnd}:00`;
    const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Ho_Chi_Minh';

    // RRULE day mapping
    const dayCodes = ['', '', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];
    const rruleDay = dayCodes[item.dayOfWeek] || 'MO';

    const payload: GoogleCalendarEventPayload = {
      summary: `[TKB] ${item.subject} (${item.room})`,
      description: `Tiết ${item.period} - GV: ${item.teacher}${item.note ? `\nGhi chú: ${item.note}` : ''}`,
      location: item.room,
      start: {
        dateTime: startDateTime,
        timeZone: userTimeZone,
      },
      end: {
        dateTime: endDateTime,
        timeZone: userTimeZone,
      },
      recurrence: [`RRULE:FREQ=WEEKLY;BYDAY=${rruleDay};COUNT=16`],
      reminders: {
        useDefault: false,
        overrides: [{ method: 'popup', minutes: 15 }],
      },
    };

    return await CalendarService.createEvent(token, payload);
  },

  // Sync an extra tutoring class item
  syncExtraClass: async (
    token: string,
    item: ExtraClassItem
  ): Promise<{ id: string }> => {
    const targetDate = getNextDateForDayOfWeek(item.dayOfWeek);
    const startDateTime = `${targetDate}T${item.timeStart}:00`;
    const endDateTime = `${targetDate}T${item.timeEnd}:00`;
    const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Ho_Chi_Minh';

    const dayCodes = ['', '', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];
    const rruleDay = dayCodes[item.dayOfWeek] || 'MO';

    const payload: GoogleCalendarEventPayload = {
      summary: `[Học Thêm] ${item.subject} - ${item.title}`,
      description: `Giảng viên/Gia sư: ${item.teacher}\nĐịa điểm: ${item.location}\nHọc phí: ${item.fee.toLocaleString('vi-VN')} VNĐ / ${item.feePeriod === 'session' ? 'buổi' : 'tháng'}\n${item.note ? `Ghi chú: ${item.note}` : ''}`,
      location: item.location,
      start: {
        dateTime: startDateTime,
        timeZone: userTimeZone,
      },
      end: {
        dateTime: endDateTime,
        timeZone: userTimeZone,
      },
      recurrence: [`RRULE:FREQ=WEEKLY;BYDAY=${rruleDay};COUNT=16`],
      reminders: {
        useDefault: false,
        overrides: [{ method: 'popup', minutes: item.reminderMinutesBefore || 30 }],
      },
    };

    return await CalendarService.createEvent(token, payload);
  },

  // Sync an Exam item
  syncExam: async (token: string, item: ExamItem): Promise<{ id: string }> => {
    const startDateTime = `${item.examDate}T${item.timeStart}:00`;
    const [h, m] = item.timeStart.split(':').map(Number);
    const startDate = new Date(`${item.examDate}T${item.timeStart}:00`);
    const endDate = new Date(startDate.getTime() + item.durationMinutes * 60000);
    const endHour = String(endDate.getHours()).padStart(2, '0');
    const endMin = String(endDate.getMinutes()).padStart(2, '0');
    const endDateTime = `${item.examDate}T${endHour}:${endMin}:00`;
    const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Ho_Chi_Minh';

    const payload: GoogleCalendarEventPayload = {
      summary: `[LỊCH THI] ${item.subject} - ${item.examName}`,
      description: `Phòng thi: ${item.room}\nSố báo danh (SBD): ${item.candidateNumber}\nHình thức thi: ${item.format}\nThời lượng: ${item.durationMinutes} phút\nTrọng tâm ôn tập: ${item.reviewTopics}\nMục tiêu: ${item.targetScore ? item.targetScore + ' điểm' : 'Đạt kết quả cao'}`,
      location: item.room,
      start: {
        dateTime: startDateTime,
        timeZone: userTimeZone,
      },
      end: {
        dateTime: endDateTime,
        timeZone: userTimeZone,
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 60 * 24 }, // 1 day before
          { method: 'popup', minutes: 60 }, // 1 hour before
        ],
      },
    };

    return await CalendarService.createEvent(token, payload);
  },

  // Sync Homework Deadline reminder
  syncHomework: async (
    token: string,
    item: HomeworkItem
  ): Promise<{ id: string }> => {
    const endDateTime = item.deadline.includes(':')
      ? `${item.deadline}:00`.substring(0, 19)
      : `${item.deadline}T23:59:00`;
    const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Ho_Chi_Minh';

    // Event duration 30 mins ending at deadline
    const deadlineDate = new Date(endDateTime);
    const startDate = new Date(deadlineDate.getTime() - 30 * 60000);
    const startDateTime = startDate.toISOString().substring(0, 19);

    const payload: GoogleCalendarEventPayload = {
      summary: `[BÀI TẬP] Hạn nộp: ${item.subject} - ${item.title}`,
      description: `Mức độ ưu tiên: ${item.priority.toUpperCase()}\nTrạng thái: ${item.status}\n${item.description ? `Chi tiết: ${item.description}` : ''}`,
      start: {
        dateTime: startDateTime,
        timeZone: userTimeZone,
      },
      end: {
        dateTime: endDateTime,
        timeZone: userTimeZone,
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: item.reminderMinutesBefore || 120 },
          { method: 'popup', minutes: 30 },
        ],
      },
    };

    return await CalendarService.createEvent(token, payload);
  },
};

export const GoogleCalendarService = {
  getUserEmail: (): string | null => {
    return auth.currentUser?.email || null;
  },
  getAccessToken: async (): Promise<string | null> => {
    return cachedAccessToken;
  },
  signInWithGoogle: async (): Promise<string | null> => {
    const res = await googleSignIn();
    return res?.user.email || null;
  },
  signOut: async (): Promise<void> => {
    await logout();
  },
  syncClassPeriod: async (item: ClassScheduleItem): Promise<{ success: boolean; eventId?: string; error?: string }> => {
    try {
      if (!cachedAccessToken) {
        throw new Error('Chưa đăng nhập Google Calendar. Vui lòng kết nối tài khoản.');
      }
      const res = await CalendarService.syncClassPeriod(cachedAccessToken, item);
      return { success: true, eventId: res.id };
    } catch (err: any) {
      return { success: false, error: err.message || 'Lỗi đồng bộ tiết học' };
    }
  },
  syncExtraClass: async (item: ExtraClassItem): Promise<{ success: boolean; eventId?: string; error?: string }> => {
    try {
      if (!cachedAccessToken) {
        throw new Error('Chưa đăng nhập Google Calendar. Vui lòng kết nối tài khoản.');
      }
      const res = await CalendarService.syncExtraClass(cachedAccessToken, item);
      return { success: true, eventId: res.id };
    } catch (err: any) {
      return { success: false, error: err.message || 'Lỗi đồng bộ lớp học thêm' };
    }
  },
  syncExam: async (item: ExamItem): Promise<{ success: boolean; eventId?: string; error?: string }> => {
    try {
      if (!cachedAccessToken) {
        throw new Error('Chưa đăng nhập Google Calendar. Vui lòng kết nối tài khoản.');
      }
      const res = await CalendarService.syncExam(cachedAccessToken, item);
      return { success: true, eventId: res.id };
    } catch (err: any) {
      return { success: false, error: err.message || 'Lỗi đồng bộ lịch thi' };
    }
  },
  syncHomeworkDeadline: async (item: HomeworkItem): Promise<{ success: boolean; eventId?: string; error?: string }> => {
    try {
      if (!cachedAccessToken) {
        throw new Error('Chưa đăng nhập Google Calendar. Vui lòng kết nối tài khoản.');
      }
      const res = await CalendarService.syncHomework(cachedAccessToken, item);
      return { success: true, eventId: res.id };
    } catch (err: any) {
      return { success: false, error: err.message || 'Lỗi đồng bộ hạn bài tập' };
    }
  },
};
