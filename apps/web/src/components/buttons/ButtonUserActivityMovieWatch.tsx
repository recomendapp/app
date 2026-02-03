import * as React from "react"
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { TooltipBox } from "@/components/Box/TooltipBox";
import { Link } from "@/lib/i18n/navigation";
import { Icons } from "@/config/icons";
import { usePathname } from '@/lib/i18n/navigation';
import { cn } from "@/lib/utils";
import { AlertCircleIcon } from "lucide-react";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";
import { upperFirst } from "lodash";
import { useModal } from "@/context/modal-context";
import { useUserActivityMovieOptions } from "@/api/client/options/userOptions";
import { useQuery } from "@tanstack/react-query";
import { useUserActivityMovieDeleteMutation, useUserActivityMovieInsertMutation } from "@/api/client/mutations/userMutations";

interface ButtonUserActivityMovieWatchProps
	extends React.ComponentProps<typeof Button> {
		movieId: number;
    stopPropagation?: boolean;
	}

const ButtonUserActivityMovieWatch = React.forwardRef<
	React.ComponentRef<typeof Button>,
	ButtonUserActivityMovieWatchProps
>(({ movieId, stopPropagation = true, className, ...props }, ref) => {
	const { session } = useAuth();
  	const { createConfirmModal } = useModal();
	const t = useTranslations();
	const pathname = usePathname();
	const {
		data: activity,
		isLoading,
		isError,
	} = useQuery(useUserActivityMovieOptions({
		userId: session?.user.id,
		movieId: movieId,
	}));
	const { mutateAsync: insertActivity, isPending: isInsertPending } = useUserActivityMovieInsertMutation();
	const { mutateAsync: deleteActivity, isPending: isDeletePending } = useUserActivityMovieDeleteMutation();

	const handleInsertActivity = React.useCallback(async (e?: React.MouseEvent<HTMLButtonElement>) => {
		stopPropagation && e?.stopPropagation();
		if (activity || !session?.user.id) return;
		await insertActivity({
		userId: session?.user.id,
		movieId: movieId,
		}), {
		onError: () => {
			toast.error(upperFirst(t('common.messages.an_error_occurred')));
		}
		};
	}, [activity, insertActivity, movieId, session, stopPropagation, t]);

	const handleDeleteActivity = React.useCallback(async (e?: React.MouseEvent<HTMLButtonElement>) => {
		stopPropagation && e?.stopPropagation();
		if (!activity) return;
		createConfirmModal({
			title: upperFirst(t('common.messages.remove_from_watched')),
			description: t('components.media.actions.watch.remove_from_watched.description'),
			onConfirm: async () => {
				await deleteActivity({
					activityId: activity.id,
				}), {
					onError: () => {
					toast.error(upperFirst(t('common.messages.an_error_occurred')));
					}
				};
			}
		});
	}, [activity, deleteActivity, stopPropagation, t, createConfirmModal]);

	if (session === null) {
		return (
		<TooltipBox tooltip={upperFirst(t('common.messages.please_login'))}>
			<Button
			ref={ref}
			size="icon"
			variant={'outline'}
			className={cn(`rounded-full`, className)}
			asChild
			{...props}
			>
				<Link href={`/auth/login?redirect=${encodeURIComponent(pathname)}`}>
					<Icons.check />
				</Link>
			</Button>
		</TooltipBox>
		);
	}

	return (
		<TooltipBox tooltip={activity ? upperFirst(t('common.messages.remove_from_watched')) : upperFirst(t('common.messages.mark_as_watched'))}>
			<Button
			ref={ref}
			onClick={activity ? handleDeleteActivity : handleInsertActivity}
			disabled={isLoading || isError || activity === undefined || isInsertPending || isDeletePending}
			size="icon"
			variant={'outline'}
			className={cn(
				'rounded-full',
				activity ? 'bg-accent-blue!' : '',
				className
			)}
			{...props}
			>
				{(isLoading || activity === undefined)  ? (
				<Icons.spinner className="animate-spin" />
				) : isError ? (
				<AlertCircleIcon />
				) : (
				<Icons.check />
				)}
			</Button>
		</TooltipBox>
	);
});
ButtonUserActivityMovieWatch.displayName = 'ButtonUserActivityMovieWatch';

export default ButtonUserActivityMovieWatch;
