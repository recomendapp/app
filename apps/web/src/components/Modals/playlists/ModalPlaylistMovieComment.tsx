'use client'

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useModal } from "@/context/modal-context";
import { PlaylistItemMovie } from "@recomendapp/types";
import { Modal, ModalBody, ModalFooter, ModalHeader, ModalTitle, ModalType } from "../Modal";
import { useTranslations } from "next-intl";
import { upperFirst } from "lodash";
import { useAuth } from "@/context/auth-context";
import { usePlaylistMovieUpdateMutation } from "@/api/client/mutations/playlistMutations";
import { useQuery } from "@tanstack/react-query";
import { usePlaylistIsAllowedToEditOptions } from "@/api/client/options/playlistOptions";

interface ModalPlaylistMovieCommentProps extends ModalType {
	playlistItem: PlaylistItemMovie;
}

const ModalPlaylistMovieComment = ({
	playlistItem,
	...props
} : ModalPlaylistMovieCommentProps) => {
	const t = useTranslations();
	const { session } = useAuth();
	const { closeModal } = useModal();
	const { data: isAllowedToEdit } = useQuery(usePlaylistIsAllowedToEditOptions({
		playlistId: playlistItem.playlist_id,
		userId: session?.user.id
	}));

	// Mutations
	const updatePlaylistItem = usePlaylistMovieUpdateMutation();

	// States
	const [comment, setComment] = useState<string>(playlistItem?.comment ?? '');
	useEffect(() => {
		setComment(playlistItem?.comment ?? '');
	}, [playlistItem?.comment]);

	async function onSubmit() {  
	  if (comment == playlistItem?.comment) {
		closeModal(props.id);
		return;
	  }
	  await updatePlaylistItem.mutateAsync({
		itemId: playlistItem.id,
		comment: comment,
	  }, {
		onSuccess: () => {
			toast.success(upperFirst(t('common.messages.saved', { gender: 'male', count: 1 })));
			closeModal(props.id);
		},
		onError: () => {
			toast.error(upperFirst(t('common.messages.an_error_occurred')));
		}
	  })
	}
  
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
				disabled={updatePlaylistItem.isPending}
				className="col-span-3 resize-none h-48"
				placeholder={upperFirst(t('common.messages.add_comment', { count: 1 }))}
				readOnly={!isAllowedToEdit}
				/>
			</ModalBody>
			{isAllowedToEdit &&
				<ModalFooter>
					<Button type="submit" onClick={onSubmit}>{upperFirst(t('common.messages.save'))}</Button>
				</ModalFooter>
			}
		</Modal>
	);
};

export default ModalPlaylistMovieComment;