'use client'

import { Database, Playlist as TPlaylist } from "@recomendapp/types";
import { PlaylistMovie } from "./PlaylistMovie/PlaylistMovie";
import { PlaylistTvSeries } from "./PlaylistTvSeries/PlaylistTvSeries";
import { useQuery } from "@tanstack/react-query";
import { usePlaylistDetailsOptions } from "@/api/client/options/playlistOptions";

export const Playlist = ({
	playlist: playlistProps,
} : {
	playlist: Database['public']['Tables']['playlists']['Row'] & { user: Database['public']['Views']['profile']['Row'] };
}) => {
	const {
		data: playlist,
	} = useQuery(usePlaylistDetailsOptions({
		playlistId: playlistProps.id,
		initialData: playlistProps,
	}));
	if (!playlist) return null;
	return (
		<div className="h-full">
			{playlist.type === 'movie' ? (
				<PlaylistMovie playlist={playlist} />
			) : playlist.type === 'tv_series' ? (
				<PlaylistTvSeries playlist={playlist} />
			) : null}
		</div>
	)
};