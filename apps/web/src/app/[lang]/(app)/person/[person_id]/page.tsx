import { notFound } from 'next/navigation';
import { getIdFromSlug } from '@/utils/get-id-from-slug';
import { getTranslations } from 'next-intl/server';
import { truncate, upperFirst } from 'lodash';
import { Metadata } from 'next';
import { siteConfig } from '@/config/site';
import { generateAlternates } from '@/lib/i18n/routing';
import { SupportedLocale } from '@libs/i18n';
import { getPerson } from '@/api/server/medias';
import { getTmdbImage } from '@/lib/tmdb/getTmdbImage';
import { WidgetPersonFilms } from './_components/WidgetPersonFilms';
import { WidgetPersonTvSeries } from './_components/WidgetPersonTvSeries';

export async function generateMetadata(
  props: {
    params: Promise<{
      lang: SupportedLocale;
      person_id: string;
    }>;
  }
): Promise<Metadata> {
  const { lang, person_id } = await props.params;
  const t = await getTranslations({ locale: lang });
  const { id } = getIdFromSlug(person_id);
  const person = await getPerson(lang, id);
  return {
    title: t('pages.person.metadata.title', { name: person.name!, department: person.knownForDepartment! }),
    description: person.biography ? truncate(person.biography, { length: siteConfig.seo.description.limit }) : undefined,
    alternates: generateAlternates(lang, `/person/${person.slug}`),
    openGraph: {
      siteName: siteConfig.name,
      title: `${person.name} • ${person.knownForDepartment} • ${siteConfig.name}`,
      description: person.biography ? truncate(person.biography, { length: siteConfig.seo.description.limit }) : undefined,
      url: `${siteConfig.url}/${lang}/person/${person.slug}`,
      images: person.profilePath ? [
        { url: getTmdbImage({ path: person.profilePath, size: 'w500'}) },
      ] : undefined,
      type: 'profile',
      locale: lang,
    }
  };
}

export default async function Person(
  props: {
    params: Promise<{
      lang: SupportedLocale;
      person_id: string;
    }>;
  }
) {
  const { person_id } = await props.params;
  const { id } = getIdFromSlug(person_id);
  return (
    <div className='flex flex-col items-center'>
      <div className='max-w-7xl w-full'>
        <WidgetPersonFilms personId={id} personSlug={person_id} />
        <WidgetPersonTvSeries personId={id} personSlug={person_id} />
      </div>
    </div>
  );
}
