'use client'

import { useCallback, useEffect, useMemo } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useInView } from 'react-intersection-observer';
import { useTranslations } from 'next-intl';
import { upperFirst } from 'lodash';
import { z } from "zod";
import { useRouter, useSearchParams } from 'next/navigation';
import { Icons } from '@/config/icons';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from '@/lib/i18n/navigation';
import { Database, MediaMovie } from '@recomendapp/types';
import { CardReviewMovie } from '@/components/Card/CardReviewMovie';
import { ButtonGroup } from '@/components/ui/button-group';
import { TooltipBox } from '@/components/Box/TooltipBox';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useMediaMovieReviewsOptions } from '@/api/client/options/mediaOptions';
import { useUserActivityMovieOptions } from '@/api/client/options/userOptions';

type SortBy =  "updated_at" | "created_at";
const DEFAULT_PER_PAGE = 20;
const DEFAULT_SORT_BY: SortBy = "updated_at";
const DEFAULT_SORT_ORDER = "desc";

const sortBySchema = z.enum([ "updated_at", "created_at" ]);
const getValidatedSortBy = (order?: string | null): z.infer<typeof sortBySchema> => {
  return sortBySchema.safeParse(order).success ? order! as z.infer<typeof sortBySchema> : DEFAULT_SORT_BY;
};
const orderSchema = z.enum(["asc", "desc"]);
const getValidatedSortOrder = (order?: string | null): z.infer<typeof orderSchema> => {
  return orderSchema.safeParse(order).success ? order! as z.infer<typeof orderSchema> : DEFAULT_SORT_ORDER;
};
const perPageSchema = z.number().int().positive();
const getValidatePerPage = (perPage?: number | null): number => {
  return perPageSchema.safeParse(perPage).success ? perPage! : DEFAULT_PER_PAGE;
}

export const MovieReviews = ({
	movie,
} : {
	movie: Database['public']['Views']['media_movie_full']['Row'];
}) => {
	const t = useTranslations();
	const searchParams = useSearchParams();
	const sortBy = getValidatedSortBy(searchParams.get('sort_by'));
	const sortOrder = getValidatedSortOrder(searchParams.get('sort_order'));
	const perPage = getValidatePerPage(Number(searchParams.get('per_page')));
	const router = useRouter();
	const { ref, inView } = useInView();
	// Requests
	const {
		data: reviews,
		isLoading,
		fetchNextPage,
		isFetchingNextPage,
		hasNextPage,
	} = useInfiniteQuery(useMediaMovieReviewsOptions({
		movieId: movie.id,
		filters: {
			sortBy: sortBy,
			sortOrder: sortOrder,
			perPage: perPage,
		},
	}));

	const sortOptions = useMemo((): { value: SortBy, label: string }[] => [
		{ value: "updated_at", label: upperFirst(t('common.messages.date_updated')) },
		{ value: "created_at", label: upperFirst(t('common.messages.date_created')) },
	  ], [t]);

	const handleChange = useCallback(({ name, value }: { name: string, value: string }) => {
		const params = new URLSearchParams(searchParams.toString());
		params.set(name, value);
		router.push(`?${params.toString()}`);
	}, [searchParams, router]);

	useEffect(() => {
		if (inView && hasNextPage) fetchNextPage();
	}, [inView, hasNextPage, fetchNextPage]);

	if (!movie) return null;

	return (
	<div className="w-full h-full flex flex-col items-center gap-4">
		<div className="w-full flex flex-col gap-4 justify-between lg:flex-row">
			<div>
				<MyReviewButton movie={movie} />
			</div>
			<ButtonGroup className="justify-end">
				<TooltipBox tooltip={upperFirst(sortOrder === 'asc' ? t('common.messages.order_asc') : t('common.messages.order_desc'))}>
					<Button variant={'outline'} onClick={() => handleChange({ name: 'sort_order', value: sortOrder === 'desc' ? 'asc' : 'desc' })}>
						{sortOrder === 'desc' ? <Icons.orderDesc /> : <Icons.orderAsc />}
					</Button>
				</TooltipBox>
				<Select defaultValue={sortBy} onValueChange={(e) => handleChange({ name: 'sort_by', value: e })}>
				<SelectTrigger>
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					{sortOptions.map((sort) => (
					<SelectItem key={sort.value} value={sort.value}>{sort.label}</SelectItem>
					))}
				</SelectContent>
				</Select>
			</ButtonGroup>
		</div>
		<div className='flex flex-col gap-2 w-full max-w-xl'>
		{/* ALL */}
		{(isLoading || reviews === undefined) ? (
			<div className="w-full overflow-hidden">
				{Array.from({ length: 5 }).map((_, i) => (
					<Skeleton key={i} className="h-24 w-full mb-2 rounded-md" style={{ animationDelay: `${i * 0.12}s`}}/>
				))}
			</div>
		) : reviews?.pages[0]?.length ? (
			reviews?.pages.map((page, i) => (
				page?.map((review, index) => {
				if (!review) return null;
				return (
					<CardReviewMovie
					ref={(i === reviews.pages?.length - 1) && (index === page?.length - 1) ? ref : undefined }
					key={review.id ?? index}
					review={review}
					activity={review.user_activities_movie}
					author={review.user_activities_movie.profile}
					url={`/film/${movie.slug || movie.id}/review/${review?.id}`}
					/>
				)
				})
			))
		) : (
			<p className="text-muted-foreground text-center font-semibold">{upperFirst(t('common.messages.no_reviews'))}</p>
		)}
		{isFetchingNextPage ? <Icons.loader /> : null}
		</div>
	</div>
	);
};

const MyReviewButton = ({
	movie,
 } : {
	movie: MediaMovie;
}) => {
	const t = useTranslations();
	const { session } = useAuth();
	const {
	  data: activity,
	  isLoading,  
	} = useQuery(useUserActivityMovieOptions({
		movieId: movie.id,
		userId: session?.user.id,
	}));

	if (!session) return;

	if (isLoading || activity === undefined) return <Skeleton className="w-36 h-10 rounded-full"/>;

	return (
		<Button
		variant={'outline'}
		asChild
		>
			<Link href={activity?.review ? `/film/${movie.slug || movie.id}/review/${activity.review.id}` : `/film/${movie.slug || movie.id}/review/create`}>
				{activity?.review ? <Icons.eye /> : <Icons.edit />}
				{upperFirst(activity?.review ? t('common.messages.my_review', { count: 1 }) : t('common.messages.write_review'))}	
			</Link>
		</Button>
	);
};