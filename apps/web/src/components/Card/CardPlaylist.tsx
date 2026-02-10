'use client';

import { AspectRatio } from '@/components/ui/aspect-ratio';
import { cn } from '@/lib/utils';
import { ImageWithFallback } from '../utils/ImageWithFallback';
import { Link } from "@/lib/i18n/navigation";
import React from 'react';
import { useTranslations } from 'next-intl';
import { ContextMenuPlaylist } from '../ContextMenu/ContextMenuPlaylist';
import { Playlist, User } from '@packages/api-js';

interface CardPlaylistProps
	extends React.HTMLAttributes<HTMLDivElement> {
		variant?: "default";
		playlist: Playlist;
		owner?: Pick<User, 'username'>;
		showItemCount?: boolean;
	}

const CardPlaylistDefault = React.forwardRef<
	HTMLDivElement,
	Omit<CardPlaylistProps, "variant">
>(({ className, playlist, owner, showItemCount, children, ...props }, ref) => {
	const t = useTranslations();
	return (
		<div
			ref={ref}
			className={cn(
				"group border-none",
				className
			)}
			{...props}
		>
			<div className='p-0'>
				<AspectRatio ratio={1 / 1} className='w-full rounded-xl overflow-hidden'>
					<ImageWithFallback
						src={playlist.poster}
						alt={playlist.title}
						fill
						sizes={`
						(max-width: 640px) 96px,
						(max-width: 1024px) 120px,
						150px
						`}
						className="object-cover"
						type="playlist"
					/>
					<div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-30 transition-opacity duration-300" />
				</AspectRatio>
			</div>
			<div className='p-0'>
				<p className="line-clamp-2 wrap-break-word group-hover:text-primary/80">{playlist.title}</p>
				{owner && <p className="line-clamp-1 text-sm italic text-muted-foreground">{t('common.messages.by_name', { name: owner.username })}</p>}
				{showItemCount && (
					<p className="line-clamp-1 text-sm italic text-muted-foreground">
					{t('common.messages.item_count', { count: playlist.itemsCount ?? 0 })}
					</p>
				)}
			</div>
		</div>
	);
});
CardPlaylistDefault.displayName = "CardPlaylistDefault";

const CardPlaylist = React.forwardRef<
	HTMLDivElement,
	CardPlaylistProps
>(({ className, variant = "default", ...props }, ref) => {
	return (
	<ContextMenuPlaylist playlist={props.playlist} owner={props.owner}>
		<Link href={`/playlist/${props.playlist.id}`}>
			{variant === "default" ? (
				<CardPlaylistDefault ref={ref} className={className} {...props} />
			) : null}
		</Link>
	</ContextMenuPlaylist>
	);
});
CardPlaylist.displayName = "CardPlaylist";

export {
	type CardPlaylistProps,
	CardPlaylist,
	CardPlaylistDefault,
}