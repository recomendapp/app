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
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useUserActivityMovieOptions } from "@/api/client/options/userOptions";
import { userKeys } from "@/api/client/keys/userKeys";
import { useUserActivityMovieInsertMutation, useUserActivityMovieUpdateMutation } from "@/api/client/mutations/userMutations";

interface ButtonUserActivityMovieLikeProps
	extends React.ComponentProps<typeof Button> {
		movieId: number;
		stopPropagation?: boolean;
	}

const ButtonUserActivityMovieLike = React.forwardRef<
	React.ComponentRef<typeof Button>,
	ButtonUserActivityMovieLikeProps
>(({ movieId, stopPropagation = true, className, ...props }, ref) => {
	const { session } = useAuth();
	const t = useTranslations();
	const pathname = usePathname();
	const queryClient = useQueryClient();

	const {
		data: activity,
		isLoading,
		isError,
	} = useQuery(useUserActivityMovieOptions({
		userId: session?.user.id,
		movieId: movieId,
	}));

	const { mutateAsync: insertActivity, isPending: isInsertPending } = useUserActivityMovieInsertMutation();
	const { mutateAsync: updateActivity, isPending: isUpdatePending } = useUserActivityMovieUpdateMutation();

	const handleLike = React.useCallback(async (e: React.MouseEvent<HTMLButtonElement>) => {
		stopPropagation && e.stopPropagation();
		if (!session?.user.id) return;
		if (activity) {
			await updateActivity({
				activityId: activity.id,
				isLiked: true,
			}, {
				onSuccess: () => {
					queryClient.invalidateQueries({
						queryKey: userKeys.heartPicks({ userId: session.user.id, type: 'movie' })
					});
				},
				onError: () => {
					toast.error(upperFirst(t('common.messages.an_error_occurred')));
				}
			});
		} else {
			await insertActivity({
				userId: session?.user.id,
				movieId: movieId,
				isLiked: true,
			}, {
				onSuccess: (data) => {
					queryClient.invalidateQueries({
						queryKey: userKeys.heartPicks({ userId: session.user.id, type: 'movie' })
					});
				},
				onError: () => {
					toast.error(upperFirst(t('common.messages.an_error_occurred')));
				}
			});
		}
	}, [activity, insertActivity, movieId, queryClient, session, stopPropagation, t, updateActivity]);
	const handleUnlike = React.useCallback(async (e: React.MouseEvent<HTMLButtonElement>) => {
		stopPropagation && e.stopPropagation();
		if (!session?.user.id) return;
		if (!activity) return;
		await updateActivity({
			activityId: activity.id,
			isLiked: false,
		}, {
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: userKeys.heartPicks({ userId: session.user.id, type: 'movie' })
				});
			},
			onError: () => {
				toast.error(upperFirst(t('common.messages.an_error_occurred')));
			}
		});
	}, [activity, queryClient, session, stopPropagation, t, updateActivity]);

	if (session == null) {
		return (
		<TooltipBox tooltip={upperFirst(t('common.messages.please_login'))}>
			<Button
			ref={ref}
			size={'icon'}
			variant={'outline'}
			className={cn("rounded-full", className)}
			asChild
			{...props}
			>
			<Link href={`/auth/login?redirect=${encodeURIComponent(pathname)}`}>
				<Icons.like className={`transition hover:text-accent-pink`} />
			</Link>
			</Button>
		</TooltipBox>
		)
	}

	return (
		<TooltipBox tooltip={activity?.is_liked ? upperFirst(t('common.messages.remove_from_heart_picks')) : upperFirst(t('common.messages.add_to_heart_picks'))}>
			<Button
			ref={ref}
			onClick={(e) => activity?.is_liked ? handleUnlike(e) : handleLike(e)}
			disabled={isLoading || isError || activity === undefined || isInsertPending || isUpdatePending}
			size="icon"
			variant={'outline'}
			className={cn(
				'rounded-full',
				activity?.is_liked ? 'bg-accent-pink!' : '',
				className
			)}
			{...props}
			>
				{(isLoading || activity === undefined) ? (
				<Icons.spinner className="animate-spin" />
				) : isError ? (
				<AlertCircleIcon />
				) : (
				<Icons.like
				className={`${activity?.is_liked ? 'fill-foreground' : ''}`}
				/>
				)}
			</Button>
		</TooltipBox>
	);
});
ButtonUserActivityMovieLike.displayName = 'ButtonUserActivityMovieLike';

export default ButtonUserActivityMovieLike;
