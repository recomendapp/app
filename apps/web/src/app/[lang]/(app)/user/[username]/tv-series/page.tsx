import { notFound } from 'next/navigation';
import ProfileTvSeries from './_components/ProfileTvSeries';
import { getProfile } from '@/api/server/users';

export default async function TvSeries(
  props: {
	params: Promise<{ username: string }>;
  }
) {
  const params = await props.params;
  const profile = await getProfile(params.username);
  if (!profile) return notFound();
  return <ProfileTvSeries userId={profile.id} />;
}
