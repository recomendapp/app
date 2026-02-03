import { Playlist } from "@recomendapp/types"
import { Icons } from "@/config/icons";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuSub, ContextMenuSubContent, ContextMenuSubTrigger, ContextMenuTrigger } from "../ui/context-menu";
import { WithLink } from "../utils/WithLink";
import { useModal } from "@/context/modal-context";
import { Fragment, useMemo } from "react";
import { ModalShare } from "../Modals/Share/ModalShare";
import { useTranslations } from "next-intl";
import { upperFirst } from "lodash";
import { useAuth } from "@/context/auth-context";
import { PlaylistModal } from "../Modals/playlists/PlaylistModal";
import { ModalPlaylistGuest } from "../Modals/playlists/ModalPlaylistGuest/ModalPlaylistGuest";
import { usePlaylistDeleteMutation } from "@/api/client/mutations/playlistMutations";
import toast from "react-hot-toast";
import { usePathname, useRouter } from "@/lib/i18n/navigation";

interface Item {
	icon: React.ElementType;
	href?: string;
	label: string;
	submenu?: Item[];
	variant?: 'destructive';
	onClick?: () => void;
}

export const ContextMenuPlaylist = ({
	children,
	playlist,
}: {
	children: React.ReactNode,
	playlist: Playlist,
}) => {
	const { session } = useAuth();
	const router = useRouter();
	const pathname = usePathname();
	const { openModal, createConfirmModal } = useModal();
	const playlistDeleteMutation = usePlaylistDeleteMutation()
	const t = useTranslations();
	const items = useMemo((): Item[][] => {
		return [
		[
			{
				icon: Icons.playlist,
				href: `/playlist/${playlist.id}`,
				label: upperFirst(t('common.messages.go_to_playlist')),
			},
			{
				icon: Icons.user,
				href: `/@${playlist.user?.username}`,
				label: upperFirst(t('common.messages.go_to_user')),
			},
			...(session?.user.id === playlist.user_id ? [
				{
					icon: Icons.users,
					onClick: () => openModal(ModalPlaylistGuest, {
						playlistId: playlist.id,
					}),
					label: upperFirst(t('common.messages.manage_guests', { gender: 'male', count: 2 })),
				},
				{
					icon: Icons.edit,
					onClick: () => {
						openModal(PlaylistModal, {
							playlist: playlist,
						})
					},
					label: upperFirst(t('common.messages.edit_playlist')),
				},
			] : []),
		],
		[
			{
				icon: Icons.share,
				onClick: () => openModal(ModalShare, {
					title: playlist.title,
					type: 'playlist',
					path: `/playlist/${playlist.id}`,
				}),
				label: upperFirst(t('common.messages.share')),
			},
			...(session?.user.id === playlist.user_id ? [
				{
					icon: Icons.delete,
					onClick: () => {
						createConfirmModal({
							title: upperFirst(t('common.messages.are_u_sure')),
							description: t.rich('pages.playlist.actions.delete.description', {
								title: playlist.title,
								important: (chunk) => <b>{chunk}</b>,
							}),
							onConfirm: async () => {
								await playlistDeleteMutation.mutateAsync(
									{ playlistId: playlist.id, userId: session.user.id },
									{
										onSuccess: async () => {
											toast.success(upperFirst(t('common.messages.deleted')));
											if (pathname.startsWith(`/playlist/${playlist.id}`)) {
												router.replace('/collection');
											}
										},
										onError: () => {
											toast.error(upperFirst(t('common.messages.an_error_occurred')));
										},
									}
								);
							},
						});
					},
					label: upperFirst(t('common.messages.delete')),
					variant: 'destructive' as const,
				}
			] : []),
		],
	]}, [playlist, session, t, openModal, createConfirmModal, playlistDeleteMutation, pathname, router]);
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
											variant={subItem.variant}
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
								variant={item.variant}
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
  