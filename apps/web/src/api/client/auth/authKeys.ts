export const authKeys = {
  base: ['auth'] as const,

  session: () => [...authKeys.base, 'session'] as const,

  entitlements: () => [...authKeys.base, 'entitlements'] as const,
  customerInfo: () => [...authKeys.base, 'customerInfo'] as const,
};
