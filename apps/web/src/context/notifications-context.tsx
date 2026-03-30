'use client'

import { useAuth } from '@/context/auth-context';
import useNotificationPermission, { NotificationPermissionProps } from '@/hooks/use-notification-permission';
import { createContext, use, useMemo } from 'react';

type NotificationsState = 'loading' | 'error' | 'success';

interface NotificationsContextProps {
	state: NotificationsState;
	permission: NotificationPermissionProps;
}

const NotificationsContext = createContext<NotificationsContextProps | undefined>(undefined);

export const NotificationsProvider = ({
	children,
}: {
	children: React.ReactNode;
}) => {
	const { user } = useAuth();
	const notificationPermission = useNotificationPermission();
	const state = useMemo((): NotificationsState => {
		if (!user) {
			return 'loading';
		}
		return 'success';
	}, [user]);

	return (
		<NotificationsContext.Provider value={{ permission: notificationPermission, state }}>
			{children}
		</NotificationsContext.Provider>
	)
};

export const useNotifications = () => {
	const context = use(NotificationsContext);
	if (context === undefined) {
		throw new Error('useNotifications must be used within a NotificationsProvider');
	}
	return context;
};
