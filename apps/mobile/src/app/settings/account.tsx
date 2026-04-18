import { useAuth } from "apps/mobile/src/providers/AuthProvider";
import { useTheme } from "apps/mobile/src/providers/ThemeProvider";
import tw from "apps/mobile/src/lib/tw";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import * as z from 'zod';
import { Button } from "apps/mobile/src/components/ui/Button";
import { useUsernameAvailability } from "apps/mobile/src/hooks/useUsernameAvailability";
import useDebounce from "apps/mobile/src/hooks/useDebounce";
import { Input } from "apps/mobile/src/components/ui/Input";
import { Icons } from "apps/mobile/src/constants/Icons";
import { useFormatter, useNow, useTranslations } from "use-intl";
import { upperFirst } from "lodash";
import { Stack, useLocalSearchParams } from "expo-router";
import { ActivityIndicator, Alert } from "react-native";
import { View } from "apps/mobile/src/components/ui/view";
import { Text } from "apps/mobile/src/components/ui/text";
import { Label } from "apps/mobile/src/components/ui/Label";
import Switch from "apps/mobile/src/components/ui/Switch";
import { Separator } from "apps/mobile/src/components/ui/separator";
import { KeyboardAwareScrollView } from 'apps/mobile/src/components/ui/KeyboardAwareScrollView';
import { GAP, PADDING_HORIZONTAL, PADDING_VERTICAL } from "apps/mobile/src/theme/globals";
import { KeyboardToolbar } from "apps/mobile/src/components/ui/KeyboardToolbar";
import { useToast } from "apps/mobile/src/components/Toast";
import { meOptions, useMeUpdateMutation } from "@libs/query-client";
import { authClient } from "../../lib/auth/client";
import { makeRedirectUri } from "expo-auth-session";
import { useQueryClient } from "@tanstack/react-query";

const USERNAME_MIN_LENGTH = 3;
const USERNAME_MAX_LENGTH = 15;

const verifiedSchema = z.object({
	verified: z
		.enum(['true', 'false'])
		.transform((val) => val === 'true')
		.optional()
		.catch(false),
});

const SettingsAccountScreen = () => {
	const { user } = useAuth();
	const format = useFormatter();
	const t = useTranslations();
	const toast = useToast();
	const { colors, bottomOffset, tabBarHeight } = useTheme();
	const { mutateAsync: updateProfile } = useMeUpdateMutation();
	const [ hasUnsavedChanges, setHasUnsavedChanges ] = useState(false);
	const [ isLoading, setIsLoading ] = useState(false);
	const queryClient = useQueryClient();

	const rawParams = useLocalSearchParams();
	const { verified: isVerified } = useMemo(
		() => verifiedSchema.parse(rawParams),
		[rawParams],
	);

	const now = useNow();
	const dateLastUsernameUpdate = useMemo(() => user?.usernameUpdatedAt ? new Date(user.usernameUpdatedAt) : new Date('01/01/1970'), [user?.usernameUpdatedAt]);
	const usernameDisabled = (now.getTime() - dateLastUsernameUpdate.getTime()) / (1000 * 60 * 60 * 24) < 30 ? true : false;

	// Form
	const accountFormSchema = useMemo(() => z.object({
		username: z
			.string()
			.min(USERNAME_MIN_LENGTH, {
				message: t('common.form.length.char_min', { count: USERNAME_MIN_LENGTH }),
			})
			.max(USERNAME_MAX_LENGTH, {
				message: t('common.form.length.char_max', { count: USERNAME_MAX_LENGTH }),
			})
			.regex(/^[^\W]/, {
				message: t('common.form.username.schema.first_char'),
			})
			.regex(/^(?!.*\.\.)/, {
				message: t('common.form.username.schema.double_dot'),
			})
			.regex(/^(?!.*\.$)/, {
				message: t('common.form.username.schema.ends_with_dot'),
			})
			.regex(/^[\w.]+$/, {
				message: t('common.form.username.schema.format'),
			}),
		private: z.boolean(),
		email: z.email({ error: t('common.form.email.error.invalid') })
	}), [t]);
	type AccountFormValues = z.infer<typeof accountFormSchema>;
	const defaultValues = useMemo((): Partial<AccountFormValues> => ({
		username: user?.username,
		private: user?.isPrivate,
		email: user?.email,
	}), [user]);
	const { reset: fromReset, setError: formSetError, ...form} = useForm<AccountFormValues>({
		resolver: zodResolver(accountFormSchema),
		defaultValues,
		mode: 'onChange',
	});
	const usernameToCheck = useDebounce(form.watch('username'), 500);
	const { data: isUsernameAvailable, isLoading: isUsernameChecking } = useUsernameAvailability(
		!form.formState.errors.username?.message && usernameToCheck && usernameToCheck !== user?.username ? usernameToCheck : undefined
	);

	// Handlers
	const handleOnSubmit = useCallback(async (values: AccountFormValues) => {
		try {
			if (!user) return;
			setIsLoading(true);
			if (
				values.username !== user.username
				|| values.private !== user.isPrivate
			) {
				await updateProfile({
					body: {
						username: values.username,
						isPrivate: values.private,
					}
				}, {
					onError: (error) => {
						toast.error(upperFirst(t('common.messages.an_error_occurred')), { description: error.message });
						throw error;
					}
				});
			}
			if (values.email && values.email !== user.email) {
				const { error } = await authClient.changeEmail({
					newEmail: values.email,
					callbackURL: makeRedirectUri({
						path: '/settings/account',
						queryParams: { verified: 'true' },
					}),
				});
				if (error) {
					switch (error.code) {
						default:
							toast.error(upperFirst(t('common.messages.an_error_occurred')), { description: error.message });
							break;
					}
					throw error;
				}
			}
			setHasUnsavedChanges(false);
			toast.success(upperFirst(t('common.messages.saved', { count: 1, gender: 'male' })));
		} finally {
			setIsLoading(false);
		}
	}, [updateProfile, toast, t, user]);

	// useEffects
	useEffect(() => {
		if (isUsernameAvailable === false) {
			formSetError('username', {
				message: t('common.form.username.schema.unavailable'),
			});
		}
	}, [isUsernameAvailable, t, formSetError]);

	useEffect(() => {
		if (user) {
			fromReset({
				username: user?.username,
				private: user?.isPrivate,
				email: user?.email
			});
		}
	}, [user, fromReset]);

	useEffect(() => {
		if (isVerified) {
			queryClient.invalidateQueries({
				queryKey: meOptions().queryKey,
			});
			toast.success(upperFirst(t('pages.settings.account.email.change_success')));
		}
	}, [isVerified, queryClient, toast, t]);

	useEffect(() => {
		const subscription = form.watch((value) => {
			const isChanged = 
				value.username !== defaultValues.username ||
				value.private !== defaultValues.private ||
				value.email !== defaultValues.email;
			setHasUnsavedChanges(() => isChanged);
		});
		return () => subscription.unsubscribe();
	}, [form, defaultValues.email, defaultValues.private, defaultValues.username]);

	return (
		<>
			<Stack.Screen
			options={{
				headerTitle: upperFirst(t('pages.settings.account.label')),
				headerRight: () => (
					<Button
					variant="ghost"
					size="fit"
					loading={isLoading}
					onPress={form.handleSubmit(handleOnSubmit)}
					disabled={!hasUnsavedChanges || !form.formState.isValid || isLoading}
					>
						{upperFirst(t('common.messages.save'))}
					</Button>
				),
				unstable_headerRightItems: (props) => [
					{
						type: "button",
						label: upperFirst(t('common.messages.save')),
						onPress: form.handleSubmit(handleOnSubmit),
						tintColor: props.tintColor,
						disabled: !hasUnsavedChanges || !form.formState.isValid || isLoading,
						icon: {
							name: "checkmark",
							type: "sfSymbol",
						},
					},
				],
			}}
			/>
			<KeyboardAwareScrollView
			contentContainerStyle={{
				gap: GAP,
				paddingTop: PADDING_VERTICAL,
				paddingHorizontal: PADDING_HORIZONTAL,
				paddingBottom: bottomOffset + PADDING_VERTICAL,
			}}
			scrollIndicatorInsets={{
				bottom: tabBarHeight
			}}
			bottomOffset={bottomOffset + PADDING_VERTICAL}
			>
				<Controller
				name='username'
				control={form.control}
				render={({ field: { onChange, onBlur, value } }) => (
				<View style={tw`gap-2`}>
					<Label>{t('pages.settings.account.username.label')}</Label>
					<Input
					icon={Icons.User}
					disabled={usernameDisabled || isLoading}
					autoComplete="username"
					autoCapitalize='none'
					placeholder={t('pages.settings.account.username.placeholder')}
					value={value}
					autoCorrect={false}
					onBlur={onBlur}
					onChangeText={onChange}
					leftSectionStyle={tw`w-auto`}
					rightComponent={(!form.formState.errors.username && value !== defaultValues.username) ? (
						isUsernameChecking ? <ActivityIndicator />
						: (
							<View style={[{ backgroundColor: isUsernameAvailable ? colors.success : colors.destructive }, tw`rounded-full h-6 w-6 items-center justify-center`]}>
								{isUsernameAvailable ? (
									<Icons.Check size={17} color={colors.successForeground} />
								) : <Icons.Cancel size={17} color={colors.destructiveForeground} />}
							</View>
						)
					) : undefined}
					error={form.formState.errors.username?.message}
					/>
					{usernameDisabled && (
						<Text style={[{ color: colors.destructive }, tw`text-right text-xs`]}>
							{upperFirst(t('common.messages.last_updated_at_date', {
								date: format.dateTime(dateLastUsernameUpdate, { dateStyle: 'long', timeStyle: 'short' })
							}))}
						</Text>
					)}
					<Text textColor='muted' style={tw`text-xs text-justify`}>
						{t('pages.settings.account.username.description')}
					</Text>
				</View>
				)}
				/>
				<Controller
				name='private'
				control={form.control}
				render={({ field: { onChange, onBlur, value } }) => (
				<View style={tw`gap-2`}>
					<View style={tw`flex-row items-center justify-between gap-2`}>
						<Label>{t('pages.settings.account.private.label')}</Label>
						<Switch
						value={value}
						onValueChange={onChange}
						/>
					</View>
					<Text textColor='muted' style={tw`text-xs text-justify`}>
						{t('pages.settings.account.private.description')}
					</Text>
				</View>
				)}
				/>
				<Controller
				name='email'
				control={form.control}
				render={({ field: { onChange, onBlur, value } }) => (
				<View style={tw`gap-2`}>
					<Label>{t('common.form.email.label')}</Label>
					<Input
					icon={Icons.Mail}
					autoComplete="email"
					autoCapitalize='none'
					placeholder={t('common.form.email.placeholder')}
					value={value}
					onBlur={onBlur}
					onChangeText={onChange}
					leftSectionStyle={tw`w-auto`}
					error={form.formState.errors.email?.message}
					disabled={isLoading}
					/>
					{/* {session?.user.new_email && (
					<>
						<Text style={[{ color: colors.destructive }, tw`text-center text-xs`]}>
							{t.rich('pages.settings.account.email.change_pending', {
								strong: (chunks) => <RNText style={tw`font-semibold`}>{chunks}</RNText>,
								date: session.user.email_change_sent_at ? format.dateTime(new Date(session.user.email_change_sent_at), { dateStyle: 'long', timeStyle: 'short' }) : upperFirst(t('common.messages.unknown')),
								email: session.user.new_email
							})}
						</Text>
						<GridView
						data={[
							{
								label: upperFirst(t('common.messages.verify_with_a_code')),
								variant: 'outline' as const,
								textColor: colors.accentYellow,
								onPress: handleVerifyEmailButtonPress,
							},
							{
								label: upperFirst(t('common.messages.cancel_request')),
								variant: 'outline' as const,
								textColor: colors.destructive,
								onPress: handleCancelEmailChange,
							}
						]}
						renderItem={(item) => (
							<Button variant={item.variant} size="sm" onPress={item.onPress} textStyle={[tw`text-center`, item.textColor ? { color: item.textColor } : {}]} disabled={isLoading}>
								{item.label}
							</Button>
						)}
						gap={50}
						/>
					</>
					)} */}
					<Text textColor='muted' style={tw`text-xs text-justify`}>
						{t('pages.settings.account.email.description')}
					</Text>
				</View>
				)}
				/>
				<Separator style={tw`my-4`} />
				<DeleteAccountSection />
			</KeyboardAwareScrollView>
			<KeyboardToolbar />
		</>
	)
};

const DeleteAccountSection = () => {
	const { user } = useAuth();
	const { colors, mode } = useTheme();
	const toast = useToast();
	const format = useFormatter();
	const t = useTranslations();
	// Handlers
	const handleDeleteButtonPress = useCallback(() => {
		Alert.alert(
			upperFirst(t('common.messages.are_u_sure')),
			upperFirst(t('pages.settings.account.delete_account.confirm.description')),
			[
				{
					text: upperFirst(t('common.messages.cancel')),
					style: 'cancel',
				},
				{
					text: upperFirst(t('common.messages.delete')),
					onPress: async () => {
						const { data, error } = await authClient.deleteUser({
							callbackURL: makeRedirectUri({
								path: '/goodbye',
							}),
						});
						if (error) {
							switch (error.code) {
								default:
									toast.error(upperFirst(t('common.messages.an_error_occurred')), { description: error.message });
									break;
							}
						}
						if (data?.success) {
							toast.success(upperFirst(t('common.messages.confirmation_email_sent')));
						}
					},
					style: 'destructive',
				},
			],
			{ cancelable: true, userInterfaceStyle: mode }
		);
	}, [t, mode, toast]);

	return (
		<>
			<Button
			variant="link"
			textStyle={{ color: colors.destructive }}
			onPress={handleDeleteButtonPress}
			>
				{upperFirst(t('pages.settings.account.delete_account.button'))}
			</Button>
		</>
	);
};

export default SettingsAccountScreen;