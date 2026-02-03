'use client'

import { useAuth } from '@/context/auth-context';
import { useRouter } from "@/lib/i18n/navigation";
import ReviewForm from '@/components/Review/ReviewForm';
import { Spinner } from '@/components/ui/spinner';
import { useCallback, useEffect } from 'react';
import { Database } from '@recomendapp/types';
import { useUserActivityTvSeriesOptions, useUserReviewTvSeriesOptions } from '@/api/client/options/userOptions';
import { useQuery } from '@tanstack/react-query';
import { useUserReviewTvSeriesUpsertMutation } from '@/api/client/mutations/userMutations';

export const TvSeriesEditReview = ({
	tvSeries,
	reviewId,
}: {
	tvSeries: Database['public']['Views']['media_tv_series']['Row'];
	reviewId: number;
}) => {
	const { session } = useAuth();
	const router = useRouter();

	const {
		data: activity,
	} = useQuery(useUserActivityTvSeriesOptions({
		tvSeriesId: tvSeries.id,
		userId: session?.user.id,
	}));
	const {
		data: review,
		isLoading,
	} = useQuery(useUserReviewTvSeriesOptions({
		reviewId: reviewId,
	}));
	const { mutateAsync: upsertReview } = useUserReviewTvSeriesUpsertMutation({
		tvSeriesId: tvSeries.id,
	});

	const handleSubmit = useCallback(async (data: { title?: string; body: string }) => {
		if (!review) return;
		await upsertReview(data, {
			onSuccess: (review) => {
				router.push(`/tv-series/${tvSeries.slug || tvSeries.id}/review/${review.id}`);
			},
			onError: (error) => {
				throw error;
			}
		});
	}, [review, upsertReview, router, tvSeries]);

	const handleCancel = useCallback(() => {
		if (!review) return;
		router.push(`/tv-series/${tvSeries.slug || tvSeries.id}/review/${review.id}`);
	}, [review, router, tvSeries]);

	useEffect(() => {
		if (
			review
			&& session
			&& review?.activity?.user_id !== session?.user.id
		) {
			router.replace(`/tv-series/${tvSeries.slug || tvSeries.id}/review/${review.id}`);
		}
	}, [review, session, router, tvSeries]);

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
			type='tv_series'
			tvSeries={tvSeries}
			onUpdate={handleSubmit}
			onCancel={handleCancel}
			/>
		</div>
	);
}
