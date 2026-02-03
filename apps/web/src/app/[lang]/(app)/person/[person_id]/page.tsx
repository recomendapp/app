import { notFound } from 'next/navigation';
import { getIdFromSlug } from '@/utils/get-id-from-slug';
import { getTranslations } from 'next-intl/server';
import { truncate, upperFirst } from 'lodash';
import { Metadata } from 'next';
import { siteConfig } from '@/config/site';
import { generateAlternates } from '@/lib/i18n/routing';
import { SupportedLocale } from '@/translations/locales';
import { getPerson } from '@/api/server/medias';
import { getTmdbImage } from '@/lib/tmdb/getTmdbImage';
import { Database } from '@recomendapp/types';
import { WidgetPersonFilms } from './_components/WidgetPersonFilms';
import { WidgetPersonTvSeries } from './_components/WidgetPersonTvSeries';

export async function generateMetadata(
  props: {
    params: Promise<{
      lang: string;
      person_id: string;
    }>;
  }
): Promise<Metadata> {
  const params = await props.params;
  const t = await getTranslations({ locale: params.lang as SupportedLocale });
  const { id } = getIdFromSlug(params.person_id);
  try {
    const person = await getPerson(params.lang, id);
    return {
      title: t('pages.person.metadata.title', { name: person.name!, department: person.known_for_department! }),
      description: person.biography ? truncate(person.biography, { length: siteConfig.seo.description.limit }) : undefined,
      alternates: generateAlternates(params.lang, `/person/${person.slug}`),
      openGraph: {
        siteName: siteConfig.name,
        title: `${person.name} • ${person.known_for_department} • ${siteConfig.name}`,
        description: person.biography ? truncate(person.biography, { length: siteConfig.seo.description.limit }) : undefined,
        url: `${siteConfig.url}/${params.lang}/person/${person.slug}`,
        images: person.profile_path ? [
          { url: getTmdbImage({ path: person.profile_path, size: 'w500'}) },
        ] : undefined,
        type: 'profile',
        locale: params.lang,
      }
    };
  } catch {
    return { title: upperFirst(t('common.messages.person_not_found')) };
  }
}

export default async function Person(
  props: {
    params: Promise<{
      lang: string;
      person_id: string;
    }>;
  }
) {
  const params = await props.params;
  const { id } = getIdFromSlug(params.person_id);
  let person: Database['public']['Views']['media_person']['Row'];
  try {
    person = await getPerson(params.lang, id);
  } catch {
    return notFound();
  }
  return (
    <div className='flex flex-col items-center'>
      <div className='max-w-7xl w-full'>
        <WidgetPersonFilms person={person} />
        <WidgetPersonTvSeries person={person} />
      </div>
    </div>
  );
}
