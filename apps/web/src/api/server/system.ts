'use server'

import { getAnonApi } from "@/lib/api/server";
import { cache } from "@/lib/utils/cache";
import { systemControllerGetStatus } from "@packages/api-js/src";

export const getStatus = cache(
	async () => {
		const client = await getAnonApi();
		const { data } = await systemControllerGetStatus({
			client,
		});
		return data;
	}, {
		revalidate: 60, // 1 minute
	}
);