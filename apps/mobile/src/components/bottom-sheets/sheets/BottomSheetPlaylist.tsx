import tw from 'apps/mobile/src/lib/tw';
import { Icons } from 'apps/mobile/src/constants/Icons';
import { usePathname, useRouter } from 'expo-router';
import { LucideIcon } from 'lucide-react-native';
import { useTheme } from 'apps/mobile/src/providers/ThemeProvider';
import { upperFirst } from 'lodash';
import useBottomSheetStore from 'apps/mobile/src/stores/useBottomSheetStore';
import { Alert } from 'react-native';
import { ImageWithFallback } from 'apps/mobile/src/components/utils/ImageWithFallback';
import { useAuth } from 'apps/mobile/src/providers/AuthProvider';
import TrueSheet from 'apps/mobile/src/components/ui/TrueSheet';
import { BottomSheetProps } from '../BottomSheetManager';
import { useTranslations } from 'use-intl';
import { Button } from 'apps/mobile/src/components/ui/Button';
import { Text } from 'apps/mobile/src/components/ui/text';
import richTextToPlainString from 'apps/mobile/src/utils/richTextToPlainString';
import { useToast } from 'apps/mobile/src/components/Toast';
import BottomSheetSharePlaylist from './share/BottomSheetSharePlaylist';
import { GAP } from 'apps/mobile/src/theme/globals';
import { View } from 'apps/mobile/src/components/ui/view';
import ButtonActionPlaylistLike from 'apps/mobile/src/components/buttons/ButtonActionPlaylistLike';
import ButtonActionPlaylistSaved from 'apps/mobile/src/components/buttons/ButtonActionPlaylistSaved';
import { forwardRef, useMemo } from 'react';
import { FlashList } from '@shopify/flash-list';
import { Playlist, UserSummary } from '@libs/api-js';
import { usePlaylistDeleteMutation, useUserPlaylistSaved } from '@libs/query-client';

interface BottomSheetPlaylistProps extends BottomSheetProps {
	playlist: Playlist,
	owner?: UserSummary;
	additionalItemsTop?: Item[];
};

interface Item {
	icon: LucideIcon;
	label: string;
	onPress: () => void;
	submenu?: Item[];
	closeSheet?: boolean;
	disabled?: boolean;
	destructive?: boolean;
}

const BottomSheetPlaylist = forwardRef<
	React.ComponentRef<typeof TrueSheet>,
	BottomSheetPlaylistProps
>(({ id, playlist, owner, additionalItemsTop = [], ...props }, ref) => {
	const { user } = useAuth();
	const toast = useToast();
	const { closeSheet, openSheet } = useBottomSheetStore((state) => state);
	const { colors, mode, isLiquidGlassAvailable } = useTheme();
	const router = useRouter();
	const pathname = usePathname();
	const t = useTranslations();
	const { isSaved, toggle } = useUserPlaylistSaved({
		userId: user?.id,
		playlistId: playlist.id
	});
	const { mutateAsync: deletePlaylist} = usePlaylistDeleteMutation();

	const items = useMemo<Item[]>(() => [
		...additionalItemsTop,
		{
			icon: Icons.Share,
			onPress: () => openSheet(BottomSheetSharePlaylist, {
				playlist: playlist,
			}),
			label: upperFirst(t('common.messages.share')),
		},
		...(user?.id && playlist.userId !== user.id ? [
			{
				icon: isSaved
					? Icons.Check
					: Icons.Add,
				onPress: toggle,
				label: isSaved ? upperFirst(t('common.messages.remove_from_library')) : upperFirst(t('common.messages.save_to_library')),
				closeSheet: false,
			}
		] : []),
		{
			icon: Icons.Playlist,
			onPress: () => router.push(`/playlist/${playlist.id}`),
			label: upperFirst(t('common.messages.go_to_playlist')),
			disabled: pathname.startsWith(`/playlist/${playlist.id}`),
		},
		...(owner ? [
			{
				icon: Icons.User,
				onPress: () => router.push({ pathname: '/user/[username]', params: { username: owner.username } }),
				label: upperFirst(t('common.messages.go_to_user')),
			}
		] : []),
		...(user?.id === playlist.userId ? [
			{
				icon: Icons.Users,
				onPress: () => router.push({ pathname: '/playlist/[playlist_id]/edit/members', params: { playlist_id: playlist.id }}),
				label: upperFirst(t('common.messages.manage_members', { gender: 'male', count: 2 })),
			},
		] : []),
		...((playlist.role === 'owner' || playlist.role === 'admin') ? [
			{
				icon: Icons.settings,
				onPress: () => router.push({ pathname: '/playlist/[playlist_id]/edit', params: { playlist_id: playlist.id }}),
				label: upperFirst(t('common.messages.edit_playlist')),
			},
		] : []),
		...(user?.id === playlist.userId ? [
			{
				icon: Icons.Delete,
				destructive: true,
				onPress: async () => {
					Alert.alert(
						upperFirst(t('common.messages.are_u_sure')),
						upperFirst(richTextToPlainString(t.rich('pages.playlist.actions.delete.description', { title: playlist.title, important: (chunk) => `"${chunk}"` }))),
						[
							{
								text: upperFirst(t('common.messages.cancel')),
								style: 'cancel',
							},
							{
								text: upperFirst(t('common.messages.delete')),
								onPress: async () => {
									await deletePlaylist({
										path: {
											playlist_id: playlist.id,
										}
									}, {
										onSuccess: () => {
											toast.success(upperFirst(t('common.messages.deleted')));
											if (pathname.startsWith(`/playlist/${playlist.id}`)) {
												router.replace('/collection');
											}
											closeSheet(id);
										},
										onError: () => {
											toast.error(upperFirst(t('common.messages.error')), { description: upperFirst(t('common.messages.an_error_occurred')) });
										},
									});
								},
								style: 'destructive',
							}
						], {
							userInterfaceStyle: mode,
						}
					)
				},
				label: upperFirst(t('common.messages.delete')),
				closeSheet: false,
			}
		] : []),
	], [
		additionalItemsTop,
		closeSheet,
		id,
		mode,
		openSheet,
		playlist,
		router,
		pathname,
		user?.id,
		t,
		toast,
		deletePlaylist,
		isSaved,
		toggle,
	]);

	return (
	<TrueSheet
	ref={ref}
	scrollable
	{...props}
	>
		<FlashList
		data={[
			'header',
			...items,
		]}
		bounces={false}
		keyExtractor={(_, i) => i.toString()}
		stickyHeaderIndices={[0]}
		renderItem={({ item }) => (
			typeof item === 'string' ? (
				<View
				style={[
					{ backgroundColor: isLiquidGlassAvailable ? 'transparent' : colors.muted, borderColor: colors.mutedForeground, gap: GAP },
					tw`flex-row items-center justify-between border-b p-4`,
				]}
				>
					<View style={[tw`flex-row items-center`, { gap: GAP }]}>
						<ImageWithFallback
						alt={playlist.title}
						source={{ uri: playlist.poster ?? '' }}
						style={[
							{ aspectRatio: 1 / 1 },
							tw.style('rounded-md w-12'),
						]}
						type={"playlist"}
						/>
						<View>
							<Text numberOfLines={2}>{playlist.title}</Text>
							{owner && <Text textColor='muted' numberOfLines={1}>
								{t('common.messages.by_name', { name: owner.username })}
							</Text>}
						</View>
					</View>
					<View style={tw`flex-row items-center`}>
						<ButtonActionPlaylistLike playlist={playlist} />
						<ButtonActionPlaylistSaved playlist={playlist} />
					</View>
				</View>
			) : (
				<Button
				variant='ghost'
				icon={item.icon}
				iconProps={{
					color: item.destructive ? colors.destructive : colors.mutedForeground,
				}}
				disabled={item.disabled}
				style={[
					tw`justify-start h-auto py-4`,
				]}
				textStyle={{
					color: item.destructive ? colors.destructive : colors.foreground
				}}
				onPress={() => {
					(item.closeSheet === undefined || item.closeSheet === true) && closeSheet(id);
					item.onPress();
				}}
				>
					{item.label}
				</Button>
			)
		)}
		indicatorStyle={mode === 'dark' ? 'white' : 'black'}
		nestedScrollEnabled
		/>
	</TrueSheet>
	);
});
BottomSheetPlaylist.displayName = 'BottomSheetPlaylist';

export default BottomSheetPlaylist;