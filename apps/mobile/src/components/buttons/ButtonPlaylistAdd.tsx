import React from "react"
import { Pressable } from "react-native";
import { Icons } from "apps/mobile/src/constants/Icons";
import { useAuth } from "apps/mobile/src/providers/AuthProvider";
import { usePathname, useRouter } from "expo-router";
import { Button } from "apps/mobile/src/components/ui/Button";
import tw from "apps/mobile/src/lib/tw";
import { PlaylistItem } from "@libs/api-js";

interface ButtonPlaylistAddProps
	extends React.ComponentProps<typeof Button> {
		mediaId: number;
		mediaType: PlaylistItem['type'];
		mediaTitle?: string | null;
	}

export const ButtonPlaylistAdd = React.forwardRef<
	React.ComponentRef<typeof Pressable>,
	ButtonPlaylistAddProps
>(({ mediaId, mediaType, mediaTitle, icon = Icons.AddPlaylist, variant = "outline", size = "icon", style, onPress: onPressProps, ...props }, ref) => {
	const { user } = useAuth();
	const router = useRouter();
	const pathname = usePathname();
	return (
		<Button
		ref={ref}
		variant={variant}
		icon={icon}
		size={size}
		onPress={(e) => {
			if (user) {
				router.push({
					pathname: '/playlist/add/[type]/[id]',
					params: {
						type: mediaType,
						id: mediaId,
						title: mediaTitle,
					},
				});
			} else {
				router.push({
					pathname: '/auth',
					params: {
						redirect: pathname,
					},
				});
			}
			onPressProps?.(e);
		}}
		style={{
			...tw`rounded-full`,
			...style,
		}}
		{...props}
		/>
	);
});
ButtonPlaylistAdd.displayName = 'ButtonPlaylistAdd';
