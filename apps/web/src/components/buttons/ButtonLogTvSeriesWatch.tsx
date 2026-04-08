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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { tvSeriesLogOptions, useTvSeriesLogDeleteMutation, useTvSeriesLogSetMutation } from "@libs/query-client";
import { LogTvSeries, TvSeriesCompact } from "@libs/api-js";

interface ButtonLogTvSeriesWatchProps
	extends React.ComponentProps<typeof Button> {
		tvSeries: TvSeriesCompact;
	}

const ButtonLogTvSeriesWatch = React.forwardRef<
	React.ComponentRef<typeof Button>,
	ButtonLogTvSeriesWatchProps
>(({ tvSeries, className, ...props }, ref) => {
	const { user } = useAuth();
  	const { createConfirmModal } = useModal();
	const t = useTranslations();
	const pathname = usePathname();
	const {
		data: activity,
		isLoading,
		isError,
	} = useQuery(tvSeriesLogOptions({
		userId: user?.id,
		tvSeriesId: tvSeries.id,
	}));
	const { mutateAsync: handleLog, isPending: isInsertPending } = useTvSeriesLogSetMutation();
	const { mutateAsync: handleUnlog, isPending: isDeletePending } = useTvSeriesLogDeleteMutation();

	const handleInsertActivity = React.useCallback(async (status?: LogTvSeries['status']) => {
		await handleLog({
			path: {
				tv_series_id: tvSeries.id,
			},
			body: {
				status: status,
			}
		}, {
			onError: () => {
				toast.error(upperFirst(t('common.messages.an_error_occurred')));
			}
		});
	}, [activity, user, t, tvSeries.id, handleLog]);

	const handleDeleteActivity = React.useCallback(async () => {
		createConfirmModal({
			title: upperFirst(t('common.messages.remove_from_watched')),
			description: t('components.media.actions.watch.remove_from_watched.description'),
			onConfirm: async () => {
				await handleUnlog({
					path: {
						tv_series_id: tvSeries.id,
					}
				}, {
					onError: () => {
						toast.error(upperFirst(t('common.messages.an_error_occurred')));
					}
				})
			}
		});
	}, [activity, t, createConfirmModal, handleUnlog, tvSeries.id]);

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
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
				ref={ref}
				disabled={isLoading || isError || activity === undefined || isInsertPending || isDeletePending}
				size="icon"
				variant={'outline'}
				className={cn(
					'rounded-full',
					activity?.status === 'completed'
						? 'bg-accent-blue! text-accent-blue-foreground!'
						: activity?.status === 'watching'
						? 'bg-accent-orange! text-accent-orange-foreground!'
						: '',
					className
				)}
				{...props}
				>
					{(isLoading || activity === undefined)  ? (
					<Icons.spinner className="animate-spin" />
					) : isError ? (
					<AlertCircleIcon />
					) : (
						activity?.status === 'watching' ? (
							<Icons.clock />
						) : (
							<Icons.check />
						)
					)}
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="w-40" align="start">
				{activity?.status !== 'completed' && (
					<>
						{!activity?.status && (
							<DropdownMenuItem onClick={() => handleInsertActivity('watching')}>
								{upperFirst(t('common.messages.in_progress'))}
							</DropdownMenuItem>
						)}
						{/* {activity && (
							<DropdownMenuItem
							disabled={activity?.status === 'dropped'}
							onClick={() => handleInsertActivity('watching')}
							>
								{upperFirst(t('common.messages.give_up'))}
							</DropdownMenuItem>
						)} */}
						<DropdownMenuItem
						onClick={() => {
							createConfirmModal({
								title: upperFirst(t('common.messages.are_u_sure')),
								description: t('components.tv_series.actions.watch.complete.description'),
								onConfirm: () => handleInsertActivity('completed')
							});
						}}
						>
							{upperFirst(t('common.messages.complete'))}
						</DropdownMenuItem>
					</>
				)}
				{activity && (
					<DropdownMenuItem variant="destructive" onClick={handleDeleteActivity}>
						{upperFirst(t('common.messages.delete'))}
					</DropdownMenuItem>
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);
});
ButtonLogTvSeriesWatch.displayName = 'ButtonLogTvSeriesWatch';

export default ButtonLogTvSeriesWatch;
