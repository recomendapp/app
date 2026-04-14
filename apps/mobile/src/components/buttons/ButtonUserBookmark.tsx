import { useAuth } from "apps/mobile/src/providers/AuthProvider";
import { Icons } from "apps/mobile/src/constants/Icons";
import { useTheme } from "apps/mobile/src/providers/ThemeProvider";
import { upperFirst } from "lodash";
import { useTranslations } from "use-intl";
import { usePathname, useRouter } from "expo-router";
import { Button } from "apps/mobile/src/components/ui/Button";
import useBottomSheetStore from "apps/mobile/src/stores/useBottomSheetStore";
import { useToast } from "apps/mobile/src/components/Toast";
import { forwardRef, useCallback } from "react";
import tw from "apps/mobile/src/lib/tw";
import { Bookmark } from "@libs/api-js";
import { useQuery } from "@tanstack/react-query";
import { userBookmarkByMediaOptions, useUserBookmarkDeleteByMediaMutation, useUserBookmarkSetByMediaMutation } from "@libs/query-client";
import { BottomSheetBookmarkComment } from "../bottom-sheets/sheets/BottomSheetBookmarkComment";

interface ButtonUserBookmarkProps
	extends React.ComponentProps<typeof Button> {
		mediaId: number;
		mediaType: Bookmark['type'];
		mediaTitle?: string | null;
	}

export const ButtonUserBookmark = forwardRef<
	React.ComponentRef<typeof Button>,
	ButtonUserBookmarkProps
>(({ mediaId, mediaType, mediaTitle, icon = Icons.Watchlist, variant = "outline", size = "icon", style, onPress: onPressProps, onLongPress: onLongPressProps, iconProps, ...props }, ref) => {
	const { colors } = useTheme();
	const toast = useToast();
	const { user } = useAuth();
	const router = useRouter();
	const pathname = usePathname();
	const t = useTranslations();
	const openSheet = useBottomSheetStore((state) => state.openSheet);
	const {
		data: bookmark,
	} = useQuery(userBookmarkByMediaOptions({
		mediaId: mediaId,
		type: mediaType,
		userId: user?.id,
	}));
	// Mutations
	const { mutateAsync: addBookmark } = useUserBookmarkSetByMediaMutation();
	const { mutateAsync: deleteBookmark } = useUserBookmarkDeleteByMediaMutation();

	const handleWatchlist = useCallback(async () => {
		await addBookmark({
			path: {
				media_id: mediaId,
				type: mediaType,
			},
			body: {}
		}, {
		  onError: () => {
			toast.error(upperFirst(t('common.messages.an_error_occurred')), { description: upperFirst(t('common.messages.an_error_occurred')) });
		  }
		});
	}, [addBookmark, mediaId, mediaType, t, toast]);
	const handleUnwatchlist = useCallback(async () => {
		if (!bookmark) return;
		await deleteBookmark({
		  path: {
			media_id: bookmark.mediaId,
			type: bookmark.type,
		  }
		}, {
		  onError: () => {
			toast.error(upperFirst(t('common.messages.an_error_occurred')), { description: upperFirst(t('common.messages.an_error_occurred')) });
		  }
		});
	}, [deleteBookmark, toast, t, bookmark]);

	return (
	<Button
	ref={ref}
	variant={variant}
	icon={icon}
	size={size}
	onPress={async (e) => {
		if (user) {
			if (bookmark) {
				await handleUnwatchlist()
			} else {
				await handleWatchlist()
			}
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
	onLongPress={(e) => {
		bookmark?.id && openSheet(BottomSheetBookmarkComment, {
			data: bookmark
		});
		onLongPressProps?.(e);
	}}
	iconProps={{
		fill: bookmark ? colors.foreground : 'transparent',
		...iconProps
	}}
	style={{
		...tw`rounded-full`,
		...style,
	}}
	{...props}
	/>
	)
});
ButtonUserBookmark.displayName = 'ButtonUserBookmark';

