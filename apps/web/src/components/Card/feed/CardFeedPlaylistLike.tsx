"use client"

import { Link } from "@/lib/i18n/navigation";
import MediaPoster from "@/components/Media/MediaPoster";
import { useFormatter, useTranslations } from "next-intl";
import { PlaylistLike, Profile } from "@recomendapp/types";
import { cn } from "@/lib/utils";
import { CardUser } from "@/components/Card/CardUser";
import { upperFirst } from "lodash";
import { forwardRef } from "react";

interface CardFeedPlaylistLikeProps extends React.HTMLAttributes<HTMLDivElement> {
	author: Profile;
	playlistLike: PlaylistLike;
}

export const CardFeedPlaylistLike = forwardRef<
	HTMLDivElement,
	CardFeedPlaylistLikeProps
>(({ author, playlistLike, ...props }, ref) => {
	const format = useFormatter();
	const t = useTranslations();
	const { playlist } = playlistLike;

	return (
	  <div ref={ref} className="@container/feed-item flex gap-4 bg-muted rounded-xl p-2 group" {...props}>
		<MediaPoster
		className="w-20 @md/feed-item:w-24 aspect-square"
		src={playlist?.poster_url ?? ''}
		alt={playlist?.title ?? ''}
		fill
		classNameFallback="h-full"
		/>
		<div className="flex flex-col gap-4 w-full">
			<div className="flex justify-between">
				{/* USER */}
				<div className="flex items-center gap-1">
					<CardUser user={author} variant="icon" />
					<p className="text-sm @md/feed-item:text-base text-muted-foreground">
						{t.rich('common.messages.user_liked_playlist', {
							name: () => (
								<Link href={`/@${author.username}`} className="text-foreground hover:underline">
									{author.username}
								</Link>
							)
						})}
					</p>
				</div>
				{playlistLike.created_at && <div className='hidden @md/feed-item:block text-sm text-muted-foreground opacity-0 group-hover:opacity-100 duration-500'>
					{format.relativeTime(new Date(playlistLike.created_at), new Date())}
				</div>}
			</div>
			<Link href={`/playlist/${playlistLike.playlist?.id}`} className="text-md @md/feed-item:text-xl space-x-1 line-clamp-2">
				<span className='font-bold'>{playlistLike.playlist?.title}</span>
			</Link>
			{playlistLike.playlist?.description && (
				<p className={cn("text-xs @md/feed-item:text-sm line-clamp-3 text-justify", !playlistLike.playlist.description?.length && 'text-muted-foreground')}>
					{ playlistLike.playlist.description || upperFirst(t('common.messages.no_description'))}
				</p>
			)}
		</div>
	  </div>
	);
});
CardFeedPlaylistLike.displayName = 'CardFeedPlaylistLike';