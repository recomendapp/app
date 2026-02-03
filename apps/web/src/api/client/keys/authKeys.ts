export const authKeys = {
	base: ['auth'] as const,
	
	entitlements: () => [...authKeys.base, 'entitlements'] as const,
	customerInfo: () => [...authKeys.base, 'customerInfo'] as const,
};