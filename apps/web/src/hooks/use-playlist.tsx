import { playlistOptions } from "@libs/query-client";
import { Playlist } from "@packages/api-js";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

const ROLES_CAN_EDIT: Playlist['role'][] = ['editor', 'admin', 'owner'] as const;

export const usePlaylist = ({
	playlistId,
}: {
	playlistId?: number;
}) => {
	const {
		data: playlist,
	} = useQuery(playlistOptions({
		playlistId: playlistId,
	}));

	const canEdit = useMemo(() => {
		if (!playlist || !playlist.role) return false;
		return ROLES_CAN_EDIT.includes(playlist.role);
	}, [playlist]);

	return {
		playlist,
		canEdit,
	};
};
