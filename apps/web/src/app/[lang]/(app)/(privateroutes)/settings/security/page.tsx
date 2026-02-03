'use client';
import { Separator } from '@/components/ui/separator';
import { SecurityForm } from '@/app/[lang]/(app)/(privateroutes)/settings/security/_components/securityForm';
import { siteConfig } from '@/config/site';
import { useTranslations } from 'next-intl';

export default function SettingsSecurityPage() {
  const t = useTranslations('pages.settings');
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">{t('security.label')}</h3>
        <p className="text-sm text-muted-foreground text-justify">{t('security.description')}</p>
      </div>
      <Separator />
      <SecurityForm />
    </div>
  );
}
