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
import { userPlaylistLikeOptions, useUserPlaylistLikeMutation, useUserPlaylistUnlikeMutation } from "@libs/query-client";

interface PlaylistActionLikeProps
	extends React.ComponentProps<typeof Button> {
		playlistId: number;
		stopPropagation?: boolean;
	}

const PlaylistActionLike = React.forwardRef<
	HTMLDivElement,
	PlaylistActionLikeProps
>(({ playlistId, stopPropagation = true, ...props }, ref) => {
	const { user } = useAuth();
	const t = useTranslations();
	const pathname = usePathname();

	const {
		data: liked,
		isLoading,
		isError,
	} = useQuery(userPlaylistLikeOptions({
		userId: user?.id,
		playlistId: playlistId,
	}));
	const { mutateAsync: save, isPending: insertIsPending } = useUserPlaylistLikeMutation({
		userId: user?.id,
	});
	const { mutateAsync: unsave, isPending: deleteIsPending } = useUserPlaylistUnlikeMutation({
		userId: user?.id,
	});

	const handleLike = React.useCallback(async (e: React.MouseEvent) => {
		stopPropagation && e.stopPropagation();
		await save({
			path: {
				playlist_id: playlistId,
			},
		}, {
		  onError: () => {
			toast.error(upperFirst(t('common.messages.an_error_occurred')));
		  }
		});
	}, [playlistId, save, stopPropagation, t]);
	const handleUnsave = React.useCallback(async (e: React.MouseEvent) => {
		stopPropagation && e.stopPropagation();
		await unsave({
			path: {
				playlist_id: playlistId,
			},
		}, {
			onError: () => {
				toast.error(upperFirst(t('common.messages.an_error_occurred')));
			}
		});
	}, [playlistId, unsave, stopPropagation, t]);

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
		<TooltipBox tooltip={liked ? upperFirst(t('common.messages.delete')) : upperFirst(t('common.messages.save'))}>
			<Button
			onClick={liked ? handleUnsave : handleLike}
			disabled={isLoading || isError || liked === undefined || insertIsPending || deleteIsPending}
			size="icon"
			variant={'outline'}
			{...props}
			>
				{(isLoading || liked === undefined)  ? (
				<Icons.spinner className="animate-spin" />
				) : isError ? (
				<AlertCircleIcon />
				) : (
				<Icons.like className={`${liked && 'fill-foreground'}`} />
				)}
			</Button>
		</TooltipBox>
	);
});
PlaylistActionLike.displayName = 'PlaylistActionLike';

export default PlaylistActionLike;
