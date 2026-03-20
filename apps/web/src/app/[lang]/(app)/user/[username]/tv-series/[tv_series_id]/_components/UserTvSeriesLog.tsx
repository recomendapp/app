'use client'

import ReviewViewer from "@/components/Review/ReviewViewer";
import { useQuery } from "@tanstack/react-query";
import { userTvSeriesLogOptions } from "@libs/query-client";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { CardUser } from "@/components/Card/CardUser";
import { useRouter } from "@/lib/i18n/navigation";
import { useEffect } from "react";
import { UserTvSeriesWithUserTvSeries } from "@packages/api-js";
import { CardTvSeries } from "@/components/Card/CardTvSeries";

export const UserTvSeriesLog = ({
	log: logProp,
}: {
	log: UserTvSeriesWithUserTvSeries;
}) => {
	const router = useRouter();
	const {
		data: log,
		isLoading,
	} = useQuery({
		...userTvSeriesLogOptions({
			userId: logProp.userId,
			tvSeriesId: logProp.tvSeriesId,
		}),
		initialData: logProp,
	});

	useEffect(() => {
		if (log === null && !isLoading) {
			router.replace(logProp.tvSeries.url || '/');
		}
	}, [log, isLoading, router])

	if (!log) return null;

	return (
	<>
		<div className='@container/review p-4 flex flex-col items-center'>
			<div className="max-w-3xl w-full flex flex-col @xl/review:flex-row gap-4">
				<CardTvSeries tvSeries={log.tvSeries} variant='poster' />
				<div className="w-full flex flex-col gap-4">
					<Card>
						<CardHeader>
							<CardTitle>
								<CardUser variant="username" user={log.user} /> a vu cette série
							</CardTitle>
						</CardHeader>
					</Card>
					{log.review && (
						<ReviewViewer
						review={log.review}
						rating={log.rating}
						author={log.user}
						type='tv_series'
						tvSeries={log.tvSeries}
						/>
					)}
				</div>	
			</div>
		</div>
	</>
	);
}