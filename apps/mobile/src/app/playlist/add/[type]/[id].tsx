import BottomSheetPlaylistCreate from "apps/mobile/src/components/bottom-sheets/sheets/BottomSheetPlaylistCreate";
import { Button } from "apps/mobile/src/components/ui/Button";
import { Text } from "apps/mobile/src/components/ui/text";
import { View } from "apps/mobile/src/components/ui/view";
import { useAuth } from "apps/mobile/src/providers/AuthProvider";
import { zodResolver } from "@hookform/resolvers/zod";
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { upperFirst } from "lodash";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Pressable, TextInput, useWindowDimensions } from "react-native";
import { useTranslations } from "use-intl";
import { z } from "zod";
import { SelectionFooter } from "apps/mobile/src/components/ui/SelectionFooter";
import { ImageWithFallback } from "apps/mobile/src/components/utils/ImageWithFallback";
import tw from "apps/mobile/src/lib/tw";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { GAP, IOS_TOOLBAR_HEIGHT, PADDING_HORIZONTAL, PADDING_VERTICAL } from "apps/mobile/src/theme/globals";
import Fuse from "fuse.js";
import { Icons } from "apps/mobile/src/constants/Icons";
import { Badge } from "apps/mobile/src/components/ui/Badge";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Input } from "apps/mobile/src/components/ui/Input";
import { Checkbox } from "apps/mobile/src/components/ui/checkbox";
import { useToast } from "apps/mobile/src/components/Toast";
import { usePlaylistItemsAddMutation, userPlaylistsAddTargetsAllOptions } from "@libs/query-client";
import { Playlist, PlaylistsAddTarget, PlaylistWithOwner } from "@libs/api-js";
import { useTheme } from "apps/mobile/src/providers/ThemeProvider";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FlashList } from "@shopify/flash-list";
import { theme } from "apps/mobile/src/theme";
import { useModalHeaderOptions } from "apps/mobile/src/hooks/useModalHeaderOptions";

const COMMENT_MAX_LENGTH = 180;

const PlaylistAddTo = () => {
	const t = useTranslations();
	const router = useRouter();
	const queryClient = useQueryClient();
	const { colors, isLiquidGlassAvailable } = useTheme();
	const insets = useSafeAreaInsets();
	const { width: SCREEN_WIDTH } = useWindowDimensions();
	const toast = useToast();
	const { user } = useAuth();
	const { type, id, title } = useLocalSearchParams();
	const mediaId = Number(id);
	const mediaType = type === 'movie' ? 'movie' : 'tv_series';
	const mediaTitle = title ? String(title) : undefined;

	const [toolbarView, setToolbarView] = useState<'main' | 'comment' | 'targets'>('main');

	// Form
	const addToPlaylistFormSchema = z.object({
		comment: z.string()
			.max(COMMENT_MAX_LENGTH, { message: upperFirst(t('common.form.length.char_max', { count: COMMENT_MAX_LENGTH }))})
			.regex(/^(?!\s+$)(?!.*\n\s*\n)[\s\S]*$/)
			.optional()
			.nullable(),
	});
	type AddToPlaylistFormValues = z.infer<typeof addToPlaylistFormSchema>;
	const defaultValues: Partial<AddToPlaylistFormValues> = {
		comment: '',
	};
	const form = useForm<AddToPlaylistFormValues>({
		resolver: zodResolver(addToPlaylistFormSchema),
		defaultValues,
		mode: 'onChange',
	});

	// Mutations
	const { mutateAsync: addToPlaylistMutation, isPending: isAddingToPlaylist } = usePlaylistItemsAddMutation({
		userId: user?.id,
	});

	// REFs
	const BottomSheetPlaylistCreateRef = useRef<TrueSheet>(null);

	// SharedValues
	const footerHeight = useSharedValue(0);

	// States
	const [search, setSearch] = useState('');
	const [results, setResults] = useState<typeof playlists>([]);
	const [selected, setSelected] = useState<PlaylistWithOwner[]>([]);
	const resultsRender = useMemo(() => results?.map((item) => ({ item: item, isSelected: selected.some((selectedItem) => selectedItem.id === item.id) })) || [], [results, selected]);
	const canSave = useMemo(() => selected.length > 0, [selected]);

	const modalHeaderOptions = useModalHeaderOptions({
		isPending: isAddingToPlaylist,
		forceCross: true,
		confirmExit: !!canSave,
	});

	// Queries
	const {
		data: playlists,
		isRefetching,
		refetch,
	} = useQuery(userPlaylistsAddTargetsAllOptions({
		userId: user?.id,
		mediaId: mediaId,
		type: mediaType,
	}));
	// Search
	const fuse = useMemo(() => {
		return new Fuse(playlists || [], {
			keys: ['title', 'owner.username', 'owner.name'],
			threshold: 0.5,
		});
	}, [playlists]);
	useEffect(() => {
		if (search && search.length > 0) {
			setResults(fuse?.search(search).map(result => result.item));
		} else {
			setResults(playlists);
		}
	}, [search, playlists, fuse]);

	// Handlers
	const handleTogglePlaylist = useCallback((playlist: PlaylistWithOwner) => {
		setSelected((prev) => {
			const isSelected = prev.some((p) => p.id === playlist.id);
			if (isSelected) {
				return prev.filter((p) => p.id !== playlist.id);
			}
			return [...prev, playlist];
		});
	}, []);
	const handleSubmit = useCallback(async (values: AddToPlaylistFormValues) => {
		await addToPlaylistMutation({
			path: {
				media_id: mediaId,
				type: mediaType,
			},
			body: {
				playlistIds: selected.map((playlist) => playlist.id),
				comment: values.comment || null,
			}
		}, {
			onSuccess: () => {
				toast.success(upperFirst(t('common.messages.saved', { count: 1, gender: 'male' })));
				router.dismiss();
			},
			onError: () => {
				toast.error(upperFirst(t('common.messages.error')), { description: upperFirst(t('common.messages.an_error_occurred')) });
			}
		});
	}, [addToPlaylistMutation, mediaId, mediaType, selected, toast, router, t]);
	const onCreatePlaylist = useCallback((playlist: Playlist) => {
		if (!user) return;
		BottomSheetPlaylistCreateRef.current?.dismiss();
		const playlistWithOwner: PlaylistWithOwner = {
			...playlist,
			owner: user,
		};
		setSelected((prev) => [...prev, playlistWithOwner]);
	}, [queryClient, user]);

	// AnimatedStyles
	const animatedFooterStyle = useAnimatedStyle(() => {
		return {
			marginBottom: withTiming(footerHeight.value, { duration: 200 }),
		};
	});

	// Render
	const renderItem = useCallback(({ item: { item: { alreadyAdded, ...playlist }, isSelected } }: { item: { item: PlaylistsAddTarget, isSelected: boolean } }) => (
		<Pressable disabled={alreadyAdded} onPress={() => handleTogglePlaylist(playlist)} style={tw`flex-row items-center justify-between gap-2`}>
			<View style={tw`shrink flex-row items-center gap-2`}>
				<ImageWithFallback
				source={{ uri: playlist.poster ?? '' }}
				alt={playlist.title}
				style={tw`rounded-md w-14 h-14`}
				type="playlist"
				/>
				<View>
					<Text style={tw`shrink`} numberOfLines={1}>{playlist.title}</Text>
					{playlist.role !== 'owner' && (
						<View style={tw`flex-row items-center gap-1`}>
							<Text textColor="muted" style={tw`text-xs`}>
								@{playlist.owner.username}
							</Text>
							{playlist.owner.isPremium && (
								<Icons.premium color={colors.accentBlue} size={12} />
							)}
						</View>
					)}
				</View>
			</View>
			<View style={tw`flex-row items-center gap-2 shrink-0`}>
				{alreadyAdded && (
				<Badge variant="destructive">
					{upperFirst(t('common.messages.already_added', { count: 1, gender: 'male' }))}
				</Badge>
				)}
				<Checkbox checked={isSelected} onCheckedChange={() => handleTogglePlaylist(playlist)} />
			</View>
		</Pressable>
	), [handleTogglePlaylist, t]);

	// useEffects
	useEffect(() => {
		return () => {
			BottomSheetPlaylistCreateRef.current?.dismiss();
		};
	}, []);

	return (
	<>
		<Stack.Screen
			options={{
				...modalHeaderOptions,
				headerSearchBarOptions: {
					autoCapitalize: 'none',
					placeholder: upperFirst(t('common.messages.search_playlist', { count: 1 })),
					onChangeText: (e) => setSearch(e.nativeEvent.text),
					hideNavigationBar: false,
				},
				headerRight: () => (
					<Button
					variant="outline"
					icon={Icons.Check}
					size="icon"
					onPress={form.handleSubmit(handleSubmit)}
					disabled={isAddingToPlaylist || !canSave}
					style={tw`rounded-full`}
					/>
				),
				unstable_headerRightItems: (props) => [
					{
						type: "button",
						label: upperFirst(t('common.messages.add')),
						onPress: form.handleSubmit(handleSubmit),
						disabled: isAddingToPlaylist || !canSave,
						icon: {
							name: "checkmark",
							type: "sfSymbol",
						},
					},
				],
			}}
		/>
		{isLiquidGlassAvailable && (
				<Stack.Toolbar>
				{toolbarView === 'comment' ? (
				<>
					<Stack.Toolbar.View>
						<View style={[tw`justify-center h-10`, { width: SCREEN_WIDTH - 80, paddingHorizontal: PADDING_HORIZONTAL }]}>
							<Controller
								name="comment"
								control={form.control}
								render={({ field: { onChange, onBlur, value } }) => (
									<TextInput
										placeholder={upperFirst(t('common.messages.add_comment', { count: 1 }))}
										autoCapitalize="sentences"
										value={value || ''}
										onChangeText={onChange}
										onBlur={onBlur}
										multiline
										style={{
											color: colors.foreground,
										}}
										placeholderTextColor={colors.mutedForeground}
										autoFocus
									/>
								)}
							/>
						</View>
					</Stack.Toolbar.View>
					<Stack.Toolbar.Button icon={'xmark'} onPress={() => setToolbarView('main')} />
				</>
				) : toolbarView === 'targets' ? (
				<>
					<Stack.Toolbar.View>
						<View style={[tw`justify-center h-20`, { width: SCREEN_WIDTH - 80 }]}>
							<FlashList
								horizontal
								data={selected}
								keyExtractor={(item) => item.id.toString()}
								showsHorizontalScrollIndicator={false}
								contentContainerStyle={[
									tw`items-center`, 
									{ paddingHorizontal: PADDING_HORIZONTAL, gap: theme.space12 }
								]}
								ItemSeparatorComponent={() => <View style={{ width: theme.space12 }} />}
								renderItem={({ item }) => (
									<Pressable
									onPress={() => handleTogglePlaylist(item)}
									>
										<ImageWithFallback
										source={{ uri: item.poster ?? '' }}
										alt={item.title}
										style={tw`rounded-md w-10 h-10`}
										type="playlist"
										/>
									</Pressable>
								)}
								ListEmptyComponent={
									<Text textColor="muted" style={tw`text-sm`}>
										{upperFirst(t('common.messages.select_playlists_to_add_the_item'))}
									</Text>
								}
							/>
						</View>
					</Stack.Toolbar.View>
					<Stack.Toolbar.Button icon={'xmark'} onPress={() => setToolbarView('main')} />
				</>
				) : (
				<>
					<Stack.Toolbar.SearchBarSlot />
					<Stack.Toolbar.Button icon={'text.aligncenter'} onPress={() => setToolbarView('comment')} />
					<Stack.Toolbar.Button icon={'list.bullet'} onPress={() => setToolbarView('targets')} />
					<Stack.Toolbar.Button icon={'text.badge.plus'} onPress={() => BottomSheetPlaylistCreateRef.current?.present()} />
				</>
				)}
			</Stack.Toolbar>
		)}
		<FlashList
		data={resultsRender}
		renderItem={renderItem}
		ListEmptyComponent={
			isAddingToPlaylist ? <Icons.Loader />
			: (
				<View style={tw`p-4`}>
					<Text textColor="muted" style={tw`text-center`}>
						{upperFirst(t('common.messages.no_results'))}
					</Text>
				</View>
			)
		}
		keyExtractor={({ item }) => item.id.toString()}
		refreshing={isRefetching}
		onRefresh={refetch}
		maintainVisibleContentPosition={{
			disabled: true,
		}}
		ItemSeparatorComponent={() => <View style={{ height: GAP }} />}
		contentContainerStyle={[
			{
				paddingBottom: isLiquidGlassAvailable ? insets.bottom + PADDING_VERTICAL + IOS_TOOLBAR_HEIGHT : 0,
				paddingHorizontal: PADDING_HORIZONTAL,
			},
		]}
		keyboardShouldPersistTaps='handled'
		/>
		{!isLiquidGlassAvailable && (
		<>
			<Animated.View style={animatedFooterStyle} />
			<SelectionFooter
			data={selected}
			visibleHeight={footerHeight}
			renderItem={({ item }) => (
				<Pressable
				key={item.id}
				onPress={() => handleTogglePlaylist(item)}
				>
					<ImageWithFallback
					source={{ uri: item.poster ?? '' }}
					alt={item.title}
					style={tw`rounded-md w-10 h-10`}
					type="playlist"
					/>
				</Pressable>
			)}
			keyExtractor={(item) => item.id.toString()}
			>
				<Controller
				name="comment"
				control={form.control}
				render={({ field: { onChange, onBlur, value } }) => (
					<Input
					placeholder={upperFirst(t('common.messages.add_comment', { count: 1 }))}
					autoCapitalize="sentences"
					value={value || ''}
					onChangeText={onChange}
					onBlur={onBlur}
					disabled={isAddingToPlaylist}
					error={form.formState.errors.comment?.message}
					/>
				)}
				/>
			</SelectionFooter>
		</>
		)}
		<BottomSheetPlaylistCreate
		ref={BottomSheetPlaylistCreateRef}
		id={`${mediaType}-${mediaId}-create-playlist`}
		onCreate={onCreatePlaylist}
		placeholder={mediaTitle}
		/>
	</>
	)
};

export default PlaylistAddTo;