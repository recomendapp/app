import { ScrollArea } from "@/components/ui/scroll-area";
import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuAction, SidebarMenuButton, SidebarMenuItem, SidebarSeparator, useSidebar } from "@/components/ui/sidebar";
import { ImageWithFallback } from "@/components/utils/ImageWithFallback";
import { Icons } from "@/config/icons";
import { useAuth } from "@/context/auth-context";
import { Link, usePathname } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";
import { upperFirst } from "lodash";
import { BookmarkIcon, HeartIcon, SendIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo } from "react";
import { useInView } from "react-intersection-observer";
import { useUI } from "@/context/ui-context";
import { ContextMenuPlaylist } from "@/components/ContextMenu/ContextMenuPlaylist";
import { useModal } from "@/context/modal-context";
import { PlaylistModal } from "@/components/Modals/playlists/PlaylistModal";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useUserPlaylistsInfiniteOptions } from "@/api/client/options/userOptions";

const SidebarCollectionContainerIcon = ({
	className,
	children,
	from,
	to,
} : {
	className?: string;
	children: React.ReactNode;
	from?: string;
	to?: string;
}) => {
	return (
	  <div
		style={{
		  backgroundImage: (from && to) ? `linear-gradient(to top right, ${from}, ${to})` : 'none',
		}}
		className={cn(
		  "w-12 relative overflow-hidden",
		  "aspect-square rounded-md flex items-center justify-center shrink-0 text-white",
		  className
		)}
	  >
		{children}
	  </div>
	);
}

export const SidebarLeftRoutes = () => {
	const { session } = useAuth();
	const { open } = useSidebar();
	const { isMobile } = useUI();
	const t = useTranslations('common');
	const pathname = usePathname();
	const { openModal } = useModal();
	const { ref, inView } = useInView();

	const routes = useMemo(
		() => [
		  {
			icon: Icons.home,
			label: upperFirst(t('messages.home')),
			active: pathname === '/',
			href: '/',
		  },
		  {
			icon: Icons.explore,
			label: upperFirst(t('messages.explore')),
			active: pathname === '/explore',
			href: '/explore',
		  },
		  {
			icon: Icons.feed,
			label: upperFirst(t('messages.feed')),
			active: pathname.startsWith('/feed'),
			href: '/feed',
		  },
		  {
			icon: Icons.search,
			label: upperFirst(t('messages.search')),
			active: pathname.startsWith('/search') || pathname.startsWith('/movie'),
			href: '/search',
		  },
		],
		[pathname, t]
	);

	const collectionRoutes = useMemo(() => [
		{
			icon: <SendIcon fill="#fff" className="w-2/5 h-2/5" />,
			bgFrom: '#FBE773',
			bgTo: '#F18E43',
			label: upperFirst(t('messages.my_recos')),
			active: pathname.startsWith('/collection/my-recos'),
			href: '/collection/my-recos',
		},
		{
			icon: <BookmarkIcon fill="#fff" className="w-2/5 h-2/5" />,
			bgFrom: '#39BAED',
			bgTo: '#32509e',
			label: upperFirst(t('messages.watchlist')),
			active: pathname.startsWith('/collection/watchlist'),
			href: '/collection/watchlist',
		},
		{
			icon: <HeartIcon fill="#fff" className="w-2/5 h-2/5" />,
			bgFrom: '#e6619b',
			bgTo: '#e84749',
			label: upperFirst(t('messages.heart_pick', { count: 0 })),
			active: pathname.startsWith('/collection/heart-picks'),
			href: '/collection/heart-picks',
		},
	], [pathname, t]);

	const unloggedRoutes = useMemo(() => [
		{
			icon: Icons.shop,
			label: upperFirst(t('messages.shop')),
			active: false,
			href: 'https://shop.recomend.app',
			target: '_blank',
		},
		{
			icon: Icons.help,
			label: upperFirst(t('messages.help')),
			active: false,
			href: 'https://help.recomend.app',
			target: '_blank',
		  },
		  {
			icon: Icons.about,
			label: upperFirst(t('messages.about')),
			active: pathname.startsWith('/about'),
			href: '/about',
			target: undefined,
		  },
		  {
			icon: Icons.legal,
			label: upperFirst(t('messages.legal')),
			active: pathname.startsWith('/legal'),
			href: '/legal/terms-of-use',
			target: undefined,
		  }
	], [pathname, t]);

	const {
		data: playlists,
		isLoading,
		fetchNextPage,
		isFetchingNextPage,
		hasNextPage,
	} = useInfiniteQuery(useUserPlaylistsInfiniteOptions({
		userId: session?.user.id,
		filters: {
			sortBy: 'updated_at',
			sortOrder: 'desc',
		}
	}));

	// Fix for sidebar issue with mobile and desktop using different open state
	const sidebarOpen = useMemo(() => {
		if (!isMobile) {
			return open;
		} else {
			return true;
		}
	}, [isMobile, open]);

	useEffect(() => {
		if (inView && hasNextPage) {
			fetchNextPage();
		}
	}, [inView, hasNextPage, playlists, fetchNextPage]);

	return (
		<>
		<SidebarGroup>
			<SidebarGroupLabel>{upperFirst(t('messages.navigation'))}</SidebarGroupLabel>
			<nav>
			<SidebarMenu>
				{/* className={`${!sidebarOpen ? "items-center" : ""}`} */}
				{routes.map((route, i) => (
					<SidebarMenuItem key={i}>
						<SidebarMenuButton tooltip={route.label} isActive={route.active} asChild>
							<Link href={route.href}>
								<route.icon />
								<span className={`line-clamp-1 transition-all duration-300 ${!sidebarOpen ? "opacity-0 hidden" : "opacity-100"}`}>
									{route.label}
								</span>
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>
				))}
			</SidebarMenu>
			</nav>
		</SidebarGroup>
		<SidebarSeparator />
		<SidebarGroup className="overflow-hidden">
			{session ? (
			<SidebarMenu className="h-full">
				<SidebarMenuItem>
					<SidebarMenuButton tooltip={upperFirst(t('messages.library'))} isActive={pathname === '/collection'} asChild>
						<Link href={"/collection"}>
							<Icons.Library />
							<span>
								{upperFirst(t('messages.library'))}
							</span>
						</Link>
					</SidebarMenuButton>
					<SidebarMenuAction onClick={() => openModal(PlaylistModal, {})}>
						<Icons.add />
						<span className="sr-only">{upperFirst(t('messages.create_a_playlist'))}</span>
					</SidebarMenuAction>
				</SidebarMenuItem>
				<ScrollArea className="overflow-y-auto">
					<div className={cn(
						"flex flex-col transition-all",
						!sidebarOpen ? "gap-1" : ""
					)}>

						{collectionRoutes.map((route, i) => (
							<SidebarMenuItem key={i}>
								<SidebarMenuButton tooltip={route.label} isActive={route.active} className="h-fit group-data-[collapsible=icon]:p-0!" asChild>
									<Link href={route.href}>
										<SidebarCollectionContainerIcon from={route.bgFrom} to={route.bgTo} className={`${sidebarOpen ? "w-12" : "w-8"}`}>
											{route.icon}
										</SidebarCollectionContainerIcon>
										<span>
											{route.label}
										</span>
									</Link>
								</SidebarMenuButton>
							</SidebarMenuItem>
						))}
						{playlists?.pages[0]?.length ? (
							playlists?.pages.map((page, i) => (
								page?.map((playlist, index) => (
								<SidebarMenuItem
								key={index}
								ref={(i === playlists.pages.length - 1 && index === page.length - 1) ? ref : undefined }
								>
									<ContextMenuPlaylist playlist={playlist}>
										<SidebarMenuButton
											tooltip={{
												children: (
													<>
														{playlist.title}
														<span className="ml-4 text-muted-foreground">
															{playlist.items_count}
														</span>
													</>
												)
											}}
											className="h-fit group-data-[collapsible=icon]:p-0!"
											isActive={pathname === `/playlist/${playlist.id}`}
											asChild
										>
											<Link href={`/playlist/${playlist.id}`}>
												<SidebarCollectionContainerIcon className={`${sidebarOpen ? "w-12" : "w-8"}`}>
													<ImageWithFallback
														src={playlist.poster_url ?? ''}
														alt={playlist.title ?? ''}
														fill
														className='object-cover'
														type='playlist'
													/>
												</SidebarCollectionContainerIcon>
												<div>
													<p className="line-clamp-1">{playlist.title}</p>
													<p className='text-muted-foreground line-clamp-1'>
														{playlist.type === 'movie' ? (
															t('messages.film_count', { count: playlist.items_count ?? 0 })
														) : playlist.type === 'tv_series' ? (
															t('messages.tv_series_count', { count: playlist.items_count ?? 0 })
														) : t('messages.item_count', { count: playlist.items_count ?? 0 })}
													</p>
												</div>
											</Link>
										</SidebarMenuButton>
									</ContextMenuPlaylist>
								</SidebarMenuItem>
								))
							))
						) : null}
					</div>
				</ScrollArea>
			</SidebarMenu>
			) : (
			<>
				<SidebarGroupLabel>{upperFirst(t('messages.see_more'))}</SidebarGroupLabel>
				<SidebarMenu>
					{unloggedRoutes.map((route, i) => (
						<SidebarMenuItem key={i}>
							<SidebarMenuButton tooltip={route.label} isActive={route.active}  asChild>
								<Link href={route.href} target={route.target}>
									<route.icon />
									<span>
										{route.label}
									</span>
								</Link>
							</SidebarMenuButton>
						</SidebarMenuItem>
					))}
				</SidebarMenu>
			</>
			)}
		</SidebarGroup>
		</>
	);
};
