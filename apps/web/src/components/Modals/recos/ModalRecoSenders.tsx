'use client'

import { ScrollArea } from "@/components/ui/scroll-area";
import { Modal, ModalBody, ModalDescription, ModalHeader, ModalTitle, ModalType } from "../Modal";
import { useModal } from "@/context/modal-context";
import { CardUser } from "@/components/Card/CardUser";
import { useTranslations } from "next-intl";
import { upperFirst } from "lodash";
import { RecoSender } from "@packages/api-js";

interface ModalRecosSendersProps extends ModalType {
	senders: RecoSender[];
}

export const ModalRecoSenders = ({
	senders,
	...props
  } : ModalRecosSendersProps) => {
	const t = useTranslations();
	const { closeModal } = useModal();
	return (
		<Modal
			open={props.open}
			onOpenChange={(open) => !open && closeModal(props.id)}
		>
			<ModalHeader>
				<ModalTitle>{upperFirst(t('common.messages.reco', { count: senders.length }))}</ModalTitle>
				<ModalDescription className="sr-only" />
			</ModalHeader>
			<ModalBody>
				<ScrollArea className="h-[40vh]">
					<div className="space-y-2">
						{senders?.map((item) => (
							<div
							key={item.user.id}
							className="bg-muted rounded-xl p-2 space-y-2"
							>
								<CardUser user={item.user} variant="inline" />
								{item.comment && (
									<div className="pl-8">
										<div className="bg-background rounded-md p-2">
											{item.comment}
										</div>
									</div>
								)}
							</div>
						))}
					</div>
				</ScrollArea>
			</ModalBody>
		</Modal>
	);
};