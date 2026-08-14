'use client';

import { useAuthPromptGate } from '@/hooks/use-auth-prompt-gate';

export const AuthPromptGate = () => {
  useAuthPromptGate();
  return null;
};
