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
import { MediaTvSeries, Profile, UserReviewTvSeries } from '@recomendapp/types';
import { useTranslations } from 'next-intl';
import { upperFirst } from 'lodash';
import { Icons } from '@/config/icons';
import { useModal } from '@/context/modal-context';
import { usePathname, useRouter } from '@/lib/i18n/navigation';
import { useCallback, useMemo } from 'react';
import { useUserReviewTvSeriesDeleteMutation } from '@/api/client/mutations/userMutations';

type OptionItem = {
	variant?: 'destructive';
	label: string;
	icon: LucideIcon;
	onSelect: () => void;
}

export function ReviewTvSeriesSettings({
	tvSeriesId,
	tvSeries,
	review,
	author,
} : {
	tvSeriesId: number;
	tvSeries: MediaTvSeries;
	review: UserReviewTvSeries;
	author: Profile;
}) {
	const { session } = useAuth();
	const t = useTranslations();
	const { createConfirmModal } = useModal();
	const pathname = usePathname();
	const router = useRouter();
	const { mutateAsync: deleteReview } = useUserReviewTvSeriesDeleteMutation({
		userId: session?.user.id,
		tvSeriesId,
	});

	const handleDeleteReview = useCallback(async () => {
		await deleteReview({
			id: review.id,
		}, {
			onSuccess: () => {
				toast.success(upperFirst(t('common.messages.deleted')));
				const regex = new RegExp(`^\/tv-series\/[^/]+\/review\/${review.id}$`);
				if (pathname.match(regex)) {
					router.replace(`/tv-series/${tvSeries.slug || tvSeriesId}`);
				}
			},
			onError: () => {
				toast.error(upperFirst(t('common.messages.an_error_occurred')));
			}
		});
	}, [deleteReview, review.id, t, pathname, router, tvSeries, tvSeriesId]);

	const options = useMemo<OptionItem[]>(() => [
		...(session?.user.id && session?.user.id == author?.id ? [
			{
				label: upperFirst(t('common.messages.edit')),
				icon: Icons.edit,
				onSelect: () => {
					router.push(`/tv-series/${tvSeries.slug || tvSeriesId}/review/${review.id}/edit`);
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
	], [session, t, createConfirmModal, handleDeleteReview, author, tvSeries.slug, tvSeriesId, review.id, router]);


	if (session?.user.id != author?.id) return null;

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
  