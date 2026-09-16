'use client';

import { useAuth } from '@/context/auth-context';
import useNotificationPermission, {
  NotificationPermissionProps,
} from '@/hooks/use-notification-permission';
import { messaging } from '@/lib/firebase/firebase.config';
import { createContext, use, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { onMessage, type MessagePayload } from 'firebase/messaging';
import toast from 'react-hot-toast';

type NotificationsState = 'loading' | 'error' | 'success';

interface NotificationsContextProps {
  state: NotificationsState;
  permission: NotificationPermissionProps;
}

const NotificationsContext = createContext<NotificationsContextProps | undefined>(undefined);

export const NotificationsProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const router = useRouter();
  const notificationPermission = useNotificationPermission();
  const state = useMemo((): NotificationsState => {
    if (!user) {
      return 'loading';
    }
    return 'success';
  }, [user]);

  // Foreground pushes never reach the service worker's onBackgroundMessage —
  // Firebase requires this listener to surface them at all while the tab is open.
  useEffect(() => {
    if (!user || notificationPermission.permission !== 'granted') return;

    let unsubscribe: (() => void) | undefined;

    messaging().then((fcmMessaging) => {
      if (!fcmMessaging) return;

      unsubscribe = onMessage(fcmMessaging, (payload: MessagePayload) => {
        const url = payload.data?.url;

        toast(
          (t) => (
            <div
              className={url ? 'cursor-pointer' : undefined}
              onClick={() => {
                if (url) router.push(url);
                toast.dismiss(t.id);
              }}
            >
              <p className="font-medium">{payload.notification?.title}</p>
              {payload.notification?.body ? (
                <p className="text-sm text-muted-foreground">{payload.notification.body}</p>
              ) : null}
            </div>
          ),
          { duration: 5000 },
        );
      });
    });

    return () => unsubscribe?.();
  }, [user, notificationPermission.permission, router]);

  return (
    <NotificationsContext.Provider value={{ permission: notificationPermission, state }}>
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => {
  const context = use(NotificationsContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
};
