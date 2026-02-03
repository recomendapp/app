'use client';
import { Separator } from '@/components/ui/separator';
import { AccountForm } from '@/app/[lang]/(app)/(privateroutes)/settings/account/_components/accountForm';
import { useTranslations } from 'next-intl';
import AccountDelete from './_components/accountDelete';

export default function SettingsAccountPage() {
  const t = useTranslations('pages.settings');
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">{t('account.label')}</h3>
        <p className="text-sm text-muted-foreground">
          {t('account.description')}
        </p>
      </div>
      <Separator />
      <AccountForm />
      <AccountDelete />
    </div>
  );
}
