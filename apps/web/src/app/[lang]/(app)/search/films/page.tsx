import { getTranslations } from 'next-intl/server';
import { upperFirst } from 'lodash';
import { Metadata } from 'next';
import { SearchFilms } from './_components/SearchFilms';

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
      title: upperFirst(t('common.messages.film', { count: 2 })),
    };
  }
  return {
    title: `${searchParams.q} - ${upperFirst(t('common.messages.film', { count: 2 }))}`,
  };
}

export default function SearchFilmsPage() {
  return <SearchFilms />;
}