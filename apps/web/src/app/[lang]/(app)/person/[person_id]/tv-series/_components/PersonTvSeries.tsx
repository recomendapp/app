'use client'

import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { useMediaPersonTvSeriesOptions } from '@/api/client/options/mediaOptions';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { CardTvSeries } from '@/components/Card/CardTvSeries';

export const PersonTvSeries = ({
	personId,
	display,
	filters,
} : {
	personId: number;
	display: 'grid' | 'row';
	filters: {
		page: number;
		perPage: number;
		sortBy: 'last_appearance_date' | 'first_air_date' | 'vote_average';
		sortOrder: 'asc' | 'desc';
		department?: string;
		job?: string;
	};

}) => {
	const t = useTranslations();
	// Requests
	const {
		data,
		isLoading,
	} = useQuery(useMediaPersonTvSeriesOptions({
		personId: personId,
		filters: filters,
	}));

	return (
	<div
	className={` gap-2
		${
			display == 'row'
			? 'flex flex-col'
			: 'grid grid-cols-3 sm:grid-cols-4 md:grid-cols-8 2xl:grid-cols-10'
		}
	`}
	>
		{isLoading ? (
			new Array(filters.perPage).fill(0).map((_, index) => (
				<Skeleton
				key={index}
				className={cn(
					'w-full',
					display === 'grid' ? 'aspect-2/3 rounded-md' : 'h-24 rounded-md',
				)}
				/>
			))
		) : data?.map((credits, index) => (
			<CardTvSeries
			key={index}
			variant={display === 'grid' ? 'poster' : 'row'}
			tvSeries={credits.media_tv_series}
			className='w-full'
			/>
		))}
	</div>
	)
};