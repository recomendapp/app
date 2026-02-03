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
import { ContextMenuWatchlistTvSeries } from "../ContextMenu/ContextMenuWatchlistTvSeries";
import { useQuery } from "@tanstack/react-query";
import { useUserWatchlistTvSeriesItemOptions } from "@/api/client/options/userOptions";
import { useUserWatchlistTvSeriesDeleteMutation, useUserWatchlistTvSeriesInsertMutation } from "@/api/client/mutations/userMutations";

interface ButtonUserWatchlistTvSeriesProps
	extends React.ComponentProps<typeof Button> {
		tvSeriesId: number;
		stopPropagation?: boolean;
	}

const ButtonUserWatchlistTvSeries = React.forwardRef<
	React.ComponentRef<typeof Button>,
	ButtonUserWatchlistTvSeriesProps
>(({ tvSeriesId, stopPropagation = true, className, ...props }, ref) => {
	const { session } = useAuth();
	const t = useTranslations();
	const pathname = usePathname();

	const {
		data: watchlist,
		isLoading,
		isError,
	} = useQuery(useUserWatchlistTvSeriesItemOptions({
		tvSeriesId: tvSeriesId,
		userId: session?.user.id,
	}));
	const { mutateAsync: insertWatchlist, isPending: isInsertPending } = useUserWatchlistTvSeriesInsertMutation();
	const { mutateAsync: deleteWatchlist, isPending: isDeletePending } = useUserWatchlistTvSeriesDeleteMutation();

	const handleWatchlist = React.useCallback(async (e: React.MouseEvent) => {
		stopPropagation && e.stopPropagation();
		if (watchlist) return;
		if (!session || !tvSeriesId) {
			toast.error(upperFirst(t('common.messages.an_error_occurred')));
			return;
		}
		await insertWatchlist({
			tvSeriesId: tvSeriesId,
		  	userId: session.user.id,
		}, {
		  onError: () => {
			toast.error(upperFirst(t('common.messages.an_error_occurred')));
		  }
		});
	}, [insertWatchlist, tvSeriesId, session, stopPropagation, t, watchlist]);

	const handleUnwatchlist = React.useCallback(async (e: React.MouseEvent) => {
		stopPropagation && e.stopPropagation();
		if (!watchlist) return;
		if (!watchlist.id) {
			toast.error(upperFirst(t('common.messages.an_error_occurred')));
			return;
		}
		await deleteWatchlist({
		  watchlistId: watchlist.id,
		}, {
		  onError: () => {
			toast.error(upperFirst(t('common.messages.an_error_occurred')));
		  }
		});
	}, [deleteWatchlist, stopPropagation, t, watchlist]);

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
				<Icons.watchlist />
			</Link>
			</Button>
		</TooltipBox>
		)
	}

	return (
		<ContextMenuWatchlistTvSeries watchlistItem={watchlist}>
			<TooltipBox tooltip={watchlist ? upperFirst(t('common.messages.remove_from_watchlist')) : upperFirst(t('common.messages.add_to_watchlist'))}>
				<Button
					ref={ref}
					onClick={watchlist ? handleUnwatchlist : handleWatchlist}
					disabled={isLoading || isError || watchlist === undefined || isInsertPending || isDeletePending}
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
		</ContextMenuWatchlistTvSeries>
	);
});
ButtonUserWatchlistTvSeries.displayName = 'ButtonUserWatchlistTvSeries';

export default ButtonUserWatchlistTvSeries;
