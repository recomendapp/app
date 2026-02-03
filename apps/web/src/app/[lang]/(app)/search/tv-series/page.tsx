import { getTranslations } from 'next-intl/server';
import { upperFirst } from 'lodash';
import { Metadata } from 'next';
import { SearchTvSeries } from './_components/SearchTvSeries';

export async function generateMetadata(
  props: {
    params: Promise<{
      lang: string;
    }>;
    searchParams: Promise<{
      q?: string;
    }>;
  }
): Promise<Metadata> {
  const searchParams = await props.searchParams;
  const t = await getTranslations();
  if (!searchParams?.q) {
    return {
      title: upperFirst(t('common.messages.tv_series', { count: 2 })),
    };
  }
  return {
    title: `${searchParams.q} - ${upperFirst(t('common.messages.tv_series', { count: 2 }))}`,
  };
}

export default function SearchTvSeriesPage() {
  return <SearchTvSeries />;
}