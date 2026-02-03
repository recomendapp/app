import { notFound } from 'next/navigation';
import { truncate, upperFirst } from 'lodash';
import { siteConfig } from '@/config/site';
import { Metadata } from 'next';
import { generateAlternates } from '@/lib/i18n/routing';
import { getTranslations } from 'next-intl/server';
import { SupportedLocale } from '@/translations/locales';
import { ProfileFeed } from './_components/ProfileFeed';
import { getProfile } from '@/api/server/users';

export async function generateMetadata(
  props: {
    params: Promise<{ lang: string, username: string }>;
  }
): Promise<Metadata> {
  const params = await props.params;
  const t = await getTranslations({ locale: params.lang as SupportedLocale });
  const profile = await getProfile(params.username);
  if (!profile) return {
      title: upperFirst(t('common.messages.user_not_found')),
  };
  return {
    title: upperFirst(t('pages.user.metadata.title', { full_name: profile.full_name!, username: profile.username! })),
    description: truncate(upperFirst(t('pages.user.metadata.description', { username: profile.username!, app: siteConfig.name })), { length: siteConfig.seo.description.limit }),
    alternates: generateAlternates(params.lang, `/@${profile.username}`),
    openGraph: {
      siteName: siteConfig.name,
      title: `${upperFirst(t('pages.user.metadata.title', { full_name: profile.full_name!, username: profile.username! }))} • ${siteConfig.name}`,
      description: truncate(upperFirst(t('pages.user.metadata.description', { username: profile.username!, app: siteConfig.name })), { length: siteConfig.seo.description.limit }),
      url: `${siteConfig.url}/${params.lang}/@${profile.username}`,
      images: profile.avatar_url ? [
        { url: profile.avatar_url },
      ] : undefined,
      type: 'profile',
      locale: params.lang,
    },
  };
}

export default async function UserPage(
  props: {
    params: Promise<{ username: string }>;
  }
) {
  const params = await props.params;
  const profile = await getProfile(params.username);
  if (!profile) return notFound();
  return (
    <ProfileFeed profileId={profile.id} />
  );
}
