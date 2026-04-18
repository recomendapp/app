import { CardUser } from "apps/mobile/src/components/cards/CardUser";
import { Button } from "apps/mobile/src/components/ui/Button";
import { SelectionFooter } from "apps/mobile/src/components/ui/SelectionFooter";
import { Text } from "apps/mobile/src/components/ui/text";
import { View } from "apps/mobile/src/components/ui/view";
import { Icons } from "apps/mobile/src/constants/Icons";
import tw from "apps/mobile/src/lib/tw";
import { PADDING_HORIZONTAL } from "apps/mobile/src/theme/globals";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { upperFirst } from "lodash";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue } from "react-native-reanimated";
import { useTranslations } from "use-intl";
import { Checkbox } from "apps/mobile/src/components/ui/checkbox";
import { useToast } from "apps/mobile/src/components/Toast";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { playlistMembersAllOptions, searchUsersInfiniteOptions, usePlaylistMembersAddMutation } from "@libs/query-client";
import { UserSummary } from "@libs/api-js";
import { useModalHeaderOptions } from "apps/mobile/src/hooks/useModalHeaderOptions";
import useDebounce from "apps/mobile/src/hooks/useDebounce";
import { FlashList } from "@shopify/flash-list";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useReanimatedKeyboardAnimation } from "react-native-keyboard-controller";
import { Badge } from "apps/mobile/src/components/ui/Badge";
import { SearchBarCommands } from "react-native-screens";

const ModalPlaylistEditGuestsAdd = () => {
	const { playlist_id } = useLocalSearchParams<{ playlist_id: string }>();
	const playlistId = Number(playlist_id);
	const t = useTranslations();
	const toast = useToast();
	const router = useRouter();
	const insets = useSafeAreaInsets();

	// Refs
	const searchBarRef = useRef<SearchBarCommands>(null); 

	// Queries
	const { data: members } = useQuery(playlistMembersAllOptions({
		playlistId: playlistId,
	}));
	// Mutations
	const { mutateAsync: addMembers, isPending } = usePlaylistMembersAddMutation();

	// SharedValues
	const footerHeight = useSharedValue(0);
	const { height: keyboardHeight } = useReanimatedKeyboardAnimation();

	// States
	const [ search, setSearch ] = useState('');
	const debouncedSearch = useDebounce(search);
	const [ selectedUsers, setSelectedUsers ] = useState<UserSummary[]>([]);
	const canSave: boolean = useMemo(() => selectedUsers.length > 0, [selectedUsers]);
	const modalHeaderOptions = useModalHeaderOptions({
		isPending,
		confirmExit: !!canSave,
	});
	const {
		data,
		isLoading,
		isRefetching,
		fetchNextPage,
		hasNextPage,
		refetch,
	} = useInfiniteQuery(searchUsersInfiniteOptions({
		filters: {
			q: debouncedSearch,
		}
	}));
	const users = useMemo(() => data?.pages.flatMap((page) => page.data.map((user) => ({
		user,
		isSelected: selectedUsers.some((u) => u.id === user.id),
		alreadyMember: members?.some((m) => m.user.id === user.id) || false,
	}))) || [], [data, selectedUsers]);

	// Handlers
	const handleToggleUser = useCallback((user: UserSummary) => {
		setSelectedUsers((prev) => {
			const isSelected = prev.some((u) => u.id === user.id);
			if (isSelected) {
				return prev.filter((u) => u.id !== user.id);
			}
			return [...prev, user];
		});
	}, []);
	const handleSubmit = useCallback(async () => {
		await addMembers({
			path: {
				playlist_id: playlistId,
			},
			body: {
				userIds: selectedUsers.map((user) => user.id),
			},
			}, {
			onSuccess: () => {
				toast.success(upperFirst(t('common.messages.added', { gender: 'male', count: selectedUsers.length })));
				router.dismiss();
			},
			onError: () => {
				toast.error(upperFirst(t('common.messages.an_error_occurred')));
			}
		});
	}, [selectedUsers, addMembers, toast, router, t]);

	// AnimatedStyles
	const animatedFooterStyle = useAnimatedStyle(() => {
		const kHeight = Math.abs(keyboardHeight.value);
		return {
			height: Math.max((footerHeight.value + kHeight), insets.bottom),
		};
	});

	// Render
	const renderItem = useCallback(({ item: { user, isSelected, alreadyMember } }: { item: { user: UserSummary, isSelected: boolean, alreadyMember: boolean } }) => (
		<Pressable disabled={alreadyMember} onPress={() => handleToggleUser(user)} style={tw`flex-row items-center justify-between`}>
			<CardUser user={user} linked={false} style={tw`border-0 p-0 h-auto bg-transparent`} />
			<View style={tw`flex-row items-center gap-2`}>
				{alreadyMember && (
					<Badge variant="destructive">
						{upperFirst(t('common.messages.already_member'))}
					</Badge>
				)}
				<Checkbox
				checked={isSelected}
				onCheckedChange={() => handleToggleUser(user)}
				/>
			</View>
		</Pressable>
	), [handleToggleUser]);

	useEffect(() => {
        const timer = setTimeout(() => {
            if (searchBarRef.current) {
				console.log('Focusing search bar');
                searchBarRef.current.focus();
            }
        }, 600);

        return () => clearTimeout(timer);
    }, []);

	return (
	<>
		<Stack.Screen
			options={{
				...modalHeaderOptions,
				headerSearchBarOptions: {
					ref: searchBarRef,
					autoCapitalize: 'none',
					placeholder: upperFirst(t('common.messages.search_user', { count: 1 })),
					onChangeText: (e) => setSearch(e.nativeEvent.text),
					hideNavigationBar: false,
					allowToolbarIntegration: false,
					hideWhenScrolling: false,
					autoFocus: true,
				},
				headerTitle: upperFirst(t('common.messages.add_guest', { count: 2 })),
				headerRight: () => (
					<Button
					variant="ghost"
					size="fit"
					loading={isPending}
					onPress={handleSubmit}
					disabled={!canSave || isPending}
					>
						{upperFirst(t('common.messages.save'))}
					</Button>
				),
				unstable_headerRightItems: (props) => [
					{
						type: "button",
						label: upperFirst(t('common.messages.save')),
						onPress: handleSubmit,
						tintColor: props.tintColor,
						disabled: !canSave || isPending,
						icon: {
							name: "checkmark",
							type: "sfSymbol",
						},
					},
				],
			}}
		/>
		<FlashList
		data={users}
		renderItem={renderItem}
		ListEmptyComponent={
			isLoading ? <Icons.Loader />
			: debouncedSearch.length ? (
				<View style={tw`p-4`}>
					<Text textColor="muted" style={tw`text-center`}>
						{upperFirst(t('common.messages.no_results'))}
					</Text>
				</View>
			) : (
				<View style={tw`items-center p-4`}>
					<Text textColor="muted" style={tw`text-center`}>
						{upperFirst(t('common.messages.search_user', { count: 1 }))}
					</Text>
				</View>
			)
		}
		keyExtractor={(item) => item.user.id}
		refreshing={isRefetching}
		onRefresh={refetch}
		onEndReached={() => hasNextPage && fetchNextPage()}
		onEndReachedThreshold={0.5}
		maintainVisibleContentPosition={{
			disabled: true,
		}}
		contentContainerStyle={[
			tw`gap-2 flex-grow`,
			{
				paddingHorizontal: PADDING_HORIZONTAL,
			},
		]}
		keyboardShouldPersistTaps='handled'
		/>
		<Animated.View style={animatedFooterStyle} />
		<SelectionFooter
		data={selectedUsers}
		visibleHeight={footerHeight}
		renderItem={({ item }) => (
			<CardUser user={item} variant="icon" linked={false} onPress={() => handleToggleUser(item)} width={50} height={50} />
		)}
		keyExtractor={(item) => item.id.toString()}
		/>
	</>
	)
};

export default ModalPlaylistEditGuestsAdd;