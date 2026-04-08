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
import { Alert, Pressable } from "react-native";
import { useTranslations } from "use-intl";
import { z } from "zod";
import { SelectionFooter } from "apps/mobile/src/components/ui/SelectionFooter";
import { ImageWithFallback } from "apps/mobile/src/components/utils/ImageWithFallback";
import tw from "apps/mobile/src/lib/tw";
import Animated, { FadeInRight, FadeOutRight, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { SearchBar } from "apps/mobile/src/components/ui/searchbar";
import { PADDING, PADDING_HORIZONTAL, PADDING_VERTICAL } from "apps/mobile/src/theme/globals";
import { AnimatedLegendList } from "@legendapp/list/reanimated";
import Fuse from "fuse.js";
import { Icons } from "apps/mobile/src/constants/Icons";
import { Badge } from "apps/mobile/src/components/ui/Badge";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Input } from "apps/mobile/src/components/ui/Input";
import { Checkbox } from "apps/mobile/src/components/ui/checkbox";
import { useToast } from "apps/mobile/src/components/Toast";
import { useSupabaseClient } from "apps/mobile/src/providers/SupabaseProvider";
import { usePlaylistItemsAddMutation, userPlaylistsAddTargetsAllOptions } from "@libs/query-client";
import { Playlist, PlaylistWithOwner } from "@libs/api-js";

const COMMENT_MAX_LENGTH = 180;

const PlaylistAddTo = () => {
	const t = useTranslations();
	const router = useRouter();
	const supabase = useSupabaseClient();
	const queryClient = useQueryClient();
	const toast = useToast();
	const { user } = useAuth();
	// const { movie_id, movie_title } = useLocalSearchParams();
	const { type, id, title } = useLocalSearchParams();
	const mediaId = Number(id);
	const mediaType = type === 'movie' ? 'movie' : 'tv_series';
	const mediaTitle = title ? String(title) : undefined;

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
	const resultsRender = results?.map((item) => ({ item: item, isSelected: selected.some((selectedItem) => selectedItem.id === item.id) })) || [];
	const canSave = useMemo(() => selected.length > 0, [selected]);

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
			keys: ['playlist.title'],
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
			onError: (error) => {
				toast.error(upperFirst(t('common.messages.error')), { description: upperFirst(t('common.messages.an_error_occurred')) });
			}
		});
	}, [addToPlaylistMutation, mediaId, mediaType, selected, toast, router, t]);
	const handleCancel = useCallback(() => {
		if (canSave) {
			Alert.alert(
				upperFirst(t('common.messages.are_u_sure')),
				upperFirst(t('common.messages.do_you_really_want_to_cancel_change', { count: 2 })),
				[
					{
						text: upperFirst(t('common.messages.continue_editing')),
					},
					{
						text: upperFirst(t('common.messages.ignore')),
						onPress: () => router.dismiss(),
						style: 'destructive',
					},
				]
			);
		} else {
			router.back();
		}
	}, [canSave, router, t]);
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
				headerTitle: upperFirst(t('common.messages.add_to_playlist')),
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
				unstable_headerLeftItems: (props) => [
					{
						type: "button",
						label: upperFirst(t('common.messages.close')),
						onPress: handleCancel,
						icon: {
							name: "xmark",
							type: "sfSymbol",
						},
					},
				],
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
		<View style={[tw`gap-2`, { paddingHorizontal: PADDING, paddingVertical: PADDING_VERTICAL }]}>
			<View style={tw`flex-row items-center justify-between gap-2`}>
				<SearchBar
				autoCorrect={false}
				autoComplete="off"
				autoCapitalize="none"
				onSearch={setSearch}
				placeholder={upperFirst(t('common.messages.search_playlist', { count: 1 }))}
				containerStyle={tw`flex-1`}
				/>
				<Animated.View 
				entering={FadeInRight.duration(200)} 
				exiting={FadeOutRight.duration(200)}
				>
					<Button 
					icon={Icons.Add} 
					onPress={() => BottomSheetPlaylistCreateRef.current?.present()} 
					/>
				</Animated.View>
			</View>
		</View>
		<AnimatedLegendList
		data={resultsRender}
		renderItem={({ item: { item: { alreadyAdded, ...playlist }, isSelected } }) => (
			<Pressable disabled={alreadyAdded} onPress={() => handleTogglePlaylist(playlist)} style={[tw`flex-row items-center justify-between gap-2`, { paddingHorizontal: PADDING_HORIZONTAL }]}>
				<View style={tw`shrink flex-row items-center gap-2`}>
					<ImageWithFallback
					source={{ uri: playlist.poster ?? '' }}
					alt={playlist.title}
					style={tw`rounded-md w-14 h-14`}
					type="playlist"
					/>
					<Text style={tw`shrink`} numberOfLines={1}>{playlist.title}</Text>
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
		)}
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
		onEndReachedThreshold={0.5}
		contentContainerStyle={[
			tw`gap-2`,
			{ paddingBottom: PADDING_VERTICAL },
		]}
		style={animatedFooterStyle}
		keyboardShouldPersistTaps='handled'
		/>
		<SelectionFooter
		data={selected}
		visibleHeight={footerHeight}
		renderItem={({ item }) => (
			<Pressable
			key={item.id}
			onPress={() => setSelected((prev) => prev.filter(
			(selectedPlaylist) => selectedPlaylist?.id !== item.id
			))}
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