import { useAuth } from "@/context/auth-context";
import { useSupabaseClient } from "@/context/supabase-context";
import { fetchToken } from "@/lib/firebase/firebase.config";
import { useEffect, useRef, useState } from "react";

const LOCAL_STORAGE_KEY = 'notification-prompt-permission';
const DELAY = 3000;
const MAX_RETRIES = 3;

export interface NotificationPermissionProps {
	token: string | null;
	permission: NotificationPermission;
	enableNotifications: () => void;
	disableNotifications: () => void;
}


const useNotificationPermission = () => {
	const { session, setPushToken } = useAuth();
	const supabase = useSupabaseClient();
	const [permission, setPermission] = useState<NotificationPermission>('default');
	const [token, setToken] = useState<string | null>(null);
	const retryLoadToken = useRef(0);
	const isLoading = useRef(false);

	const loadToken = async () => {
		if (isLoading.current) return;
		isLoading.current = true;

		const token = await fetchToken();
		if (!token) {
			if (retryLoadToken.current >= MAX_RETRIES) {
				isLoading.current = false;
				console.warn('Failed to fetch FCM token');
				return;
			}
			retryLoadToken.current++;
			isLoading.current = false;
			return await loadToken();
		}
		setToken(token);
		setPushToken(token);
		isLoading.current;
	}

	const enableNotifications = async () => {
		if (!('Notification' in window)) {
			console.warn('This browser does not support notifications');
			return;
		}
		if (session) {
			const newPermission = await Notification.requestPermission();
			if (newPermission !== 'granted') throw new Error('Permission denied');
			setPermission(newPermission);
			localStorage.setItem(LOCAL_STORAGE_KEY, newPermission);
		} else {
			console.warn('User must be logged in to enable notifications');
		}
	};

	const disableNotifications = () => {
		setPermission('denied');
		localStorage.setItem(LOCAL_STORAGE_KEY, 'denied');
	};

	// Notification permission
	useEffect(() => {
		if (!('Notification' in window)) {
			console.warn('This browser does not support notifications');
			return;
		}
		const handler = () => setPermission(Notification.permission);
		handler();
		const storedPermission = localStorage.getItem(LOCAL_STORAGE_KEY);

		if (session && !storedPermission) {
			const timeoutId = setTimeout(() => {
				Notification.requestPermission().then((newPermission) => {
					setPermission(newPermission);
					localStorage.setItem(LOCAL_STORAGE_KEY, newPermission);
					// if (newPermission === 'granted' || newPermission === 'denied') {
					// 	localStorage.setItem(LOCAL_STORAGE_KEY, newPermission);
					// }
				});
			}
			, DELAY);

			navigator.permissions.query({ name: 'notifications' }).then((status) => {
				status.onchange = handler;
			});

			return () => clearTimeout(timeoutId);
		}
	}, [session]);

	// FCM token
	useEffect(() => {
		if (session && permission === 'granted') {
			loadToken();
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [session, permission]);

	// Store token
	useEffect(() => {
		if (!token || !session) return;

		const saveToken = async () => {
			await supabase.from('user_notification_tokens').upsert({
				user_id: session.user.id,
				token: token,
				device_type: 'web',
				provider: 'fcm',
				updated_at: new Date().toISOString(),
			}, {
				onConflict: "provider, token"
			});
		};
		if (process.env.NODE_ENV !== 'development') {
			saveToken();
		}
	}, [token, session,  supabase]);


	return {
		token,
		permission,
		enableNotifications,
		disableNotifications,
	}
};

export default useNotificationPermission;