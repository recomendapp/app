'use client';

import { client } from '@packages/api-js';

client.setConfig({
  baseUrl: process.env.NEXT_PUBLIC_API_HOST || 'https://api.woodn.fr',
  credentials: 'include',
});

export const ApiProvider = ({ children }: { children?: React.ReactNode }) => {
  return children;
};
