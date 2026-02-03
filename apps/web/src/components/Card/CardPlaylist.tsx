'use client';

import { AspectRatio } from '@/components/ui/aspect-ratio';
import { cn } from '@/lib/utils';
import { ImageWithFallback } from '../utils/ImageWithFallback';
import { Link } from "@/lib/i18n/navigation";
import { Playlist } from '@recomendapp/types';
import React from 'react';
import { useTranslations } from 'next-intl';
import { ContextMenuPlaylist } from '../ContextMenu/ContextMenuPlaylist';

interface CardPlaylistProps
	extends React.HTMLAttributes<HTMLDivElement> {
		variant?: "default";
		playlist: Playlist;
		showByUser?: boolean;
		showItemCount?: boolean;
	}

const CardPlaylistDefault = React.forwardRef<
	HTMLDivElement,
	Omit<CardPlaylistProps, "variant">
>(({ className, playlist, showItemCount, showByUser = true, children, ...props }, ref) => {
	const t = useTranslations();
	const renderItemsCount = () => {
		switch (playlist.type) {
			case 'movie':
				return t('common.messages.film_count', { count: playlist?.items_count ?? 0 });
			case 'tv_series':
				return t('common.messages.tv_series_count', { count: playlist?.items_count ?? 0 });
			default:
				return t('common.messages.item_count', { count: playlist?.items_count ?? 0 });
		}
	}
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
						src={playlist?.poster_url ?? ''}
						alt={playlist?.title ?? ''}
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
				<p className="line-clamp-2 wrap-break-word group-hover:text-primary/80">{playlist?.title}</p>
				{showByUser && <p className="line-clamp-1 text-sm italic text-muted-foreground">{t('common.messages.by_name', { name: playlist.user?.username! })}</p>}
				{showItemCount && (
					<p className="line-clamp-1 text-sm italic text-muted-foreground">
					{renderItemsCount()}
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
>(({ className, playlist, variant = "default", ...props }, ref) => {
	return (
	<ContextMenuPlaylist playlist={playlist}>
		<Link href={`/playlist/${playlist?.id}`}>
			{variant === "default" ? (
				<CardPlaylistDefault ref={ref} className={className} playlist={playlist} {...props} />
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