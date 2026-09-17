import { useEffect, useRef, useState } from 'react';
import { ActiveTab, Language } from '../types';
import { hasOpenModal, closeTopModal } from './useSwipeToCloseModal';
import { App as CapApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

interface UseMobileSwipeOptions {
  activeTab: ActiveTab;
  tabHistory: ActiveTab[];
  onNavigateTab: (tab: ActiveTab) => void;
  onPopHistory: () => ActiveTab | null;
  isMobileDrawerOpen: boolean;
  onCloseMobileDrawer: () => void;
  lang: Language;
}

export interface GestureFeedback {
  id: number;
  text: string;
  icon: 'back' | 'close' | 'forward';
}

const TAB_ORDER: ActiveTab[] = [
  'timetable',
  'extra_class',
  'exams',
  'homework',
  'grades',
  'notices',
  'profile',
  'system',
  'notifications',
];

const TAB_NAMES: Record<Language, Record<ActiveTab, string>> = {
  vi: {
    timetable: 'Thời Khóa Biểu',
    extra_class: 'Lớp Học Thêm',
    exams: 'Lịch Thi',
    homework: 'Bài Tập',
    grades: 'Bảng Điểm',
    notices: 'Thông Báo Trường',
    profile: 'Hồ Sơ Học Sinh',
    system: 'Cài Đặt',
    notifications: 'Thông Báo Cá Nhân',
  },
  en: {
    timetable: 'Timetable',
    extra_class: 'Tutoring',
    exams: 'Exams',
    homework: 'Homework',
    grades: 'Grades',
    notices: 'School Notices',
    profile: 'Student Profile',
    system: 'Settings',
    notifications: 'Notifications',
  },
};

export function useMobileSwipe({
  activeTab,
  tabHistory,
  onNavigateTab,
  onPopHistory,
  isMobileDrawerOpen,
  onCloseMobileDrawer,
  lang,
}: UseMobileSwipeOptions) {
  const [feedback, setFeedback] = useState<GestureFeedback | null>(null);
  const feedbackTimerRef = useRef<NodeJS.Timeout | null>(null);

  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const touchStartTimeRef = useRef<number>(0);
  const isInputTargetRef = useRef<boolean>(false);

  const showFeedback = (text: string, icon: 'back' | 'close' | 'forward') => {
    if (feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current);
    }
    setFeedback({ id: Date.now(), text, icon });
    feedbackTimerRef.current = setTimeout(() => {
      setFeedback(null);
    }, 1100);
  };

  // Helper to check if any modal is currently visible
  const checkHasOpenModal = (): boolean => {
    if (hasOpenModal()) return true;
    const modalContainers = document.querySelectorAll(
      '.fixed.inset-0.z-50, [role="dialog"], [data-app-modal="true"]'
    );
    // Ignore the mobile navigation drawer if it's separate
    for (let i = 0; i < modalContainers.length; i++) {
      const el = modalContainers[i] as HTMLElement;
      if (
        el &&
        !el.closest('#mobile-nav-drawer') &&
        !el.closest('[data-mobile-drawer="true"]') &&
        el.getAttribute('data-mobile-drawer') !== 'true'
      ) {
        return true;
      }
    }
    return false;
  };

  // Close top modal function (Tier 1)
  const tryCloseTopModal = (): boolean => {
    const tabName = TAB_NAMES[lang][activeTab] || activeTab;
    const closed = closeTopModal();
    if (closed) {
      showFeedback(
        lang === 'vi' ? `Quay lại: ${tabName}` : `Back to: ${tabName}`,
        'back'
      );
      return true;
    }
    return false;
  };

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const touch = e.touches[0];
      touchStartXRef.current = touch.clientX;
      touchStartYRef.current = touch.clientY;
      touchStartTimeRef.current = Date.now();

      const target = touch.target as HTMLElement | null;
      if (target) {
        const isInput =
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable;
        isInputTargetRef.current = isInput;
      } else {
        isInputTargetRef.current = false;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (
        touchStartXRef.current === null ||
        touchStartYRef.current === null ||
        e.changedTouches.length === 0
      ) {
        return;
      }

      const touch = e.changedTouches[0];
      const diffX = touch.clientX - touchStartXRef.current;
      const diffY = touch.clientY - touchStartYRef.current;
      const absX = Math.abs(diffX);
      const absY = Math.abs(diffY);
      const duration = Date.now() - touchStartTimeRef.current;
      const startX = touchStartXRef.current;
      const windowWidth = window.innerWidth;

      // Reset coordinates
      touchStartXRef.current = null;
      touchStartYRef.current = null;

      // Filter out non-horizontal swipes or long slow drags
      if (duration > 750) return;
      if (absX < 45 || absX < absY * 1.25) return;

      // If touch started in input/textarea, only allow if started near screen edge or very large swipe
      if (isInputTargetRef.current) {
        const isEdge = startX < 45 || startX > windowWidth - 45;
        if (!isEdge && absX < 110) return;
      }

      // Check if started inside a horizontally scrollable element (e.g. big tables)
      const target = touch.target as HTMLElement | null;
      if (target) {
        const scrollable = target.closest(
          '.overflow-x-auto, .overflow-x-scroll, table'
        ) as HTMLElement | null;
        if (scrollable && scrollable.scrollWidth > scrollable.clientWidth + 10) {
          // If in a table, only trigger if swiped from edges (phone edge gesture)
          const isEdge = startX < 45 || startX > windowWidth - 45;
          if (!isEdge) return;
        }
      }

      const isSwipeRight = diffX > 0;
      const isSwipeLeft = diffX < 0;
      const isFromLeftEdge = startX < 55;
      const isFromRightEdge = startX > windowWidth - 55;

      // ACTION 1: IF MOBILE NAVIGATION DRAWER IS OPEN
      if (isMobileDrawerOpen) {
        if (isSwipeLeft || isSwipeRight) {
          onCloseMobileDrawer();
          showFeedback(lang === 'vi' ? 'Đã đóng Menu' : 'Closed Menu', 'close');
          return;
        }
      }

      // ACTION 2: TIER 1 - IF ANY MODAL IS OPEN (e.g. Thêm Lớp Học Thêm, Thêm Bài Tập, Lịch Thi, v.v.)
      // Left edge swipe or Back gesture closes the active modal and returns to the parent menu/page!
      if (checkHasOpenModal()) {
        if (isSwipeRight || isFromLeftEdge || isFromRightEdge) {
          tryCloseTopModal();
        }
        return; // Always stop here; never switch tabs underneath an active modal
      }

      // ACTION 3: 3-TIER NAVIGATION HIERARCHY
      // - Tier 2 (Secondary Views & Sub-Tabs):
      //   When on any secondary tab (extra_class, exams, homework, grades, notices, profile, system, notifications):
      //   Swipe from left edge or Back gesture ALWAYS returns to the Root Menu ('timetable' - Thời Khóa Biểu)!
      // - Tier 3 (Root Menu: timetable):
      //   Back gesture smoothly exits the application via CapApp.exitApp() on Android.
      const isBackGesture =
        isSwipeRight || (isSwipeLeft && isFromRightEdge) || isFromLeftEdge;

      if (isBackGesture) {
        if (activeTab !== 'timetable') {
          onNavigateTab('timetable');
          showFeedback(
            lang === 'vi' ? 'Quay lại: Thời Khóa Biểu' : 'Back to: Timetable',
            'back'
          );
          return;
        }

        // On Root Menu ('timetable'):
        if (typeof window !== 'undefined' && Capacitor.isNativePlatform()) {
          CapApp.exitApp();
        } else {
          showFeedback(
            lang === 'vi' ? 'Thời Khóa Biểu (Trang chính)' : 'Timetable (Home)',
            'back'
          );
        }
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
      if (feedbackTimerRef.current) {
        clearTimeout(feedbackTimerRef.current);
      }
    };
  }, [
    activeTab,
    tabHistory,
    isMobileDrawerOpen,
    lang,
    onNavigateTab,
    onPopHistory,
    onCloseMobileDrawer,
  ]);

  return {
    feedback,
  };
}
