import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import * as z from 'zod';
import tw from '../../lib/tw';
import { Label } from '../../components/ui/Label';
import { Button } from '../../components/ui/Button';
import { useTheme } from '../../providers/ThemeProvider';
import { useCallback, useMemo, useState } from 'react';
import { useTranslations } from 'use-intl';
import { upperFirst } from 'lodash';
import { Input } from '../../components/ui/Input';
import { Stack } from 'expo-router';
import { Text } from '../../components/ui/text';
import { View } from '../../components/ui/view';
import { KeyboardAwareScrollView } from '../../components/ui/KeyboardAwareScrollView';
import { GAP, PADDING_HORIZONTAL, PADDING_VERTICAL } from '../../theme/globals';
import { KeyboardToolbar } from '../../components/ui/KeyboardToolbar';
import { useToast } from '../../components/Toast';
import { authClient } from '../../lib/auth/client';

const SettingsSecurityScreen = () => {
  const toast = useToast();
  const { bottomOffset, tabBarHeight } = useTheme();
  const t = useTranslations();
  const [isLoading, setIsLoading] = useState(false);
  const profileFormSchema = useMemo(
    () =>
      z
        .object({
          currentPassword: z
            .string({
              message: t('pages.settings.security.current_password.form.invalid'),
            })
            .min(1, {
              message: t('pages.settings.security.current_password.form.required'),
            }),
          newpassword: z
            .string()
            .min(8, {
              message: t('pages.settings.security.new_password.form.min_length'),
            })
            .regex(/[A-Z]/, {
              message: t('pages.settings.security.new_password.form.uppercase'),
            })
            .regex(/[a-z]/, {
              message: t('pages.settings.security.new_password.form.lowercase'),
            })
            .regex(/[0-9]/, {
              message: t('pages.settings.security.new_password.form.number'),
            })
            .regex(/[\W_]/, {
              message: t('pages.settings.security.new_password.form.special'),
            }),
          confirmnewpassword: z.string(),
        })
        .refine((data) => data.newpassword === data.confirmnewpassword, {
          message: t('pages.settings.security.confirm_password.form.match'),
          path: ['confirmnewpassword'],
        }),
    [t],
  );

  type ProfileFormValues = z.infer<typeof profileFormSchema>;

  const defaultValues = useMemo(
    (): Partial<ProfileFormValues> => ({
      newpassword: '',
      confirmnewpassword: '',
    }),
    [],
  );

  const { reset: formReset, ...form } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues,
    mode: 'onChange',
  });

  // Handlers
  const handleSubmit = useCallback(
    async (data: ProfileFormValues) => {
      try {
        setIsLoading(true);
        const { error } = await authClient.changePassword({
          currentPassword: data.currentPassword,
          newPassword: data.newpassword,
          revokeOtherSessions: true,
        });
        if (error) {
          switch (error.code) {
            case 'INVALID_PASSWORD':
              form.setError('currentPassword', {
                message: t('pages.settings.security.current_password.form.invalid'),
              });
              break;
            default:
              toast.error(upperFirst(t('common.messages.an_error_occurred')));
              break;
          }
          throw error;
        }
        toast.success(upperFirst(t('common.messages.saved', { count: 1, gender: 'male' })));
        formReset();
      } finally {
        setIsLoading(false);
      }
    },
    [t, toast, form, formReset],
  );

  return (
    <>
      <Stack.Screen
        options={useMemo(
          () => ({
            headerTitle: upperFirst(t('pages.settings.security.label')),
            headerRight: () => (
              <Button
                variant="ghost"
                size="fit"
                loading={isLoading}
                onPress={form.handleSubmit(handleSubmit)}
                disabled={!form.formState.isValid || isLoading}
              >
                {upperFirst(t('common.messages.save'))}
              </Button>
            ),
            unstable_headerRightItems: (props) => [
              {
                type: 'button',
                label: upperFirst(t('common.messages.save')),
                onPress: form.handleSubmit(handleSubmit),
                tintColor: props.tintColor,
                disabled: !form.formState.isValid || isLoading,
                icon: {
                  name: 'checkmark',
                  type: 'sfSymbol',
                },
              },
            ],
          }),
          [t, isLoading, form, handleSubmit],
        )}
      />
      <KeyboardAwareScrollView
        contentContainerStyle={{
          gap: GAP,
          paddingTop: PADDING_VERTICAL,
          paddingHorizontal: PADDING_HORIZONTAL,
          paddingBottom: bottomOffset + PADDING_VERTICAL,
        }}
        scrollIndicatorInsets={{
          bottom: tabBarHeight,
        }}
        bottomOffset={bottomOffset + PADDING_VERTICAL}
      >
        <Text textColor="muted" style={tw`text-sm text-justify`}>
          {t(`pages.settings.security.description`)}
        </Text>
        <Controller
          name="currentPassword"
          control={form.control}
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={tw`gap-2`}>
              <Label>{upperFirst(t('pages.settings.security.current_password.label'))}</Label>
              <Input
                label={null}
                placeholder={t('pages.settings.security.current_password.placeholder')}
                value={value ?? ''}
                onChangeText={onChange}
                onBlur={onBlur}
                nativeID="currentPassword"
                autoComplete="new-password"
                autoCapitalize="none"
                disabled={isLoading}
                leftSectionStyle={tw`w-auto`}
                error={form.formState.errors.currentPassword?.message}
                type="password"
              />
            </View>
          )}
        />
        <Controller
          name="newpassword"
          control={form.control}
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={tw`gap-2`}>
              <Label>{upperFirst(t('pages.settings.security.new_password.label'))}</Label>
              <Input
                label={null}
                placeholder={t('pages.settings.security.new_password.placeholder')}
                value={value ?? ''}
                onChangeText={onChange}
                onBlur={onBlur}
                nativeID="newpassword"
                autoComplete="new-password"
                autoCapitalize="none"
                disabled={isLoading}
                leftSectionStyle={tw`w-auto`}
                error={form.formState.errors.newpassword?.message}
                type="password"
              />
            </View>
          )}
        />
        <Controller
          name="confirmnewpassword"
          control={form.control}
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={tw`gap-2`}>
              <Label>{upperFirst(t('common.form.password.confirm.label'))}</Label>
              <Input
                label={null}
                placeholder={t('pages.settings.security.confirm_password.placeholder')}
                value={value ?? ''}
                onChangeText={onChange}
                onBlur={onBlur}
                nativeID="confirmnewpassword"
                autoComplete="new-password"
                autoCapitalize="none"
                disabled={isLoading}
                leftSectionStyle={tw`w-auto`}
                error={form.formState.errors.confirmnewpassword?.message}
                type="password"
              />
            </View>
          )}
        />
      </KeyboardAwareScrollView>
      <KeyboardToolbar />
    </>
  );
};

export default SettingsSecurityScreen;
