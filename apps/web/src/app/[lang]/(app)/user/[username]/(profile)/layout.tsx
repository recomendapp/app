import { notFound } from 'next/navigation';
import { getProfile } from '@/api/server/users';
import { ProfileHeader } from './_components/ProfileHeader';
import { ProfileNavbar } from './_components/ProfileNavbar';
import { ProfilePrivateAccountCard } from './_components/ProfilePrivateAccountCard';

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
  const profile = await getProfile(params.username);
  if (!profile) return notFound();
  return (
    <>
      <ProfileHeader profile={profile} />
      {profile.isVisible ? (
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
