import { Database, PlaylistItemMovie } from "@recomendapp/types";
import { PlaylistMovieHeader } from "./PlaylistMovieHeader";
import { useEffect, useMemo, useState } from "react";
import PlaylistMovieTable from "./PlaylistMovieTable/PlaylistMovieTable";
import useDebounce from "@/hooks/use-debounce";
import { RealtimeChannel } from "@supabase/supabase-js";
import { useAuth } from "@/context/auth-context";
import { useSupabaseClient } from "@/context/supabase-context";
import { usePlaylistItemsMovieRealtimeMutation } from "@/api/client/mutations/playlistMutations";
import { useQuery } from "@tanstack/react-query";
import { usePlaylistIsAllowedToEditOptions, usePlaylistMovieItemsOptions } from "@/api/client/options/playlistOptions";

export const PlaylistMovie = ({
	playlist,
} : {
	playlist: Database['public']['Tables']['playlists']['Row'] & { user: Database['public']['Views']['profile']['Row'] };
}) => {
	const { session } = useAuth();
	const supabase = useSupabaseClient();
	// Queries
	const {
		data: items,
		isLoading,
		refetch,
	} = useQuery(usePlaylistMovieItemsOptions({
		playlistId: playlist.id
	}));
	const { data: isAllowedToEdit } = useQuery(usePlaylistIsAllowedToEditOptions({
		playlistId: playlist.id,
		userId: session?.user.id,
	}));
	
	// Mutations
	const playlistItemsRealtime = usePlaylistItemsMovieRealtimeMutation({
		playlistId: playlist.id,
	});

	// States
	const [shouldRefresh, setShouldRefresh] = useState(false);
  	const debouncedRefresh = useDebounce(shouldRefresh, 200);
	const [playlistItems, setPlaylistItems] = useState<PlaylistItemMovie[]>(items || []);
	const backdrops = useMemo(() => items?.map(item => item.movie.backdrop_path).filter(src => src !== null && src !== undefined), [items]);

	// useEffects
	useEffect(() => {
		if (isAllowedToEdit) {
			let playlistItemsChanges: RealtimeChannel;
			const setupRealtime = async () => {
				if (!session)  return;
				await supabase.realtime.setAuth(session.access_token);
				playlistItemsChanges = supabase
					.channel(`playlist:${playlist.id}`, {
					config: { private: true },
					})
					.on('broadcast', { event: '*' }, ({ event, payload } : { event: string, payload: { old: PlaylistItemMovie, new: PlaylistItemMovie } }) => {
						playlistItemsRealtime.mutate({
							event,
							payload,
						});
					})
					.subscribe();
				return playlistItemsChanges;
			}
			setupRealtime().catch(console.error);

			return () => {
			if (playlistItemsChanges) {
				supabase.removeChannel(playlistItemsChanges);
			}
			};
		}
	}, [isAllowedToEdit]);
	

	useEffect(() => {
		if (debouncedRefresh) {
			refetch();
			setShouldRefresh(false);
		}
	}, [debouncedRefresh, refetch]);
	useEffect(() => {
		if (items) {
			setPlaylistItems(items);
		}
	}, [items]);

	return (
		<div>
			<PlaylistMovieHeader
			playlist={playlist}
			numberItems={playlistItems.length}
			backdrops={backdrops || []}
			/>
			{items && (
				<PlaylistMovieTable playlist={playlist} playlistItems={playlistItems} setPlaylistItems={setPlaylistItems} />
			)}
		</div>
	)
}