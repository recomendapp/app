'use client'

import { useAuth } from '@/context/auth-context';
import { useRouter } from "@/lib/i18n/navigation";
import ReviewForm from '@/components/Review/ReviewForm';
import { Spinner } from '@/components/ui/spinner';
import { useCallback, useEffect } from 'react';
import { Database } from '@recomendapp/types';
import { useUserActivityMovieOptions } from '@/api/client/options/userOptions';
import { useQuery } from '@tanstack/react-query';
import { useUserReviewMovieUpsertMutation } from '@/api/client/mutations/userMutations';

export const MovieCreateReview = ({
	movie,
}: {
	movie: Database['public']['Views']['media_movie']['Row'];
}) => {
	const { session } = useAuth();
	const router = useRouter();

	const {
		data: activity,
		isLoading,
	} = useQuery(useUserActivityMovieOptions({
		movieId: movie.id,
		userId: session?.user.id,
	}));
	const { mutateAsync: upsertReview } = useUserReviewMovieUpsertMutation({
		movieId: movie.id,
	});

	const handleSubmit = useCallback(async (data: { title?: string; body: string }) => {
		if (!activity) return;
		await upsertReview(data, {
			onSuccess: (review) => {
				router.replace(`/film/${movie.slug || movie.id}/review/${review.id}`);
			},
			onError: (error) => {
				throw error;
			}
		});
	}, [activity, upsertReview, router, movie]);

	useEffect(() => {
		if (activity?.review) {
			router.replace(`/film/${movie.slug || movie.id}/review/${activity.review.id}`);
		}
	}, [activity, router, movie]);

	if (isLoading ||activity?.review || !movie) {
		return (
			<div className='flex items-center justify-center flex-1 p-4'>
				<Spinner />
			</div>
		);
	}
	
	return (
		<div className='@container/review p-4 flex flex-col items-center'>
			<ReviewForm
			rating={activity?.rating || undefined}
			type='movie'
			movie={movie}
			onCreate={handleSubmit}
			/>
		</div>
	);
}
