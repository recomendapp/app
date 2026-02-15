'use client'

import { EditorContent } from '@tiptap/react';
import { buttonVariants } from '@/components/ui/button';
import { MediaTvSeries, UserReviewTvSeries } from '@recomendapp/types';
import { cn } from '@/lib/utils';
import { Card, CardAction, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CardUser } from '@/components/Card/CardUser';
import { useTranslations } from 'next-intl';
import { useEditor } from '@/components/tiptap/Tiptap';
import { ButtonGroup } from '../ui/button-group';
import { ReviewMovieSettings } from './ReviewMovieSettings';
import { ReviewTvSeriesSettings } from './ReviewTvSeriesSettings';
import ButtonUserReviewMovieLike from '../buttons/ButtonUserReviewMovieLike';
import ButtonUserReviewTvSeriesLike from '../buttons/ButtonUserReviewTvSeriesLike';
import { MovieCompact, ReviewMovie as TReviewMovie, UserSummary } from '@packages/api-js';
import { upperFirst } from 'lodash';

interface ReviewViewerBase extends React.HTMLAttributes<HTMLDivElement> {
	author: UserSummary;
	rating: number | null;
}

type ReviewMovie = {
	type: 'movie';
	review: TReviewMovie;
	movie: MovieCompact;
	tvSeries?: never;
}

type ReviewTvSeries = {
	type: 'tv_series';
	review: UserReviewTvSeries;
	tvSeries: MediaTvSeries;
	movie?: never;
}

type ReviewViewerProps = ReviewViewerBase & (ReviewMovie | ReviewTvSeries);

export default function ReviewViewer({
	author,
	rating,
	review,
	className,
	type,
	movie,
	tvSeries,
} : ReviewViewerProps) {
	const t = useTranslations();
	const editor = useEditor({
		editable: false,
		content: review.body,
	});
	return (
		<Card className={cn("w-full gap-4", className)}>
			<CardHeader>
				<CardTitle>
					<div className='flex flex-row items-center gap-2'>
						<CardUser variant='inline' user={author} />
						{rating !== null && (
							<div className={buttonVariants({ variant: 'default', className: 'bg-background! border-accent-yellow! text-accent-yellow! border-2'})}>
								<p className='font-bold text-lg'>{rating}</p>
							</div>
						)}
					</div>
				</CardTitle>
				<CardAction>
					<ButtonGroup>
						{type === 'movie' ? (
						<>
						<ReviewMovieSettings movieId={movie.id} movie={movie} review={review} author={author} />
						</>
						) : type === 'tv_series' && (
						<>
						<ReviewTvSeriesSettings tvSeriesId={tvSeries.id} review={review} tvSeries={tvSeries} author={author} />
						</>
						)}
					</ButtonGroup>
				</CardAction>
			</CardHeader>
			<CardContent>
				<h1 className="text-5xl font-bold text-primary text-center">
					{review.title || `${upperFirst(t('common.messages.review_by', { name: author.name }))}`}
				</h1>
				<EditorContent
				className='prose dark:prose-invert max-w-none mt-4'
				editor={editor}
				/>
			</CardContent>
			<CardFooter className='justify-end'>
				{type === 'movie' ? (
					<ButtonUserReviewMovieLike reviewId={review?.id} reviewLikesCount={review.likesCount} />
				) : type === 'tv_series' && (
					<ButtonUserReviewTvSeriesLike reviewId={review?.id} reviewLikesCount={review.likes_count} />
				)}
			</CardFooter>
	 	</Card>
	);
}
