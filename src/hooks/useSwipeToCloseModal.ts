import React, { useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';

interface UseSwipeToCloseModalOptions {
  isOpen: boolean;
  onClose: () => void;
}

// Active modal stack to guarantee predictable LIFO modal closing across the app
const activeModals: Array<() => void> = [];
let isClosingModalHistoryCleanup = false;

export function getActiveModalCount(): number {
  return activeModals.length;
}

export function isModalHistoryCleaning(): boolean {
  return isClosingModalHistoryCleanup;
}

export function hasOpenModal(): boolean {
  if (activeModals.length > 0) return true;
  // Fallback to DOM detection
  if (typeof document === 'undefined') return false;
  const modalEl = document.querySelector(
    '.fixed.inset-0.z-50, [data-app-modal="true"], [role="dialog"]'
  );
  if (!modalEl) return false;
  if (
    modalEl.id === 'mobile-nav-drawer' ||
    modalEl.closest('#mobile-nav-drawer') ||
    modalEl.getAttribute('data-mobile-drawer') === 'true'
  ) {
    return false;
  }
  return true;
}

export function closeTopModal(): boolean {
  if (activeModals.length > 0) {
    const topClose = activeModals[activeModals.length - 1];
    topClose();
    return true;
  }

  // Fallback: Dispatch custom event for custom-handled modals
  if (typeof window !== 'undefined') {
    const closeEvt = new CustomEvent('app-modal-close', {
      bubbles: true,
      cancelable: true,
    });
    window.dispatchEvent(closeEvt);
    if (closeEvt.defaultPrevented) return true;
  }

  // Fallback: Click modal close button
  if (typeof document !== 'undefined') {
    const modalEl = document.querySelector('.fixed.inset-0.z-50, [data-app-modal="true"], [role="dialog"]');
    if (modalEl) {
      const btn = modalEl.querySelector<HTMLButtonElement>(
        'button[title*="Đóng"], button[title*="Hủy"], button[title*="Close"], button[title*="Cancel"], button[aria-label*="close" i], button[aria-label*="đóng" i], button.shrink-0'
      );
      if (btn) {
        btn.click();
        return true;
      }
    }
  }

  return false;
}

export function useSwipeToCloseModal({ isOpen, onClose }: UseSwipeToCloseModalOptions) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const pushedHistoryRef = useRef(false);
  const touchStartRef = useRef<{
    x: number;
    y: number;
    time: number;
    isInput: boolean;
  } | null>(null);

  // 1. REGISTER IN ACTIVE MODAL STACK & LISTEN TO CUSTOM EVENT
  useEffect(() => {
    if (!isOpen) return;

    const closeHandler = () => {
      onCloseRef.current();
    };

    activeModals.push(closeHandler);

    const handleAppModalClose = (e: Event) => {
      e.preventDefault();
      closeHandler();
    };
    window.addEventListener('app-modal-close', handleAppModalClose);

    return () => {
      const idx = activeModals.indexOf(closeHandler);
      if (idx !== -1) {
        activeModals.splice(idx, 1);
      }
      window.removeEventListener('app-modal-close', handleAppModalClose);
    };
  }, [isOpen]);

  // 2. BROWSER & WEBVIEW HISTORY INTERCEPTION (POPSTATE):
  // When modal opens, pushes history entry. When popped via Back gesture, safely closes
  // the modal without leaving the current tab/page.
  useEffect(() => {
    if (!isOpen) {
      if (pushedHistoryRef.current) {
        pushedHistoryRef.current = false;
        try {
          isClosingModalHistoryCleanup = true;
          window.history.back();
          setTimeout(() => {
            isClosingModalHistoryCleanup = false;
          }, 150);
        } catch {
          isClosingModalHistoryCleanup = false;
        }
      }
      return;
    }

    if (!pushedHistoryRef.current) {
      try {
        window.history.pushState({ isAppModal: true, timestamp: Date.now() }, '');
        pushedHistoryRef.current = true;
      } catch {
        // ignore
      }
    }

    const handlePopState = () => {
      if (pushedHistoryRef.current) {
        pushedHistoryRef.current = false;
        onCloseRef.current();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseRef.current();
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('keydown', handleKeyDown);
      if (pushedHistoryRef.current) {
        pushedHistoryRef.current = false;
        try {
          isClosingModalHistoryCleanup = true;
          window.history.back();
          setTimeout(() => {
            isClosingModalHistoryCleanup = false;
          }, 150);
        } catch {
          isClosingModalHistoryCleanup = false;
        }
      }
    };
  }, [isOpen]);

  // 3. TOUCH SWIPE DETECTION (EDGE-SWIPE & HORIZONTAL DISMISS SWIPE):
  useEffect(() => {
    if (!isOpen) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        const target = touch.target as HTMLElement | null;
        const isInput = !!(
          target &&
          (target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.tagName === 'SELECT' ||
            target.isContentEditable)
        );
        touchStartRef.current = {
          x: touch.clientX,
          y: touch.clientY,
          time: Date.now(),
          isInput,
        };
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current || e.changedTouches.length === 0) return;
      const touch = e.changedTouches[0];
      const start = touchStartRef.current;
      touchStartRef.current = null;

      const diffX = touch.clientX - start.x;
      const diffY = touch.clientY - start.y;
      const absX = Math.abs(diffX);
      const absY = Math.abs(diffY);
      const duration = Date.now() - start.time;
      const screenWidth = window.innerWidth;

      // Filter non-horizontal or slow drags
      if (duration > 800) return;
      if (absX < 45 || absX < absY * 1.15) return;

      // Left-to-right swipe (Back gesture) OR Right-to-left from right edge:
      const isSwipeRight = diffX > 40;
      const isFromLeftEdge = start.x < 65;
      const isFromRightEdge = start.x > screenWidth - 65;
      const isBackGesture = isSwipeRight || isFromLeftEdge || (diffX < -40 && isFromRightEdge);

      if (!isBackGesture) return;

      // If started inside an input, only trigger if it started near screen edge or travel is large
      if (start.isInput) {
        const nearEdge = start.x < 65 || start.x > screenWidth - 65;
        if (!nearEdge && absX < 85) return;
      }

      onCloseRef.current();
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isOpen]);

  const onTouchStart = (e: React.TouchEvent) => {
    if (!isOpen) return;
    if (e.touches.length === 1) {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        time: Date.now(),
        isInput: false,
      };
    }
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (!isOpen || !touchStartRef.current || e.changedTouches.length === 0) return;
    const touch = e.changedTouches[0];
    const diffX = touch.clientX - touchStartRef.current.x;
    const diffY = touch.clientY - touchStartRef.current.y;
    const duration = Date.now() - touchStartRef.current.time;
    const absX = Math.abs(diffX);
    const absY = Math.abs(diffY);
    touchStartRef.current = null;

    if (duration > 750) return;
    if (absX < 45 || absX < absY * 1.15) return;

    if (diffX > 40) {
      onCloseRef.current();
    }
  };

  return {
    modalTouchHandlers: {
      onTouchStart,
      onTouchEnd,
    },
  };
}

