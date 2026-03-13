import { playlistOptions } from "@libs/query-client";
import { ROLES_CAN_EDIT } from "@packages/api-js";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

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
