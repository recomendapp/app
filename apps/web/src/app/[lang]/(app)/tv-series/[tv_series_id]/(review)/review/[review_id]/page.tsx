import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { truncate, upperFirst } from 'lodash';
import { Metadata } from 'next';
import { TvSeriesReview } from './_components/TvSeriesReview';
import { Review, WithContext } from 'schema-dts';
import { siteConfig } from '@/config/site';
import { generateAlternates } from '@/lib/i18n/routing';
import { SupportedLocale } from '@/translations/locales';
import { generateJSON } from '@tiptap/html';
import { EDITOR_EXTENSIONS } from '@/components/tiptap/TiptapExtensions';
import { generateText } from '@tiptap/core';
import { getReviewTvSeriesSeo } from '@/api/server/reviews';
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
    const review = await getReviewTvSeriesSeo(params.review_id, params.lang as SupportedLocale);
    const tiptapJson = generateJSON(review.body, EDITOR_EXTENSIONS);
    const rawText = generateText(tiptapJson, EDITOR_EXTENSIONS);
    return {
      title: t('pages.review.metadata.title', { title: review.user_activities_tv_series.media_tv_series.name!, username: review.user_activities_tv_series.profile.username! }),
      description: truncate(rawText, { length: siteConfig.seo.description.limit }),
      alternates: generateAlternates(params.lang, `/tv-series/${review.user_activities_tv_series.media_tv_series.slug || review.user_activities_tv_series.media_tv_series.id}/review/${review.id}`),
      openGraph: {
        siteName: siteConfig.name,
        title: t('pages.review.metadata.title', { title: review.user_activities_tv_series.media_tv_series.name!, username: review.user_activities_tv_series.profile.username! }),
        description: truncate(rawText, { length: siteConfig.seo.description.limit }),
        url: `${siteConfig.url}/${params.lang}/tv-series/${review.user_activities_tv_series.media_tv_series.slug || review.user_activities_tv_series.media_tv_series.id}/review/${params.review_id}`,
        images: review.user_activities_tv_series.media_tv_series.poster_path ? [
          { url: getTmdbImage({ path: review.user_activities_tv_series.media_tv_series.poster_path, size: 'w500' }) },
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
  const review = await getReviewTvSeriesSeo(reviewId, params.lang as SupportedLocale);
  if (!review) return notFound();
  const tiptapJson = generateJSON(review.body, EDITOR_EXTENSIONS);
  const rawText = generateText(tiptapJson, EDITOR_EXTENSIONS);
  const t = await getTranslations({ locale: params.lang as SupportedLocale });

  const jsonLd: WithContext<Review> = {
    '@context': 'https://schema.org',
    '@type': 'Review',
    name: t('pages.review.metadata.title', { title: review.user_activities_tv_series.media_tv_series.name!, username: review.user_activities_tv_series.profile.username! }),
    description: truncate(rawText, { length: siteConfig.seo.description.limit }),
    datePublished: review.created_at,
    dateModified: review.updated_at,
    itemReviewed: review.user_activities_tv_series.media_tv_series ? {
      '@type': 'Movie',
      name: review.user_activities_tv_series.media_tv_series.name || undefined,
      image: review.user_activities_tv_series.media_tv_series.poster_path || undefined,
      description: review.user_activities_tv_series.media_tv_series.overview || undefined,
      aggregateRating: review.user_activities_tv_series.media_tv_series.vote_average ? {
        '@type': 'AggregateRating',
        ratingValue: review.user_activities_tv_series.media_tv_series.vote_average,
        ratingCount: review.user_activities_tv_series.media_tv_series.vote_count,
        bestRating: 10,
        worstRating: 1,
      } : undefined,
    } : undefined,
    reviewRating: {
      '@type': 'Rating',
      ratingValue: review.user_activities_tv_series.rating || undefined,
      bestRating: 10,
      worstRating: 1,
    }
  };
  return (
  <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    <TvSeriesReview reviewId={reviewId} />
  </>
  );
}
