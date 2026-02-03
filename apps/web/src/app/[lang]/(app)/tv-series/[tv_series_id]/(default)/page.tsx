import { notFound } from 'next/navigation';
import { getIdFromSlug } from '@/utils/get-id-from-slug';
import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { truncate, upperFirst } from 'lodash';
import { siteConfig } from '@/config/site';
import { generateAlternates } from '@/lib/i18n/routing';
import { TVSeries, WithContext } from 'schema-dts';
import { SupportedLocale } from '@/translations/locales';
import { getTvSeries } from '@/api/server/medias';
import { getTmdbImage } from '@/lib/tmdb/getTmdbImage';
import { Database } from '@recomendapp/types';
import { JustWatchWidget } from '@/components/JustWatch/JustWatchWidgetScript';
import { TvSeriesSeasons } from './_components/TvSeriesSeasons';
import { TvSeriesCasting } from './_components/TvSeriesCasting';

export async function generateMetadata(
  props: {
    params: Promise<{
      lang: string;
      tv_series_id: string;
    }>;
  }
): Promise<Metadata> {
  const params = await props.params;
  const t = await getTranslations({ locale: params.lang as SupportedLocale });
  const { id: tvSeriesId } = getIdFromSlug(params.tv_series_id);
  try {
    const tvSeries = await getTvSeries(params.lang, tvSeriesId);
    return {
      title: t('pages.tv_series.metadata.title', { title: tvSeries.name!, year: new Date(String(tvSeries.first_air_date)).getFullYear() }),
      description: truncate(
        tvSeries.created_by
          ? t('pages.tv_series.metadata.description', {
            title: tvSeries.name!,
            creators: new Intl.ListFormat(params.lang, { style: 'long', type: 'conjunction' }).format(tvSeries.created_by.map((creator) => creator.name ?? '')),
            year: new Date(String(tvSeries.first_air_date)).getFullYear(),
            overview: tvSeries.overview!,
          }) : t('pages.tv_series.metadata.description_no_creator', {
            title: tvSeries.name!,
            year: new Date(String(tvSeries.first_air_date)).getFullYear(),
            overview: tvSeries.overview!,
          }),
        { length: siteConfig.seo.description.limit }
      ),
      alternates: generateAlternates(params.lang, `/tv-series/${tvSeries.slug}`),
      openGraph: {
        siteName: siteConfig.name,
        title: `${t('pages.tv_series.metadata.title', { title: tvSeries.name!, year: new Date(String(tvSeries.first_air_date)).getFullYear() })} • ${siteConfig.name}`,
        description: truncate(
          tvSeries.created_by
            ? t('pages.tv_series.metadata.description', {
              title: tvSeries.name!,
              creators: new Intl.ListFormat(params.lang, { style: 'long', type: 'conjunction' }).format(tvSeries.created_by.map((creator) => creator.name ?? '')),
              year: new Date(String(tvSeries.first_air_date)).getFullYear(),
              overview: tvSeries.overview!,
            }) : t('pages.tv_series.metadata.description_no_creator', {
              title: tvSeries.name!,
              year: new Date(String(tvSeries.first_air_date)).getFullYear(),
              overview: tvSeries.overview!,
            }),
          { length: siteConfig.seo.description.limit }
        ),
        url: `${siteConfig.url}/${params.lang}/tv-series/${tvSeries.slug}`,
        images: tvSeries.poster_path ? [
          { url: getTmdbImage({ path: tvSeries.poster_path, size: 'w500' }) }
        ] : undefined,
        type: 'video.tv_show',
        locale: params.lang,
      },
    };
  } catch {
    return { title: upperFirst(t('common.messages.tv_series_not_found')) };
  }
}

export default async function TvSeriesPage(
  props: {
    params: Promise<{
      lang: string;
      tv_series_id: string;
    }>;
  }
) {
  const params = await props.params;
  const { id: tvSeriesId } = getIdFromSlug(params.tv_series_id);
  let tvSeries: Database['public']['Views']['media_tv_series']['Row'];
  try {
    tvSeries = await getTvSeries(params.lang, tvSeriesId);
  } catch {
    return notFound();
  }
  const jsonLd: WithContext<TVSeries> = {
    '@context': 'https://schema.org',
    '@type': 'TVSeries',
    name: tvSeries.name?? undefined,
    image: tvSeries.poster_path ? getTmdbImage({ path: tvSeries.poster_path, size: 'w500' }) : undefined,
    description: tvSeries.overview ?? undefined,
    datePublished: tvSeries.first_air_date ?? undefined,
    dateModified: new Date().toISOString(),
    director: tvSeries.created_by
      ?.map(director => ({
        '@type': 'Person',
        name: director.name ?? undefined,
        image: director.profile_path ? getTmdbImage({ path: director.profile_path, size: 'w500' }) : undefined,
      })),
    aggregateRating: tvSeries.vote_average ? {
      '@type': 'AggregateRating',
      ratingValue: tvSeries.vote_average ?? undefined,
      ratingCount: tvSeries.vote_count ?? 0,
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
            <span className="text-muted-foreground">{` ${tvSeries.number_of_seasons}`}</span>
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
