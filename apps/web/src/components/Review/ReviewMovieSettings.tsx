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
import { MediaMovie, Profile, UserReviewMovie } from '@recomendapp/types';
import { useTranslations } from 'next-intl';
import { upperFirst } from 'lodash';
import { Icons } from '@/config/icons';
import { useModal } from '@/context/modal-context';
import { usePathname, useRouter } from '@/lib/i18n/navigation';
import { useCallback, useMemo } from 'react';
import { useUserReviewMovieDeleteMutation } from '@/api/client/mutations/userMutations';

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
	movie: MediaMovie;
	review: UserReviewMovie;
	author: Profile;
}) {
	const { session } = useAuth();
	const t = useTranslations();
	const { createConfirmModal } = useModal();
	const pathname = usePathname();
	const router = useRouter();
	const { mutateAsync: deleteReview } = useUserReviewMovieDeleteMutation({
		userId: session?.user.id,
		movieId,
	});

	const handleDeleteReview = useCallback(async () => {
		await deleteReview({
			id: review.id,
		}, {
			onSuccess: () => {
				toast.success(upperFirst(t('common.messages.deleted')));
				const regex = new RegExp(`^\/film\/[^/]+\/review\/${review.id}$`);
				if (pathname.match(regex)) {
					router.replace(`/film/${movie.slug || movieId}`);
				}
			},
			onError: () => {
				toast.error(upperFirst(t('common.messages.an_error_occurred')));
			}
		});
	}, [deleteReview, review.id, t, pathname, router, movie.slug, movieId]);

	const options = useMemo<OptionItem[]>(() => [
		...(session?.user.id && session?.user.id == author?.id ? [
			{
				label: upperFirst(t('common.messages.edit')),
				icon: Icons.edit,
				onSelect: () => {
					router.push(`/film/${movie.slug || movieId}/review/${review.id}/edit`);
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
	], [session, t, createConfirmModal, handleDeleteReview, author, movie.slug, movieId, review.id, router]);

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
  