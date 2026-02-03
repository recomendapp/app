import { getTranslations } from 'next-intl/server';
import { Search } from './_components/SearchResults';
import { upperFirst } from 'lodash';

export async function generateMetadata(
  props: {
    searchParams?: Promise<{
      q: string | undefined;
    }>;
  }
) {
  const t = await getTranslations();
  const searchParams = await props.searchParams;
  if (!searchParams?.q) {
    return {
      title: upperFirst(t('common.messages.search')),
    };
  }
  return {
    title: `${searchParams.q} - ${upperFirst(t('common.messages.search'))}`,
  };
}

export default function SearchPage() {
  return <Search />;
}
