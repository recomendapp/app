import { notFound } from 'next/navigation';
import { getIdFromSlug } from '@/utils/get-id-from-slug';
import { getTvSeries } from '@/api/server/medias';
import { TvSeriesHeader } from './_components/TvSeriesHeader';
import { TvSeriesNavbar } from './_components/TvSeriesNavbar';

export default async function Layout(
  props: {
      children: React.ReactNode;
      params: Promise<{
        lang: string;
        tv_series_id: string;
      }>;
  }
) {
  const params = await props.params;

  const {
      children
  } = props;
  const { id: tvSeriesId } = getIdFromSlug(params.tv_series_id);

  let tvSeries: Awaited<ReturnType<typeof getTvSeries>>;
  try {
    tvSeries = await getTvSeries(params.lang, tvSeriesId);
  } catch {
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
