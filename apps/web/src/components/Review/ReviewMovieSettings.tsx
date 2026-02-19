import { Button } from '@/components/ui/button';
import {
DropdownMenu,
DropdownMenuContent,
DropdownMenuItem,
DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/context/auth-context';
import { LucideIcon, MoreVertical } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslations } from 'next-intl';
import { upperFirst } from 'lodash';
import { Icons } from '@/config/icons';
import { useModal } from '@/context/modal-context';
import { useRouter } from '@/lib/i18n/navigation';
import { useCallback, useMemo } from 'react';
import { useMovieReviewDeleteMutation } from '@libs/query-client';
import { MovieCompact, ReviewMovie, UserSummary } from '@packages/api-js';

type OptionItem = {
	variant?: 'destructive';
	label: string;
	icon: LucideIcon;
	onSelect: () => void;
}

export function ReviewMovieSettings({
	movieId,
	movie,
	review,
	author,
} : {
	movieId: number;
	movie: MovieCompact;
	review: ReviewMovie;
	author: UserSummary;
}) {
	const { user } = useAuth();
	const t = useTranslations();
	const { createConfirmModal } = useModal();
	const router = useRouter();
	const { mutateAsync: deleteReview } = useMovieReviewDeleteMutation();

	const handleDeleteReview = useCallback(async () => {
		await deleteReview({
			path: {
				movie_id: movieId,
			}
		}, {
			onSuccess: () => {
				toast.success(upperFirst(t('common.messages.deleted')));
			},
			onError: () => {
				toast.error(upperFirst(t('common.messages.an_error_occurred')));
			}
		});
	}, [deleteReview, review.id, t, movie.slug, movieId]);

	const options = useMemo<OptionItem[]>(() => [
		...(user?.id && user.id == author?.id ? [
			{
				label: upperFirst(t('common.messages.edit')),
				icon: Icons.edit,
				onSelect: () => {
					router.push(`/film/${movie.slug || movieId}/review`);
				},
			},
			{
				label: upperFirst(t('common.messages.delete')),
				icon: Icons.delete,
				onSelect: () => createConfirmModal({
					title: upperFirst(t('common.messages.delete_review')),
					description: upperFirst(t('common.messages.do_you_really_want_to_delete_this_review')),
					onConfirm: () => handleDeleteReview(),
				}),
				variant: 'destructive' as const,
			}
		] : []),
	], [user, t, createConfirmModal, handleDeleteReview, author, movie.slug, movieId, review.id, router]);

	if (!options.length) return null;

	return (
	<DropdownMenu>
		<DropdownMenuTrigger asChild>
			<Button variant="outline" size={'icon'}>
				<span className="sr-only">{upperFirst(t('common.messages.open_menu'))}</span>
				<MoreVertical />
			</Button>
		</DropdownMenuTrigger>
		<DropdownMenuContent align="end">
			{options.map((option) => (
			<DropdownMenuItem
			key={option.label}
			variant={option.variant}
			onSelect={option.onSelect}
			>
				<option.icon className="mr-2 h-4 w-4"/>
				{option.label}
			</DropdownMenuItem>
			))}
		</DropdownMenuContent>
	</DropdownMenu>
	);
}
  