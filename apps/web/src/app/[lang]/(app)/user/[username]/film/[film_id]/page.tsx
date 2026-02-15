import { truncate, upperFirst } from 'lodash';
import { siteConfig } from '@/config/site';
import { Metadata } from 'next';
import { generateAlternates } from '@/lib/i18n/routing';
import { getTranslations } from 'next-intl/server';
import { SupportedLocale } from '@libs/i18n';
import { getProfile, getUserMovie } from '@/api/server/users';
import { getIdFromSlug } from '@/utils/get-id-from-slug';
import { notFound } from 'next/navigation';
import { UserMovieLog } from './_components/UserMovieLog';
import { Review, WithContext } from 'schema-dts';
import { getTmdbImage } from '@/lib/tmdb/getTmdbImage';
import { generateText } from '@tiptap/core';
import { EDITOR_EXTENSIONS } from '@/components/tiptap/TiptapExtensions';
import { generateJSON } from '@tiptap/html';

export async function generateMetadata(
  props: {
    params: Promise<{
      lang: SupportedLocale,
      username: string,
      film_id: string,
    }>;
  }
): Promise<Metadata> {
  const { lang, username, film_id } = await props.params;
  const { id: movieId } = getIdFromSlug(film_id);
  const t = await getTranslations({ locale: lang });
  const profile = await getProfile(username);
  if (!profile) return {
      title: upperFirst(t('common.messages.user_not_found')),
  };
  const log = await getUserMovie({
    userId: profile.id,
    movieId: movieId,
    locale: lang,
  });
  if (!log) {
    return {
      title: upperFirst(t('common.messages.log_not_found')),
    }
  }
  return {
    title: upperFirst(t('pages.user.metadata.title', { full_name: profile.name, username: profile.username })),
    description: truncate(upperFirst(t('pages.user.metadata.description', { username: profile.username!, app: siteConfig.name })), { length: siteConfig.seo.description.limit }),
    alternates: generateAlternates(lang, `/@${profile.username}`),
    openGraph: {
      siteName: siteConfig.name,
      title: `${upperFirst(t('pages.user.metadata.title', { full_name: profile.name, username: profile.username }))} • ${siteConfig.name}`,
      description: truncate(upperFirst(t('pages.user.metadata.description', { username: profile.username!, app: siteConfig.name })), { length: siteConfig.seo.description.limit }),
      url: `${siteConfig.url}/${lang}/@${profile.username}`,
      images: profile.avatar ? [
        { url: profile.avatar },
      ] : undefined,
      type: 'profile',
      locale: lang,
    },
  };
}

export default async function UserMovie(
  props: {
    params: Promise<{
      lang: SupportedLocale,
      username: string,
      film_id: string,
    }>;
  }
) {
  const { lang, username, film_id } = await props.params;
  const { id: movieId } = getIdFromSlug(film_id);
  const t = await getTranslations({ locale: lang });
  const profile = await getProfile(username);
  if (!profile) return {
      title: upperFirst(t('common.messages.user_not_found')),
  };
  const log = await getUserMovie({
    userId: profile.id,
    movieId: movieId,
    locale: lang,
  });
  if (!log) {
    return notFound();
  }
  const jsonLd: WithContext<Review> = {
    '@context': 'https://schema.org',
    '@type': 'Review',
    name: t('pages.review.metadata.title', { title: log.movie.title!, username: log.user.username }),
    description: log.review ? truncate(generateText(generateJSON(log.review.body, EDITOR_EXTENSIONS), EDITOR_EXTENSIONS), { length: siteConfig.seo.description.limit }) : undefined,
    datePublished: log.createdAt,
    dateModified: log.updatedAt,
    itemReviewed: {
      '@type': 'Movie',
      name: log.movie.title || undefined,
      image: log.movie.posterPath ? getTmdbImage({ path: log.movie.posterPath, size: 'w500' }) : undefined,
      aggregateRating: log.movie.voteAverage ? {
        '@type': 'AggregateRating',
        ratingValue: log.movie.voteAverage,
        ratingCount: log.movie.voteCount,
        bestRating: 10,
        worstRating: 1,
      } : undefined,
    },
    reviewRating: log.rating ? {
      '@type': 'Rating',
      ratingValue: log.rating || undefined,
      bestRating: 10,
      worstRating: 0.5,
    } : undefined,
  };
	return (
  <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    <UserMovieLog log={log} />
  </>
  );
};