'use client';
import { Separator } from '@/components/ui/separator';
import { ProfileForm } from '@/app/[lang]/(app)/(privateroutes)/settings/profile/_components/profileForm';
import { useTranslations } from 'next-intl';
// import { FavoriteMovies } from '@/components/Settings/UserSettingsProfile/FavoriteFilms/FavoriteMovies';

export default function SettingsProfilePage() {
  const t = useTranslations('pages.settings');
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">{t('profile.label')}</h3>
        <p className="text-sm text-muted-foreground text-justify">
          {t('profile.description')}
        </p>
      </div>
      <Separator />
      <ProfileForm />
      {/* <Separator /> */}
      {/* <FavoriteMovies /> */}
    </div>
  );
}
