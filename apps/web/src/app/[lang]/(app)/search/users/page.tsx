import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { upperFirst } from 'lodash';
import { SearchUsers } from './_components/SearchUsers';

export async function generateMetadata(
  props: {
    searchParams: Promise<{
      q: string | undefined;
    }>;
  }
): Promise<Metadata> {
  const t = await getTranslations();
  const searchParams = await props.searchParams;
  if (!searchParams?.q) {
    return {
      title: upperFirst(t('common.messages.user', { count: 2 })),
    };
  }
  return {
    title: `${searchParams.q} - ${upperFirst(t('common.messages.user', { count: 2 }))}`,
  };
}

export default async function SearchUsersPage() {
  return <SearchUsers />;
}
