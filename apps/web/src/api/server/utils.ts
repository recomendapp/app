'use server'

import { createAnonClient } from "@/lib/supabase/anon";
import { cache } from "@/lib/utils/cache";

export const checkMaintenance = cache(
	async () => {
		try {
			const supabase = createAnonClient();
			const { data } = await supabase.rpc('is_maintenance').single();
			return !!data && process.env.NODE_ENV !== 'development';
		} catch {
			return false;
		}
	}, {
		revalidate: 60, // 1 minute
	}
);