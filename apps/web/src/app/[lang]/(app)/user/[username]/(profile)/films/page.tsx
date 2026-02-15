import { notFound } from 'next/navigation';
import ProfileFilms from './_components/ProfileFilms';
import { getProfile } from '@/api/server/users';

export default async function Films(
  props: {
	params: Promise<{ username: string }>;
  }
) {
  const params = await props.params;
  const profile = await getProfile(params.username);
  if (!profile) return notFound();
  return <ProfileFilms userId={profile.id} />;
}
