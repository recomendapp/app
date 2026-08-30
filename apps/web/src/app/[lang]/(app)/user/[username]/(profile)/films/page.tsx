import { notFound } from 'next/navigation';
import ProfileFilms from './_components/ProfileFilms';
import { getProfile } from '@/api/server/users';

export default async function Films(props: { params: Promise<{ username: string }> }) {
  const params = await props.params;
  const { data: profile, error } = await getProfile(params.username);
  if (error || !profile) return notFound();
  return <ProfileFilms user={profile} />;
}
