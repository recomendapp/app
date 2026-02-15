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
import { useQuery } from "@tanstack/react-query";
import { movieLogOptions, useMovieLogDeleteMutation, useMovieLogSetMutation } from "@libs/query-client";

interface ButtonUserActivityMovieWatchProps
	extends React.ComponentProps<typeof Button> {
		movieId: number;
    stopPropagation?: boolean;
	}

const ButtonUserActivityMovieWatch = React.forwardRef<
	React.ComponentRef<typeof Button>,
	ButtonUserActivityMovieWatchProps
>(({ movieId, stopPropagation = true, className, ...props }, ref) => {
	const { user } = useAuth();
  	const { createConfirmModal } = useModal();
	const t = useTranslations();
	const pathname = usePathname();
	const {
		data: activity,
		isLoading,
		isError,
	} = useQuery(movieLogOptions({
		userId: user?.id,
		movieId: movieId,
	}));
	const { mutateAsync: handleLog, isPending: isLogPending } = useMovieLogSetMutation();
	const { mutateAsync: handleUnlog, isPending: isUnlogPending } = useMovieLogDeleteMutation();

	const handleInsertActivity = React.useCallback(async (e?: React.MouseEvent<HTMLButtonElement>) => {
		stopPropagation && e?.stopPropagation();
		await handleLog({
			path: {
				movie_id: movieId,
			},
			body: {}
		}, {
			onError: () => {
				toast.error(upperFirst(t('common.messages.an_error_occurred')));
			}
		});
	}, [handleLog, movieId, stopPropagation, t]);

	const handleDeleteActivity = React.useCallback(async (e?: React.MouseEvent<HTMLButtonElement>) => {
		stopPropagation && e?.stopPropagation();
		createConfirmModal({
			title: upperFirst(t('common.messages.remove_from_watched')),
			description: t('components.media.actions.watch.remove_from_watched.description'),
			onConfirm: async () => {
				await handleUnlog({
					path: {
						movie_id: movieId,
					}
				}, {
					onError: () => {
						toast.error(upperFirst(t('common.messages.an_error_occurred')));
					}
				});
			}
		});
	}, [handleUnlog, movieId, stopPropagation, t, createConfirmModal]);

	if (user === null) {
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
			disabled={isLoading || isError || activity === undefined || isLogPending || isUnlogPending}
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
