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
import { useQuery } from "@tanstack/react-query";
import { movieLogOptions, useMovieLogSetMutation } from "@libs/query-client";

interface ButtonUserActivityMovieLikeProps
	extends React.ComponentProps<typeof Button> {
		movieId: number;
		stopPropagation?: boolean;
	}

const ButtonUserActivityMovieLike = React.forwardRef<
	React.ComponentRef<typeof Button>,
	ButtonUserActivityMovieLikeProps
>(({ movieId, stopPropagation = true, className, ...props }, ref) => {
	const { user } = useAuth();
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

	const { mutateAsync: handleLog, isPending } = useMovieLogSetMutation();

	const handleToggle = React.useCallback(async (e: React.MouseEvent<HTMLButtonElement>) => {
		stopPropagation && e.stopPropagation();
		await handleLog({
			path: {
				movie_id: movieId,
			},
			body: {
				isLiked: activity?.isLiked !== undefined ? !activity.isLiked : true,
			}
		}, {
			onError: () => {
				toast.error(upperFirst(t('common.messages.an_error_occurred')));
			}
		});
	}, [activity, movieId, stopPropagation, t]);

	if (user == null) {
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
		<TooltipBox tooltip={activity?.isLiked ? upperFirst(t('common.messages.remove_from_heart_picks')) : upperFirst(t('common.messages.add_to_heart_picks'))}>
			<Button
			ref={ref}
			onClick={handleToggle}
			disabled={isLoading || isError || activity === undefined || isPending}
			size="icon"
			variant={'outline'}
			className={cn(
				'rounded-full',
				activity?.isLiked ? 'bg-accent-pink!' : '',
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
				className={`${activity?.isLiked ? 'fill-foreground' : ''}`}
				/>
				)}
			</Button>
		</TooltipBox>
	);
});
ButtonUserActivityMovieLike.displayName = 'ButtonUserActivityMovieLike';

export default ButtonUserActivityMovieLike;
