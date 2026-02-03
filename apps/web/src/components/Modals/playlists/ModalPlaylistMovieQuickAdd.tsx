'use client'

import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';
import { useModal } from '@/context/modal-context';
import { useCallback, useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { ImageWithFallback } from '@/components/utils/ImageWithFallback';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { MediaMovie, Playlist } from '@recomendapp/types';
import { Modal, ModalBody, ModalDescription, ModalFooter, ModalHeader, ModalTitle, ModalType } from '../Modal';
import { Icons } from '@/config/icons';
import { Label } from '@/components/ui/label';
import useDebounce from '@/hooks/use-debounce';
import { useTranslations } from 'next-intl';
import { InputSearch } from '@/components/ui/input-search';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useInView } from 'react-intersection-observer';
import { usePlaylistMovieMultiInsertMutation } from '@/api/client/mutations/playlistMutations';
import { upperFirst } from 'lodash';
import { CardMovie } from '@/components/Card/CardMovie';
import { getTmdbImage } from '@/lib/tmdb/getTmdbImage';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useSearchMoviesOptions } from '@/api/client/options/searchOptions';

const COMMENT_MAX_LENGTH = 180;

interface ModalPlaylistMovieQuickAddProps extends ModalType {
	playlist: Playlist;
}

export function ModalPlaylistMovieQuickAdd({
	playlist,
	...props
} : ModalPlaylistMovieQuickAddProps) {
	const { session } = useAuth();
	const t = useTranslations();
	const { closeModal } = useModal();
	const [selectMovies, setSelectedMovies] = useState<MediaMovie[]>([]);
	const [comment, setComment] = useState<string>('');
	const [search, setSearch] = useState<string>('');
	const searchQuery = useDebounce(search);
	const { ref, inView } = useInView();

	const {
		data: movies,
		isLoading,
		isError,
		fetchNextPage,
		isFetchingNextPage,
		hasNextPage,
	} = useInfiniteQuery(useSearchMoviesOptions({
		query: searchQuery,
	}));

	const { mutateAsync: insertMovieMultiple, isPending } = usePlaylistMovieMultiInsertMutation({
		playlistId: playlist.id,
	});

	useEffect(() => {
		if (inView && hasNextPage) {
		  fetchNextPage();
		}
	}, [inView, hasNextPage, fetchNextPage]);

	const handleSubmit = useCallback(async () => {
		if (!session?.user.id) return;
		const ids = selectMovies.map((movie) => movie.id);
		if (ids.length === 0) return;
		await insertMovieMultiple({
			userId: session.user.id,
			movieIds: ids,
			comment: comment,
		}, {
			onSuccess: () => {
				toast.success(upperFirst(t('common.messages.added', { gender: 'male', count: selectMovies.length })));
				closeModal(props.id);
			},
			onError: () => {
				toast.error(upperFirst(t('common.messages.an_error_occurred')));
			}
		});
	}, [session, selectMovies, comment, insertMovieMultiple, t, closeModal, props.id]);

	return (
		<Modal
			open={props.open}
			onOpenChange={(open) => !open && closeModal(props.id)}
			className='gap-0 p-0 outline-hidden'
		>
			<ModalHeader className='px-4 pb-4 pt-5'>
				<ModalTitle>{upperFirst(t('common.messages.add_to_playlist'))}</ModalTitle>
				<ModalDescription>
					{t.rich('common.messages.add_one_or_more_films_to', {
						title: playlist.title,
						important: (chunks) => <strong>{chunks}</strong>,
					})}
				</ModalDescription>
			</ModalHeader>
			<ModalBody className='p-0! border-t bg-popover text-popover-foreground'>
				<InputSearch
				value={search}
				onChange={(e) => setSearch(e.target.value)}
				placeholder={upperFirst(t('common.messages.search_film', { count: 1 }))}
				/>
				<ScrollArea className={`h-[40vh]`}>
					<div className='p-2 flex flex-col gap-1'>
					{(movies?.pages && movies.pages[0].data.length > 0) ? (
						movies.pages.map((page, i) => (
							page.data.map((movie, index) => (
								<CardMovie
								key={index}
								variant='row'
								movie={movie as MediaMovie}
								className={`
									border-none bg-transparent hover:cursor-pointer
									${selectMovies.some((selectedMovie) => selectedMovie.id === movie.id) ? 'bg-muted-hover' : ''}
								`}
								posterClassName='h-full'
								linked={false}
								onClick={() => {
									if (selectMovies.some((selectedMovie) => selectedMovie.id === movie.id)) {
										return setSelectedMovies((prev) => prev.filter(
											(selectedMovie) => selectedMovie.id !== movie.id
										))
									}
									return setSelectedMovies((prev) => [...prev, movie as MediaMovie]);
								}}
								{...(i === movies.pages.length - 1 && index === page.data.length - 1
										? { ref: ref }
										: {})}
								/>
							))
						))
					) : isError ? (
						<p className='p-4 text-center text-muted-foreground'>
						{upperFirst(t('common.messages.an_error_occurred'))}
						</p>
					) : (searchQuery && !isLoading) ? (
						<p className='p-4 text-center text-muted-foreground'>
							{t.rich('common.messages.no_results_for', {
								query: searchQuery,
								strong: (chunks) => <strong>{chunks}</strong>,
							})}
						</p>
					) : !isLoading ? (
						<p className='p-4 text-center text-muted-foreground'>
						{upperFirst(t('common.messages.search_film', { count: 1 }))}
						</p>
					) : null}
					 {(isLoading || isFetchingNextPage) ? <Icons.loader className='w-full'/> : null}
					</div>
				</ScrollArea>
			</ModalBody>
			<div className='px-2 pt-2'>
				<Label htmlFor="comment" className='sr-only'>{upperFirst(t('common.messages.comment', {count: 1}))}</Label>
				<Input
				value={comment}
				onChange={(e) => setComment(e.target.value)}
				placeholder={upperFirst(t('common.messages.add_comment', { count: 1 }))}
				maxLength={COMMENT_MAX_LENGTH}
				/>
			</div>
			<ModalFooter className="flex items-center p-4 sm:justify-between">
				{selectMovies.length > 0 ? (
				<div className="flex -space-x-2 overflow-hidden">
					{selectMovies.map((movie) => (
						<div
						key={movie.id}
						className={`w-[40px] shadow-2xl cursor-not-allowed`}
						onClick={() => setSelectedMovies((prev) => prev.filter(
							(selectedMovie) => selectedMovie.id !== movie.id
						))}
						>
							<AspectRatio ratio={1 / 1}>
								<ImageWithFallback
								src={getTmdbImage({ path: movie?.poster_path, size: 'w342' })}
								alt={movie.title ?? ''}
								fill
								className="rounded-md object-cover"
								type="movie"
								unoptimized
								/>
							</AspectRatio>
						</div>
					))}
				</div>
				) : (
					<p className="text-sm text-muted-foreground">
						{upperFirst(t('common.messages.select_a_film_to_add_to_playlist'))}
					</p>
				)}
				<Button
				disabled={!selectMovies.length || isPending}
				onClick={handleSubmit}
				>
				{isPending && <Icons.loader className="mr-2" />}
				{upperFirst(t('common.messages.add'))}
				</Button>
			</ModalFooter>
		</Modal>
	)
}
