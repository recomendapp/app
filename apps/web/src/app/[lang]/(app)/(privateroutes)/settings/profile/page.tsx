'use client';
import { Separator } from '@libs/ui/components/separator';
import { ProfileForm } from '@/app/[lang]/(app)/(privateroutes)/settings/profile/_components/profileForm';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/context/auth-context';
import { ProfilePinned } from '../../../user/[username]/(profile)/_components/ProfilePinned';
import { useQuery } from '@tanstack/react-query';
import { userPinnedOptions } from '@libs/query-client/src';
import { Card } from '@libs/ui/components/card';

export default function SettingsProfilePage() {
  const { user } = useAuth();
  const t = useTranslations();
  const { data: pinnedItems } = useQuery(userPinnedOptions({ userId: user?.id }));
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">{t('pages.settings.profile.label')}</h3>
        <p className="text-sm text-muted-foreground text-justify">
          {t('pages.settings.profile.description')}
        </p>
      </div>
      <Separator />
      <ProfileForm />
      {user && (
        <>
          <Separator />
          <div className="space-y-2">
            <h3 className="text-lg font-medium">
              {t('common.messages.pinned', { gender: 'male', count: 2 })}
            </h3>
            {pinnedItems && pinnedItems?.length > 0 ? (
              <ProfilePinned profileId={user?.id} />
            ) : (
              <Card>
                <p className="text-sm text-muted-foreground text-center">
                  {t('common.messages.no_pinned', { gender: 'male', count: 2 })}
                </p>
              </Card>
            )}
          </div>
        </>
      )}
    </div>
  );
}
