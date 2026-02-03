'use client'

import ReviewViewer from "@/components/Review/ReviewViewer";
import { HeaderBox } from "@/components/Box/HeaderBox";
import { CardTvSeries } from "@/components/Card/CardTvSeries";
import { TMDB_IMAGE_BASE_URL } from "@/lib/tmdb/tmdb";
import { useTranslations } from "next-intl";
import { upperFirst } from "lodash";
import { useQuery } from "@tanstack/react-query";
import { useUserReviewTvSeriesOptions } from "@/api/client/options/userOptions";

export const TvSeriesReview = ({
	reviewId,
} : {
	reviewId: number;
}) => {
	const t = useTranslations();
	const {
		data: review
	} = useQuery(useUserReviewTvSeriesOptions({
		reviewId: reviewId,
	}));
	
	if (!review) return null;
	
	return (
	<>
		<HeaderBox className="flex-col items-center justify-center gap-4 pb-20" background={review.activity?.tv_series!.backdrop_path ? { src: `${TMDB_IMAGE_BASE_URL}/w1280${review.activity?.tv_series.backdrop_path}`, alt: review.activity?.tv_series.name ?? '', unoptimized: true } : undefined}>
				<h1 className="text-5xl font-bold text-primary text-center">
					{review.title || `${upperFirst(t('common.messages.review_by', { name: review.activity?.user?.full_name! }))}`}
				</h1>
				<CardTvSeries tvSeries={review.activity?.tv_series!} className="h-12" />
		</HeaderBox>
		<div className='@container/review p-4 flex flex-col items-center -mt-20 z-1'>
			<ReviewViewer
			review={review}
			type='tv_series'
			tvSeries={review.activity?.tv_series!}
			/>
		</div>
	</>
	);
}