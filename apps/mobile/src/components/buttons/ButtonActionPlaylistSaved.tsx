import { useAuth } from "apps/mobile/src/providers/AuthProvider";
import { useTheme } from "apps/mobile/src/providers/ThemeProvider";
import { Icons } from "apps/mobile/src/constants/Icons";
import { Button } from "apps/mobile/src/components/ui/Button";
import { forwardRef } from "react";
import { Playlist } from "@libs/api-js";
import { useUserPlaylistSaved } from "@libs/query-client";

interface ButtonActionPlaylistSavedProps
	extends React.ComponentProps<typeof Button> {
		playlist: Playlist;
	}

const ButtonActionPlaylistSaved = forwardRef<
	React.ComponentRef<typeof Button>,
	ButtonActionPlaylistSavedProps
>(({ playlist, variant = "ghost", size = "icon", icon = Icons.Watchlist, onPress, iconProps, ...props }, ref) => {
	const { colors } = useTheme();
	const { user } = useAuth();
	const { isSaved, toggle } = useUserPlaylistSaved({
		userId: user?.id,
		playlistId: playlist.id
	});

	if (!user || user.id === playlist.userId) return null;

	return (
		<Button
		ref={ref}
		variant={variant}
		size={size}
		icon={icon}
		iconProps={{
			fill: isSaved ? colors.foreground : 'transparent',
			...iconProps
		}}
		onPress={(e) => {
			toggle();
			onPress?.(e);
		}}
		{...props}
		/>
	);
});
ButtonActionPlaylistSaved.displayName = 'ButtonActionPlaylistSaved';

export default ButtonActionPlaylistSaved;
