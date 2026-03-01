'use client'

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useModal } from "@/context/modal-context";
import { Modal, ModalBody, ModalFooter, ModalHeader, ModalTitle, ModalType } from "../Modal";
import { useTranslations } from "next-intl";
import { upperFirst } from "lodash";
import { Bookmark } from "@packages/api-js";
import { useUserBookmarkSetByMediaMutation } from "@libs/query-client";

interface ModalBookmarkCommentProps extends ModalType {
	data: Bookmark;
}

const ModalBookmarkComment = ({
	data,
	...props
} : ModalBookmarkCommentProps) => {
	const { closeModal } = useModal();
	const t = useTranslations();
	const [comment, setComment] = useState<string>(data?.comment ?? '');
	const { mutateAsync: updateBookmark, isPending } = useUserBookmarkSetByMediaMutation();

	useEffect(() => {
		setComment(data?.comment ?? '');
	}, [data?.comment]);

	const handleSubmit = useCallback(async () => {  
		if (comment == data?.comment) {
			closeModal(props.id);
			return;
		}
		if (!data?.id) {
			toast.error(upperFirst(t('common.messages.an_error_occurred')));
			return;
		}
		await updateBookmark({
			path: {
				media_id: data.mediaId,
				type: data.type,
			},
			body: {
				comment: comment,
			}
		}, {
			onSuccess: () => {
				toast.success(upperFirst(t('common.messages.saved', { gender: 'male', count: 1 })));
				closeModal(props.id);
			},
			onError: () => {
				toast.error(upperFirst(t('common.messages.an_error_occurred')));
			}
		});
	}, [comment, data?.comment, data?.id, updateBookmark, closeModal, props.id, t]);
  
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
	ModalBookmarkComment
}