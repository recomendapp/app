'use client'
import { useModal } from "@/context/modal-context";
import { PersonAboutModal } from "@/components/Modals/persons/PersonAboutModal";
import { Person } from "@libs/api-js";
import { upperFirst } from "lodash";
import { useTranslations } from "next-intl";

export function PersonAbout({
  person,
}: {
  person?: Person;
}) {
  const { openModal } = useModal();
  const t = useTranslations();
  return (
    <>
      <div
        className={`
          text-justify text-muted-foreground cursor-pointer
        `}
        onClick={() => openModal(PersonAboutModal, { person })}
      >
        <p className="line-clamp-2 select-text">
          {person?.biography?.length ? person.biography : upperFirst(t('common.messages.no_biography_available'))}
        </p>
        <p className="">
          Voir plus
        </p>
      </div>
    </>
  );
}
