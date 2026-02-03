import { getTranslations } from 'next-intl/server';
import { title } from '@/utils/custom-lodash';
import { Metadata } from 'next';
import { SearchCrewCast } from './_components/SearchCrewCast';

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
      title: title(t('common.messages.cast_and_crew')),
    };
  }
  return {
    title: `${searchParams.q} - ${title(t('common.messages.cast_and_crew'))}`,
  };
}

export default function SearchCrewCastPage() {
  return <SearchCrewCast />;
}