import { Database, PlaylistItemTvSeries } from "@recomendapp/types";
import { PlaylistTvSeriesHeader } from "./PlaylistTvSeriesHeader";
import { useEffect, useMemo, useState } from "react";
import PlaylistTvSeriesTable from "./PlaylistTvSeriesTable/PlaylistTvSeriesTable";
import useDebounce from "@/hooks/use-debounce";
import { RealtimeChannel } from "@supabase/supabase-js";
import { useAuth } from "@/context/auth-context";
import { useSupabaseClient } from "@/context/supabase-context";
import { usePlaylistItemsTvSeriesRealtimeMutation } from "@/api/client/mutations/playlistMutations";
import { useQuery } from "@tanstack/react-query";
import { usePlaylistIsAllowedToEditOptions, usePlaylistTvSeriesItemsOptions } from "@/api/client/options/playlistOptions";

export const PlaylistTvSeries = ({
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
	} = useQuery(usePlaylistTvSeriesItemsOptions({
		playlistId: playlist.id
	}));
	const { data: isAllowedToEdit } = useQuery(usePlaylistIsAllowedToEditOptions({
		playlistId: playlist.id,
		userId: session?.user.id,
	}));
	
	// Mutations
	const playlistItemsRealtime = usePlaylistItemsTvSeriesRealtimeMutation({
		playlistId: playlist.id,
	});

	// States
	const [shouldRefresh, setShouldRefresh] = useState(false);
  	const debouncedRefresh = useDebounce(shouldRefresh, 200);
	const [playlistItems, setPlaylistItems] = useState<PlaylistItemTvSeries[]>(items || []);
	const backdrops = useMemo(() => items?.map(item => item.tv_series.backdrop_path).filter(src => src !== null && src !== undefined), [items]);

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
					.on('broadcast', { event: '*' }, ({ event, payload } : { event: string, payload: { old: PlaylistItemTvSeries, new: PlaylistItemTvSeries } }) => {
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
			<PlaylistTvSeriesHeader
			playlist={playlist}
			numberItems={playlistItems.length}
			backdrops={backdrops || []}
			/>
			{items && (
				<PlaylistTvSeriesTable playlist={playlist} playlistItems={playlistItems} setPlaylistItems={setPlaylistItems} />
			)}
		</div>
	)
}