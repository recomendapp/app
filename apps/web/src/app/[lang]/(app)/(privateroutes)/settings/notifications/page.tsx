'use client';

import { Separator } from "@/components/ui/separator";
import { useTranslations } from "next-intl";
import { NotificationsForm } from "./_components/notificationsForm";

export default function SettingsNotificationsPage() {
  const t = useTranslations('pages.settings');
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">{t('notifications.label')}</h3>
        <p className="text-sm text-muted-foreground text-justify">
          {t('notifications.description')}
        </p>
      </div>
      <Separator />
      <NotificationsForm />
    </div>
  );
}