import { CardUser } from "apps/mobile/src/components/cards/CardUser";
import { Button } from "apps/mobile/src/components/ui/Button";
import { SearchBar } from "apps/mobile/src/components/ui/searchbar";
import { SelectionFooter } from "apps/mobile/src/components/ui/SelectionFooter";
import { Text } from "apps/mobile/src/components/ui/text";
import { View } from "apps/mobile/src/components/ui/view";
import { Icons } from "apps/mobile/src/constants/Icons";
import tw from "apps/mobile/src/lib/tw";
import { GAP, PADDING, PADDING_HORIZONTAL, PADDING_VERTICAL } from "apps/mobile/src/theme/globals";
import { AnimatedLegendList } from "@legendapp/list/reanimated";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { upperFirst } from "lodash";
import { useCallback, useMemo, useState } from "react";
import { Alert } from "react-native";
import { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useTranslations } from "use-intl";
import { Checkbox } from "apps/mobile/src/components/ui/checkbox";
import { useToast } from "apps/mobile/src/components/Toast";
import { useTheme } from "apps/mobile/src/providers/ThemeProvider";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { playlistMembersAllOptions, searchUsersInfiniteOptions, usePlaylistMembersAddMutation } from "@libs/query-client";
import { UserSummary } from "@libs/api-js";

const ModalPlaylistEditGuestsAdd = () => {
	const { playlist_id } = useLocalSearchParams<{ playlist_id: string }>();
	const playlistId = Number(playlist_id);
	const t = useTranslations();
	const toast = useToast();
	const router = useRouter();
	const { mode } = useTheme();
	// Queries
	const { data: members } = useQuery(playlistMembersAllOptions({
		playlistId: playlistId,
	}));
	// Mutations
	const { mutateAsync: addMembers, isPending } = usePlaylistMembersAddMutation();


	// SharedValues
	const footerHeight = useSharedValue(0);

	// States
	const [ search, setSearch ] = useState('');
	const [ selectedUsers, setSelectedUsers ] = useState<UserSummary[]>([]);
	const canSave: boolean = selectedUsers.length > 0;
	const {
		data,
		isLoading,
		isRefetching,
		fetchNextPage,
		hasNextPage,
		refetch,
	} = useInfiniteQuery(searchUsersInfiniteOptions({
		filters: {
			q: search,
		}
	}));
	const users = useMemo(() => data?.pages.flatMap((page) => page.data.map((user) => ({
		user,
		isSelected: selectedUsers.some((u) => u.id === user.id),
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
				], { userInterfaceStyle: mode }
			);
		} else {
			router.dismiss();
		}
	}, [canSave, router, t, mode]);


	// AnimatedStyles
	const animatedFooterStyle = useAnimatedStyle(() => {
		return {
			marginBottom: withTiming(footerHeight.value, { duration: 200 }),
		};
	});

	return (
	<>
		<Stack.Screen
			options={{
				headerTitle: upperFirst(t('common.messages.add_guest', { count: 2 })),
				headerLeft: () => (
					<Button
					variant="ghost"
					size="fit"
					disabled={isPending}
					onPress={handleCancel}
					>
						{upperFirst(t('common.messages.cancel'))}
					</Button>
				),
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
				unstable_headerLeftItems: (props) => [
					{
						type: "button",
						label: upperFirst(t('common.messages.cancel')),
						onPress: handleCancel,
						tintColor: props.tintColor,
						disabled: isPending,
						icon: {
							name: "xmark",
							type: "sfSymbol",
						},
					},
				],
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
		<View style={[tw`gap-2`, { paddingHorizontal: PADDING, paddingVertical: PADDING_VERTICAL }]}>
			<SearchBar
			autoCorrect={false}
			autoComplete="off"
			autoCapitalize="none"
			onSearch={setSearch}
			placeholder={upperFirst(t('common.messages.search_user', { count: 1 }))}
			/>
		</View>
		<AnimatedLegendList
		data={users}
		renderItem={({ item }) => (
			<CardUser linked={false} onPress={() => handleToggleUser(item.user)} user={item.user} containerStyle={{ paddingHorizontal: PADDING_HORIZONTAL }}>
				<Checkbox
				checked={item.isSelected}
				onCheckedChange={() => handleToggleUser(item.user)}
				/>
			</CardUser>
		)}
		ListEmptyComponent={
			isLoading ? <Icons.Loader />
			: search.length ? (
				<View style={tw`p-4`}>
					<Text textColor="muted" style={tw`text-center`}>
						{upperFirst(t('common.messages.no_results'))}
					</Text>
				</View>
			) : (
				<View style={tw`items-center justify-center p-4`}>
					<Text textColor="muted" style={tw`text-center`}>
						{upperFirst(t('common.messages.search_user', { count: 1 }))}
					</Text>
				</View>
			)
		}
		keyExtractor={(item) => item.user.id!.toString()}
		refreshing={isRefetching}
		onRefresh={refetch}
		onEndReached={() => hasNextPage && fetchNextPage()}
		onEndReachedThreshold={0.5}
		contentContainerStyle={[
			{ gap: GAP },
			{ paddingBottom: PADDING_VERTICAL },
		]}
		style={animatedFooterStyle}
		/>
		<SelectionFooter
		data={selectedUsers}
		visibleHeight={footerHeight}
		renderItem={({ item }) => (
			<CardUser variant="icon" linked={false} onPress={() => handleToggleUser(item)} user={item} width={50} height={50}/>
		)}
		keyExtractor={(user) => user.id!}
		/>
	</>
	)
};

export default ModalPlaylistEditGuestsAdd;