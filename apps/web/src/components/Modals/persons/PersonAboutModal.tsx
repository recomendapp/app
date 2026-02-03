'use client'

import { CakeIcon, MapPin, PersonStandingIcon } from "lucide-react";
import { Modal, ModalBody, ModalHeader, ModalTitle, ModalType } from "../Modal";
import { useModal } from "@/context/modal-context";
import { TooltipBox } from "@/components/Box/TooltipBox";
import { useFormatter, useTranslations } from "next-intl";
import { TbGrave } from "react-icons/tb";
import { MediaPerson } from "@recomendapp/types";
import { upperFirst } from "lodash";

interface PersonAboutModalProps extends ModalType {
	person?: MediaPerson;
}

export const PersonAboutModal = ({
	person,
	...props
  } : PersonAboutModalProps) => {
	const t = useTranslations();
	const { closeModal } = useModal();
	const format = useFormatter();
	if (!person) return null;
	return (
		<Modal
			open={props.open}
			onOpenChange={(open) => !open && closeModal(props.id)}
			className=""
		>
			<ModalHeader>
				<ModalTitle>{upperFirst(t('common.messages.about_title', { title: person.name! }))}</ModalTitle>
			</ModalHeader>
			<ModalBody className="flex flex-col gap-4">
				{/* Détails */}
				<div className="">
					<h3 className=" text-lg font-semibold">{upperFirst(t('common.messages.detail', { count: 2 }))}</h3>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-muted-foreground">
						{person?.gender && (
							<div className="flex items-center gap-2">
							<TooltipBox tooltip={upperFirst(t('common.messages.genre', { count: 1 }))}>
								<div>
								<PersonStandingIcon size={20} />
								<span className="sr-only">{upperFirst(t('common.messages.genre', { count: 1 }))}</span>
								</div>
							</TooltipBox>
							<span className="">
								{person.gender === 3 ? upperFirst(t('common.messages.non_binary', { count: 1 }))
								: person.gender === 2 ? upperFirst(t('common.messages.male', { count: 1 }))
								: person.gender === 1 ? upperFirst(t('common.messages.female', { count: 1 }))
								: upperFirst(t('common.messages.unspecified', { count: 1, gender: 'male' }))}
							</span>
							</div>
						)}
						{person?.birthday && (
							<div className="flex items-center gap-2">
							<TooltipBox tooltip={upperFirst(t('common.messages.date_of_birth', { count: 1 }))}>
								<div className="shrink-0">
									<CakeIcon size={20}/>
									<span className="sr-only">{upperFirst(t('common.messages.date_of_birth', { count: 1 }))}</span>
								</div>
							</TooltipBox>
							<span className="">
								{format.dateTime(
								new Date(person?.birthday),
								{ dateStyle: 'long' }
								)}
								{!person.deathday && ` (${t('common.messages.age_years', { count: new Date().getFullYear() - new Date(person?.birthday).getFullYear() })})`}
							</span>
							</div>
						)}
						{person?.deathday && (
							<div className="flex items-center gap-2">
							<TooltipBox tooltip={upperFirst(t('common.messages.date_of_death', { count: 1 }))}>
								<div className="shrink-0">
									<TbGrave size={20}/>
									<span className="sr-only">{upperFirst(t('common.messages.date_of_death', { count: 1 }))}</span>
								</div>
							</TooltipBox>
							<span className="">
								{format.dateTime(
								new Date(person?.deathday),
								{ dateStyle: 'long' }
								)}
								{person.birthday && ` (${t('common.messages.age_years', { count: new Date(person?.deathday).getFullYear() - new Date(person?.birthday).getFullYear() })})`}
							</span>
							</div>
						)}
						{person?.place_of_birth && (
							<div className="flex items-center gap-2">
							<TooltipBox tooltip={upperFirst(t('common.messages.place_of_birth', { count: 1 }))}>
								<div className="shrink-0">
									<MapPin size={20}/>
									<span className="sr-only">{upperFirst(t('common.messages.place_of_birth', { count: 1 }))}</span>
								</div>
							</TooltipBox>
							<span className="">
								{person?.place_of_birth}
							</span>
							</div>
						)}
						{!person?.gender && !person?.birthday && !person?.deathday && !person?.place_of_birth && upperFirst(t('common.messages.no_information_available'))}
					</div>
				</div>
				{/* BIOGRAPHY */}
				<div className=''>
				<h3 className=" text-lg font-semibold">{upperFirst(t('common.messages.biography', { count: 1 }))}</h3>
				<p className="text-justify text-muted-foreground">
					{person?.biography?.length ? person?.biography : upperFirst(t('common.messages.no_biography_available'))}
				</p>
				</div>
			</ModalBody>
		</Modal>
	);
};