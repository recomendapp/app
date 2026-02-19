'use client'

import { useQuery } from "@tanstack/react-query";
import { PlaylistGet as TPlaylist } from "@packages/api-js";
import { PlaylistHeader } from "./PlaylistHeader";
import { playlistOptions } from "@libs/query-client";

export const Playlist = ({
	playlist: playlistProps,
} : {
	playlist: TPlaylist;
}) => {
	const {
		data: playlist,
	} = useQuery({
		...playlistOptions({
			playlistId: playlistProps.id,
		}),
		initialData: playlistProps,
	});
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