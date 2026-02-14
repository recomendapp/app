'use client'

import { useQuery } from "@tanstack/react-query";
import { usePlaylistDetailsOptions } from "@/api/client/options/playlistOptions";
import { PlaylistGet as TPlaylist } from "@packages/api-js";
import { PlaylistHeader } from "./PlaylistHeader";

export const Playlist = ({
	playlist: playlistProps,
} : {
	playlist: TPlaylist;
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
			<PlaylistHeader
			playlist={playlist}
			numberItems={0}
			backdrops={[]}
			/>
			{/* {playlist.type === 'movie' ? (
				<PlaylistMovie playlist={playlist} />
			) : playlist.type === 'tv_series' ? (
				<PlaylistTvSeries playlist={playlist} />
			) : null} */}
		</div>
	)
};