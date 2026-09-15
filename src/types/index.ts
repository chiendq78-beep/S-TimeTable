export type Language = 'vi' | 'en';
export type Theme = 'light' | 'dark';
export type DeviceMode = 'responsive' | 'mobile' | 'tablet';

export type ActiveTab =
  | 'timetable'
  | 'extra_class'
  | 'exams'
  | 'homework'
  | 'grades'
  | 'notices'
  | 'profile'
  | 'system'
  | 'notifications';

export interface StudentProfile {
  id: string;
  fullName: string;
  school: string;
  classGrade: string;
  phone: string;
  birthYear: string;
  address: string;
  studentCode: string;
  email: string;
  parentName: string;
  parentPhone: string;
  avatarUrl: string;
  academicYear: string;
  homeroomTeacher: string;
  notes: string;
  gender?: 'male' | 'female' | 'other' | string;
  teacherPhone?: string;
  homeroomTeacherPhone?: string;
  studentId?: string;
  className?: string;
  birthDate?: string;
}

export interface ClassScheduleItem {
  id: string;
  dayOfWeek: number; // 2 = Thứ 2 / Monday ... 8 = Chủ Nhật / Sunday
  period: number; // 1 - 10
  session: 'morning' | 'afternoon';
  timeStart: string; // "07:15"
  timeEnd: string; // "08:00"
  subject: string;
  room: string;
  teacher: string;
  color: string;
  note?: string;
  googleEventId?: string;
}

export interface ExtraClassItem {
  id: string;
  title: string;
  subject: string;
  dayOfWeek: number;
  timeStart: string;
  timeEnd: string;
  location: string;
  teacher: string;
  fee: number;
  feePeriod?: 'month' | 'session';
  reminderMinutesBefore: number;
  note?: string;
  googleEventId?: string;
}

export type ExamFormat = 'essay' | 'multiple_choice' | 'oral' | 'practice';

export interface ExamItem {
  id: string;
  subject: string;
  examName: string;
  examDate: string; // YYYY-MM-DD
  timeStart: string; // HH:mm
  durationMinutes: number;
  room: string;
  candidateNumber: string;
  format: ExamFormat;
  reviewTopics: string;
  targetScore?: number;
  actualScore?: number;
  googleEventId?: string;
}

export type Priority = 'low' | 'medium' | 'high';
export type HomeworkStatus = 'pending' | 'in_progress' | 'completed';

export interface HomeworkItem {
  id: string;
  subject: string;
  title: string;
  deadline: string; // YYYY-MM-DDTHH:mm
  priority: Priority;
  status: HomeworkStatus;
  description?: string;
  reminderMinutesBefore: number;
  googleEventId?: string;
}

export interface SubjectGrade {
  id: string;
  subjectName: string;
  coefficient: number; // Hệ số môn (ví dụ Toán Văn hệ số 2 hoặc 1 tuỳ cấp)
  semester: 'sem1' | 'sem2';
  oralScores: number[]; // Điểm miệng
  quiz15Scores: number[]; // Điểm 15 phút
  midTermScore: number | null; // Điểm giữa kỳ (hệ số 2)
  finalScore: number | null; // Điểm cuối kỳ (hệ số 3)
}

export type NoticeCategory = 'urgent' | 'academic' | 'activity' | 'holiday' | 'fee' | 'general';

export interface SchoolNotice {
  id: string;
  title: string;
  category: NoticeCategory;
  date: string;
  content: string;
  author: string;
  sender?: string;
  isUrgent?: boolean;
  isPinned: boolean;
  isRead: boolean;
  attachments?: string[];
}

export interface GoogleCalendarState {
  isSignedIn: boolean;
  userEmail: string | null;
  userName: string | null;
  userPhoto: string | null;
  accessToken: string | null;
  isSyncing: boolean;
  lastSyncedAt: string | null;
}

export type PersonalNotificationType = 'exam' | 'homework' | 'grade' | 'system';

export interface PersonalNotification {
  id: string;
  type: PersonalNotificationType;
  title: string;
  message: string;
  createdAt: string; // ISO string or human readable
  isRead: boolean;
  actionUrl?: string;
  meta?: {
    subject?: string;
    score?: number;
    dueDate?: string;
    examDate?: string;
  };
}

export interface NotificationPreferences {
  channels: {
    inApp: boolean;
    email: boolean;
    push: boolean;
    emailAddress?: string;
  };
  rules: {
    examAdvanceDays: number; // 1, 3, 7
    homeworkAdvanceHours: number; // 2, 12, 24
    newGradeAlert: boolean;
  };
  quietHours: {
    enabled: boolean;
    startTime: string; // "23:00"
    endTime: string; // "06:00"
  };
}

