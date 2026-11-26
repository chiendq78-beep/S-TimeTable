import { ExamItem, ExtraClassItem, HomeworkItem, PersonalNotification } from '../types';

export const syncAllDueNotifications = (
  homework: HomeworkItem[],
  exams: ExamItem[],
  extraClasses: ExtraClassItem[],
  currentNotifications: PersonalNotification[]
): PersonalNotification[] => {
  // Helper to format deadline
  const formatDeadline = (dl: string) => {
    try {
      const d = new Date(dl);
      const now = new Date();
      const isToday = d.toDateString() === now.toDateString();
      const timeStr = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      if (isToday) return `Hôm nay, ${timeStr}`;
      return `${d.getDate()}/${d.getMonth() + 1}, ${timeStr}`;
    } catch {
      return dl;
    }
  };

  // Helper to format exam date
  const formatExamDate = (dateStr: string) => {
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  const updatedNotifications: PersonalNotification[] = [];

  // 1. Đồng bộ Bài tập (Homework)
  homework.forEach((hw) => {
    const existing = currentNotifications.find(
      (n) => n.targetId === hw.id || n.id === `notif-hw-${hw.id}`
    );
    const isCompleted = hw.status === 'completed';

    updatedNotifications.push({
      id: existing ? existing.id : `notif-hw-${hw.id}`,
      type: 'homework',
      title: `Bài tập ${hw.subject}: ${hw.title}`,
      message: hw.description || `Bài tập môn ${hw.subject}`,
      createdAt: existing ? existing.createdAt : 'Đến hẹn',
      // Nếu bài tập đã hoàn thành thì tự động đánh dấu đã đọc
      isRead: isCompleted ? true : (existing ? existing.isRead : false),
      targetId: hw.id,
      meta: {
        subject: hw.subject,
        dueDate: formatDeadline(hw.deadline),
        dueStatus: isCompleted ? undefined : 'today',
        targetId: hw.id,
      },
    });
  });

  // 2. Đồng bộ Lịch thi (Exams)
  exams.forEach((ex) => {
    const existing = currentNotifications.find(
      (n) => n.targetId === ex.id || n.id === `notif-exam-${ex.id}`
    );

    updatedNotifications.push({
      id: existing ? existing.id : `notif-exam-${ex.id}`,
      type: 'exam',
      title: `Lịch thi ${ex.subject}: ${ex.examName}`,
      message: `Thi ${ex.subject} ngày ${formatExamDate(ex.examDate)} lúc ${ex.timeStart}`,
      createdAt: existing ? existing.createdAt : 'Sắp đến hẹn',
      isRead: existing ? existing.isRead : false,
      targetId: ex.id,
      meta: {
        subject: ex.subject,
        examDate: `${formatExamDate(ex.examDate)}, ${ex.timeStart}${ex.room ? ` (${ex.room})` : ''}`,
        dueStatus: 'upcoming',
        targetId: ex.id,
      },
    });
  });

  // 3. Đồng bộ Học thêm (Extra Classes)
  extraClasses.forEach((ec) => {
    const existing = currentNotifications.find(
      (n) => n.targetId === ec.id || n.id === `notif-extra-${ec.id}`
    );

    const dayName = ec.dayOfWeek ? `Thứ ${ec.dayOfWeek}` : 'Lịch tuần';
    const timeLabel = ec.timeStart && ec.timeEnd ? `${ec.timeStart} - ${ec.timeEnd}` : '';

    updatedNotifications.push({
      id: existing ? existing.id : `notif-extra-${ec.id}`,
      type: 'extra_class',
      title: `Lịch học thêm: ${ec.subject} (${ec.title || ec.subject})`,
      message: `Lớp học thêm ${ec.subject} (${dayName} ${timeLabel})`,
      createdAt: existing ? existing.createdAt : 'Sắp đến hẹn',
      isRead: existing ? existing.isRead : false,
      targetId: ec.id,
      meta: {
        subject: ec.subject,
        dueDate: `${dayName}${timeLabel ? `, ${timeLabel}` : ''}${ec.location ? ` • ${ec.location}` : ''}`,
        dueStatus: 'upcoming',
        targetId: ec.id,
      },
    });
  });

  // 4. Giữ lại các thông báo hệ thống khác (nếu có)
  currentNotifications.forEach((n) => {
    if (n.type !== 'homework' && n.type !== 'exam' && n.type !== 'extra_class') {
      updatedNotifications.push(n);
    }
  });

  return updatedNotifications;
};
