'use client';
import { Link } from '@/lib/i18n/navigation';
import { getPersonDetailsHref } from '@/utils/hrefs/get-person-details-href';
import { Person } from '@libs/api-js';
import { upperFirst } from 'lodash';
import { useTranslations } from 'next-intl';

export function PersonAbout({ person }: { person?: Person }) {
  const t = useTranslations();
  if (!person) return null;
  return (
    <>
      <Link
        href={getPersonDetailsHref(person.slug ?? person.id)}
        className={`
          block text-justify text-muted-foreground cursor-pointer
        `}
      >
        <p className="line-clamp-2 select-text">
          {person?.biography?.length
            ? person.biography
            : upperFirst(t('common.messages.no_biography_available'))}
        </p>
        <p className="">Voir plus</p>
      </Link>
    </>
  );
}
