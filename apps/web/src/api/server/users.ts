'use server'

import { createServerClient } from "@/lib/supabase/server";
import { cache } from "react";

export const getProfile = cache(async (username: string) => {
	const supabase = await createServerClient();
	const { data: user, error } = await supabase
		.from('profile'	)
		.select('*')
		.eq('username', username)
		.single();
	if (error) throw error;
	return user;
});