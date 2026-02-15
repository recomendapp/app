'use client'

import ReviewViewer from "@/components/Review/ReviewViewer";
import { CardMovie } from "@/components/Card/CardMovie";
import { useQuery } from "@tanstack/react-query";
import { UserMovie } from "@packages/api-js";
import { userMovieLogOptions } from "@libs/query-client";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { CardUser } from "@/components/Card/CardUser";
import { useRouter } from "@/lib/i18n/navigation";
import { useEffect } from "react";

export const UserMovieLog = ({
	log: logProp,
}: {
	log: UserMovie;
}) => {
	const router = useRouter();
	const {
		data: log,
		isLoading,
	} = useQuery({
		...userMovieLogOptions({
			userId: logProp.userId,
			movieId: logProp.movieId,
		}),
		initialData: logProp,
	});

	useEffect(() => {
		if (log === null && !isLoading) {
			router.replace(logProp.movie.url || '/');
		}
	}, [log, isLoading, router])

	if (!log) return null;

	return (
	<>
		<div className='@container/review p-4 flex flex-col items-center'>
			<div className="max-w-3xl w-full flex flex-col @xl/review:flex-row gap-4">
				<CardMovie movie={log.movie} variant='poster' />
				<div className="w-full flex flex-col gap-4">
					<Card>
						<CardHeader>
							<CardTitle>
								<CardUser variant="username" user={log.user} /> a vu ce film
							</CardTitle>
						</CardHeader>
					</Card>
					{log.review && (
						<ReviewViewer
						review={log.review}
						rating={log.rating}
						author={log.user}
						type='movie'
						movie={log.movie}
						/>
					)}
				</div>	
			</div>
		</div>
	</>
	);
}