import { View } from '../../../../../../components/ui/view';
import tw from '../../../../../../lib/tw';
import { useTheme } from '../../../../../../providers/ThemeProvider';
import { TopTabs } from 'expo-router/js-top-tabs';
import { HeaderTitle } from 'expo-router/react-navigation';
import { Stack, useLocalSearchParams } from 'expo-router';
import { upperFirst } from 'lodash';
import { useTranslations } from 'use-intl';
import { Icons } from '../../../../../../constants/Icons';
import { useQuery } from '@tanstack/react-query';
import { userByUsernameOptions } from '@libs/query-client';

export const unstable_settings = {
  anchor: 'followers',
};

const ProfileFollowLayout = () => {
  const { username } = useLocalSearchParams<{ username: string }>();
  const { data: profile } = useQuery(userByUsernameOptions({ username: username }));
  const { colors } = useTheme();
  const t = useTranslations();
  return (
    <>
      <Stack.Screen
        options={{
          title: profile ? `@${profile.username}` : '',
          headerTitle: (props) => (
            <View style={tw`flex-row items-center gap-1`}>
              <HeaderTitle {...props}>{profile ? `@${profile.username}` : ''}</HeaderTitle>
              {profile?.isPremium && <Icons.premium color={colors.accentBlue} size={14} />}
            </View>
          ),
          headerBackButtonDisplayMode: 'minimal',
        }}
      />
      <TopTabs
        screenOptions={{
          tabBarIndicatorStyle: {
            backgroundColor: colors.accentBlue,
          },
          tabBarLabelStyle: {
            color: colors.foreground,
          },
          tabBarStyle: {
            backgroundColor: colors.background,
          },
        }}
      >
        <TopTabs.Screen
          name="followers"
          options={{
            title: upperFirst(
              t('common.messages.follower_count', { count: profile?.followersCount || 0 }),
            ),
          }}
        />
        <TopTabs.Screen
          name="followees"
          options={{
            title: upperFirst(
              t('common.messages.followee_count', { count: profile?.followingCount || 0 }),
            ),
          }}
        />
      </TopTabs>
    </>
  );
};

export default ProfileFollowLayout;
