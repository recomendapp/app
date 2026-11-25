import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { HeaderTitle } from 'expo-router/react-navigation';
import { RefreshControl, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialTopTabBarProps, TopTabs } from 'expo-router/js-top-tabs';
import { useQuery } from '@tanstack/react-query';
import { userByUsernameOptions } from '@libs/query-client';
import { upperFirst } from 'lodash';
import { useTranslations } from 'use-intl';
import { Button } from '../../../../../../components/ui/Button';
import { View } from '../../../../../../components/ui/view';
import { Icons } from '../../../../../../constants/Icons';
import tw from '../../../../../../lib/tw';
import { useAuth } from '../../../../../../providers/AuthProvider';
import { useTheme } from '../../../../../../providers/ThemeProvider';
import { useUserHeaderMenu } from '../../../../../../components/header-menus/useUserHeaderMenu';
import { CardError } from '../../../../../../components/cards/CardError';
import ProfileHeader from '../../../../../../components/screens/user/profile/ProfileHeader';
import ProfilePrivateCard from '../../../../../../components/screens/user/profile/ProfilePrivateCard';
import { ProfileTabsProvider } from '../../../../../../components/screens/user/profile/ProfileTabsProvider';
import ProfileTabsOverlay from '../../../../../../components/screens/user/profile/ProfileTabsOverlay';

/**
 * The profile and its four lists: one screen as far as the stack is concerned,
 * four routes as far as the reader and the URL are concerned. `/user/x/films`
 * opens straight on the films tab, and swiping to another tab rewrites the URL,
 * because each tab is a route of this navigator rather than a piece of local
 * state.
 */
const ProfileLayout = () => {
  const t = useTranslations();
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();
  const { username } = useLocalSearchParams<{ username: string }>();

  const {
    data: profile,
    isLoading,
    isError,
    isRefetching,
    refetch: refreshProfile,
  } = useQuery(userByUsernameOptions({ username }));
  const loading = isLoading || (!isError && profile === undefined);
  const isOwnProfile = profile?.id === user?.id || user?.username === username;

  const { onMenuPress, headerRightItems } = useUserHeaderMenu({ profile });

  return (
    <ProfileTabsProvider
      profile={profile}
      profileIsLoading={loading}
      refreshProfile={refreshProfile}
    >
      <Stack.Screen
        options={{
          title: profile ? `@${profile.username}` : '',
          headerTitle: (props) => (
            <View style={tw`flex-row items-center gap-1`}>
              <HeaderTitle {...props}>{profile ? `@${profile.username}` : ''}</HeaderTitle>
              {profile?.isPremium && <Icons.premium color={colors.accentBlue} size={14} />}
            </View>
          ),
          headerTitleAlign: 'center',
          headerRight: () => (
            <>
              {isOwnProfile && (
                <Button
                  variant="ghost"
                  size="icon"
                  icon={Icons.settings}
                  onPress={() => router.push('/settings')}
                />
              )}
              <Button
                variant="ghost"
                size="icon"
                icon={Icons.EllipsisVertical}
                onPress={onMenuPress}
              />
            </>
          ),
          unstable_headerRightItems: (props) => [
            ...(isOwnProfile
              ? ([
                  {
                    type: 'button',
                    label: upperFirst(t('common.messages.setting', { count: 2 })),
                    onPress: () => router.push('/settings'),
                    tintColor: props.tintColor,
                    icon: { name: 'gearshape', type: 'sfSymbol' },
                  },
                ] as const)
              : []),
            ...(headerRightItems ? headerRightItems() : []),
          ],
        }}
      />
      {loading ? (
        // Nothing under the header is worth drawing yet: the lists are keyed to
        // a profile that has not arrived, and a tab bar over four empty lists
        // only invites taps that lead nowhere.
        <ProfileState>
          <ProfileHeader skeleton />
        </ProfileState>
      ) : isError || !profile ? (
        <ProfileState onRefresh={refreshProfile} refreshing={isRefetching}>
          <CardError label={upperFirst(t('common.messages.user_not_found'))} style={tw`flex-1`} />
        </ProfileState>
      ) : !profile.isVisible ? (
        <ProfileState onRefresh={refreshProfile} refreshing={isRefetching}>
          <ProfileHeader profile={profile} />
          <ProfilePrivateCard />
        </ProfileState>
      ) : (
        <ProfileTabs />
      )}
    </ProfileTabsProvider>
  );
};

/**
 * The header and whatever stands in for the lists, for the states where there
 * are none: the profile still loading, refused, or private. Scrollable so a
 * reader can pull it to try again.
 */
const ProfileState = ({
  children,
  onRefresh,
  refreshing,
}: {
  children: React.ReactNode;
  onRefresh?: () => void;
  refreshing?: boolean;
}) => {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      refreshControl={
        onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} /> : undefined
      }
      contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom }}
    >
      {children}
    </ScrollView>
  );
};

/**
 * Inside the provider so the tab bar can report which list the header follows,
 * and so the pager can be told how much of the screen the overlay hides.
 */
const ProfileTabs = () => {
  const t = useTranslations();

  return (
    <TopTabs
      // The overlay is handed over as the tab bar, but it is positioned
      // absolutely: the pager keeps the whole screen and each list clears the
      // overlay with its own top padding.
      tabBar={(props: MaterialTopTabBarProps) => <ProfileTabsOverlay {...props} />}
      // All four stay mounted: a list mounted on arrival would start at the top
      // and spring the header back open.
      screenOptions={{ lazy: false }}
    >
      <TopTabs.Screen
        name="index"
        options={{ title: upperFirst(t('common.messages.all', { count: 2, gender: 'male' })) }}
      />
      <TopTabs.Screen
        name="films"
        options={{ title: upperFirst(t('common.messages.film', { count: 2 })) }}
      />
      <TopTabs.Screen
        name="tv-series"
        options={{ title: upperFirst(t('common.messages.tv_series', { count: 2 })) }}
      />
      <TopTabs.Screen
        name="playlists"
        options={{ title: upperFirst(t('common.messages.playlist', { count: 2 })) }}
      />
    </TopTabs>
  );
};

export default ProfileLayout;
