'use client'
import { useModal } from "@/context/modal-context";
import { PersonAboutModal } from "@/components/Modals/persons/PersonAboutModal";
import { Person } from "@packages/api-js";

export function PersonAbout({
  person,
}: {
  person?: Person;
}) {
  const { openModal } = useModal();
  return (
    <>
      <div
        className={`
          text-justify text-muted-foreground cursor-pointer
        `}
        onClick={() => openModal(PersonAboutModal, { person })}
      >
        <p className="line-clamp-2 select-text">
          {person?.biography?.length ? person.biography : 'No biography available'}
        </p>
        <p className="">
          Voir plus
        </p>
      </div>
    </>
  );
}
