import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo } from "react"
import { userPlaylistSavedOptions } from '../userOptions';
import { useUserPlaylistSaveMutation, useUserPlaylistUnsaveMutation } from '../userMutations';

export const useUserPlaylistSaved = ({
	userId,
	playlistId
}: {
	userId?: string,
	playlistId?: number
}) => {
	const { data: isSaved, isLoading } = useQuery(userPlaylistSavedOptions({
		userId: userId,
		playlistId,
	}));

	const { mutate: insertSaved, isPending: isInserting } = useUserPlaylistSaveMutation({
		userId,
	});
	const { mutate: deleteSaved, isPending: isDeleting } = useUserPlaylistUnsaveMutation({
		userId,
	});
	const isPending = useMemo(() => isInserting || isDeleting, [isInserting, isDeleting])

	const toggle = useCallback(() => {
		if (!userId || !playlistId) return
		if (isPending) return
		if (isSaved) {
			deleteSaved({
				path: {
					playlist_id: playlistId,
				}
			})
		} else {
			insertSaved({
				path: {
					playlist_id: playlistId,
				}
			})
		}
	}, [isSaved, isPending, insertSaved, deleteSaved, playlistId, userId])

	return {
		isSaved,
		isLoading,
		toggle,
		isPending,
	}
}