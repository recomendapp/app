import { upperFirst } from 'lodash';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata() {
  const t = await getTranslations();
  return {
    title: upperFirst(t('common.messages.person_not_found')),
  };
}

export default async function PersonNotFound() {
  const t = await getTranslations();
  return (
    <div
      className="bg-white w-full h-full flex justify-center items-center"
      style={{
        backgroundImage: `url('https://s.ltrbxd.com/static/img/errors/not-found-4.9da22e2b.jpg')`,
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="text-4xl font-bold">
      {upperFirst(t('common.messages.person_not_found'))}
      </div>
    </div>
  );
}
