import { notFound } from 'next/navigation';
import { getProfile } from '@/api/server/users';
import { createServerClient } from '@/lib/supabase/server';
import { ProfileHeader } from './_components/ProfileHeader';
import { ProfileNavbar } from './_components/ProfileNavbar';
import { ProfilePrivateAccountCard } from './_components/ProfilePrivateAccountCard';
import { SupportedLocale } from '@/translations/locales';

export default async function Layout(
  props: {
    params: Promise<{
      lang: string,
      username: string
    }>;
    children: React.ReactNode;
  }
) {
  const params = await props.params;
  const supabase = await createServerClient({ locale: params.lang as SupportedLocale });
  const { data: { session } } = await supabase.auth.getSession();
  const profile = await getProfile(params.username);
  if (!profile) return notFound();
  return (
    <>
      <ProfileHeader profile={profile} session={session} />
      {profile.visible ? (
        <div className="flex flex-col items-center p-4 gap-2">
          <div className='max-w-7xl w-full space-y-4'>
            <ProfileNavbar username={profile.username} />
            {props.children}
          </div>
        </div>
      ) : (
        <ProfilePrivateAccountCard />
      )}
    </>
    )
}
