'use server'

import { createServerClient } from "@/lib/supabase/server";
import { cache } from "react";

export const getPlaylist = cache(async (id: number) => {
	const supabase = await createServerClient();
	const { data: playlist, error } = await supabase
		.from('playlists')
		.select('*, user:profile(*)')
		.eq('id', id)
		.maybeSingle()
	if (error) throw error;
	return playlist;
});