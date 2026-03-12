'use client'

import { useQuery } from "@tanstack/react-query";
import { PlaylistWithOwner } from "@packages/api-js";
import { PlaylistHeader } from "./PlaylistHeader";
import { playlistItemsAllOptions, playlistOptions } from "@libs/query-client";
import { useMemo } from "react";
import PlaylistTable from "./PlaylistTable/PlaylistTable";

export const Playlist = ({
	playlist: playlistProps,
} : {
	playlist: PlaylistWithOwner;
}) => {
	const {
		data: playlist,
	} = useQuery({
		...playlistOptions({
			playlistId: playlistProps.id,
		}),
		initialData: playlistProps,
	});
	const {
		data: items,
		isLoading,
		refetch,
	} = useQuery(playlistItemsAllOptions({
		playlistId: playlist.id
	}));

	const backdrops = useMemo(() => items?.map(item => {
		if (item.type === 'movie') return item.media.backdropPath;
		if (item.type === 'tv_series') return item.media.backdropPath;
		return null;
	}).filter((src): src is string => !!src) || [], [items]);
	
	if (!playlist) return null;
	return (
		<div className="h-full">
			<PlaylistHeader
			playlist={playlist}
			numberItems={playlist.itemsCount}
			backdrops={backdrops}
			/>
			{items && (
				<PlaylistTable playlist={playlist} items={items} />
			)}
		</div>
	)
};