import { createContext, use, useCallback, useEffect, useRef, useState } from "react";
import * as Notifications from "expo-notifications";
import { useAuth } from "./AuthProvider";
import { Platform } from "react-native";
import * as Device from 'expo-device';
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "apps/mobile/src/components/Toast";
import { usePushTokenUpdateMutation } from "@libs/query-client";

type NotificationsContextType = {
  isMounted: boolean;
  permissionStatus: Notifications.PermissionStatus | null;
  pushToken: string | null;
  notifications: Notifications.Notification[] | null;
  error?: Error | null;
};

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export const useNotifications = () => {
  const ctx = use(NotificationsContext);
  if (!ctx) throw new Error("useNotifications must be used in NotificationsProvider");
  return ctx;
};

export const NotificationsProvider = ({ children }: { children: React.ReactNode }) => {
  const toast = useToast();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, pushToken, setPushToken } = useAuth();
  const [isMounted, setIsMounted] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<Notifications.PermissionStatus | null>(null);
  const [notifications, setNotifications] = useState<Notifications.Notification[] | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const notificationsListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  const { mutate: updatePushToken } = usePushTokenUpdateMutation(); 

  const handleRegisterForPushNotificationsAsync = useCallback(async () => {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      setPermissionStatus(finalStatus);
      if (finalStatus !== 'granted') {
        throw new Error('Permission not granted to get push token for push notification!');
      }
      try {
        const pushTokenString = (
          await Notifications.getDevicePushTokenAsync()
        ).data;
        return pushTokenString;
      } catch (e) {
        throw new Error(`${e}`);
      }
    } else {
      throw new Error('Must use physical device for push notifications');
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    // Register token
    handleRegisterForPushNotificationsAsync().then(
      (token) => {
        setPushToken(token);
        updatePushToken({
          body: {
            provider: (Platform.OS === 'ios' || Platform.OS === 'macos') ? 'apns' : 'fcm',
            token,
            deviceType: Platform.OS === 'ios' ? 'ios' : 'android',
          },
        });
      },
      (err) => {
        console.error("Error getting push token:", err);
        setError(err);
      }
    );

    // Listener when app is open
    notificationsListener.current = Notifications.addNotificationReceivedListener((notification) => {
      console.log("🔔 Notification received:", notification);
      setNotifications((prev) => (prev ? [...prev, notification] : [notification]));
    });

    // Listener when notification is clicked
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log("🔔 Notification response received:", JSON.stringify(response, null, 2));
    });

    // Handle notification that opened the app
    (async () => {
      const initialResponse = Notifications.getLastNotificationResponse();
      if (initialResponse) {
        console.log("🔔 Initial notification response:", JSON.stringify(initialResponse, null, 2));
      }
    })();

    return () => {
      notificationsListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [user, updatePushToken, queryClient, toast, router]);

  return (
    <NotificationsContext.Provider
    value={{
      isMounted,
      permissionStatus,
      pushToken,
      notifications,
      error
    }}
    >
      {children}
    </NotificationsContext.Provider>
  );
};
