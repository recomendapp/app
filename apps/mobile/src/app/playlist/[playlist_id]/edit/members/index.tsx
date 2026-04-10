import { useAuth } from "apps/mobile/src/providers/AuthProvider";
import tw from "apps/mobile/src/lib/tw";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "apps/mobile/src/components/ui/Button";
import { useTranslations } from "use-intl";
import { upperFirst } from "lodash";
import { Icons } from "apps/mobile/src/constants/Icons";
import { Link, Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Text } from "apps/mobile/src/components/ui/text";
import { View } from "apps/mobile/src/components/ui/view";
import Fuse from "fuse.js";
import { SearchBar } from "apps/mobile/src/components/ui/searchbar";
import { LegendList } from "@legendapp/list/react-native";
import { CardUser } from "apps/mobile/src/components/cards/CardUser";
import app from "apps/mobile/src/constants/app";
import Swipeable, { SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, { interpolate, SharedValue, useAnimatedStyle } from "react-native-reanimated";
import { PADDING_HORIZONTAL, PADDING_VERTICAL } from "apps/mobile/src/theme/globals";
import { useToast } from "apps/mobile/src/components/Toast";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PlaylistMemberWithUser, UserSummary } from "@libs/api-js";
import { useQuery } from "@tanstack/react-query";
import { playlistMembersAllOptions, playlistOptions, usePlaylistMembersDeleteMutation, usePlaylistMemberUpdateMutation } from "@libs/query-client";

const RightActions = ({
	drag,
	item,
	swipeable,
	onDelete,
}: {
	drag: SharedValue<number>,
	item: UserSummary,
	swipeable: SwipeableMethods,
	onDelete: (userId: string) => void
}) => {
	const actionWidth = 50;
	const swipeActions = [
		{
			icon: Icons.X,
			onPress: () => onDelete(item.id!),
		},
	];
	const styleAnimation = useAnimatedStyle(() => {
		return {
			transform: [{ translateX: (drag.value - PADDING_HORIZONTAL + actionWidth) * swipeActions.length }],
			opacity: interpolate(drag.value, [0, -actionWidth * swipeActions.length], [0, 1]),
		};
	});

	return (
	<Animated.View style={[tw`rounded-r-md overflow-hidden flex-row`, styleAnimation]}>
		{swipeActions.map((action, index) => (
			<Button
				key={index}
				variant={"ghost"}
				icon={action.icon}
				style={[
					tw`h-full rounded-none`,
					{ width: actionWidth },
				]}
				size="icon"
				onPress={() => {
					action.onPress();
					swipeable.close();
				}}
			/>
		))}
	</Animated.View>
	);
};

const ModalPlaylistEditMembers = () => {
	const { user } = useAuth();
	const { playlist_id } = useLocalSearchParams<{ playlist_id: string }>();
    const playlistId = Number(playlist_id);
	const router = useRouter();
	const toast = useToast();
	const { customerInfo } = useAuth();
	const t = useTranslations();
	const insets = useSafeAreaInsets();
	const {
		data: playlist,
	} = useQuery(playlistOptions({
		playlistId: playlistId,
	}));
	const {
		data: members,
		isLoading,
		isRefetching,
		refetch,
	} = useQuery(playlistMembersAllOptions({
		playlistId: playlist?.id,
	}));
	const loading = members === undefined || isLoading;
	
	// Mutations
	const { mutateAsync: updateMember, isPending: isUpdatingMember } = usePlaylistMemberUpdateMutation({
		userId: user?.id,
	});
	const { mutateAsync: deleteMember, isPending: isDeletingMember } = usePlaylistMembersDeleteMutation({
		userId: user?.id,
	});
	const isPending = useMemo(() => isUpdatingMember || isDeletingMember, [isUpdatingMember, isDeletingMember]);

	// Search
	const [search, setSearch] = useState('');
	const [results, setResults] = useState<PlaylistMemberWithUser[]>([]);
	const fuse = useMemo(() => {
		return new Fuse(members || [], {
			keys: ['user.username', 'user.full_name'],
			threshold: 0.5,
		});
	}, [members]);
	useEffect(() => {
		if (search.length > 0) {
			setResults(fuse?.search(search).map(({ item }) => item));
		} else {
			setResults(members || []);
		}
	}, [search, members, fuse]);
	const hasResults = results && results.length > 0;
	/* -------------------------------------------------------------------------- */


	// Handlers
	const handleToggleEdit = (userId: string) => {
		if (!customerInfo?.entitlements.active['premium']) {
			router.push({ pathname: '/upgrade', params: { feature: app.features.playlist_collaborators } });
			return;
		}
	};
	// const handleSubmit = async () => {
	// 	try {
	// 		if (!playlist) return;
	// 		setIsLoading(true);
	// 		const guestsToUpsert = guests?.filter((guest) => {
	// 			const original = guestsRequest?.find(g => g.user?.id === guest.user.id);
	// 			if (!original) return true;
	// 			return original.edit !== guest.edit;
	// 		});
	// 		const guestsToDelete = guestsRequest?.filter((guest) => !guests?.some((g) => g.user.id === guest.user?.id));
	// 		if (guestsToUpsert?.length) {
	// 			await upsertGuestsMutation({
	// 				guests: guestsToUpsert.map((guest) => ({
	// 					user_id: guest.user.id!,
	// 					edit: guest.edit
	// 				})),
	// 			}, { onError: (error) => { throw error } })
	// 		}
	// 		if (guestsToDelete?.length) {
	// 			await deleteGuestsMutation({
	// 				userIds: guestsToDelete.map((guest) => guest.user_id),
	// 			}, { onError: (error) => { throw error } })
	// 		}
	// 		toast.success(upperFirst(t('common.messages.saved', { count: 1, gender: 'male' })));
	// 		router.dismiss();
	// 	} catch (error) {
	// 		let errorMessage: string = upperFirst(t('common.messages.an_error_occurred'));
	// 		if (error instanceof Error) {
	// 			errorMessage = error.message;
	// 		} else if (error instanceof PostgrestError) {
	// 			errorMessage = error.message;
	// 		} else if (typeof error === 'string') {
	// 			errorMessage = error;
	// 		}
	// 		toast.error(upperFirst(t('common.messages.error')), { description: errorMessage });
	// 	} finally {
	// 		setIsLoading(false);
	// 	}
	// };
	const handleDeleteMember = useCallback(async (userId: string) => {
		await deleteMember({
			path: {
				playlist_id: playlistId,
			},
			body: {
				userIds: [userId],
			}
		}, {
			onError: () => {
				toast.error(upperFirst(t('common.messages.an_error_occurred')));
			}
		});
	}, [deleteMember, playlistId, toast]);

	const handleGoBack = useCallback(() => {
		if (router.canGoBack()) {
			router.back();
		} else {
			router.replace('/')
		}
	}, [router]);

	const renderItem = useCallback(({ item }: { item: PlaylistMemberWithUser }) => {
		return (
			<Swipeable
			friction={2}
			enableTrackpadTwoFingerGesture
			renderRightActions={(_, drag, swipeable) => (
				<RightActions
				drag={drag}
				item={item.user}
				swipeable={swipeable}
				onDelete={handleDeleteMember}
				/>
			)}
			containerStyle={[
				{ paddingHorizontal: PADDING_HORIZONTAL }
			]}
			>
				<View style={tw`flex-row items-center justify-between gap-2 w-full`}>
					<CardUser user={item.user} linked={false} style={tw`border-0 p-0 h-auto bg-transparent`} />
					<View style={tw`flex-row items-center gap-2`}>
						<Text textColor="muted" style={tw`text-sm`}>
							edit
						</Text>
					</View>
				</View>
			</Swipeable>
		);
	}, [handleDeleteMember]);
	
	return (
	<>
		<Stack.Screen
			options={{
				headerTitle: upperFirst(t('common.messages.manage_members', { count: 2 })),
				headerLeft: () => (
					<Button
					variant="muted"
					size="icon"
					disabled={isPending}
					onPress={handleGoBack}
					/>
				),
				unstable_headerLeftItems: (props) => [
					{
						type: "button",
						label: upperFirst(t('common.messages.cancel')),
						onPress: handleGoBack,
						tintColor: props.tintColor,
						disabled: isPending,
						icon: {
							name: "xmark",
							type: "sfSymbol",
						},
					},
				],
			}}
		/>
		<View style={[tw`gap-2`, { paddingHorizontal: PADDING_HORIZONTAL, paddingVertical: PADDING_VERTICAL }]}>
			<SearchBar
			onSearch={setSearch}
			autoCorrect={false}
			autoComplete="off"
			autoCapitalize="none"
			placeholder={upperFirst(t('common.messages.search_user', { count: 1 }))}
			/>
			<View
			style={
				hasResults ? tw`flex-row items-center justify-between gap-2` : undefined
			}>
				<Link href={{ pathname: '/playlist/[playlist_id]/edit/members/add', params: { playlist_id: playlistId }}} asChild>
					<Button
					variant="muted"
					icon={Icons.Add}
					>
						{upperFirst(t('common.messages.add_member', { count: 2 }))}
					</Button>
				</Link>
				{hasResults && <Text textColor="muted" style={tw`text-right`}>{upperFirst(t('common.messages.can_edit'))}</Text>}
			</View>
		</View>
		<LegendList
		data={results || []}
		renderItem={renderItem}
		ListEmptyComponent={
			loading ? <Icons.Loader />
			: (
				<View style={tw`flex-1 items-center justify-center p-4`}>
					<Text textColor="muted" style={tw`text-center`}>
						{upperFirst(t('common.messages.no_results'))}
					</Text>
				</View>
			) 
		}
		keyExtractor={(item) => item.user.id!.toString()}
		nestedScrollEnabled
		refreshing={isRefetching}
		onRefresh={refetch}
		contentContainerStyle={[
			tw`gap-2`,
			{ paddingBottom: insets.bottom + PADDING_VERTICAL }
		]}
		/>
	</>
	)
};

export default ModalPlaylistEditMembers;