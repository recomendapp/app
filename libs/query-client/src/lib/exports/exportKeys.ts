export const exportKeys = {
  base: 'exports' as const,

  sources: () => [exportKeys.base, 'sources'] as const,
};
