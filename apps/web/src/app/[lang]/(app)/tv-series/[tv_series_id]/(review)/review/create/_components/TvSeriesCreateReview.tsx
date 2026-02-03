'use client'

import { useAuth } from '@/context/auth-context';
import { useRouter } from "@/lib/i18n/navigation";
import ReviewForm from '@/components/Review/ReviewForm';
import { useCallback, useEffect } from 'react';
import { Spinner } from '@/components/ui/spinner';
import { Database } from '@recomendapp/types';
import { useQuery } from '@tanstack/react-query';
import { useUserActivityTvSeriesOptions } from '@/api/client/options/userOptions';
import { useUserReviewTvSeriesUpsertMutation } from '@/api/client/mutations/userMutations';

export const TvSeriesCreateReview = ({
	tvSeries,
}: {
	tvSeries: Database['public']['Views']['media_tv_series']['Row'];
}) => {
	const { session } = useAuth();
	const router = useRouter();

	const {
		data: activity,
		isLoading,
	} = useQuery(useUserActivityTvSeriesOptions({
		tvSeriesId: tvSeries.id,
		userId: session?.user.id,
	}));
	const { mutateAsync: upsertReview } = useUserReviewTvSeriesUpsertMutation({
		tvSeriesId: tvSeries.id,
	});

	const handleSubmit = useCallback(async (data: { title?: string; body: string }) => {
		if (!activity) return;
		await upsertReview(data, {
			onSuccess: (review) => {
				router.replace(`/tv-series/${tvSeries.slug || tvSeries.id}/review/${review.id}`);
			},
			onError: (error) => {
				throw error;
			}
		});
	}, [activity, upsertReview, router, tvSeries]);
	
	useEffect(() => {
		if (activity?.review) {
			router.replace(`/tv-series/${tvSeries.slug || tvSeries.id}/review/${activity.review.id}`);
		}
	}, [activity, router, tvSeries]);

	if (isLoading ||activity?.review) {
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
			type='tv_series'
			tvSeries={tvSeries}
			onCreate={handleSubmit}
			/>
		</div>
	);
}