import { useEffect, useRef, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { upperFirst } from 'lodash';
import { useTranslations } from 'use-intl';
import tw from '../../lib/tw';
import { Text } from '../../components/ui/text';
import { View } from '../../components/ui/view';
import { Spinner } from '../../components/ui/spinner';
import { Icons } from '../../constants/Icons';
import { useTheme } from '../../providers/ThemeProvider';
import { useAuth } from '../../providers/AuthProvider';
import { authClient, clearSessionCookie, storeSessionCookie } from '../../lib/auth/client';
import { consumeEmailHandoverToken } from '../../lib/auth/emailHandover';
import { logger } from '../../logger';
import { isAndroid, isIpad } from '../../platform/detection';

// Long enough to be read, short enough that nobody looks for a button.
const CLOSE_DELAY_MS = 3000;

/**
 * Where a verification link lands. The address is verified by the time this
 * mounts; what is left is the session, which rides in on the `cookie` param the
 * expo plugin appends to the deep link.
 *
 * On success nothing navigates: the auth screens sit behind a guard on `!user`,
 * so the router takes this screen away by itself. Only the paths that leave no
 * session -- no cookie, a link this device did not ask for, expired, offline --
 * fall back to the auth screen.
 */
const EmailConfirmedScreen = () => {
  const t = useTranslations();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colors, theme } = useTheme();
  const insets = useSafeAreaInsets();
  // iPhone sheets already clear the home indicator on their own, iPad sheets
  // and the Android bottom sheet do not.
  const bottomInset = isIpad || isAndroid ? insets.bottom : 0;
  const { user } = useAuth();
  const { cookie, handover } = useLocalSearchParams<{
    cookie?: string;
    handover?: string;
  }>();
  const [isSigningIn, setIsSigningIn] = useState(!!cookie && !!handover);

  const hasSignedIn = useRef(false);
  useEffect(() => {
    if (!cookie || !handover || hasSignedIn.current) return;
    hasSignedIn.current = true;
    void (async () => {
      try {
        const issued = await consumeEmailHandoverToken();
        if (!issued || issued !== handover) {
          throw new Error('Verification link is not the one this device asked for');
        }
        await storeSessionCookie(cookie);
        const { data: session, error } = await authClient.getSession();
        if (error) throw error;
        if (!session) {
          // The API does not know this cookie. Left behind, it would be sent on
          // the next request and answered with an erasure that can wipe a later
          // handover's own cookie -- one failure feeding the next.
          await clearSessionCookie();
          throw new Error('No session behind the verification link');
        }
        // Cancels the session fetch that may already be in flight without one,
        // then reads everything back with the cookie in the jar.
        await queryClient.resetQueries();
        logger.metric('account:loggedIn', {
          logContext: 'EmailConfirmedScreen',
          withPassword: false,
        });
      } catch (error) {
        // A failure only means a sign-in by hand.
        logger.error('email verified sign-in error', { error });
      } finally {
        setIsSigningIn(false);
      }
    })();
  }, [cookie, handover, queryClient]);

  useEffect(() => {
    if (isSigningIn || user) return;
    const timer = setTimeout(() => router.dismissTo({ pathname: '/auth' }), CLOSE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [isSigningIn, user, router]);

  return (
    <View
      style={[
        tw`items-center`,
        {
          gap: theme.spaces.md,
          paddingTop: theme.spaces.vertical,
          paddingLeft: insets.left + theme.spaces.horizontal,
          paddingRight: insets.right + theme.spaces.horizontal,
          paddingBottom: bottomInset + theme.spaces.vertical,
        },
      ]}
    >
      {isSigningIn ? (
        <Spinner size="lg" />
      ) : (
        <Icons.Check color={colors.success} size={theme.icons.sizes.xl} />
      )}
      <Text variant="title" style={tw`text-center`}>
        {upperFirst(t('common.messages.email_confirmed'))}
      </Text>
    </View>
  );
};

export default EmailConfirmedScreen;
