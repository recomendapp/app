'use client'

import { useAuth } from '@/context/auth-context';
import useNotificationPermission, { NotificationPermissionProps } from '@/hooks/use-notification-permission';
import { NovuProvider } from '@novu/react';
import { createContext, useEffect, useState, use, useMemo } from 'react';
import { getNovuSubscriberHash } from '@/lib/novu/novu'; // doit être côté client-compatible

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
	const { session } = useAuth();
	const notificationPermission = useNotificationPermission();
	const [subscriberHash, setSubscriberHash] = useState<string | null>(null);
	const state = useMemo((): NotificationsState => {
		if (!session || subscriberHash === null) {
			return 'loading';
		}
		return 'success';
	}, [session, subscriberHash]);

	useEffect(() => {
		const fetchHash = async () => {
			if (session && subscriberHash === null) {
				const hash = await getNovuSubscriberHash(session.user.id);
				setSubscriberHash(hash);
			}
		};
		if (session && subscriberHash === null) {
			fetchHash();
		} else {
			setSubscriberHash(null);
		}
	}, [session]);

	const content = (
		<NotificationsContext.Provider value={{ permission: notificationPermission, state }}>
			{children}
		</NotificationsContext.Provider>
	);

	if (session && subscriberHash) {
		return (
			<NovuProvider
				applicationIdentifier={process.env.NEXT_PUBLIC_NOVU_APP_IDENTIFIER!}
				subscriber={session.user.id}
				subscriberHash={subscriberHash}
			>
				{content}
			</NovuProvider>
		);
	}
	return content;
};

export const useNotifications = () => {
	const context = use(NotificationsContext);
	if (context === undefined) {
		throw new Error('useNotifications must be used within a NotificationsProvider');
	}
	return context;
};
