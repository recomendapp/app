import { redirect } from "next/navigation";
import { getIdFromSlug } from "@/utils/get-id-from-slug";
import { siteConfig } from "@/config/site";
import { truncate, upperFirst } from "lodash";
import { getTranslations } from "next-intl/server";
import { Metadata } from "next";
import { TVSeason, WithContext } from "schema-dts";
import { generateAlternates } from "@/lib/i18n/routing";
import { SupportedLocale } from "@/translations/locales";
import { getTvSeason } from "@/api/server/medias";
import { getTmdbImage } from "@/lib/tmdb/getTmdbImage";
import { Database } from "@recomendapp/types";
import { TvSeasonHeader } from "./_components/TvSeasonHeader";
import { TvSeasonDetails } from "./_components/TvSeasonDetails";

export async function generateMetadata(
  props: {
    params: Promise<{
      lang: string;
      tv_series_id: string;
      season_number: number;
    }>;
  }
): Promise<Metadata> {
  const params = await props.params;
  const t = await getTranslations({ locale: params.lang as SupportedLocale });
  const { id: serieId } = getIdFromSlug(params.tv_series_id);
  try {
    const season = await getTvSeason(params.lang, serieId, Number(params.season_number));
    return {
      title: t('pages.tv_series.seasons.season.metadata.title', { title: season.media_tv_series?.name!, number: season.season_number! }),
      description: truncate(
        t('pages.tv_series.seasons.season.metadata.description', {
          title: season.media_tv_series?.name!,
          number: season.season_number!,
        }),
        { length: siteConfig.seo.description.limit }
      ),
      alternates: generateAlternates(params.lang, `/tv-series/${params.tv_series_id}/${params.season_number}`),
      openGraph: {
        siteName: siteConfig.name,
        title: `${t('pages.tv_series.seasons.season.metadata.title', { title: season.media_tv_series?.name!, number: season.season_number! })} • ${siteConfig.name}`,
        description: truncate(
          t('pages.tv_series.seasons.season.metadata.description', {
            title: season.media_tv_series?.name!,
            number: season.season_number!,
          }),
          { length: siteConfig.seo.description.limit }
        ),
        url: `${siteConfig.url}/${params.lang}/tv-series/${params.tv_series_id}/${params.season_number}`,
        images: season.poster_path ? [
          { url: getTmdbImage({ path: season.poster_path, size: 'w500' }) }
        ] : undefined,
        type: 'video.episode',
        locale: params.lang,
      },
    };
  } catch {
    return { title: upperFirst(t('common.messages.tv_season_not_found')) };
  }
}

export default async function TvSeriesSeason(
  props: {
      params: Promise<{
        lang: string;
        tv_series_id: string;
        season_number: number;
      }>;
  }
) {
  const params = await props.params;
  const { id: tvSeriesId } = getIdFromSlug(params.tv_series_id);
  const seasonNumber = Number(params.season_number);
  if (isNaN(seasonNumber)) {
    return redirect(`/${params.lang}/tv-series/${params.tv_series_id}`);
  }
  let season: Database['public']['Views']['media_tv_series_seasons']['Row'];
  try {
    season = await getTvSeason(params.lang, tvSeriesId, seasonNumber);
  } catch {
    return redirect(`/${params.lang}/tv-series/${params.tv_series_id}`);
  }
  const jsonLd: WithContext<TVSeason> = {
    '@context': 'https://schema.org',
    '@type': 'TVSeason',
    name: season.name ?? undefined,
    image: season.poster_path ? getTmdbImage({ path: season.poster_path, size: 'w500' }) : undefined,
    seasonNumber: season.season_number ?? undefined,
    aggregateRating: season.vote_average ? {
      '@type': 'AggregateRating',
      ratingValue: season.vote_average,
      ratingCount: season.vote_count ?? 0,
      bestRating: 10,
      worstRating: 1,
    } : undefined,
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <TvSeasonHeader season={season} />
      {season && (
        <div className="flex flex-col items-center px-4 pb-4">
          <TvSeasonDetails season={season} />
        </div>
      )}
    </>
  );
};
