import { SearchPlaylists } from './_components/SearchPlaylists';
import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { upperFirst } from 'lodash';

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
      title: upperFirst(t('common.messages.playlist', { count: 2 })),
    };
  }
  return {
    title: `${searchParams.q} - ${upperFirst(t('common.messages.playlist', { count: 2 }))}`,
  };
}

export default async function SearchPlaylistsPage() {
  return <SearchPlaylists />;
}
