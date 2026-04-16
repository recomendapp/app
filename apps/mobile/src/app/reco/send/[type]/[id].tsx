import { Button } from "apps/mobile/src/components/ui/Button";
import { Text } from "apps/mobile/src/components/ui/text";
import { View } from "apps/mobile/src/components/ui/view";
import { useAuth } from "apps/mobile/src/providers/AuthProvider";
import { zodResolver } from "@hookform/resolvers/zod";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { upperFirst } from "lodash";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Alert, Pressable, TextInput, useWindowDimensions } from "react-native";
import { useTranslations } from "use-intl";
import { z } from "zod";
import { SelectionFooter } from "apps/mobile/src/components/ui/SelectionFooter";
import tw from "apps/mobile/src/lib/tw";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { IOS_TOOLBAR_HEIGHT, PADDING_HORIZONTAL, PADDING_VERTICAL } from "apps/mobile/src/theme/globals";
import { useTheme } from "apps/mobile/src/providers/ThemeProvider";
import Fuse from "fuse.js";
import { Icons } from "apps/mobile/src/constants/Icons";
import { Badge } from "apps/mobile/src/components/ui/Badge";
import { Input } from "apps/mobile/src/components/ui/Input";
import { CardUser } from "apps/mobile/src/components/cards/CardUser";
import { Checkbox } from "apps/mobile/src/components/ui/checkbox";
import { useToast } from "apps/mobile/src/components/Toast";
import { useQuery } from "@tanstack/react-query";
import { userRecoSendAllOptions, useUserRecoSendMutation } from "@libs/query-client";
import { RecoTarget, UserSummary } from "@libs/api-js";
import { FlashList } from "@shopify/flash-list";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme } from "apps/mobile/src/theme";

const COMMENT_MAX_LENGTH = 180;

const RecoSend = () => {
	const t = useTranslations();
	const router = useRouter();
	const toast = useToast();
	const { colors, mode, isLiquidGlassAvailable } = useTheme();
	const insets = useSafeAreaInsets();
	const { user } = useAuth();
	const { width: SCREEN_WIDTH } = useWindowDimensions();
	const { type, id } = useLocalSearchParams();
	const mediaId = Number(id);
	const mediaType = type === 'movie' ? 'movie' : 'tv_series';

	const [toolbarView, setToolbarView] = useState<'main' | 'comment' | 'targets'>('main');

	// Form
	const sendRecoFormSchema = z.object({
		comment: z.string()
			.max(COMMENT_MAX_LENGTH, { message: upperFirst(t('common.form.length.char_max', { count: COMMENT_MAX_LENGTH }))})
			.regex(/^(?!\s+$)(?!.*\n\s*\n)[\s\S]*$/)
			.optional()
			.nullable(),
	});
	type SendRecoFormValues = z.infer<typeof sendRecoFormSchema>;
	const defaultValues: Partial<SendRecoFormValues> = {
		comment: '',
	};
	const form = useForm<SendRecoFormValues>({
		resolver: zodResolver(sendRecoFormSchema),
		defaultValues,
		mode: 'onChange',
	});

	// Mutations
	const { mutateAsync: sendReco, isPending: isSendingReco } = useUserRecoSendMutation();

	// SharedValues
	const footerHeight = useSharedValue(0);

	// States
	const [search, setSearch] = useState('');
	const [results, setResults] = useState<typeof friends>([]);
	const [selected, setSelected] = useState<UserSummary[]>([]);
	const resultsRender = useMemo(() => results?.map((item) => ({ item: item, isSelected: selected.some((selectedItem) => selectedItem.id === item.id) })) || [], [results, selected]);
	const canSave = useMemo(() => {
		return selected.length > 0;
	}, [selected]);

	// Queries
	const {
		data: friends,
		isRefetching,
		refetch,
	} = useQuery(userRecoSendAllOptions({
		userId: user?.id,
		mediaId: mediaId,
		mediaType: mediaType,
	}));

	// Search
	const fuse = useMemo(() => {
		return new Fuse(friends || [], {
			keys: ['username', 'name'],
			threshold: 0.5,
		});
	}, [friends]);
	useEffect(() => {
		if (search && search.length > 0) {
			setResults(fuse?.search(search).map(result => result.item));
		} else {
			setResults(friends);
		}
	}, [search, friends, fuse]);

	// Handlers
	const handleToggleUser = useCallback((user: UserSummary) => {
		setSelected((prev) => {
			const isSelected = prev.some((p) => p.id === user.id);
			if (isSelected) {
				return prev.filter((p) => p.id !== user.id);
			}
			return [...prev, user];
		});
	}, []);
	const handleSubmit = useCallback(async (values: SendRecoFormValues) => {
		if (!user?.id) return;
		if (selected.length === 0) return;
		await sendReco({
			path: {
				media_id: mediaId,
				type: mediaType,
			},
			body: {
				userIds: selected.map((user) => user.id),
				comment: values.comment,
			}
		}, {
			onSuccess: () => {
				toast.success(upperFirst(t('common.messages.sent', { count: selected.length, gender: 'female' })));
				router.dismiss();
			},
			onError: () => {
				toast.error(upperFirst(t('common.messages.error')), { description: upperFirst(t('common.messages.an_error_occurred')) });
			}
		});
	}, [user, selected, mediaId, mediaType, sendReco, toast, router, t]);
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
			router.back();
		}
	}, [canSave, router, t, mode]);

	// AnimatedStyles
	const animatedFooterStyle = useAnimatedStyle(() => {
		return {
			height: Math.max(footerHeight.value, insets.bottom),
		};
	});

	// Render
	const renderItem = useCallback(({ item: { item: { alreadySeen, alreadySent, ...friend }, isSelected } }: { item: { item: RecoTarget, isSelected: boolean } }) => (
		<Pressable disabled={alreadySeen} onPress={() => handleToggleUser(friend)} style={tw`flex-row items-center justify-between`}>
			<CardUser user={friend} linked={false} style={tw`border-0 p-0 h-auto bg-transparent`} />
			<View style={tw`flex-row items-center gap-2`}>
				{alreadySent && (
				<Badge variant="accent-yellow">
					{upperFirst(t('common.messages.already_sent'))}
				</Badge>
				)}
				{alreadySeen && (
				<Badge variant="destructive">
					{upperFirst(t('common.messages.already_watched'))}
				</Badge>
				)}
				<Checkbox
				checked={isSelected}
				onCheckedChange={() => handleToggleUser(friend)}
				/>
			</View>
		</Pressable>
	), [handleToggleUser, t]);

	return (
	<>
		<Stack.Screen
			options={{
				headerSearchBarOptions: {
					autoCapitalize: 'none',
					placeholder: upperFirst(t('common.messages.search_user', { count: 1 })),
					onChangeText: (e) => setSearch(e.nativeEvent.text),
					hideNavigationBar: false,
				},
				headerRight: () => (
					<Button
					variant="outline"
					icon={Icons.Reco}
					size="icon"
					onPress={form.handleSubmit(handleSubmit)}
					disabled={isSendingReco || !canSave}
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
						label: upperFirst(t('common.messages.send')),
						onPress: form.handleSubmit(handleSubmit),
						disabled: isSendingReco || !canSave,
						icon: {
							name: "paperplane.fill",
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
								keyExtractor={(item) => item.id!.toString()}
								showsHorizontalScrollIndicator={false}
								contentContainerStyle={[
									tw`items-center`, 
									{ paddingHorizontal: PADDING_HORIZONTAL, gap: theme.space12 }
								]}
								renderItem={({ item }) => (
									<CardUser 
										user={item} 
										variant="icon" 
										linked={false} 
										onPress={() => handleToggleUser(item)} 
										width={50} 
										height={50} 
									/>
								)}
								ItemSeparatorComponent={() => <View style={{ width: theme.space12 }} />}
								ListEmptyComponent={
									<Text textColor="muted" style={tw`text-sm`}>
										{upperFirst(t('common.messages.select_users_to_send_reco'))}
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
					<Stack.Toolbar.Button icon={'person'} onPress={() => setToolbarView('targets')} />
				</>
				)}
			</Stack.Toolbar>
		)}
		<FlashList
		data={resultsRender}
		renderItem={renderItem}
		ListEmptyComponent={
			isSendingReco ? <Icons.Loader />
			: (
				<View style={tw`p-4`}>
					<Text textColor="muted" style={tw`text-center`}>
						{upperFirst(t('common.messages.no_results'))}
					</Text>
				</View>
			)
		}
		keyExtractor={({ item }) => item.id}
		refreshing={isRefetching}
		onRefresh={refetch}
		maintainVisibleContentPosition={{
			disabled: true,
		}}
		onEndReachedThreshold={0.5}
		contentContainerStyle={[
			tw`gap-2`,
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
				<CardUser user={item} variant="icon" linked={false} onPress={() => handleToggleUser(item)} width={50} height={50} />
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
					disabled={isSendingReco}
					error={form.formState.errors.comment?.message}
					/>
				)}
				/>
			</SelectionFooter>
		</>
		)}
	</>
	)
};

export default RecoSend;