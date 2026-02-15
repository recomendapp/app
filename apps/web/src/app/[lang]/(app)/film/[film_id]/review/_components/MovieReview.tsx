'use client'

import { useAuth } from '@/context/auth-context';
import { useRouter } from "@/lib/i18n/navigation";
import ReviewForm from '@/components/Review/ReviewForm';
import { Spinner } from '@/components/ui/spinner';
import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Movie } from '@packages/api-js';
import { movieLogOptions, useMovieReviewUpsertMutation, userMovieLogOptions } from '@libs/query-client';

export const MovieReview = ({
	movie,
}: {
	movie: Movie;
}) => {
	const { user } = useAuth();
	const router = useRouter();

	const {
		data: log,
		isLoading,
	} = useQuery(userMovieLogOptions({
		movieId: movie.id,
		userId: user?.id,
	}));

	const { mutateAsync: upsertReview } = useMovieReviewUpsertMutation();

	const handleSubmit = useCallback(async (data: { title?: string; body: string }) => {
		await upsertReview({
			path: {
				movie_id: movie.id,
			},
			body: {
				title: data.title || null,
				body: data.body,
				isSpoiler: false,
			}
		}, {
			onSuccess: () => {
				console.log('okoko')
				router.push(`/@${user?.username}/film/${movie.slug || movie.id}`);
			},
			onError: (error) => {
				throw error;
			}
		});
	}, [upsertReview, router, movie]);

	const handleCancel = useCallback(() => {
		if (!user) return;
		router.push(`/@${user.username}/film/${movie.slug || movie.id}`);
	}, [user, router, movie]);

	if (isLoading || log === undefined) {
		return (
			<div className='flex items-center justify-center flex-1 p-4'>
				<Spinner />
			</div>
		);
	}
	
	return (
		<div className='@container/review p-4 flex flex-col items-center'>
			<ReviewForm
			review={log?.review}
			isWatched={!!log}
			type='movie'
			movie={movie}
			onSave={handleSubmit}
			onCancel={handleCancel}
			/>
		</div>
	);
}
