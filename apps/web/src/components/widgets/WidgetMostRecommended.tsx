"use client"

import {
	Carousel,
	CarouselContent,
	CarouselItem,
	CarouselNext,
	CarouselPlayPause,
	CarouselPrevious,
  } from "@/components/ui/carousel"
import { Card, CardContent, CardFooter, CardHeader } from "../ui/card";
import { Button } from "../ui/button";
import { Link } from "@/lib/i18n/navigation";
import { DateOnlyYearTooltip } from "../utils/Date";
import { SendIcon } from "lucide-react";
import { useModal } from "@/context/modal-context";
import Autoplay from "embla-carousel-autoplay"
import { useCallback, useMemo, useRef, useState } from "react";
import { TooltipBox } from "../Box/TooltipBox";
import { cn } from "@/lib/utils";
import { Skeleton } from "../ui/skeleton";
import { useAuth } from "@/context/auth-context";
import { useTranslations } from "next-intl";
import { BadgeMedia } from "../Badge/BadgeMedia";
import Image from "next/image";
import { upperFirst } from "lodash";
import { ModalUserRecosMovieSend } from "../Modals/recos/ModalUserRecosMovieSend";
import { ModalUserRecosTvSeriesSend } from "../Modals/recos/ModalUserRecosTvSeriesSend";
import { getMediaDetails } from "@/utils/get-media-details";
import { Database } from "@recomendapp/types";
import { getTmdbImage } from "@/lib/tmdb/getTmdbImage";
import { ContextMenuMovie } from "../ContextMenu/ContextMenuMovie";
import { ContextMenuTvSeries } from "../ContextMenu/ContextMenuTvSeries";
import { useQuery } from "@tanstack/react-query";
import { useWidgetMostRecommendedOptions } from "@/api/client/options/widgetOptions";


interface WidgetMostRecommendedProps extends React.HTMLAttributes<HTMLDivElement> {}

export const WidgetMostRecommended = ({
	className,
} : WidgetMostRecommendedProps) => {
	const {
		data,
		isLoading,
		isError
	} = useQuery(useWidgetMostRecommendedOptions({
		filters: {
			limit: 10,
			sortBy: 'recommendation_count',
			sortOrder: 'desc',
		}
	}));
	const [isPlaying, setIsPlaying] = useState(true);
	const autoplay = useRef(
		Autoplay({
			delay: 8000,
		})
	)

	if (data === undefined || isLoading) {
		return <Skeleton className={cn("w-full h-80", className)} />
	}
	
	if (!data.length || isError) return null;
	return (
	<Carousel
	opts={{
		loop: true,
	}}
	className={cn("w-full", className)}
	plugins={[autoplay.current]}
	onMouseEnter={autoplay.current.stop}
	onMouseLeave={() => isPlaying && autoplay.current.play()}
	>
		<CarouselContent>
			{data.map((item, index) => <Item key={`${item.type}:${item.media_id}`} item={item} index={index} />)}
		</CarouselContent>
		<div className="absolute bottom-6 right-2 flex gap-2">
			<CarouselPlayPause
			autoplay={autoplay.current}
			className="static left-auto top-auto translate-y-0"
			isPlaylistCallback={(e) => setIsPlaying(e)}
			/>
			<CarouselPrevious className="static left-auto top-auto translate-y-0"/>
			<CarouselNext className="static right-auto top-auto translate-y-0"/>
		</div>
	</Carousel>
	);
};


type ItemProps =
  {
    item: Database['public']['Views']['widget_most_recommended']['Row'];
	index: number;
  } & React.ComponentProps<typeof CarouselItem>;

const Item = ({
	item,
	index,
	...props
}: ItemProps) => {
	const { session } = useAuth();
	const { openModal } = useModal();
	const t = useTranslations('common');
	const details = useMemo(() => {
		switch (item.type) {
			case 'movie':
				return getMediaDetails({ type: 'movie', media: item.media });
			case 'tv_series':
				return getMediaDetails({ type: 'tv_series', media: item.media });
			default:
				return null;
		}
	}, [item]);
	const handleReco = useCallback(() => {
		if (item.media) {
			switch (item.type) {
				case 'movie':
					openModal(ModalUserRecosMovieSend, { movieId: item.media_id!, movieTitle: details?.title! })
					break;
				case 'tv_series':
					openModal(ModalUserRecosTvSeriesSend, { tvSeriesId: item.media_id!, tvSeriesTitle: details?.title! })
					break;
			}
		}
	}, [item, details, openModal]);

	if (!details) return null;
	return (
		<CarouselItem className="" {...props}>
			<ItemContextMenu item={item}>
				<Card className="overflow-hidden relative bg-black/40 flex flex-col h-full justify-between gap-2">
					{item.media?.backdrop_url && (
						<Image
						src={getTmdbImage({ path: item.media?.backdrop_path, size: 'w1280' })}
						alt={details.title ?? ''}
						fill
						className="object-cover -z-10"
						unoptimized
						/>
					)}
					<CardHeader className="flex flex-row justify-between items-center gap-2 text-xl font-semibold leading-none tracking-tight ">
						<h3 className="text-xl">
							{upperFirst(t('messages.most_recommended', { count: 0 }))}
						</h3>
						<div className="flex flex-col items-end gap-2">
							<div># {index + 1}</div>
							<BadgeMedia type={item.type} />
						</div>
					</CardHeader>
					<CardContent>
						<Link href={item.media.url ?? ''} className="w-fit text-clamp-title line-clamp-2 font-semibold">
							{details.title}
							{details.date && <sup className="ml-2">
								<DateOnlyYearTooltip date={details.date} className="text-base font-medium" />
							</sup>}
						</Link>
						{item.media.genres ? <div>
							{item.media?.genres?.map((genre, index: number) => (
							<span key={genre.id}>
								<Button
								variant="link"
								className="w-fit p-0 h-full font-normal"
								asChild
								>
								<Link href={`/genre/${genre.id}`}>
									{genre.name}
								</Link>
								</Button>
								{index !== item.media.genres?.length! - 1 && (
								<span>, </span>
								)}
							</span>
							))}
						</div> : null}
						{details.description && (
							<div className="max-w-xl line-clamp-2 pt-2">
								{details.description}
							</div>
						)}
					</CardContent>
					<CardFooter className="flex items-center gap-2">
						{session && (
							<TooltipBox tooltip={session ? 'Envoyer à un(e) ami(e)' : undefined}>
								<Button size={"icon"} variant={'outline'} className="bg-red-500" onClick={handleReco}>
									<SendIcon className="w-4 h-4 fill-foreground" />
								</Button>
							</TooltipBox>
						)}
						{item.recommendation_count} reco{Number(item.recommendation_count) > 1 ? 's' : ''}
					</CardFooter>
				</Card>
			</ItemContextMenu>
		</CarouselItem>
	)
};

const ItemContextMenu = ({
	item,
	children
}: {
	item: Database['public']['Views']['widget_most_recommended']['Row'];
	children: React.ReactNode;
}) => {
	switch (item.type) {
		case 'movie':
			return (
				<ContextMenuMovie movie={item.media}>
					{children}
				</ContextMenuMovie>
			);
		case 'tv_series':
			return (
				<ContextMenuTvSeries tvSeries={item.media}>
					{children}
				</ContextMenuTvSeries>
			);
		default:
			return <>{children}</>;
	}
}