import { notFound } from 'next/navigation';
import { PersonHeader } from './_components/PersonHeader';
import PersonNavbar from './_components/PersonNavbar';
import { getIdFromSlug } from '@/utils/get-id-from-slug';
import { Database } from '@recomendapp/types';
import { getPerson } from '@/api/server/medias';

export default async function PersonLayout(
  props: {
    children: React.ReactNode;
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