'use client'

import { useAuth } from '@/context/auth-context';
import { useRouter } from "@/lib/i18n/navigation";
import ReviewForm from '@/components/Review/ReviewForm';
import { Spinner } from '@/components/ui/spinner';
import { useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useUserReviewMovieOptions } from '@/api/client/options/userOptions';
import { useUserReviewMovieUpsertMutation } from '@/api/client/mutations/userMutations';
import { Movie } from '@packages/api-js';
import { userMovieLogOptions } from '@libs/query-client/src';

export const MovieEditReview = ({
	movie,
	reviewId,
}: {
	movie: Movie;
	reviewId: number;
}) => {
	const { user } = useAuth();
	const router = useRouter();

	const {
		data: activity,
	} = useQuery(userMovieLogOptions({
		movieId: movie.id,
		userId: user?.id,
	}));
	const {
		data: review,
		isLoading,
	} = useQuery(useUserReviewMovieOptions({
		reviewId: reviewId,
	}));
	const { mutateAsync: upsertReview } = useUserReviewMovieUpsertMutation({
		movieId: movie.id,
	});

	const handleSubmit = useCallback(async (data: { title?: string; body: string }) => {
		if (!review) return;
		await upsertReview(data, {
			onSuccess: (review) => {
				router.push(`/film/${movie.slug || movie.id}/review/${review.id}`);
			},
			onError: (error) => {
				throw error;
			}
		});
	}, [review, upsertReview, router, movie]);

	const handleCancel = useCallback(() => {
		if (!review) return;
		router.push(`/film/${movie.slug || movie.id}/review/${review.id}`);
	}, [review, router, movie]);

	useEffect(() => {
		if (
			review
			&& user
			&& review?.activity?.user_id !== user.id
		) {
			router.replace(`/film/${movie.slug || movie.id}/review/${review.id}`);
		}
	}, [review, user, router, movie]);

	if (isLoading || !review) {
		return (
			<div className='flex items-center justify-center flex-1 p-4'>
				<Spinner />
			</div>
		);
	}
	
	return (
		<div className='@container/review p-4 flex flex-col items-center'>
			<ReviewForm
			review={review}
			rating={activity?.rating || undefined}
			type='movie'
			movie={movie}
			onUpdate={handleSubmit}
			onCancel={handleCancel}
			/>
		</div>
	);
}
