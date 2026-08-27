'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@libs/ui/components/button';
import { useAuth } from '@/context/auth-context';

export function ConsentButton() {
  const t = useTranslations('pages.about.legal');
  const { session } = useAuth();
  if (session) return null;
  return (
    <Button
      onClick={() => {
        if (typeof window !== 'undefined' && (window as any).googlefc) {
          (window as any).googlefc.callbackQueue.push(
            (window as any).googlefc.showRevocationMessage,
          );
        } else {
          console.warn("Le module de consentement Google n'est pas encore chargé.");
        }
      }}
    >
      {t('manageCookies')}
    </Button>
  );
}
