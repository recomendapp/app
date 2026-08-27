'use client';

import { CakeIcon, MapPin, PersonStandingIcon } from 'lucide-react';
import { Modal, ModalBody, ModalHeader, ModalTitle } from '../Modal';
import { TooltipBox } from '@/components/Box/TooltipBox';
import { useFormatter, useTranslations } from 'next-intl';
import { TbGrave } from 'react-icons/tb';
import { upperFirst } from 'lodash';
import { useQuery } from '@tanstack/react-query';
import { personOptions } from '@libs/query-client';
import { useEffect } from 'react';
import { Icons } from '@/config/icons';

interface ModalPersonDetailsProps {
  personId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCloseEnd?: () => void;
}

export const ModalPersonDetails = ({
  personId,
  open,
  onOpenChange,
  onCloseEnd,
}: ModalPersonDetailsProps) => {
  const t = useTranslations();
  const format = useFormatter();

  // Deep links (e.g. "/person/123/details") only carry the id, so fetch the
  // person ourselves.
  const { data: person, isError } = useQuery(personOptions({ personId }));

  // A nonexistent person id (e.g. a stale/tampered deep link) surfaces as a
  // fetch error here — same treatment as an invalid route: close right away
  // instead of showing a broken modal.
  useEffect(() => {
    if (isError) {
      onOpenChange(false);
    }
  }, [isError, onOpenChange]);

  return (
    <Modal open={open} onOpenChange={onOpenChange} onCloseEnd={onCloseEnd} className="">
      <ModalHeader>
        <ModalTitle>
          {person
            ? upperFirst(t('common.messages.about_title', { title: person.name ?? '' }))
            : upperFirst(t('common.messages.detail', { count: 2 }))}
        </ModalTitle>
      </ModalHeader>
      {!person ? (
        <ModalBody className="flex items-center justify-center p-8">
          <Icons.loader />
        </ModalBody>
      ) : (
        <ModalBody className="flex flex-col gap-4">
          {/* Détails */}
          <div className="">
            <h3 className=" text-lg font-semibold">
              {upperFirst(t('common.messages.detail', { count: 2 }))}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-muted-foreground">
              {person?.gender && (
                <div className="flex items-center gap-2">
                  <TooltipBox tooltip={upperFirst(t('common.messages.genre', { count: 1 }))}>
                    <div>
                      <PersonStandingIcon size={20} />
                      <span className="sr-only">
                        {upperFirst(t('common.messages.genre', { count: 1 }))}
                      </span>
                    </div>
                  </TooltipBox>
                  <span className="">
                    {person.gender === 3
                      ? upperFirst(t('common.messages.non_binary', { count: 1 }))
                      : person.gender === 2
                        ? upperFirst(t('common.messages.male', { count: 1 }))
                        : person.gender === 1
                          ? upperFirst(t('common.messages.female', { count: 1 }))
                          : upperFirst(
                              t('common.messages.unspecified', { count: 1, gender: 'male' }),
                            )}
                  </span>
                </div>
              )}
              {person?.birthday && (
                <div className="flex items-center gap-2">
                  <TooltipBox
                    tooltip={upperFirst(t('common.messages.date_of_birth', { count: 1 }))}
                  >
                    <div className="shrink-0">
                      <CakeIcon size={20} />
                      <span className="sr-only">
                        {upperFirst(t('common.messages.date_of_birth', { count: 1 }))}
                      </span>
                    </div>
                  </TooltipBox>
                  <span className="">
                    {format.dateTime(new Date(person?.birthday), { dateStyle: 'long' })}
                    {!person.deathday &&
                      ` (${t('common.messages.age_years', { count: new Date().getFullYear() - new Date(person?.birthday).getFullYear() })})`}
                  </span>
                </div>
              )}
              {person?.deathday && (
                <div className="flex items-center gap-2">
                  <TooltipBox
                    tooltip={upperFirst(t('common.messages.date_of_death', { count: 1 }))}
                  >
                    <div className="shrink-0">
                      <TbGrave size={20} />
                      <span className="sr-only">
                        {upperFirst(t('common.messages.date_of_death', { count: 1 }))}
                      </span>
                    </div>
                  </TooltipBox>
                  <span className="">
                    {format.dateTime(new Date(person?.deathday), { dateStyle: 'long' })}
                    {person.birthday &&
                      ` (${t('common.messages.age_years', { count: new Date(person?.deathday).getFullYear() - new Date(person?.birthday).getFullYear() })})`}
                  </span>
                </div>
              )}
              {person?.placeOfBirth && (
                <div className="flex items-center gap-2">
                  <TooltipBox
                    tooltip={upperFirst(t('common.messages.place_of_birth', { count: 1 }))}
                  >
                    <div className="shrink-0">
                      <MapPin size={20} />
                      <span className="sr-only">
                        {upperFirst(t('common.messages.place_of_birth', { count: 1 }))}
                      </span>
                    </div>
                  </TooltipBox>
                  <span className="">{person?.placeOfBirth}</span>
                </div>
              )}
              {!person?.gender &&
                !person?.birthday &&
                !person?.deathday &&
                !person?.placeOfBirth &&
                upperFirst(t('common.messages.no_information_available'))}
            </div>
          </div>
          {/* BIOGRAPHY */}
          <div className="">
            <h3 className=" text-lg font-semibold">
              {upperFirst(t('common.messages.biography', { count: 1 }))}
            </h3>
            <p className="text-justify text-muted-foreground">
              {person?.biography?.length
                ? person?.biography
                : upperFirst(t('common.messages.no_biography_available'))}
            </p>
          </div>
        </ModalBody>
      )}
    </Modal>
  );
};
