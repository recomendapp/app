'use client'

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useModal } from "@/context/modal-context";
import { Modal, ModalBody, ModalFooter, ModalHeader, ModalTitle, ModalType } from "../Modal";
import { useTranslations } from "next-intl";
import { upperFirst } from "lodash";
import { PlaylistItemWithMedia } from "@libs/api-js";
import { usePlaylist } from "@/hooks/use-playlist";
import { usePlaylistItemUpdateMutation } from "@libs/query-client";

interface ModalPlaylistComment extends ModalType {
	data: PlaylistItemWithMedia;
}

const ModalPlaylistComment = ({
	data,
	...props
} : ModalPlaylistComment) => {
	const t = useTranslations();
	const { closeModal } = useModal();
	const { canEdit } = usePlaylist({
		playlistId: data.playlistId,
	})

	// Mutations
	const { mutateAsync: updateItem, isPending } = usePlaylistItemUpdateMutation();

	// States
	const [comment, setComment] = useState(data?.comment ?? '');
	useEffect(() => {
		setComment(data?.comment ?? '');
	}, [data?.comment]);

	const onSubmit = useCallback(async () => {  
	  if (comment == data.comment) {
		closeModal(props.id);
		return;
	  }
	  await updateItem({
		path: {
			playlist_id: data.playlistId,
			item_id: data.id,
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
	  })
	}, [comment, updateItem, data, t, closeModal, props.id])
  
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
				readOnly={!canEdit}
				/>
			</ModalBody>
			{canEdit &&
				<ModalFooter>
					<Button type="submit" onClick={onSubmit}>{upperFirst(t('common.messages.save'))}</Button>
				</ModalFooter>
			}
		</Modal>
	);
};

export default ModalPlaylistComment;