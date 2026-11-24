import { useMemo } from 'react';
import { Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslations } from 'use-intl';
import { Profile } from '@libs/api-js';
import ButtonUserFollow from '../../../buttons/ButtonUserFollow';
import { Skeleton } from '../../../ui/Skeleton';
import { Text } from '../../../ui/text';
import { View } from '../../../ui/view';
import UserAvatar from '../../../user/UserAvatar';
import tw from '../../../../lib/tw';
import { useAuth } from '../../../../providers/AuthProvider';
import { useTheme } from '../../../../providers/ThemeProvider';
import ProfilePinned from '../ProfilePinned';

const ProfileHeader = ({
  profile,
  skeleton,
}: { skeleton: true; profile?: never } | { skeleton?: false; profile: Profile }) => {
  const router = useRouter();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const t = useTranslations();
  const routesFollow = useMemo(
    () => [
      {
        label: t('common.messages.follower', { count: 2 }),
        onPress: () => router.push(`/user/${profile?.username}/followers`),
      },
      {
        label: t('common.messages.followee', { count: 2 }),
        onPress: () => router.push(`/user/${profile?.username}/followees`),
      },
    ],
    [profile?.username, router, t],
  );
  return (
    <View style={tw`gap-2 py-4`}>
      <View
        style={[
          tw`flex-row gap-4 shrink-0 items-start justify-between`,
          {
            paddingLeft: insets.left + theme.spaces.horizontal,
            paddingRight: insets.right + theme.spaces.horizontal,
          },
        ]}
      >
        <UserAvatar
          {...(!skeleton
            ? {
                avatar_url: profile.avatar,
                full_name: profile.name,
              }
            : {
                skeleton: true,
              })}
          style={tw`w-24 h-24 rounded-full`}
        />
        <View style={tw`flex-1 gap-2`}>
          <View style={tw`flex-row items-center justify-between gap-4`}>
            {!skeleton ? (
              <Text style={tw`font-semibold`} numberOfLines={3}>
                {profile.name}
              </Text>
            ) : (
              <Skeleton style={tw`w-12 h-5`} />
            )}
            <View style={tw`flex-row items-center gap-4`}>
              {routesFollow.map((item, index) => (
                <Pressable key={index} style={tw`gap-0.5`} onPress={item.onPress}>
                  {!skeleton ? (
                    <Text style={tw`text-sm`}>{item.label}</Text>
                  ) : (
                    <Skeleton style={tw`w-20 h-5`} />
                  )}
                </Pressable>
              ))}
            </View>
          </View>
          <View>
            {profile?.bio && (
              <Text style={tw`text-sm`} numberOfLines={3}>
                {profile.bio}
              </Text>
            )}
            {/* {profile?.website && (
							<Link href={profile.website as ExternalPathString} target="_blank" asChild>
								<Pressable style={tw.style('flex-row gap-2 items-center')}>
									<Icons.link color={colors.accentPink} width={15}/>
									<Text numberOfLines={1} style={[{ color: colors.accentPink}, tw`m-w-1/2`]}>{profile.website.replace(/(^\w+:|^)\/\//, '')}</Text>
								</Pressable>
							</Link>
						)} */}
          </View>
        </View>
      </View>
      {profile?.id && profile.id !== user?.id && (
        <ButtonUserFollow
          {...(!skeleton ? { profileId: profile.id } : { skeleton: true })}
          containerStyle={tw`px-4`}
        />
      )}
      {profile && <ProfilePinned profileId={profile.id} />}
    </View>
  );
};

export default ProfileHeader;
