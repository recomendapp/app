import { notFound } from 'next/navigation';
import ProfilePlaylists from './_components/ProfilePlaylists';
import { getProfile } from '@/api/server/users';

export default async function Playlists(
  props: {
    params: Promise<{ username: string }>;
  }
) {
  const params = await props.params;
  const profile = await getProfile(params.username);
  if (!profile) return notFound();
  return <ProfilePlaylists userId={profile.id} />;
}
