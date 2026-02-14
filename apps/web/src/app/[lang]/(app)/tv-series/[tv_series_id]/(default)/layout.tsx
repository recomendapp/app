import { notFound } from 'next/navigation';
import { getTvSeries } from '@/api/server/medias';
import { TvSeriesHeader } from './_components/TvSeriesHeader';
import { TvSeriesNavbar } from './_components/TvSeriesNavbar';
import { SupportedLocale } from '@libs/i18n';
import { getIdFromSlug } from '@/utils/get-id-from-slug';

export default async function Layout(
  props: {
      children: React.ReactNode;
      params: Promise<{
        lang: SupportedLocale;
        tv_series_id: string;
      }>;
  }
) {
  const { tv_series_id, lang } = await props.params;

  const {
      children
  } = props;

  const { id: tvSeriesId } = getIdFromSlug(tv_series_id);
  const { data: tvSeries, error } = await getTvSeries(lang, tvSeriesId);
  if (error || !tvSeries) {
    return notFound();
  }

  return (
  <>
    <TvSeriesHeader tvSeries={tvSeries} />
    {tvSeries && (
    <div className="px-4 pb-4 flex flex-col items-center">
      <div className='max-w-7xl w-full'>
      <TvSeriesNavbar serieId={tvSeries.slug || tvSeries.id.toString()} />
      {children}
      </div>
    </div>
    )}
  </>
	);
};
