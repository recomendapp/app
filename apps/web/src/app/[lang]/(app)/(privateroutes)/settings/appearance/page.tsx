'use client';
import { Separator } from '@/components/ui/separator';
import { AccountForm } from '@/app/[lang]/(app)/(privateroutes)/settings/account/_components/accountForm';
import { useTranslations } from 'next-intl';
import { AppearanceForm } from './_components/appearanceForm';

export default function SettingsAppearancePage() {
  const t = useTranslations('pages.settings');
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">{t('appearance.label')}</h3>
        <p className="text-sm text-muted-foreground">
          {t('appearance.description')}
        </p>
      </div>
      <Separator />
      <AppearanceForm />
    </div>
  );
}
