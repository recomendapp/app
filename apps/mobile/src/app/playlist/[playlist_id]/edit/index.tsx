import { useTheme } from "apps/mobile/src/providers/ThemeProvider";
import tw from "apps/mobile/src/lib/tw";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import * as z from 'zod';
import { Button } from "apps/mobile/src/components/ui/Button";
import { useTranslations } from "use-intl";
import { upperFirst } from "lodash";
import { Input } from "apps/mobile/src/components/ui/Input";
import { Href, Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Text } from "apps/mobile/src/components/ui/text";
import { View } from "apps/mobile/src/components/ui/view";
import { Label } from "apps/mobile/src/components/ui/Label";
import { ImagePickerAsset, launchCameraAsync, launchImageLibraryAsync, requestCameraPermissionsAsync } from "expo-image-picker";
import { useActionSheet } from "@expo/react-native-action-sheet";
import { Separator } from "apps/mobile/src/components/ui/separator";
import { ImageWithFallback } from "apps/mobile/src/components/utils/ImageWithFallback";
import { Skeleton } from "apps/mobile/src/components/ui/Skeleton";
import { Alert, Pressable } from "react-native";
import { KeyboardAwareScrollView } from 'apps/mobile/src/components/ui/KeyboardAwareScrollView';
import { useHeaderHeight } from "@react-navigation/elements";
import { LucideIcon } from "lucide-react-native";
import { Icons } from "apps/mobile/src/constants/Icons";
import { KeyboardToolbar } from "apps/mobile/src/components/ui/KeyboardToolbar";
import { useToast } from "apps/mobile/src/components/Toast";
import { PADDING_VERTICAL } from "apps/mobile/src/theme/globals";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { playlistOptions, usePlaylistUpdateMutation } from "@libs/query-client";
import { useAuth } from "apps/mobile/src/providers/AuthProvider";

const TITLE_MIN_LENGTH = 1;
const TITLE_MAX_LENGTH = 100;
const DESCRIPTION_MAX_LENGTH = 300;

const ModalPlaylistEdit = () => {
	const { playlist_id } = useLocalSearchParams<{ playlist_id: string }>();
    const playlistId = Number(playlist_id);
	const toast = useToast();
	const insets = useSafeAreaInsets();
	const { colors, mode } = useTheme();
	const router = useRouter();
	const { user } = useAuth();
	const { showActionSheetWithOptions } = useActionSheet();
	const t = useTranslations();
	const headerHeight = useHeaderHeight();
	const {
		data: playlist,
	} = useQuery(playlistOptions({
		playlistId: playlistId,
	}));
	const { mutateAsync: updatePlaylist, isPending } = usePlaylistUpdateMutation({
		userId: user?.id,
	});

	// States
	const [ newPoster, setNewPoster ] = useState<ImagePickerAsset | null | undefined>(undefined);

	// Form
	const playlistFormSchema = z.object({
		title: z.string()
			.min(TITLE_MIN_LENGTH, { message: upperFirst(t('common.form.length.char_min', { count: TITLE_MIN_LENGTH }))})
			.max(TITLE_MAX_LENGTH, { message: upperFirst(t('common.form.length.char_max', { count: TITLE_MIN_LENGTH }))}),
		description: z.string()
			.max(DESCRIPTION_MAX_LENGTH, { message: upperFirst(t('common.form.length.char_max', { count: DESCRIPTION_MAX_LENGTH }))})
			.regex(/^(?!\s+$)(?!.*\n\s*\n)[\s\S]*$/, {
				message: t('pages.playlist.form.error.format'),
			})
			.optional()
			.nullable(),
	});
	type PlaylistFormValues = z.infer<typeof playlistFormSchema>;
	const defaultValues = useMemo((): Partial<PlaylistFormValues> => ({
		title: playlist?.title ?? '',
		description: playlist?.description ?? null,
	}), [playlist]);
	const { watch: formWatch, reset: formReset, ...form} = useForm<PlaylistFormValues>({
		resolver: zodResolver(playlistFormSchema),
		defaultValues,
		mode: 'onChange',
	});

	const [ hasFormChanged, setHasFormChanged ] = useState(false);
	const canSave = useMemo(() => {
		return hasFormChanged || newPoster !== undefined;
	}, [hasFormChanged, newPoster]);

	// Routes
	const routes: { label: string, icon: LucideIcon, route: Href }[] = [
		{
			label: upperFirst(t('common.messages.manage_guests', { count: 2 })),
			icon: Icons.Users,
			route: {
				pathname: '/playlist/[playlist_id]/edit/members',
				params: { playlist_id: playlistId },
			},
		}
	];

	// Poster
	const posterOptions = useMemo((): { label: string, value: "library" | "camera" | "delete", disable?: boolean }[] => ([
		{ label: upperFirst(t('common.messages.choose_from_the_library')), value: "library" },
		{ label: upperFirst(t('common.messages.take_a_photo')), value: "camera" },
		{ label: upperFirst(t('common.messages.delete_current_image')), value: "delete", disable: !playlist?.poster && !newPoster },
	]), [playlist?.poster, newPoster, t]);
	// Handlers
	const handlePosterOptions = useCallback(() => {
		const options = [
			...posterOptions,
			{ label: upperFirst(t('common.messages.cancel')), value: 'cancel' },
		];
		const cancelIndex = options.length - 1;
		showActionSheetWithOptions({
			options: options.map((option) => option.label),
			disabledButtonIndices: posterOptions.map((option, index) => option.disable ? index : -1).filter((index) => index !== -1),
			cancelButtonIndex: cancelIndex,
			destructiveButtonIndex: options.findIndex(option => option.value === 'delete'),
		}, async (selectedIndex) => {
			if (selectedIndex === undefined || selectedIndex === cancelIndex) return;
			const selectedOption = options[selectedIndex];
			switch (selectedOption.value) {
				case 'library':
					const results = await launchImageLibraryAsync({
						mediaTypes: ['images'],
						allowsEditing: true,
						aspect: [1, 1],
						quality: 1,
						base64: true,
					})
					if (!results.canceled && results.assets?.length) {
						setNewPoster(results.assets[0]);
					}
					break;
				case 'camera':
					const hasPermission = await requestCameraPermissionsAsync();
					if (!hasPermission.granted) {
						toast.error(upperFirst(t('common.messages.error')), { description: upperFirst(t('common.messages.camera_permission_denied')) });
						return;
					}
					const cameraResults = await launchCameraAsync({
						mediaTypes: ['images'],
						allowsEditing: true,
						aspect: [1, 1],
						quality: 1,
						base64: true,
					});
					if (!cameraResults.canceled && cameraResults.assets?.length) {
						setNewPoster(cameraResults.assets[0]);
					}
					break;
				case 'delete':
					setNewPoster(playlist?.poster ? null : undefined);
					break;
				default:
					break;
			};
		});
	}, [playlist, showActionSheetWithOptions, toast, t, posterOptions]);

	const handleSubmit = useCallback(async (values: PlaylistFormValues) => {
		if (!playlist) return;
		await updatePlaylist({
			path: {
				playlist_id: playlist.id,
			},
			body: {
				title: values.title.trim(),
				description: values.description?.trim() || null,
			}
		}, {
			onSuccess: () => {
				toast.success(upperFirst(t('common.messages.saved', { count: 1, gender: 'male' })));
				router.dismiss();
			},
			onError: () => {
				toast.error(upperFirst(t('common.messages.an_error_occurred')));
			}
		});
	}, [playlist, updatePlaylist, toast, router, t]);

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

	// useEffects
	useEffect(() => {
		if (playlist) {
			formReset({
				title: playlist.title,
				description: playlist.description,
			});
		}
	}, [playlist, formReset]);

	// Track form changes
	useEffect(() => {
		const subscription = formWatch((value) => {
			const isFormChanged =
				value.title !== defaultValues.title ||
				(value.description?.trim() || null) !== defaultValues.description ||
				newPoster !== undefined;
			setHasFormChanged(isFormChanged);
		});
		return () => subscription.unsubscribe();
	}, [formWatch, defaultValues, newPoster]);

	return (
	<>
		<Stack.Screen
			options={{
				headerTitle: upperFirst(t('common.messages.edit_playlist')),
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
					onPress={form.handleSubmit(handleSubmit)}
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
						onPress: form.handleSubmit(handleSubmit),
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
		<KeyboardAwareScrollView
		bounces={false}
		contentContainerStyle={[
			tw`gap-2 p-4`,
			{ paddingBottom: insets.bottom + PADDING_VERTICAL }
		]}
		nestedScrollEnabled
		bottomOffset={headerHeight}
		>
			<Pressable onPress={handlePosterOptions} style={tw`relative items-center justify-center gap-2`}>
				{playlist ? (
					<ImageWithFallback
					source={{uri: newPoster !== undefined ? newPoster?.uri : playlist.poster ?? ''}}
					alt={playlist?.title ?? ''}
					type="playlist"
					style={tw`relative aspect-square rounded-md overflow-hidden w-1/3 h-auto`}
					/>
				) : <Skeleton style={tw`aspect-square w-1/3`} color={colors.background} />}
				<Text>
					{playlist?.poster ? upperFirst(t('common.messages.edit_image')) : upperFirst(t('common.messages.add_image'))}
				</Text>
			</Pressable>
			<Separator />
			<Controller
			name='title'
			control={form.control}
			render={({ field: { onChange, onBlur, value} }) => (
				<View style={tw`gap-2`}>
					<Label>{upperFirst(t('common.messages.name'))}</Label>
					<Input
					value={value}
					onChangeText={onChange}
					onBlur={onBlur}
					placeholder={t('pages.playlist.form.title.placeholder')}
					nativeID="title"
					autoCapitalize="sentences"
					returnKeyType="done"
					disabled={isPending}
					leftSectionStyle={tw`w-auto`}
					error={form.formState.errors.title?.message}
					/>
				</View>
			)}
			/>
			<Controller
			name='description'
			control={form.control}
			render={({ field: { onChange, onBlur, value} }) => (
				<View style={tw`gap-2`}>
					<Label>{upperFirst(t('common.messages.description'))}</Label>
					<Input
					value={value ?? ''}
					onChangeText={onChange}
					onBlur={onBlur}
					placeholder={upperFirst(t('pages.playlist.form.description.placeholder'))}
					nativeID="description"
					autoCapitalize="sentences"
					type="textarea"
					disabled={isPending}
					error={form.formState.errors.description?.message}
					/>
				</View>
			)}
			/>
			{/* <Controller
			name='private'
			control={form.control}
			render={({ field: { onChange, value} }) => (
				<View style={tw`flex-row items-center gap-2`}>
					<Label>{upperFirst(t('common.messages.private', { count: 1, gender: 'female' }))}</Label>
					<Switch
					value={value}
					onValueChange={onChange}
					disabled={isPending}
					/>
				</View>
			)}
			/> */}
			{routes.length > 0 && (
				<>
					<Separator />
					{routes.map((item, index) => (
						<Pressable
						key={index}
						onPress={() => router.push(item.route)}
						style={[
							{ borderColor: colors.muted },
							tw`flex-1 flex-row justify-between items-center gap-2`,
							index < routes.length - 1 ? tw`border-b` : null,
						]}
						>
							<Button
							variant="ghost"
							size="fit"
							icon={item.icon}
							>
								{item.label}
							</Button>
							<Button
							variant="ghost"
							icon={Icons.ChevronRight}
							size="icon"
							/>
						</Pressable>
					))}
				</>
			)}
		</KeyboardAwareScrollView>
		<KeyboardToolbar />
	</>
	)
};

export default ModalPlaylistEdit;