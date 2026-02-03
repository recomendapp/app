import { Icons } from "@/config/icons";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger } from "../ui/context-menu";
import { useModal } from "@/context/modal-context";
import { Fragment, useMemo } from "react";
import { useTranslations } from "next-intl";
import { upperFirst } from "lodash";
import { ModalUserWatchlistMovieComment } from "../Modals/watchlist/ModalUserWatchlistMovieComment";
import { UserWatchlistMovie } from "@recomendapp/types";

export const ContextMenuWatchlistMovie = ({
	children,
	watchlistItem,
}: {
	children: React.ReactNode,
	watchlistItem?: UserWatchlistMovie | null,
}) => {
	const { openModal } = useModal();
	const t = useTranslations();
	const items = useMemo(() => [
		[
			{
				icon: Icons.comment,
				onClick: () => watchlistItem && openModal(ModalUserWatchlistMovieComment, { watchlistItem }),
				label: watchlistItem?.comment ? upperFirst(t('common.messages.edit_comment', { count: 1 })) : upperFirst(t('common.messages.add_comment', { count: 1 })),
			}
		]
	], [watchlistItem, t]);
	if (!watchlistItem) return children;
	return (
		<ContextMenu>
			<ContextMenuTrigger>
				{children}
			</ContextMenuTrigger>
			<ContextMenuContent>
				{items.map((group, fragindex) => (
					<Fragment key={fragindex}>
						{group.map((item, index) => (
							<ContextMenuItem
								key={index}
								className="gap-2"
								onClick={item.onClick}
							>
								<item.icon className="h-4 w-4"/>
								{item.label}
							</ContextMenuItem>
						))}
						{fragindex < items.length - 1 && <ContextMenuSeparator />}
					</Fragment>
				))}
			</ContextMenuContent>
		</ContextMenu>
	)
}
  