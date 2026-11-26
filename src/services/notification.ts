import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

export const NotificationService = {
  // Check permission status
  getPermissionStatus: async (): Promise<'granted' | 'denied' | 'prompt'> => {
    try {
      if (Capacitor.isNativePlatform()) {
        const status = await LocalNotifications.checkPermissions();
        if (status.display === 'granted') return 'granted';
        if (status.display === 'denied') return 'denied';
        return 'prompt';
      }

      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'granted') return 'granted';
        if (Notification.permission === 'denied') return 'denied';
        return 'prompt';
      }
      return 'denied';
    } catch {
      return 'prompt';
    }
  },

  // Request native phone / web notification permissions
  requestPermission: async (): Promise<boolean> => {
    try {
      // 1. If running inside native Android / iOS Capacitor app
      if (Capacitor.isNativePlatform()) {
        const res = await LocalNotifications.requestPermissions();
        if (res.display === 'granted') {
          await NotificationService.setupNativeChannel();
          return true;
        }
        return false;
      }

      // 2. If running on Mobile Web / PWA / Browser
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          return true;
        }
        if (Notification.permission !== 'denied') {
          const perm = await Notification.requestPermission();
          return perm === 'granted';
        }
      }
      return false;
    } catch (err) {
      console.warn('Error requesting notification permission:', err);
      return false;
    }
  },

  // Setup Android notification channel for high-priority notification center display
  setupNativeChannel: async () => {
    try {
      if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android') {
        await LocalNotifications.createChannel({
          id: 'school_reminders',
          name: 'Nhắc nhở học tập & Lịch biểu',
          description: 'Thông báo nhắc bài tập, lịch thi và học thêm',
          importance: 5, // High importance (heads-up & notification center)
          visibility: 1, // Public on lock screen
          vibration: true,
        });
      }
    } catch (e) {
      console.warn('Failed to setup native notification channel', e);
    }
  },

  // Show immediate system notification onto phone notification center
  sendSystemNotification: async (
    title: string,
    body: string = '',
    options?: { url?: string; tag?: string; id?: number }
  ): Promise<boolean> => {
    try {
      // Always play audio bell chime
      NotificationService.playBellSound();

      // Path A: Native Android / iOS via Capacitor
      if (Capacitor.isNativePlatform()) {
        const notifId = options?.id || Math.floor(Math.random() * 100000);
        await LocalNotifications.schedule({
          notifications: [
            {
              id: notifId,
              title,
              body,
              channelId: 'school_reminders',
              sound: 'beep.wav',
              extra: {
                url: options?.url || '/',
              },
            },
          ],
        });
        return true;
      }

      // Path B: Web / Mobile Browser / PWA (Android Chrome, Mobile Safari, Desktop)
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission !== 'granted') {
          const granted = await NotificationService.requestPermission();
          if (!granted) return false;
        }

        // On mobile browsers (Android Chrome), ServiceWorker is required for notification tray
        if ('serviceWorker' in navigator) {
          try {
            const reg = await navigator.serviceWorker.ready;
            if (reg && reg.showNotification) {
              await reg.showNotification(title, {
                body,
                icon: '/favicon.ico',
                badge: '/favicon.ico',
                tag: options?.tag || 'school-alert',
                data: { url: options?.url || '/' },
              });
              return true;
            }
          } catch {
            // fallback to standard Notification
          }
        }

        // Standard Notification constructor fallback
        new Notification(title, {
          body,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: options?.tag || 'school-alert',
        });
        return true;
      }

      return false;
    } catch (err) {
      console.warn('Could not display system notification', err);
      return false;
    }
  },

  // Send test notification to verify phone notification center
  testPhoneNotification: async (): Promise<boolean> => {
    const granted = await NotificationService.requestPermission();
    if (!granted) return false;

    return await NotificationService.sendSystemNotification(
      '🔔 Quản lý Thời gian biểu',
      'Thông báo đã được kết nối thành công với trung tâm thông báo của điện thoại!',
      { tag: 'test-notification' }
    );
  },

  // Convenient notify helper
  notify: (title: string, body?: string) => {
    NotificationService.sendSystemNotification(title, body);
  },

  // Vibrate mobile device if supported
  vibrate: (pattern: number | number[] = [200, 100, 200]) => {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate(pattern);
      } catch (err) {
        console.warn('Vibration API not permitted or available', err);
      }
    }
  },

  // Synthesize a pleasant, crisp bell reminder chime using Web Audio API
  playBellSound: () => {
    if (typeof window === 'undefined') return;
    try {
      NotificationService.vibrate();
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      // Two harmonic tones for a pleasant chime
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now); // D5
      osc1.frequency.exponentialRampToValueAtTime(880.0, now + 0.1); // A5

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(880.0, now); // A5
      osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.1); // D6

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 1.2);
      osc2.stop(now + 1.2);
    } catch (e) {
      console.warn('Web Audio playback error', e);
    }
  },
};
