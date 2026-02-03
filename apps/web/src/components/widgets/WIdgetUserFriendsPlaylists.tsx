import { cn } from "@/lib/utils"
import { CardPlaylist } from "../Card/CardPlaylist";
import { Button } from "../ui/button";
import { useTranslations } from "next-intl";
import { upperFirst } from "lodash";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useUserPlaylistsFriendOptions } from "@/api/client/options/userOptions";

export const WidgetUserFriendsPlaylists = ({
	className,
} : React.HTMLAttributes<HTMLDivElement>) => {
	const t = useTranslations('common');
	const {
		data: playlists,
	} = useInfiniteQuery(useUserPlaylistsFriendOptions({
		filters: {
			sortBy: 'updated_at',
			sortOrder: 'desc',
		}
	}));
	if (!playlists || !playlists.pages[0]?.length) return null;
	return (
	<div className={cn('@container/widget-user-friends-playlists space-y-4', className)}>
		<Button variant={'link'} className="p-0 w-fit font-semibold text-xl hover:text-primary hover:no-underline cursor-default">
			{upperFirst(t('messages.friends_playlists'))}
		</Button>
		<div className="grid grid-cols-4 @5xl/widget-user-friends-playlists:grid-cols-8 gap-4">
			{playlists.pages[0].map((playlist, index) => (
			<CardPlaylist key={index} playlist={playlist} />
			))}
		</div>
	</div>
  	);
}