import * as React from "react"
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { Icons } from "@/config/icons";
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
import { tvSeasonLogOptions, useTvSeasonLogDeleteMutation, useTvSeasonLogSetMutation } from "@libs/query-client";
import { LogTvSeason, TvSeasonCompact } from "@packages/api-js/src";

interface ButtonLogTvSeasonWatchProps
	extends React.ComponentProps<typeof Button> {
		tvSeason: TvSeasonCompact;
	}

const ButtonLogTvSeasonWatch = React.forwardRef<
	React.ComponentRef<typeof Button>,
	ButtonLogTvSeasonWatchProps
>(({ tvSeason, className, ...props }, ref) => {
	const { user } = useAuth();
  	const { createConfirmModal } = useModal();
	const t = useTranslations();
	const {
		data: activity,
		isLoading,
		isError,
	} = useQuery(tvSeasonLogOptions({
		userId: user?.id,
		tvSeriesId: tvSeason.tvSeriesId,
		seasonNumber: tvSeason.seasonNumber,
	}));
	const { mutateAsync: handleLog, isPending: isInsertPending } = useTvSeasonLogSetMutation();
	const { mutateAsync: handleUnlog, isPending: isDeletePending } = useTvSeasonLogDeleteMutation();

	const handleInsertActivity = React.useCallback(async (status?: LogTvSeason['status']) => {
		await handleLog({
			path: {
				tv_series_id: tvSeason.tvSeriesId,
				season_number: tvSeason.seasonNumber,
			},
			body: {
				status: status,
			}
		}, {
			onError: () => {
				toast.error(upperFirst(t('common.messages.an_error_occurred')));
			}
		});
	}, [activity, user, t, tvSeason, handleLog]);

	const handleDeleteActivity = React.useCallback(async () => {
		createConfirmModal({
			title: upperFirst(t('common.messages.remove_from_watched')),
			description: t('components.media.actions.watch.remove_from_watched.description'),
			onConfirm: async () => {
				await handleUnlog({
					path: {
						tv_series_id: tvSeason.tvSeriesId,
						season_number: tvSeason.seasonNumber,
					}
				}, {
					onError: () => {
						toast.error(upperFirst(t('common.messages.an_error_occurred')));
					}
				})
			}
		});
	}, [activity, t, createConfirmModal, handleUnlog, tvSeason]);

	if (!user) return null;

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
								description: t('components.tv_series.season.actions.watch.complete.description', { seasonNumber: tvSeason.seasonNumber }),
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
ButtonLogTvSeasonWatch.displayName = 'ButtonLogTvSeasonWatch';

export default ButtonLogTvSeasonWatch;
