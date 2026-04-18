import { useAuth } from "apps/mobile/src/providers/AuthProvider";
import tw from "apps/mobile/src/lib/tw";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "apps/mobile/src/components/ui/Button";
import { useTranslations } from "use-intl";
import { upperFirst } from "lodash";
import { Icons } from "apps/mobile/src/constants/Icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Text } from "apps/mobile/src/components/ui/text";
import { View } from "apps/mobile/src/components/ui/view";
import Fuse from "fuse.js";
import { CardUser } from "apps/mobile/src/components/cards/CardUser";
import app from "apps/mobile/src/constants/app";
import Swipeable, { SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, { interpolate, SharedValue, useAnimatedStyle } from "react-native-reanimated";
import { PADDING_HORIZONTAL } from "apps/mobile/src/theme/globals";
import { useToast } from "apps/mobile/src/components/Toast";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PlaylistMemberWithUser, UserSummary } from "@libs/api-js";
import { useQuery } from "@tanstack/react-query";
import { playlistMembersAllOptions, playlistOptions, usePlaylistMembersDeleteMutation, usePlaylistMemberUpdateMutation } from "@libs/query-client";
import { useModalHeaderOptions } from "apps/mobile/src/hooks/useModalHeaderOptions";
import { usePlaylistMembers } from "apps/mobile/src/hooks/usePlaylistMembers";
import { useActionSheet } from "@expo/react-native-action-sheet";
import { KeyboardAvoidingLegendList } from "@legendapp/list/keyboard-test";
import { LegendListRef } from "@legendapp/list/react-native";

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
	const t = useTranslations();
	const insets = useSafeAreaInsets();
	const { showActionSheetWithOptions } = useActionSheet();
	const { playlistMembersRoleValues } = usePlaylistMembers();
	// Refs
	const listRef = useRef<LegendListRef>(null);
	// Queries
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
	const modalHeaderOptions = useModalHeaderOptions({
		isPending,
	});

	// Search
	const [search, setSearch] = useState('');
	const [results, setResults] = useState<PlaylistMemberWithUser[]>([]);
	const fuse = useMemo(() => {
		return new Fuse(members || [], {
			keys: ['user.username', 'user.name'],
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
	/* -------------------------------------------------------------------------- */


	// Handlers
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

	const handleSelectRole = useCallback((member: PlaylistMemberWithUser) => {
        const roleOptionsWithCancel = [
            ...playlistMembersRoleValues,
            { label: upperFirst(t('common.messages.cancel')), value: 'cancel' },
        ];
        const cancelIndex = roleOptionsWithCancel.length - 1;
        
        showActionSheetWithOptions({
            title: upperFirst(t('common.messages.select_role')),
            options: roleOptionsWithCancel.map((option) => option.label),
            cancelButtonIndex: cancelIndex,
        }, async (selectedIndex) => {
            if (selectedIndex === undefined || selectedIndex === cancelIndex) return;

            const selectedRole = playlistMembersRoleValues[selectedIndex].value;

            if (selectedRole !== 'viewer' && !user?.isPremium) {
                router.push({ 
                    pathname: '/upgrade', 
                    params: { feature: app.features.playlist_collaborators } 
                });
                return;
            }

            await updateMember({
                path: {
                    playlist_id: playlistId,
                    user_id: member.userId,
                },
                body: {
                    role: selectedRole,
                }
            }, {
                onError: () => {
                    toast.error(upperFirst(t('common.messages.an_error_occurred')));
                }
            });
        });
    }, [
        playlistMembersRoleValues, 
        showActionSheetWithOptions, 
        t, 
        user?.isPremium, 
        router, 
        updateMember, 
        playlistId, 
        toast
    ]);

	// Render
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
						<Button variant="outline" onPress={() => handleSelectRole(item)}>
							{playlistMembersRoleValues.find((r) => r.value === item.role)?.label}
						</Button>
					</View>
				</View>
			</Swipeable>
		);
	}, [handleDeleteMember]);

	return (
	<>
		<Stack.Screen
			options={{
				...modalHeaderOptions,
				title: upperFirst(t('common.messages.manage_members', { count: 2 })),
				headerSearchBarOptions: {
					autoCapitalize: 'none',
					placeholder: upperFirst(t('common.messages.search_user', { count: 1 })),
					onChangeText: (e) => {
						setSearch(e.nativeEvent.text);
						listRef.current?.scrollToOffset({ offset: 0, animated: false });
					},
					hideNavigationBar: false,
					allowToolbarIntegration: false,
					hideWhenScrolling: false,
				},
				headerRight: () => (
					<Button
					variant="outline"
					icon={Icons.Add}
					size="icon"
					onPress={() => router.push({ pathname: '/playlist/[playlist_id]/edit/members/add', params: { playlist_id: playlistId }})}
					style={tw`rounded-full`}
					/>
				),
				unstable_headerRightItems: (props) => [
					{
						type: "button",
						label: upperFirst(t('common.messages.add_member', { count: 2 })),
						onPress:  () => router.push({ pathname: '/playlist/[playlist_id]/edit/members/add', params: { playlist_id: playlistId }}),
						icon: {
							name: "person.badge.plus",
							type: "sfSymbol",
						},
					},
				],
			}}
		/>
		<KeyboardAvoidingLegendList
		ref={listRef}
		data={results}
		renderItem={renderItem}
		ListEmptyComponent={
			loading ? <Icons.Loader />
			: (
				<View style={tw`flex-1 items-center p-4`}>
					<Text textColor="muted" style={tw`text-center`}>
						{upperFirst(t('common.messages.no_results'))}
					</Text>
				</View>
			) 
		}
		keyExtractor={(item) => item.id.toString()}
		refreshing={isRefetching}
		onRefresh={refetch}
		contentContainerStyle={[
			tw`gap-2 flex-grow`,
			{ paddingBottom: insets.bottom }
		]}
		keyboardShouldPersistTaps="handled"
		/>
	</>
	)
};

export default ModalPlaylistEditMembers;