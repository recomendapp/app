import { siteConfig } from '@/config/site';
import { getIdFromSlug } from '@/utils/get-id-from-slug';
import { Metadata } from 'next';
import { TvSeriesPlaylists } from './_components/TvSeriesPlaylists';
import { truncate, upperFirst } from 'lodash';
import { generateAlternates } from '@/lib/i18n/routing';
import { getTranslations } from 'next-intl/server';
import { SupportedLocale } from '@/translations/locales';
import { getTmdbImage } from '@/lib/tmdb/getTmdbImage';
import { Database } from '@recomendapp/types';
import { notFound } from 'next/navigation';
import { getTvSeries } from '@/api/server/medias';

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
  const { id: serieId } = getIdFromSlug(params.tv_series_id);
  try {
    const serie = await getTvSeries(params.lang, serieId);
    return {
      title: t('pages.tv_series.playlists.metadata.title', { title: serie.name!, year: new Date(String(serie.first_air_date)).getFullYear() }),
      description: truncate(
        t('pages.tv_series.playlists.metadata.description', {
          title: serie.name!,
        }),
        { length: siteConfig.seo.description.limit }
      ),
      alternates: generateAlternates(params.lang, `/tv-series/${serie.slug}/playlists`),
      openGraph: {
        siteName: siteConfig.name,
        title: `${t('pages.tv_series.playlists.metadata.title', { title: serie.name!, year: new Date(String(serie.first_air_date)).getFullYear() })} • ${siteConfig.name}`,
        description: truncate(
          t('pages.tv_series.playlists.metadata.description', {
            title: serie.name!,
          }),
          { length: siteConfig.seo.description.limit }
        ),
        url: `${siteConfig.url}/${params.lang}/tv-series/${serie.slug}/playlists`,
        images: serie.poster_path ? [
          { url: getTmdbImage({ path: serie.poster_path, size: 'w500' }) }
        ] : undefined,
        type: 'video.tv_show',
        locale: params.lang,
      },
    };
  } catch {
    return { title: upperFirst(t('common.messages.tv_series_not_found')) };
  }
}

export default async function Reviews(
  props: {
    params: Promise<{
      lang: string;
      tv_series_id: string;
    }>;
  }
) {
  const params = await props.params;
  const { id: seriesId } = getIdFromSlug(params.tv_series_id);
  let tvSeries: Database['public']['Views']['media_tv_series_full']['Row'];
  try {
    tvSeries = await getTvSeries(params.lang, seriesId);
  } catch {
    return notFound();
  }
  return <TvSeriesPlaylists tvSeriesId={seriesId} />;
}
