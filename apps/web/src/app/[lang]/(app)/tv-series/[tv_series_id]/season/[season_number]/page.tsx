import { getIdFromSlug } from "@/utils/get-id-from-slug";
import { siteConfig } from "@/config/site";
import { truncate, upperFirst } from "lodash";
import { getTranslations } from "next-intl/server";
import { Metadata } from "next";
import { TVSeason, WithContext } from "schema-dts";
import { generateAlternates } from "@/lib/i18n/routing";
import { SupportedLocale } from "@libs/i18n";
import { getTvSeason } from "@/api/server/medias";
import { getTmdbImage } from "@/lib/tmdb/getTmdbImage";
import { TvSeasonHeader } from "./_components/TvSeasonHeader";
import { TvSeasonDetails } from "./_components/TvSeasonDetails";
import { redirect } from "@/lib/i18n/navigation";

export async function generateMetadata(
  props: {
    params: Promise<{
      lang: SupportedLocale;
      tv_series_id: string;
      season_number: number;
    }>;
  }
): Promise<Metadata> {
  const { lang, tv_series_id, season_number } = await props.params;
  const t = await getTranslations({ locale: lang });
  const { id: serieId } = getIdFromSlug(tv_series_id);
  const { data: tvSeason, error } = await getTvSeason(lang, serieId, Number(season_number));
  if (error || !tvSeason) {
    return { title: upperFirst(t('common.messages.tv_season_not_found')) };
  }
  return {
    title: t('pages.tv_series.seasons.season.metadata.title', { title: tvSeason.tvSeries.name!, number: tvSeason.seasonNumber }),
    description: truncate(
      t('pages.tv_series.seasons.season.metadata.description', {
        title: tvSeason.tvSeries.name!,
        number: tvSeason.seasonNumber,
      }),
      { length: siteConfig.seo.description.limit }
    ),
    alternates: generateAlternates(lang, `/tv-series/${tv_series_id}/season/${season_number}`),
    openGraph: {
      siteName: siteConfig.name,
      title: `${t('pages.tv_series.seasons.season.metadata.title', { title: tvSeason.tvSeries.name!, number: tvSeason.seasonNumber })} • ${siteConfig.name}`,
      description: truncate(
        t('pages.tv_series.seasons.season.metadata.description', {
          title: tvSeason.tvSeries.name!,
          number: tvSeason.seasonNumber,
        }),
        { length: siteConfig.seo.description.limit }
      ),
      url: `${siteConfig.url}/${lang}/tv-series/${tv_series_id}/season/${season_number}`,
      images: tvSeason.posterPath ? [
        { url: getTmdbImage({ path: tvSeason.posterPath, size: 'w500' }) }
      ] : undefined,
      type: 'video.episode',
      locale: lang,
    },
  };
}

export default async function TvSeriesSeason(
  props: {
      params: Promise<{
        lang: SupportedLocale;
        tv_series_id: string;
        season_number: number;
      }>;
  }
) {
  const { lang, tv_series_id, season_number } = await props.params;
  const { id: tvSeriesId } = getIdFromSlug(tv_series_id);
  const seasonNumber = Number(season_number);
  if (isNaN(seasonNumber)) {
    return redirect({
      href: `/tv-series/${tv_series_id}`,
      locale: lang,
    });
  }
  const { data: tvSeason, error } = await getTvSeason(lang, tvSeriesId, seasonNumber);
  if (error || !tvSeason) {
    return redirect({
      href: `/tv-series/${tv_series_id}`,
      locale: lang,
    });
  }
  const jsonLd: WithContext<TVSeason> = {
    '@context': 'https://schema.org',
    '@type': 'TVSeason',
    name: tvSeason.name ?? undefined,
    image: tvSeason.posterPath ? getTmdbImage({ path: tvSeason.posterPath, size: 'w500' }) : undefined,
    seasonNumber: tvSeason.seasonNumber ?? undefined,
    aggregateRating: tvSeason.voteAverage ? {
      '@type': 'AggregateRating',
      ratingValue: tvSeason.voteAverage,
      ratingCount: tvSeason.voteCount ?? 0,
      bestRating: 10,
      worstRating: 1,
    } : undefined,
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <TvSeasonHeader season={tvSeason} />
      {tvSeason && (
        <div className="flex flex-col items-center px-4 pb-4">
          <TvSeasonDetails season={tvSeason} />
        </div>
      )}
    </>
  );
};
