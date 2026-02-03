'use client'

import { API_ENDPOINT } from "@/lib/env";
import { client } from "@packages/api-js";
import { useLocale } from "next-intl";
import { createContext, use, useMemo } from "react";

client.setConfig({
	baseUrl: API_ENDPOINT || 'https://api.recomend.app/v1',
	credentials: 'include',
});

const ApiContext = createContext<typeof client | undefined>(undefined);

export const ApiProvider = ({
	children,
} : {
	children: React.ReactNode;
}) => {
	const locale = useLocale();
	const api = useMemo(() => {
		// return createClient({
		// 	token: session?.access_token,
		// 	language: locale,
		// });
		return client;
	}, [locale]);
	return (
		<ApiContext.Provider value={api}>
			{children}
		</ApiContext.Provider>
	);
}

export const useApiClient = () => {
	const context = use(ApiContext);
	if (!context) {
		throw new Error('useApiClient must be used within a ApiProvider');
	}
	return context;
};