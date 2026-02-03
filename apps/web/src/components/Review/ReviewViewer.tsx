'use client'

import { EditorContent } from '@tiptap/react';
import { buttonVariants } from '@/components/ui/button';
import { MediaMovie, MediaTvSeries, UserReviewMovie, UserReviewTvSeries } from '@recomendapp/types';
import { cn } from '@/lib/utils';
import { Card, CardAction, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CardUser } from '@/components/Card/CardUser';
import { useTranslations } from 'next-intl';
import { useEditor } from '@/components/tiptap/Tiptap';
import { CardMovie } from '../Card/CardMovie';
import { CardTvSeries } from '../Card/CardTvSeries';
import { ButtonGroup } from '../ui/button-group';
import { ReviewMovieSettings } from './ReviewMovieSettings';
import { ReviewTvSeriesSettings } from './ReviewTvSeriesSettings';
import ButtonUserReviewMovieLike from '../buttons/ButtonUserReviewMovieLike';
import ButtonUserReviewTvSeriesLike from '../buttons/ButtonUserReviewTvSeriesLike';

interface ReviewViewerBase extends React.HTMLAttributes<HTMLDivElement> {}

type ReviewMovie = {
	type: 'movie';
	review: UserReviewMovie;
	movie: MediaMovie;
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
		<Card className={cn("w-full max-w-4xl gap-4", className)}>
			<CardHeader>
				<CardTitle>
					<div className='flex flex-row items-center gap-2'>
						<CardUser variant='inline' user={review.activity?.user!} />
						<div className={buttonVariants({ variant: 'default', className: 'bg-background! border-accent-yellow! text-accent-yellow! border-2'})}>
							<p className='font-bold text-lg'>{review.activity?.rating}</p>
						</div>
					</div>
				</CardTitle>
				<CardAction>
					<ButtonGroup>
						{type === 'movie' ? (
						<>
						<ReviewMovieSettings movieId={movie.id} movie={movie} review={review} author={review.activity?.user!} />
						</>
						) : type === 'tv_series' && (
						<>
						<ReviewTvSeriesSettings tvSeriesId={tvSeries.id} review={review} tvSeries={tvSeries} author={review.activity?.user!} />
						</>
						)}
					</ButtonGroup>
				</CardAction>
			</CardHeader>
			<CardContent>
				<EditorContent
				className='prose dark:prose-invert max-w-none mt-4'
				editor={editor}
				/>
			</CardContent>
			<CardFooter className='justify-end'>
				{type === 'movie' ? (
					<ButtonUserReviewMovieLike reviewId={review?.id} reviewLikesCount={review.likes_count} />
				) : type === 'tv_series' && (
					<ButtonUserReviewTvSeriesLike reviewId={review?.id} reviewLikesCount={review.likes_count} />
				)}
			</CardFooter>
	 	</Card>
	);
}
