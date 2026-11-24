import { useAuth } from '../../../providers/AuthProvider';
import { useCallback, useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { Link, Stack, useRouter } from 'expo-router';
import tw from '../../../lib/tw';
import { useTheme } from '../../../providers/ThemeProvider';
import { Input } from '../../../components/ui/Input';
import { upperCase, upperFirst } from 'lodash';
import { Icons } from '../../../constants/Icons';
import { useTranslations } from 'use-intl';
import { Text } from '../../../components/ui/text';
import { View } from '../../../components/ui/view';
import { OAuthProviders } from '../../../components/OAuth/OAuthProviders';
import { logger } from '../../../logger';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { z } from 'zod';
import { useModalHeaderOptions } from '../../../hooks/useModalHeaderOptions';
import { isAndroid, isIpad } from '../../../platform/detection';
import { useHeaderHeight } from 'expo-router/react-navigation';

const EmailSchema = z.email();

const LoginScreen = () => {
  const { login } = useAuth();
  const insets = useSafeAreaInsets();
  const { colors, theme } = useTheme();
  const router = useRouter();
  const t = useTranslations();
  const navigationHeaderHeight = useHeaderHeight();
  const modalHeaderOptions = useModalHeaderOptions({ forceCross: true });
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  // iPhone sheets already clear the home indicator on their own, iPad sheets
  // and the Android bottom sheet do not.
  const bottomInset = isIpad || isAndroid ? insets.bottom : 0;

  const handleSubmit = useCallback(async () => {
    try {
      setIsLoading(true);
      const isEmail = EmailSchema.safeParse(identifier).success;
      await login({
        password: password,
        ...(isEmail ? { email: identifier } : { username: identifier }),
      });
      logger.metric('account:loggedIn', {
        logContext: 'LoginForm',
        withPassword: true,
      });
    } catch (error) {
      // `login` has already told the reader what went wrong - it rethrows to
      // stop the flow, not to be reported twice.
      logger.error('login error', { error });
    } finally {
      setIsLoading(false);
    }
  }, [identifier, password, login]);

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
              {upperFirst(t('common.messages.login'))}
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
        {/* OAUTH */}
        <OAuthProviders iconOnly />
        {/* SEPARATOR */}
        <View
          style={[
            tw`flex-row items-center`,
            { gap: theme.spaces.md, paddingVertical: theme.spaces.md },
          ]}
        >
          <View style={[tw`flex-1`, { height: 1, backgroundColor: colors.border }]} />
          <Text textColor="muted">{upperFirst(t('common.messages.or_continue_with'))}</Text>
          <View style={[tw`flex-1`, { height: 1, backgroundColor: colors.border }]} />
        </View>
        <View style={[tw`w-full`, { gap: theme.spaces.md }]}>
          <View style={{ gap: theme.spaces.lg }}>
            <View style={{ gap: theme.spaces.sm }}>
              <Text textColor="muted" style={tw`font-semibold`}>
                {t('pages.auth.login.form.identifier.label')}
              </Text>
              <Input
                icon={Icons.Mail}
                nativeID="email"
                placeholder={t('pages.auth.login.form.identifier.placeholder')}
                autoComplete="email"
                autoCapitalize="none"
                value={identifier}
                onChangeText={setIdentifier}
                disabled={isLoading}
                keyboardType="email-address"
              />
            </View>
            <View style={{ gap: theme.spaces.sm }}>
              <Text textColor="muted" style={tw`font-semibold`}>
                {t('pages.auth.login.form.password.label')}
              </Text>
              <Input
                label={null}
                nativeID="password"
                placeholder={t('pages.auth.login.form.password.placeholder')}
                autoComplete="password"
                autoCapitalize="none"
                value={password}
                onChangeText={setPassword}
                disabled={isLoading}
                type="password"
              />
            </View>
          </View>
          {/* FORGOT PASSWORD */}
          <Link href="/auth/forgot-password" asChild>
            <Text textColor="muted" style={tw`text-right`}>
              {t('pages.auth.login.form.forgot_password')}
            </Text>
          </Link>
          {/* SUBMIT BUTTON */}
          <Button loading={isLoading} onPress={handleSubmit} style={tw`w-full rounded-xl`}>
            {t('pages.auth.login.form.submit')}
          </Button>
        </View>
        <Button variant="muted" onPress={() => router.push('/auth/login/otp')} icon={Icons.OTP}>
          {upperCase(t('common.messages.otp'))}
        </Button>
        {/* SIGNUP */}
        <Text style={[{ color: colors.mutedForeground }, tw`text-center`]}>
          {t('pages.auth.login.no_account_yet')}{' '}
          <Link href={'/auth/signup'} replace style={{ color: colors.accentYellow }}>
            {upperFirst(t('common.messages.signup'))}
          </Link>
        </Text>
      </View>
    </>
  );
};

export default LoginScreen;
