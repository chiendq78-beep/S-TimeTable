import { useEffect, useRef, useState } from 'react';
import { ActiveTab, Language } from '../types';

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

  // Helper to check if any modal is currently visible in the DOM
  const checkHasOpenModal = (): boolean => {
    const modalContainers = document.querySelectorAll(
      '.fixed.inset-0.z-50, [role="dialog"], [data-app-modal="true"]'
    );
    // Ignore the mobile navigation drawer if it's separate
    for (let i = 0; i < modalContainers.length; i++) {
      const el = modalContainers[i] as HTMLElement;
      // If element is not display: none and inside viewport
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

  // Close top modal function
  const tryCloseTopModal = (): boolean => {
    // 1. Dispatch custom event for custom-handled modals
    const closeEvt = new CustomEvent('app-modal-close', {
      bubbles: true,
      cancelable: true,
    });
    const dispatched = window.dispatchEvent(closeEvt);

    if (closeEvt.defaultPrevented) {
      showFeedback(lang === 'vi' ? 'Đã đóng' : 'Closed', 'close');
      return true;
    }

    // 2. Fallback: Find close/cancel button inside any open modal
    const closeSelectors = [
      '.fixed.inset-0.z-50 button[title*="Đóng"]',
      '.fixed.inset-0.z-50 button[title*="Hủy"]',
      '.fixed.inset-0.z-50 button[title*="Close"]',
      '.fixed.inset-0.z-50 button[title*="Cancel"]',
      '.fixed.inset-0.z-50 button[aria-label*="close" i]',
      '.fixed.inset-0.z-50 button[aria-label*="đóng" i]',
      '[role="dialog"] button[title*="Đóng"]',
      '[role="dialog"] button[title*="Hủy"]',
      '[role="dialog"] button[title*="Close"]',
      '[role="dialog"] button[aria-label*="close" i]',
    ];

    for (const selector of closeSelectors) {
      const btn = document.querySelector<HTMLButtonElement>(selector);
      if (btn) {
        btn.click();
        showFeedback(lang === 'vi' ? 'Đã đóng' : 'Closed', 'close');
        return true;
      }
    }

    // 3. Fallback: Check for buttons with text like 'Đóng', 'Hủy', 'Close', 'Cancel'
    const modalButtons = document.querySelectorAll<HTMLButtonElement>(
      '.fixed.inset-0.z-50 button, [data-app-modal="true"] button, [role="dialog"] button'
    );
    for (let i = 0; i < modalButtons.length; i++) {
      const btn = modalButtons[i];
      const text = (btn.textContent || '').trim().toLowerCase();
      if (text === 'đóng' || text === 'hủy' || text === 'close' || text === 'cancel') {
        btn.click();
        showFeedback(lang === 'vi' ? 'Đã đóng' : 'Closed', 'close');
        return true;
      }
    }

    // 4. Fallback: Check for any button with SVG X icon inside modal header
    const modalOverlay = document.querySelector('.fixed.inset-0.z-50, [data-app-modal="true"]');
    if (modalOverlay) {
      const headerCloseBtn = modalOverlay.querySelector<HTMLButtonElement>(
        'header button, [class*="border-b"] button, .shrink-0 button, button.shrink-0'
      );
      if (headerCloseBtn) {
        headerCloseBtn.click();
        showFeedback(lang === 'vi' ? 'Đã đóng' : 'Closed', 'close');
        return true;
      }
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

      // ACTION 2: IF ANY MODAL IS OPEN (e.g. Thêm Tiết Học, Thêm Lớp Học Thêm, Thêm Bài Tập, Thêm Môn Học)
      // Both swipe left and swipe right close the modal and return to previous page!
      if (checkHasOpenModal()) {
        tryCloseTopModal();
        return; // Always stop here; never switch tabs underneath an active modal
      }

      // ACTION 3: MAIN VIEW PAGE NAVIGATION (Quay lại trang trước như điện thoại)
      // On mobile phones:
      // - Swipe Right (left-to-right) is the standard BACK gesture on iOS and Android.
      // - Swipe Left from the Right Edge is the native Android BACK gesture.
      const isBackGesture =
        isSwipeRight || (isSwipeLeft && isFromRightEdge);

      if (isBackGesture) {
        // Check tab history first
        const prevTab = onPopHistory();
        if (prevTab) {
          const tabName = TAB_NAMES[lang][prevTab] || prevTab;
          showFeedback(
            lang === 'vi' ? `Quay lại: ${tabName}` : `Back to: ${tabName}`,
            'back'
          );
          return;
        }

        // If no history, move to previous tab in order
        const currIdx = TAB_ORDER.indexOf(activeTab);
        if (currIdx > 0) {
          const targetTab = TAB_ORDER[currIdx - 1];
          onNavigateTab(targetTab);
          const tabName = TAB_NAMES[lang][targetTab] || targetTab;
          showFeedback(
            lang === 'vi' ? `Quay lại: ${tabName}` : `Back to: ${tabName}`,
            'back'
          );
        }
      } else if (isSwipeLeft && !isFromRightEdge) {
        // Swiping Left across page moves forward to next tab
        const currIdx = TAB_ORDER.indexOf(activeTab);
        if (currIdx < TAB_ORDER.length - 1) {
          const targetTab = TAB_ORDER[currIdx + 1];
          onNavigateTab(targetTab);
          const tabName = TAB_NAMES[lang][targetTab] || targetTab;
          showFeedback(
            lang === 'vi' ? `Đến: ${tabName}` : `Next: ${tabName}`,
            'forward'
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
