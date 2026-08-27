'use client';
import { useModal } from '@/context/modal-context';
import { ModalPersonDetails } from '@/components/Modals/persons/ModalPersonDetails';
import { Person } from '@libs/api-js';
import { upperFirst } from 'lodash';
import { useTranslations } from 'next-intl';

export function PersonAbout({ person }: { person?: Person }) {
  const t = useTranslations();
  const { openModal } = useModal();
  if (!person) return null;
  return (
    <>
      <div
        className={`
          text-justify text-muted-foreground cursor-pointer
        `}
        onClick={() => openModal(ModalPersonDetails, { personId: person.id, person })}
      >
        <p className="line-clamp-2 select-text">
          {person?.biography?.length
            ? person.biography
            : upperFirst(t('common.messages.no_biography_available'))}
        </p>
        <p className="">Voir plus</p>
      </div>
    </>
  );
}
