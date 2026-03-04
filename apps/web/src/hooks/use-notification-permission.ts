import { useAuth } from "@/context/auth-context";
import { fetchToken } from "@/lib/firebase/firebase.config";
import { useUserPushTokenUpdateMutation } from "@libs/query-client";
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
	const { user } = useAuth();
	const [permission, setPermission] = useState<NotificationPermission>('default');
	const [token, setToken] = useState<string | null>(null);
	const retryLoadToken = useRef(0);
	const isLoading = useRef(false);

	const { mutate: updatePushToken } = useUserPushTokenUpdateMutation();

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
		isLoading.current;
	}

	const enableNotifications = async () => {
		if (!('Notification' in window)) {
			console.warn('This browser does not support notifications');
			return;
		}
		if (user) {
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

		if (user && !storedPermission) {
			const timeoutId = setTimeout(() => {
				Notification.requestPermission().then((newPermission) => {
					setPermission(newPermission);
					localStorage.setItem(LOCAL_STORAGE_KEY, newPermission);
				});
			}
			, DELAY);

			navigator.permissions.query({ name: 'notifications' }).then((status) => {
				status.onchange = handler;
			});

			return () => clearTimeout(timeoutId);
		}
	}, [user]);

	// FCM token
	useEffect(() => {
		if (user && permission === 'granted') {
			loadToken();
		}
	}, [user, permission]);

	// Store token
	useEffect(() => {
		if (!token || !user) return;

		if (process.env.NODE_ENV !== 'development') {
			updatePushToken({
				body: {
					provider: 'fcm',
					token,
					deviceType: 'web',
				}
			});
		}
	}, [token]);


	return {
		token,
		permission,
		enableNotifications,
		disableNotifications,
	}
};

export default useNotificationPermission;