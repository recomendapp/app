import { cn } from "@/lib/utils"
import { CardPlaylist } from "../Card/CardPlaylist";
import { Button } from "../ui/button";
import { useTranslations } from "next-intl";
import { upperFirst } from "lodash";
import { useInfiniteQuery } from "@tanstack/react-query";
import { userPlaylistsFollowingInfiniteOptions } from "@libs/query-client/src";
import { useAuth } from "@/context/auth-context";

export const WidgetUserFriendsPlaylists = ({
	className,
} : React.HTMLAttributes<HTMLDivElement>) => {
	const { user } = useAuth();
	const t = useTranslations('common');
	const {
		data: playlists,
	} = useInfiniteQuery(userPlaylistsFollowingInfiniteOptions({
		userId: user?.id,
	}));
	const flattenPlaylists = playlists?.pages.flatMap(page => page.data) || [];
	if (!flattenPlaylists.length) return null;
	return (
	<div className={cn('@container/widget-user-friends-playlists space-y-4', className)}>
		<Button variant={'link'} className="p-0 w-fit font-semibold text-xl hover:text-primary hover:no-underline cursor-default">
			{upperFirst(t('messages.friends_playlists'))}
		</Button>
		<div className="grid grid-cols-4 @5xl/widget-user-friends-playlists:grid-cols-8 gap-4">
			{flattenPlaylists.slice(0, 8).map(({ owner, ...playlist	}, index) => (
				<CardPlaylist key={index} playlist={playlist} owner={owner} />
			))}
		</div>
	</div>
  	);
}