import { Icons } from "@/config/icons";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger } from "../ui/context-menu";
import { useModal } from "@/context/modal-context";
import { Fragment, useMemo } from "react";
import { useTranslations } from "next-intl";
import { upperFirst } from "lodash";
import { UserWatchlistTvSeries } from "@recomendapp/types";
import { ModalUserWatchlistTvSeriesComment } from "../Modals/watchlist/ModalUserWatchlistTvSeriesComment";

export const ContextMenuWatchlistTvSeries = ({
	children,
	watchlistItem,
}: {
	children: React.ReactNode,
	watchlistItem?: UserWatchlistTvSeries | null,
}) => {
	const { openModal } = useModal();
	const t = useTranslations();
	const items = useMemo(() => [
		[
			{
				icon: Icons.comment,
				onClick: () => watchlistItem && openModal(ModalUserWatchlistTvSeriesComment, { watchlistItem }),
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
  