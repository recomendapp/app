import { useCallback, useEffect, useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { Stack, useRouter } from 'expo-router';
import tw from '../../../lib/tw';
import { useTheme } from '../../../providers/ThemeProvider';
import { Input } from '../../../components/ui/Input';
import { upperFirst } from 'lodash';
import { Icons } from '../../../constants/Icons';
import { useTranslations } from 'use-intl';
import * as z from 'zod';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Text } from '../../../components/ui/text';
import { InputOTP } from '../../../components/ui/input-otp';
import { View } from '../../../components/ui/view';
import { useToast } from '../../../components/Toast';
import { logger } from '../../../logger';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { authClient } from '../../../lib/auth/client';
import { useModalHeaderOptions } from '../../../hooks/useModalHeaderOptions';
import { useConfirmLeave } from '../../../hooks/useConfirmLeave';
import { isAndroid, isIpad } from '../../../platform/detection';
import { useHeaderHeight } from 'expo-router/react-navigation';
const RESEND_COOLDOWN_SECONDS = 30;

const LoginOtpScreen = () => {
  const { theme } = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const t = useTranslations();
  const navigationHeaderHeight = useHeaderHeight();
  const [isLoading, setIsLoading] = useState(false);
  const modalHeaderOptions = useModalHeaderOptions({ forceCross: true });
  // iPhone sheets already clear the home indicator on their own, iPad sheets
  // and the Android bottom sheet do not.
  const bottomInset = isIpad || isAndroid ? insets.bottom : 0;
  // OTP
  const numberOfDigits = 6;
  const [showOtp, setShowOtp] = useState<boolean>(false);
  const [otp, setOtp] = useState('');
  // RESEND COOLDOWN
  const [cooldownEndsAt, setCooldownEndsAt] = useState<number | null>(null);
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (cooldownEndsAt === null) return;
    // Counted off a wall-clock deadline rather than by decrementing: an
    // interval drifts, and stops ticking at all while the app is backgrounded.
    const tick = () => {
      const left = Math.max(Math.ceil((cooldownEndsAt - Date.now()) / 1000), 0);
      setResendIn(left);
      if (left === 0) setCooldownEndsAt(null);
    };
    tick();
    const interval = setInterval(tick, 250);
    return () => clearInterval(interval);
  }, [cooldownEndsAt]);

  // A code has been sent by now, and leaving wastes it.
  useConfirmLeave({
    enabled: showOtp,
    title: upperFirst(t('common.messages.are_u_sure')),
    cancelLabel: upperFirst(t('common.messages.continue')),
    confirmLabel: upperFirst(t('common.messages.ignore')),
  });

  const stepTitle = showOtp
    ? t('pages.auth.login.otp.confirm_form.label')
    : upperFirst(t('common.messages.otp'));

  /* ------------------------------- FORM SCHEMA ------------------------------ */
  const forgotPasswordSchema = z.object({
    email: z.email({
      error: t('common.form.email.error.invalid'),
    }),
  });
  type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
  const defaultValues: Partial<ForgotPasswordFormValues> = {
    email: '',
  };
  const { getValues: formGetValues, ...form } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: defaultValues,
    mode: 'onChange',
  });
  /* -------------------------------------------------------------------------- */

  // Handlers
  const handleSubmit = useCallback(
    async (data: ForgotPasswordFormValues) => {
      try {
        setIsLoading(true);
        const { error } = await authClient.emailOtp.sendVerificationOtp({
          email: data.email,
          type: 'sign-in',
        });
        if (error) {
          switch (error.code) {
            default:
              toast.error(upperFirst(t('common.messages.an_error_occurred')));
              logger.error('login with otp error', { error });
              break;
          }
          throw error;
        }
        toast.success(upperFirst(t('common.form.code_sent')));
        setShowOtp(true);
        setCooldownEndsAt(Date.now() + RESEND_COOLDOWN_SECONDS * 1000);
      } finally {
        setIsLoading(false);
      }
    },
    [t, toast],
  );
  const handleVerifyOtp = useCallback(
    async (otp: string) => {
      try {
        setIsLoading(true);
        const { error } = await authClient.signIn.emailOtp({
          email: formGetValues('email'),
          otp,
        });
        if (error) {
          switch (error.code) {
            case 'INVALID_OTP':
              toast.error(t('common.form.error.invalid_code'));
              logger.metric('account:loginFailed', {
                logContext: 'LoginOtpScreen',
                reason: error.code,
              });
              break;
            default:
              toast.error(upperFirst(t('common.messages.an_error_occurred')));
              logger.error('otp verification error', { error });
              break;
          }
          throw error;
        }
        logger.metric('account:loggedIn', {
          logContext: 'LoginOtpScreen',
          withPassword: false,
        });
        toast.success(upperFirst(t('common.form.code_verified')));
        await queryClient.resetQueries();
      } finally {
        setIsLoading(false);
        setOtp('');
      }
    },
    [t, toast, formGetValues, queryClient],
  );
  return (
    <>
      <Stack.Screen
        options={
          isAndroid ? { headerShown: false } : { ...modalHeaderOptions, headerTitle: stepTitle }
        }
      />
      {isAndroid && (
        <View
          style={[
            tw`flex-row items-center`,
            {
              paddingTop: theme.spaces.sm,
              paddingBottom: theme.spaces.sm,
              paddingLeft: insets.left + theme.spaces.horizontal,
              paddingRight: insets.right + theme.spaces.horizontal,
            },
          ]}
        >
          <Button
            variant="muted"
            size="icon"
            icon={Icons.X}
            disabled={isLoading}
            onPress={() => router.dismiss()}
            style={tw`rounded-full`}
          />
          <View pointerEvents="none" style={tw`items-center justify-center absolute inset-0`}>
            <Text variant="title" numberOfLines={1}>
              {stepTitle}
            </Text>
          </View>
        </View>
      )}
      <View
        style={{
          gap: theme.spaces.md,
          paddingTop: navigationHeaderHeight + theme.spaces.vertical,
          paddingLeft: insets.left + theme.spaces.horizontal,
          paddingRight: insets.right + theme.spaces.horizontal,
          paddingBottom: bottomInset + theme.spaces.vertical,
        }}
      >
        {!showOtp ? (
          <>
            <View style={[tw`w-full`, { gap: theme.spaces.md }]}>
              <View style={{ gap: theme.spaces.sm }}>
                <Text textColor="muted" style={tw`font-semibold`}>
                  {upperFirst(t('common.form.email.label'))}
                </Text>
                <Controller
                  name="email"
                  control={form.control}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      icon={Icons.Mail}
                      nativeID="email"
                      placeholder={t('common.form.email.placeholder')}
                      autoComplete="email"
                      autoCapitalize="none"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      disabled={isLoading}
                      keyboardType="email-address"
                      error={form.formState.errors.email?.message}
                    />
                  )}
                />
              </View>
              {/* SUBMIT BUTTON */}
              <Button
                loading={isLoading}
                onPress={() => void form.handleSubmit(handleSubmit)()}
                style={tw`w-full rounded-xl`}
              >
                {t('pages.auth.login.otp.form.submit')}
              </Button>
            </View>
          </>
        ) : (
          <>
            <Text textColor="muted" style={tw`text-center`}>
              {t('pages.auth.login.otp.confirm_form.description', {
                email: formGetValues('email'),
              })}
            </Text>
            <InputOTP
              length={numberOfDigits}
              value={otp}
              onChange={setOtp}
              onComplete={handleVerifyOtp}
              disabled={isLoading}
            />
            <View style={tw`items-center`}>
              <Text textColor="muted">{t('common.form.error.not_received_code')} </Text>
              <Button
                variant="ghost"
                style={tw`p-0`}
                disabled={isLoading || resendIn > 0}
                onPress={() => void form.handleSubmit(handleSubmit)()}
              >
                {resendIn > 0
                  ? `${t('common.form.resend_code')} (${resendIn}s)`
                  : t('common.form.resend_code')}
              </Button>
            </View>
          </>
        )}
      </View>
    </>
  );
};

export default LoginOtpScreen;
