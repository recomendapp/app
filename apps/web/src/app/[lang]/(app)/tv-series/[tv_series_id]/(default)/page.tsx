import { notFound } from 'next/navigation';
import { getIdFromSlug } from '@/utils/get-id-from-slug';
import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { truncate, upperFirst } from 'lodash';
import { siteConfig } from '@/config/site';
import { generateAlternates } from '@/lib/i18n/routing';
import { TVSeries, WithContext } from 'schema-dts';
import { SupportedLocale } from '@libs/i18n';
import { getTvSeries } from '@/api/server/medias';
import { getTmdbImage } from '@/lib/tmdb/getTmdbImage';
import { Database } from '@recomendapp/types';
import { JustWatchWidget } from '@/components/JustWatch/JustWatchWidgetScript';
import { TvSeriesSeasons } from './_components/TvSeriesSeasons';
import { TvSeriesCasting } from './_components/TvSeriesCasting';

export async function generateMetadata(
  props: {
    params: Promise<{
      lang: SupportedLocale;
      tv_series_id: string;
    }>;
  }
): Promise<Metadata> {
  const { lang, tv_series_id } = await props.params;
  const t = await getTranslations({ locale: lang });
  const { id: tvSeriesId } = getIdFromSlug(tv_series_id);
  const { data: tvSeries, error } = await getTvSeries(lang, tvSeriesId);
  if (error || !tvSeries) {
    return { title: upperFirst(t('common.messages.tv_series_not_found')) };
  }
  return {
    title: t('pages.tv_series.metadata.title', { title: tvSeries.name!, year: new Date(String(tvSeries.firstAirDate)).getFullYear() }),
    description: truncate(
      tvSeries.createdBy
        ? t('pages.tv_series.metadata.description', {
          title: tvSeries.name!,
          creators: new Intl.ListFormat(lang, { style: 'long', type: 'conjunction' }).format(tvSeries.createdBy.map((creator) => creator.name ?? '')),
          year: new Date(String(tvSeries.firstAirDate)).getFullYear(),
          overview: tvSeries.overview!,
        }) : t('pages.tv_series.metadata.description_no_creator', {
          title: tvSeries.name!,
          year: new Date(String(tvSeries.firstAirDate)).getFullYear(),
          overview: tvSeries.overview!,
        }),
      { length: siteConfig.seo.description.limit }
    ),
    alternates: generateAlternates(lang, `/tv-series/${tvSeries.slug}`),
    openGraph: {
      siteName: siteConfig.name,
      title: `${t('pages.tv_series.metadata.title', { title: tvSeries.name!, year: new Date(String(tvSeries.firstAirDate)).getFullYear() })} • ${siteConfig.name}`,
      description: truncate(
        tvSeries.createdBy
          ? t('pages.tv_series.metadata.description', {
            title: tvSeries.name!,
            creators: new Intl.ListFormat(lang, { style: 'long', type: 'conjunction' }).format(tvSeries.createdBy.map((creator) => creator.name ?? '')),
            year: new Date(String(tvSeries.firstAirDate)).getFullYear(),
            overview: tvSeries.overview!,
          }) : t('pages.tv_series.metadata.description_no_creator', {
            title: tvSeries.name!,
            year: new Date(String(tvSeries.firstAirDate)).getFullYear(),
            overview: tvSeries.overview!,
          }),
        { length: siteConfig.seo.description.limit }
      ),
      url: `${siteConfig.url}/${lang}/tv-series/${tvSeries.slug}`,
      images: tvSeries.posterPath ? [
        { url: getTmdbImage({ path: tvSeries.posterPath, size: 'w500' }) }
      ] : undefined,
      type: 'video.tv_show',
      locale: lang,
    },
  };
}

export default async function TvSeriesPage(
  props: {
    params: Promise<{
      lang: SupportedLocale;
      tv_series_id: string;
    }>;
  }
) {
  const { lang, tv_series_id } = await props.params;
  const { id: tvSeriesId } = getIdFromSlug(tv_series_id);
  const { data: tvSeries, error } = await getTvSeries(lang, tvSeriesId);
  if (error || !tvSeries) {
    return notFound();
  }
  const jsonLd: WithContext<TVSeries> = {
    '@context': 'https://schema.org',
    '@type': 'TVSeries',
    name: tvSeries.name?? undefined,
    image: tvSeries.posterPath ? getTmdbImage({ path: tvSeries.posterPath, size: 'w500' }) : undefined,
    description: tvSeries.overview ?? undefined,
    datePublished: tvSeries.firstAirDate ?? undefined,
    dateModified: new Date().toISOString(),
    director: tvSeries.createdBy
      ?.map(director => ({
        '@type': 'Person',
        name: director.name ?? undefined,
        image: director.profilePath ? getTmdbImage({ path: director.profilePath, size: 'w500' }) : undefined,
      })),
    aggregateRating: tvSeries.voteAverage ? {
      '@type': 'AggregateRating',
      ratingValue: tvSeries.voteAverage ?? undefined,
      ratingCount: tvSeries.voteCount ?? 0,
      bestRating: 10,
      worstRating: 1,
    } : undefined,
  };
  const t = await getTranslations();
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="@container/movie-details flex flex-col gap-4">
        <div className="flex flex-col @4xl/movie-details:grid @4xl/movie-details:grid-cols-3 gap-4">
          <div className="@4xl/movie-details:col-span-2">
            <h2 className="text-lg font-medium">{upperFirst(t('common.messages.overview'))}</h2>
            <div className="text-justify text-muted-foreground">
              {tvSeries.overview ?? upperFirst(t('common.messages.no_overview'))}
            </div>
          </div>
          <JustWatchWidget
            id={tvSeries.id}
            title={tvSeries.name ?? ''}
            type="show"
            className="@4xl/movie-details:col-span-1"
          />
        </div>
        <div>
          <h2 className="text-lg font-medium">
            {upperFirst(t('common.messages.tv_season', { count: 2 }))}
            <span className="text-muted-foreground">{` ${tvSeries.numberOfSeasons}`}</span>
          </h2>
          <TvSeriesSeasons tvSeries={tvSeries} />
        </div>
        <div>
          <h2 className="text-lg font-medium">{upperFirst(t('common.messages.cast'))}</h2>
          <TvSeriesCasting tvSeries={tvSeries} />
        </div>
      </div>
    </>
  );
}
