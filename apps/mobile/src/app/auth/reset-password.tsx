import { View } from '../../components/ui/view';
import { Icons } from '../../constants/Icons';
import tw from '../../lib/tw';
import { useCallback, useMemo, useState } from 'react';
import { Redirect, useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useTranslations } from 'use-intl';
import { useToast } from '../../components/Toast';
import { logger } from '../../logger';
import { z } from 'zod';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Text } from '../../components/ui/text';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { authClient } from '../../lib/auth/client';
import { useTheme } from '../../providers/ThemeProvider';
import { upperFirst } from 'lodash';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHeaderHeight } from 'expo-router/react-navigation';
import { useModalHeaderOptions } from '../../hooks/useModalHeaderOptions';
import { useConfirmLeave } from '../../hooks/useConfirmLeave';
import { isAndroid, isIpad } from '../../platform/detection';
import { USER_RULES } from '@libs/rules';

enum STEPS {
  PASSWORD = 1,
  LOGIN = 2,
}

const AuthResetPasswordScreen = () => {
  const t = useTranslations();
  const toast = useToast();
  const router = useRouter();
  const { colors, theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { token } = useLocalSearchParams<{ token: string }>();
  const [isLoading, setIsLoading] = useState(false);
  const navigationHeaderHeight = useHeaderHeight();
  const modalHeaderOptions = useModalHeaderOptions({ forceCross: true });
  // iPhone sheets already clear the home indicator on their own, iPad sheets
  // and the Android bottom sheet do not.
  const bottomInset = isIpad || isAndroid ? insets.bottom : 0;

  /* ---------------------------------- Schema ---------------------------------- */
  const resetPasswordSchema = useMemo(
    () =>
      z
        .object({
          newPassword: z
            .string()
            .min(USER_RULES.PASSWORD.MIN, {
              message: t('common.form.length.char_min', { count: USER_RULES.PASSWORD.MIN }),
            })
            .regex(/[A-Z]/, {
              message: t('common.form.password.schema.uppercase'),
            })
            .regex(/[a-z]/, {
              message: t('common.form.password.schema.lowercase'),
            })
            .regex(/[0-9]/, {
              message: t('common.form.password.schema.number'),
            })
            .regex(/[\W_]/, {
              message: t('common.form.password.schema.special'),
            }),
          confirmPassword: z.string(),
        })
        .refine((data) => data.newPassword === data.confirmPassword, {
          message: t('common.form.password.schema.match'),
          path: ['confirm_password'],
        }),
    [t],
  );
  type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    mode: 'onChange',
  });

  /* ---------------------------------- Steps --------------------------------- */
  const [currentStep, setCurrentStep] = useState(STEPS.PASSWORD);

  // Only while a password is being typed: once it is set, step two has
  // nothing left to lose.
  useConfirmLeave({
    enabled: currentStep === STEPS.PASSWORD && form.formState.isDirty,
    title: upperFirst(t('common.messages.are_u_sure')),
    cancelLabel: upperFirst(t('common.messages.continue')),
    confirmLabel: upperFirst(t('common.messages.ignore')),
  });

  /* -------------------------------- Handlers -------------------------------- */
  const handleFinish = useCallback(() => {
    if (router.canDismiss()) {
      router.dismissTo({
        pathname: '/auth',
      });
    } else {
      router.replace({
        pathname: '/auth',
      });
    }
  }, [router]);

  const handleSubmit = useCallback(
    async (data: ResetPasswordFormValues) => {
      try {
        setIsLoading(true);
        const { error } = await authClient.resetPassword({
          newPassword: data.newPassword,
          token: token,
        });
        if (error) {
          switch (error.code) {
            case 'INVALID_TOKEN':
              toast.error(t('common.messages.invalid_token'));
              break;
            default:
              toast.error(t('common.messages.an_error_occurred'));
              logger.error('Reset password error', error);
              break;
          }
          throw error;
        }
        setCurrentStep(STEPS.LOGIN);
      } finally {
        setIsLoading(false);
      }
    },
    [token, toast, t],
  );

  if (!token) {
    return <Redirect href={{ pathname: '/auth' }} />;
  }

  return (
    <>
      <Stack.Screen options={isAndroid ? { headerShown: false } : modalHeaderOptions} />
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
              {upperFirst(t('common.messages.reset_your_password'))}
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
        {currentStep === STEPS.PASSWORD ? (
          <>
            <View style={{ gap: theme.spaces.lg }}>
              <View style={{ gap: theme.spaces.sm }}>
                <Text textColor="muted" style={tw`font-semibold`}>
                  {upperFirst(t('common.messages.new_password'))}
                </Text>
                <Controller
                  name="newPassword"
                  control={form.control}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      label={null}
                      placeholder={t('pages.settings.security.new_password.placeholder')}
                      autoFocus
                      nativeID="new-password"
                      value={value}
                      onChangeText={onChange}
                      autoComplete="new-password"
                      autoCapitalize="none"
                      onBlur={onBlur}
                      disabled={isLoading}
                      error={form.formState.errors.newPassword?.message}
                      type="password"
                    />
                  )}
                />
              </View>
              <View style={{ gap: theme.spaces.sm }}>
                <Text textColor="muted" style={tw`font-semibold`}>
                  {upperFirst(t('common.messages.confirm_password'))}
                </Text>
                <Controller
                  name="confirmPassword"
                  control={form.control}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      label={null}
                      placeholder={t('pages.settings.security.confirm_password.placeholder')}
                      nativeID="confirm-password"
                      value={value}
                      onChangeText={onChange}
                      autoComplete="new-password"
                      autoCapitalize="none"
                      onBlur={onBlur}
                      disabled={isLoading}
                      error={form.formState.errors.confirmPassword?.message}
                      type="password"
                    />
                  )}
                />
              </View>
            </View>
            <Button
              loading={isLoading}
              onPress={() => void form.handleSubmit(handleSubmit)()}
              style={tw`w-full rounded-xl`}
            >
              {t('common.messages.continue')}
            </Button>
          </>
        ) : (
          <>
            <View style={[tw`items-center`, { gap: theme.spaces.md }]}>
              <Icons.Check color={colors.success} size={theme.icons.sizes.xl} />
              <Text variant="title" style={tw`text-center`}>
                {t('common.messages.password_reseted')}
              </Text>
            </View>
            <Button icon={Icons.Check} onPress={handleFinish} style={tw`w-full rounded-xl`}>
              {t('common.messages.finish')}
            </Button>
          </>
        )}
      </View>
    </>
  );
};

export default AuthResetPasswordScreen;
