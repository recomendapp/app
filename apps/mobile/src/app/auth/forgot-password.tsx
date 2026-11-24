import { useCallback, useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import tw from '../../lib/tw';
import { useTheme } from '../../providers/ThemeProvider';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { upperFirst } from 'lodash';
import { Icons } from '../../constants/Icons';
import { useTranslations } from 'use-intl';
import { z } from 'zod';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Text } from '../../components/ui/text';
import { View } from '../../components/ui/view';
import { useToast } from '../../components/Toast';
import { logger } from '../../logger';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { authClient } from '../../lib/auth/client';
import { makeRedirectUri } from 'expo-auth-session';
import { useHeaderHeight } from 'expo-router/react-navigation';
import { useModalHeaderOptions } from '../../hooks/useModalHeaderOptions';
import { isAndroid, isIpad } from '../../platform/detection';

enum STEPS {
  EMAIL = 1,
  EMAIL_VERIFICATION = 2,
}

const ForgotPasswordScreen = () => {
  const { colors, theme } = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const t = useTranslations();
  const navigationHeaderHeight = useHeaderHeight();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const modalHeaderOptions = useModalHeaderOptions({ forceCross: true });
  // iPhone sheets already clear the home indicator on their own, iPad sheets
  // and the Android bottom sheet do not.
  const bottomInset = isIpad || isAndroid ? insets.bottom : 0;

  const [currentStep, setCurrentStep] = useState(STEPS.EMAIL);

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
  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: defaultValues,
    mode: 'onSubmit',
  });
  /* -------------------------------------------------------------------------- */

  // Handlers
  const handleSubmit = useCallback(
    async (data: ForgotPasswordFormValues) => {
      try {
        setIsLoading(true);
        const { error } = await authClient.requestPasswordReset({
          email: data.email,
          redirectTo: makeRedirectUri({
            path: '/auth/reset-password',
          }),
        });
        if (error) {
          switch (error.code) {
            default:
              toast.error(t('common.messages.an_error_occurred'));
              logger.error('Forgot password error', error);
              break;
          }
          throw error;
        }
        toast.success(upperFirst(t('common.form.code_sent')));
        setCurrentStep(STEPS.EMAIL_VERIFICATION);
      } finally {
        setIsLoading(false);
      }
    },
    [t, toast],
  );

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
              {upperFirst(t('common.messages.forgot_password'))}
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
        {currentStep === STEPS.EMAIL ? (
          <>
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
                    placeholder={t('pages.auth.forgot_password.form.email.placeholder')}
                    autoFocus
                    nativeID="email"
                    inputMode="email"
                    autoComplete="email"
                    autoCapitalize="none"
                    value={value}
                    onChangeText={onChange}
                    disabled={isLoading}
                    keyboardType="email-address"
                    onBlur={onBlur}
                    error={form.formState.errors.email?.message}
                  />
                )}
              />
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
              <Icons.Mail color={colors.foreground} size={theme.icons.sizes.xl} />
              <View style={[tw`items-center`, { gap: theme.spaces.sm }]}>
                <Text textColor="muted" style={tw`text-center`}>
                  {t('pages.auth.forgot_password.confirm_form.description', {
                    email: form.getValues('email'),
                  })}
                </Text>
              </View>
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

export default ForgotPasswordScreen;
