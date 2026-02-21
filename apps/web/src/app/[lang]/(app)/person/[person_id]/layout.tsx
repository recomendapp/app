import { notFound } from 'next/navigation';
import { PersonHeader } from './_components/PersonHeader';
import PersonNavbar from './_components/PersonNavbar';
import { getIdFromSlug } from '@/utils/get-id-from-slug';
import { getPerson } from '@/api/server/medias';
import { SupportedLocale } from '@libs/i18n';
import { redirect } from '@/lib/i18n/navigation';

export default async function PersonLayout(
  props: {
    children: React.ReactNode;
    params: Promise<{
      lang: SupportedLocale;
      person_id: string;
    }>;
  }
) {
  const { lang, person_id } = await props.params;
  const { id } = getIdFromSlug(person_id);
  const person = await getPerson(lang, id);
  if (person.slug !== person_id) {
    redirect({ href: `/person/${person.slug}`, locale: lang });
  }
  return (
    <>
      <PersonHeader person={person} />
      <div className="px-4 pb-4 flex flex-col items-center">
        <div className='max-w-7xl w-full'>
          <PersonNavbar slug={person.slug || person.id.toString()} />
          {props.children}
        </div>
      </div>
    </>
  );
}