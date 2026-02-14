import { siteConfig } from '@/config/site';
import { getIdFromSlug } from '@/utils/get-id-from-slug';
import { Metadata } from 'next';
import { TvSeriesPlaylists } from './_components/TvSeriesPlaylists';
import { truncate, upperFirst } from 'lodash';
import { generateAlternates } from '@/lib/i18n/routing';
import { getTranslations } from 'next-intl/server';
import { SupportedLocale } from '@libs/i18n';
import { getTmdbImage } from '@/lib/tmdb/getTmdbImage';
import { notFound } from 'next/navigation';
import { getTvSeries } from '@/api/server/medias';

export async function generateMetadata(
  props: {
    params: Promise<{
      lang: SupportedLocale;
      tv_series_id: string;
    }>;
  }
): Promise<Metadata> {
  const { lang, tv_series_id} = await props.params;
  const t = await getTranslations({ locale: lang });
  const { id: serieId } = getIdFromSlug(tv_series_id);
  const { data: tvSeries, error } = await getTvSeries(lang, serieId);
  if (error || !tvSeries) {
    return { title: upperFirst(t('common.messages.tv_series_not_found')) };
  }
  return {
    title: t('pages.tv_series.playlists.metadata.title', { title: tvSeries.name!, year: new Date(String(tvSeries.firstAirDate)).getFullYear() }),
    description: truncate(
      t('pages.tv_series.playlists.metadata.description', {
        title: tvSeries.name!,
      }),
      { length: siteConfig.seo.description.limit }
    ),
    alternates: generateAlternates(lang, `/tv-series/${tvSeries.slug}/playlists`),
    openGraph: {
      siteName: siteConfig.name,
      title: `${t('pages.tv_series.playlists.metadata.title', { title: tvSeries.name!, year: new Date(String(tvSeries.firstAirDate)).getFullYear() })} • ${siteConfig.name}`,
      description: truncate(
        t('pages.tv_series.playlists.metadata.description', {
          title: tvSeries.name!,
        }),
        { length: siteConfig.seo.description.limit }
      ),
      url: `${siteConfig.url}/${lang}/tv-series/${tvSeries.slug}/playlists`,
      images: tvSeries.posterPath ? [
        { url: getTmdbImage({ path: tvSeries.posterPath, size: 'w500' }) }
      ] : undefined,
      type: 'video.tv_show',
      locale: lang,
    },
  };
}

export default async function Reviews(
  props: {
    params: Promise<{
      lang: SupportedLocale;
      tv_series_id: string;
    }>;
  }
) {
  const { lang, tv_series_id } = await props.params;
  const { id: seriesId } = getIdFromSlug(tv_series_id);
  const { data: tvSeries, error } = await getTvSeries(lang, seriesId);
  if (error || !tvSeries) {
    return notFound();
  }
  return <TvSeriesPlaylists tvSeriesId={seriesId} />;
}
