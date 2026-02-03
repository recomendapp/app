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
import { useUserPlaylistSavedOptions } from "@/api/client/options/userOptions";
import { useUserPlaylistSavedDeleteMutation, useUserPlaylistSavedInsertMutation } from "@/api/client/mutations/userMutations";

interface PlaylistActionSaveProps
	extends React.ComponentProps<typeof Button> {
		playlistId: number;
		stopPropagation?: boolean;
	}

const PlaylistActionSave = React.forwardRef<
	HTMLDivElement,
	PlaylistActionSaveProps
>(({ playlistId, stopPropagation = true, ...props }, ref) => {
	const { session } = useAuth();
	const t = useTranslations();
	const pathname = usePathname();

	const {
		data: saved,
		isLoading,
		isError,
	} = useQuery(useUserPlaylistSavedOptions({
		userId: session?.user.id,
		playlistId: playlistId,
	}));
	const { mutateAsync: insertPlaylistSaved, isPending: insertIsPending } = useUserPlaylistSavedInsertMutation();
	const { mutateAsync: deletePlaylistSaved, isPending: deleteIsPending } = useUserPlaylistSavedDeleteMutation();

	const handleWatchlist = React.useCallback(async (e: React.MouseEvent) => {
		stopPropagation && e.stopPropagation();
		if (saved) return;
		if (!session || !playlistId) {
			toast.error(upperFirst(t('common.messages.an_error_occurred')));
			return;
		}
		await insertPlaylistSaved({
		  	userId: session.user.id,
			playlistId: playlistId,
		}, {
		  onError: () => {
			toast.error(upperFirst(t('common.messages.an_error_occurred')));
		  }
		});
	}, [session, playlistId, insertPlaylistSaved, stopPropagation, t, saved]);
	const handleUnwatchlist = React.useCallback(async (e: React.MouseEvent) => {
		stopPropagation && e.stopPropagation();
		if (!saved) return;
		if (!saved.id) {
			toast.error(upperFirst(t('common.messages.an_error_occurred')));
			return;
		}
		await deletePlaylistSaved({
		  savedId: saved.id,
		}, {
		  onError: () => {
			toast.error(upperFirst(t('common.messages.an_error_occurred')));
		  }
		});
	}, [deletePlaylistSaved, saved, stopPropagation, t]);

	if (session == null) {
		return (
		<TooltipBox tooltip={upperFirst(t('common.messages.please_login'))}>
			<Button
			size={'icon'}
			variant={'outline'}
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
		<TooltipBox tooltip={saved ? upperFirst(t('common.messages.delete')) : upperFirst(t('common.messages.save'))}>
			<Button
			onClick={async (e) => saved ? await handleUnwatchlist(e) : await handleWatchlist(e)}
			disabled={isLoading || isError || saved === undefined || insertIsPending || deleteIsPending}
			size="icon"
			variant={'outline'}
			{...props}
			>
				{(isLoading || saved === undefined)  ? (
				<Icons.spinner className="animate-spin" />
				) : isError ? (
				<AlertCircleIcon />
				) : (
				<Icons.watchlist className={`${saved && 'fill-foreground'}`} />
				)}
			</Button>
		</TooltipBox>
	);
});
PlaylistActionSave.displayName = 'PlaylistActionSave';

export default PlaylistActionSave;
