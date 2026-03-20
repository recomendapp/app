'use client'

import { useAuth } from '@/context/auth-context';
import { useRouter } from "@/lib/i18n/navigation";
import ReviewForm from '@/components/Review/ReviewForm';
import { Spinner } from '@/components/ui/spinner';
import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TvSeries } from '@packages/api-js';
import { userTvSeriesLogOptions, useTvSeriesReviewUpsertMutation } from '@libs/query-client';

export const TvSeriesReview = ({
	tvSeries,
}: {
	tvSeries: TvSeries;
}) => {
	const { user } = useAuth();
	const router = useRouter();

	const {
		data: log,
		isLoading,
	} = useQuery(userTvSeriesLogOptions({
		tvSeriesId: tvSeries.id,
		userId: user?.id,
	}));

	const { mutateAsync: upsertReview } = useTvSeriesReviewUpsertMutation();

	const handleSubmit = useCallback(async (data: { title?: string; body: string }) => {
		await upsertReview({
			path: {
				tv_series_id: tvSeries.id,
			},
			body: {
				title: data.title || null,
				body: data.body,
				isSpoiler: false,
			}
		}, {
			onSuccess: () => {
				router.push(`/@${user?.username}/tv-series/${tvSeries.slug || tvSeries.id}`);
			},
			onError: (error) => {
				throw error;
			}
		});
	}, [upsertReview, router, tvSeries, user]);

	const handleCancel = useCallback(() => {
		if (!user) return;
		router.push(`/@${user.username}/tv-series/${tvSeries.slug || tvSeries.id}`);
	}, [user, router, tvSeries]);

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
			type='tv_series'
			tvSeries={tvSeries}
			onSave={handleSubmit}
			onCancel={handleCancel}
			/>
		</div>
	);
}
