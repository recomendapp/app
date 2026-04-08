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
import { usePathname, useRouter } from '@/lib/i18n/navigation';
import { useCallback, useMemo } from 'react';
import { ReviewTvSeries, TvSeriesCompact, UserSummary } from '@libs/api-js';
import { useTvSeriesReviewDeleteMutation } from '@libs/query-client';

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
	tvSeries: TvSeriesCompact;
	review: ReviewTvSeries;
	author: UserSummary;
}) {
	const { user } = useAuth();
	const t = useTranslations();
	const { createConfirmModal } = useModal();
	const pathname = usePathname();
	const router = useRouter();
	const { mutateAsync: deleteReview } = useTvSeriesReviewDeleteMutation();

	const handleDeleteReview = useCallback(async () => {
		await deleteReview({
			path: {
				tv_series_id: tvSeriesId,
			}
		}, {
			onSuccess: () => {
				toast.success(upperFirst(t('common.messages.deleted')));
			},
			onError: () => {
				toast.error(upperFirst(t('common.messages.an_error_occurred')));
			}
		});
	}, [deleteReview, review.id, t, pathname, router, tvSeries, tvSeriesId]);

	const options = useMemo<OptionItem[]>(() => [
		...(user?.id && user?.id == author?.id ? [
			{
				label: upperFirst(t('common.messages.edit')),
				icon: Icons.edit,
				onSelect: () => {
					router.push(`/tv-series/${tvSeries.slug || tvSeriesId}/review`);
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
	], [user, t, createConfirmModal, handleDeleteReview, author, tvSeries.slug, tvSeriesId, review.id, router]);


	if (user?.id != author?.id) return null;

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
  