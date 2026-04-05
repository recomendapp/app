import { useCallback, useMemo } from "react"
import { useQuery } from '@tanstack/react-query'
import { userPlaylistLikeOptions } from '../userOptions'
import { useUserPlaylistLikeMutation, useUserPlaylistUnlikeMutation } from '../userMutations'

export const useUserPlaylistLike = ({
	userId,
	playlistId,
}: {
	userId?: string,
	playlistId?: number
}) => {

	const { data: isLiked, isLoading } = useQuery(userPlaylistLikeOptions({
		userId: userId,
		playlistId,
	}));

	const { mutate: insertLike, isPending: isInserting } = useUserPlaylistLikeMutation({
		userId,
	});
	const { mutate: deleteLike, isPending: isDeleting } = useUserPlaylistUnlikeMutation({
		userId,
	});
	const isPending = useMemo(() => isInserting || isDeleting, [isInserting, isDeleting])

	const toggle = useCallback(() => {
		if (!userId || !playlistId) return
		if (isPending) return
		if (isLiked) {
			deleteLike({
				path: {
					playlist_id: playlistId,
				}
			})
		} else {
			insertLike({
				path: {
					playlist_id: playlistId,
				}
			})
		}
	}, [isLiked, isPending, insertLike, deleteLike, playlistId, userId])

	return {
		isLiked,
		isLoading,
		toggle,
		isPending,
	}
}