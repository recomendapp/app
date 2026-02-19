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
import { ContextMenuWatchlistMovie } from "../ContextMenu/ContextMenuWatchlistMovie";
import { useQuery } from "@tanstack/react-query";
import { movieBookmarkOptions, useMovieBookmarkDeleteMutation, useMovieBookmarkSetMutation } from "@libs/query-client/src";

interface ButtonUserWatchlistMovieProps
	extends React.ComponentProps<typeof Button> {
		movieId: number;
		stopPropagation?: boolean;
	}

const ButtonUserWatchlistMovie = React.forwardRef<
	React.ComponentRef<typeof Button>,
	ButtonUserWatchlistMovieProps
>(({ movieId, stopPropagation = true, className, ...props }, ref) => {
	const { user } = useAuth();
	const t = useTranslations();
	const pathname = usePathname();

	const {
		data: watchlist,
		isLoading,
		isError,
	} = useQuery(movieBookmarkOptions({
		movieId: movieId,
		userId: user?.id,
	}));

	const { mutateAsync: addBookmark, isPending: isAddPending } = useMovieBookmarkSetMutation();
	const { mutateAsync: deleteBookmark, isPending: isDeletePending } = useMovieBookmarkDeleteMutation();

	const handleWatchlist = React.useCallback(async (e: React.MouseEvent) => {
		stopPropagation && e.stopPropagation();
		if (watchlist) return;
		await addBookmark({
		  	path: {
				movie_id: movieId,
			},
		}, {
		  onError: () => {
			toast.error(upperFirst(t('common.messages.an_error_occurred')));
		  }
		});
	}, [addBookmark, movieId, stopPropagation, t, watchlist]);

	const handleUnwatchlist = React.useCallback(async (e: React.MouseEvent) => {
		stopPropagation && e.stopPropagation();
		if (!watchlist) return;
		await deleteBookmark({
		  path: {
			movie_id: movieId,
		  },
		  body: {}
		}, {
		  onError: () => {
			toast.error(upperFirst(t('common.messages.an_error_occurred')));
		  }
		});
	}, [deleteBookmark, movieId, stopPropagation, t, watchlist]);

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
				<Icons.watchlist />
			</Link>
			</Button>
		</TooltipBox>
		)
	}

	return (
		<ContextMenuWatchlistMovie watchlistItem={watchlist}>
			<TooltipBox tooltip={watchlist ? upperFirst(t('common.messages.remove_from_watchlist')) : upperFirst(t('common.messages.add_to_watchlist'))}>
				<Button
					ref={ref}
					onClick={watchlist ? handleUnwatchlist : handleWatchlist}
					disabled={isLoading || isError || watchlist === undefined || isAddPending || isDeletePending}
					size="icon"
					variant={'outline'}
					className={cn(`rounded-full`, className)}
					{...props}
				>
					{(isLoading || watchlist === undefined)  ? (
					<Icons.spinner className="animate-spin" />
					) : isError ? (
					<AlertCircleIcon />
					) : (
					<Icons.watchlist className={`${watchlist && 'fill-foreground'}`} />
					)}
				</Button>
			</TooltipBox>
		</ContextMenuWatchlistMovie>
	);
});
ButtonUserWatchlistMovie.displayName = 'ButtonUserWatchlistMovie';

export default ButtonUserWatchlistMovie;
