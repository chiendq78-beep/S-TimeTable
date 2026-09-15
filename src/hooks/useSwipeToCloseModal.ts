import React, { useEffect, useRef } from 'react';

interface UseSwipeToCloseModalOptions {
  isOpen: boolean;
  onClose: () => void;
}

export function useSwipeToCloseModal({ isOpen, onClose }: UseSwipeToCloseModalOptions) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const isHistoryPushedRef = useRef(false);
  const touchStartRef = useRef<{
    x: number;
    y: number;
    time: number;
    isInput: boolean;
  } | null>(null);

  // 1. Manage browser history state:
  // Intercepts phone's native edge-swipe back gesture & Android hardware back button
  // so that swiping back closes the modal instead of exiting/closing the app!
  useEffect(() => {
    if (!isOpen) {
      if (isHistoryPushedRef.current) {
        isHistoryPushedRef.current = false;
        try {
          window.history.back();
        } catch {
          // ignore
        }
      }
      return;
    }

    // Modal just opened: push history entry
    if (!isHistoryPushedRef.current) {
      try {
        window.history.pushState({ isAppModal: true, time: Date.now() }, '');
        isHistoryPushedRef.current = true;
      } catch {
        // ignore
      }
    }

    const handlePopState = () => {
      if (isHistoryPushedRef.current) {
        // Handled by browser/phone back gesture: mark as consumed so we don't call history.back() again
        isHistoryPushedRef.current = false;
        onCloseRef.current();
      }
    };

    const handleAppModalClose = (e: Event) => {
      e.preventDefault();
      onCloseRef.current();
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('app-modal-close', handleAppModalClose);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('app-modal-close', handleAppModalClose);
      if (isHistoryPushedRef.current) {
        isHistoryPushedRef.current = false;
        try {
          window.history.back();
        } catch {
          // ignore
        }
      }
    };
  }, [isOpen]);

  // 2. Global Touch Listeners on Window when modal is open
  // Allows swiping from screen edges or across modal to close it seamlessly
  useEffect(() => {
    if (!isOpen) return;

    const handleWindowTouchStart = (e: TouchEvent) => {
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

    const handleWindowTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current || e.changedTouches.length === 0) return;
      const touch = e.changedTouches[0];
      const startInfo = touchStartRef.current;
      touchStartRef.current = null;

      const diffX = touch.clientX - startInfo.x;
      const diffY = touch.clientY - startInfo.y;
      const absX = Math.abs(diffX);
      const absY = Math.abs(diffY);
      const duration = Date.now() - startInfo.time;
      const windowWidth = window.innerWidth;

      // Filter out slow drags or vertical scrolls
      if (duration > 850) return;
      if (absX < 40 || absX < absY * 1.15) return;

      // If started inside input, allow if swipe started near edge or is significant
      if (startInfo.isInput) {
        const isNearEdge = startInfo.x < 55 || startInfo.x > windowWidth - 55;
        if (!isNearEdge && absX < 90) return;
      }

      // Valid horizontal swipe gesture: close modal and return to previous screen
      onCloseRef.current();
    };

    window.addEventListener('touchstart', handleWindowTouchStart, { passive: true });
    window.addEventListener('touchend', handleWindowTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleWindowTouchStart);
      window.removeEventListener('touchend', handleWindowTouchEnd);
    };
  }, [isOpen]);

  const onTouchStart = (e: React.TouchEvent) => {
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
    if (!touchStartRef.current || e.changedTouches.length === 0) return;
    const touch = e.changedTouches[0];
    const diffX = touch.clientX - touchStartRef.current.x;
    const diffY = touch.clientY - touchStartRef.current.y;
    touchStartRef.current = null;

    if (Math.abs(diffX) > 40 && Math.abs(diffX) > Math.abs(diffY) * 1.15) {
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
