import * as React from "react"
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { TooltipBox } from "@/components/Box/TooltipBox";
import { Link } from "@/lib/i18n/navigation";
import { Icons } from "@/config/icons";
import { usePathname } from '@/lib/i18n/navigation';
import { AlertCircleIcon } from "lucide-react";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";
import { upperFirst } from "lodash";
import { useQuery } from "@tanstack/react-query";
import { userPlaylistSavedOptions, useUserPlaylistSaveMutation, useUserPlaylistUnsaveMutation } from "@libs/query-client";

interface PlaylistActionSaveProps
	extends React.ComponentProps<typeof Button> {
		playlistId: number;
		stopPropagation?: boolean;
	}

const PlaylistActionSave = React.forwardRef<
	HTMLDivElement,
	PlaylistActionSaveProps
>(({ playlistId, stopPropagation = true, ...props }, ref) => {
	const { user } = useAuth();
	const t = useTranslations();
	const pathname = usePathname();

	const {
		data: saved,
		isLoading,
		isError,
	} = useQuery(userPlaylistSavedOptions({
		userId: user?.id,
		playlistId: playlistId,
	}));
	const { mutateAsync: save, isPending: insertIsPending } = useUserPlaylistSaveMutation({
		userId: user?.id,
	});
	const { mutateAsync: unsave, isPending: deleteIsPending } = useUserPlaylistUnsaveMutation({
		userId: user?.id,
	});

	const handleSave = React.useCallback(async (e: React.MouseEvent) => {
		stopPropagation && e.stopPropagation();
		console.log('save', saved)
		if (saved) return;
		await save({
			path: {
				playlist_id: playlistId,
			},
		}, {
		  onError: () => {
			toast.error(upperFirst(t('common.messages.an_error_occurred')));
		  }
		});
	}, [playlistId, save, stopPropagation, t, saved]);
	const handleUnsave = React.useCallback(async (e: React.MouseEvent) => {
		stopPropagation && e.stopPropagation();
		console.log('unsave', saved)
		if (!saved) return;
		await unsave({
			path: {
				playlist_id: playlistId,
			},
		}, {
			onError: () => {
				toast.error(upperFirst(t('common.messages.an_error_occurred')));
			}
		});
	}, [playlistId, unsave, stopPropagation, t, saved]);

	if (user == null) {
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
			onClick={saved ? handleUnsave : handleSave}
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
