import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { truncate, upperFirst } from 'lodash';
import { Metadata } from 'next';
import { MovieReview } from './_components/MovieReview';
import { Review, WithContext } from 'schema-dts';
import { siteConfig } from '@/config/site';
import { generateAlternates } from '@/lib/i18n/routing';
import { SupportedLocale } from '@/translations/locales';
import { generateText } from '@tiptap/core';
import { generateJSON } from '@tiptap/html';
import { EDITOR_EXTENSIONS } from '@/components/tiptap/TiptapExtensions';
import { getReviewMovieSeo } from '@/api/server/reviews';
import { getTmdbImage } from '@/lib/tmdb/getTmdbImage';

export async function generateMetadata(
  props: {
    params: Promise<{
      lang: string;
      review_id: number;
    }>;
  }
): Promise<Metadata> {
  const params = await props.params;
  const t = await getTranslations({ locale: params.lang as SupportedLocale });
  try {
    const review = await getReviewMovieSeo(params.review_id, params.lang as SupportedLocale);
    const tiptapJson = generateJSON(review.body, EDITOR_EXTENSIONS);
    const rawText = generateText(tiptapJson, EDITOR_EXTENSIONS);
    return {
      title: t('pages.review.metadata.title', { title: review.user_activities_movie.media_movie.title!, username: review.user_activities_movie.profile.username! }),
      description: truncate(rawText, { length: siteConfig.seo.description.limit }),
      alternates: generateAlternates(params.lang, `/film/${review.user_activities_movie.media_movie.slug || review.user_activities_movie.media_movie.id}/review/${review.id}`),
      openGraph: {
        siteName: siteConfig.name,
        title: t('pages.review.metadata.title', { title: review.user_activities_movie.media_movie.title!, username: review.user_activities_movie.profile.username! }),
        description: truncate(rawText, { length: siteConfig.seo.description.limit }),
        url: `${siteConfig.url}/${params.lang}/film/${review.user_activities_movie.media_movie.slug || review.user_activities_movie.media_movie.id}/review/${params.review_id}`,
        images: review.user_activities_movie.media_movie.poster_path ? [
          { url: getTmdbImage({ path: review.user_activities_movie.media_movie.poster_path, size: 'w500' }) },
        ] : undefined,
        type: 'article',
        locale: params.lang,
      },
    };
  } catch {
    return { title: upperFirst(t('common.messages.review_not_found')) };
  }
}

export default async function ReviewPage(
  props: {
    params: Promise<{
      lang: string;
      review_id: string;
    }>;
  }
) {
  const params = await props.params;
  const reviewId = Number(params.review_id);
  const review = await getReviewMovieSeo(reviewId, params.lang as SupportedLocale);
  if (!review) return notFound();
  const tiptapJson = generateJSON(review.body, EDITOR_EXTENSIONS);
  const rawText = generateText(tiptapJson, EDITOR_EXTENSIONS);
  const t = await getTranslations({ locale: params.lang as SupportedLocale });

  const jsonLd: WithContext<Review> = {
    '@context': 'https://schema.org',
    '@type': 'Review',
    name: t('pages.review.metadata.title', { title: review.user_activities_movie.media_movie.title!, username: review.user_activities_movie.profile.username! }),
    description: truncate(rawText, { length: siteConfig.seo.description.limit }),
    datePublished: review.created_at,
    dateModified: review.updated_at,
    itemReviewed: review.user_activities_movie.media_movie ? {
      '@type': 'Movie',
      name: review.user_activities_movie.media_movie.title || undefined,
      image: review.user_activities_movie.media_movie.poster_path ? getTmdbImage({ path: review.user_activities_movie.media_movie.poster_path, size: 'w500' }) : undefined,
      description: review.user_activities_movie.media_movie.overview || undefined,
      aggregateRating: review.user_activities_movie.media_movie.vote_average ? {
        '@type': 'AggregateRating',
        ratingValue: review.user_activities_movie.media_movie.vote_average,
        ratingCount: review.user_activities_movie.media_movie.vote_count,
        bestRating: 10,
        worstRating: 1,
      } : undefined,
    } : undefined,
    reviewRating: {
      '@type': 'Rating',
      ratingValue: review.user_activities_movie.rating || undefined,
      bestRating: 10,
      worstRating: 1,
    }
  };
  return (
  <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    <MovieReview reviewId={reviewId} />
  </>
  );
}
