"use client";
import { MediaMovie } from "@recomendapp/types"
import { Icons } from "@/config/icons";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuSub, ContextMenuSubContent, ContextMenuSubTrigger, ContextMenuTrigger } from "../ui/context-menu";
import { WithLink } from "../utils/WithLink";
import { useModal } from "@/context/modal-context";
import { Fragment, useMemo } from "react";
import { ModalShare } from "../Modals/Share/ModalShare";
import { useTranslations } from "next-intl";
import { upperFirst } from "lodash";
import { useAuth } from "@/context/auth-context";
import { createShareController } from "../ShareController/ShareController";
import { ShareControllerMovie } from "../ShareController/ShareControllerMovie";
import { ModalUserRecosMovieSend } from "../Modals/recos/ModalUserRecosMovieSend";
import { ModalPlaylistMovieAdd } from "../Modals/playlists/ModalPlaylistMovieAdd";

interface Item {
	icon: React.ElementType;
	href?: string;
	label: string;
	submenu?: Item[];
	onClick?: () => void;
}

export const ContextMenuMovie = ({
	children,
	movie,
	additionalItemsTop = [],
	additionalItemsBottom = [],
}: {
	children: React.ReactNode,
	movie: MediaMovie,
	additionalItemsTop?: Item[],
	additionalItemsBottom?: Item[],
}) => {
	const { session } = useAuth();
	const { openModal } = useModal();
	const t = useTranslations();
	const items: Item[][] = useMemo(() => {
		return [
		additionalItemsTop,
		[
			{
				icon: Icons.movie,
				href: movie.url ?? '',
				label: upperFirst(t('common.messages.go_to_film'))
			},
			...(session ? [
				{
					icon: Icons.addPlaylist,
					onClick: () => openModal(ModalPlaylistMovieAdd, { movieId: movie.id, movieTitle: movie.title! }),
					label: upperFirst(t('common.messages.add_to_playlist')),
				},
				{
					icon: Icons.send,
					onClick: () => openModal(ModalUserRecosMovieSend, { movieId: movie.id, movieTitle: movie.title! }),
					label: upperFirst(t('common.messages.send_to_friend')),
				}
			] : []),
		],
		[
			{
				icon: Icons.share,
				onClick: () => openModal(ModalShare, {
					title: movie.title,
					type: 'movie',
					path: movie.url ?? '',
					shareController: createShareController(ShareControllerMovie, {
						movie: movie,
					}),
				}),
				label: upperFirst(t('common.messages.share')),
			},
			...additionalItemsBottom
		],
	]}, [movie, session, t, openModal, additionalItemsTop, additionalItemsBottom]);
	return (
		<ContextMenu>
			<ContextMenuTrigger>
				{children}
			</ContextMenuTrigger>
			<ContextMenuContent className="w-56">
				{items.map((group, fragindex) => (
					<Fragment key={fragindex}>
						{group.map((item, index) => (
							item.submenu ? (
								<ContextMenuSub key={index}>
									<ContextMenuSubTrigger className="gap-2">
										<item.icon className="h-4 w-4"/>
										{item.label}
									</ContextMenuSubTrigger>
									<ContextMenuSubContent>
										{item.submenu.map((subItem, subIndex) => (
											<ContextMenuItem
												key={subIndex}
												className="gap-2"
												asChild
											>
												<WithLink href={subItem.href}>
													{subItem.label}
												</WithLink>
											</ContextMenuItem>
										))}
									</ContextMenuSubContent>
								</ContextMenuSub>
							) : (
								<ContextMenuItem
									key={index}
									className="gap-2"
									onClick={item.onClick}
									asChild
								>
									<WithLink href={item.href}>
										<item.icon className="h-4 w-4"/>
										{item.label}
									</WithLink>
								</ContextMenuItem>
							)
						))}
						{(fragindex < items.length - 1 && items[fragindex].length > 0) && <ContextMenuSeparator />}
					</Fragment>
				))}
			</ContextMenuContent>
		</ContextMenu>
	)
}
  