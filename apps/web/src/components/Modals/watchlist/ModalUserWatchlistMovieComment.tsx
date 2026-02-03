'use client'

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useModal } from "@/context/modal-context";
import { UserWatchlistMovie } from "@recomendapp/types";
import { Modal, ModalBody, ModalFooter, ModalHeader, ModalTitle, ModalType } from "../Modal";
import { useTranslations } from "next-intl";
import { upperFirst } from "lodash";
import { useUserWatchlistMovieUpdateMutation } from "@/api/client/mutations/userMutations";

interface ModalUserWatchlistMovieCommentProps extends ModalType {
	watchlistItem: UserWatchlistMovie;
}

const ModalUserWatchlistMovieComment = ({
	watchlistItem,
	...props
} : ModalUserWatchlistMovieCommentProps) => {
	const { closeModal } = useModal();
	const t = useTranslations();
	const [comment, setComment] = useState<string>(watchlistItem?.comment ?? '');
	const { mutateAsync: updateWatchlistMovie, isPending } = useUserWatchlistMovieUpdateMutation();

	useEffect(() => {
		setComment(watchlistItem?.comment ?? '');
	}, [watchlistItem?.comment]);

	const handleSubmit = useCallback(async () => {  
		if (comment == watchlistItem?.comment) {
			closeModal(props.id);
			return;
		}
		if (!watchlistItem?.id) {
			toast.error(upperFirst(t('common.messages.an_error_occurred')));
			return;
		}
		await updateWatchlistMovie({
			watchlistId: watchlistItem?.id,
			comment: comment,
		}, {
			onSuccess: () => {
				toast.success(upperFirst(t('common.messages.saved', { gender: 'male', count: 1 })));
				closeModal(props.id);
			},
			onError: () => {
				toast.error(upperFirst(t('common.messages.an_error_occurred')));
			}
		});
	}, [comment, watchlistItem?.comment, watchlistItem?.id, updateWatchlistMovie, closeModal, props.id, t]);
  
	return (
		<Modal open={props.open} onOpenChange={(open) => !open && closeModal(props.id)}>
			<ModalHeader>
				<ModalTitle>{upperFirst(t('common.messages.comment', { count: 1 }))}</ModalTitle>
			</ModalHeader>
			<ModalBody>
				<Textarea
				id="name"
				value={comment}
				onChange={(e) =>
					setComment(e.target.value.replace(/\s+/g, ' ').trimStart())
				}
				maxLength={180}
				disabled={isPending}
				className="col-span-3 resize-none h-48"
				placeholder={upperFirst(t('common.messages.add_comment', { count: 1 }))}
				/>
			</ModalBody>
			<ModalFooter>
				<Button type="submit" onClick={handleSubmit}>{upperFirst(t('common.messages.save'))}</Button>
			</ModalFooter>
		</Modal>
	);
};

export {
	ModalUserWatchlistMovieComment
}