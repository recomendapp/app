import { Button } from '../../../../../components/ui/Button';
import { UserNav } from '../../../../../components/user/UserNav';
import tw from '../../../../../lib/tw';
import {
  createMaterialTopTabNavigator,
  MaterialTopTabNavigationEventMap,
  MaterialTopTabNavigationOptions,
} from '@react-navigation/material-top-tabs';
import { ParamListBase, TabNavigationState } from '@react-navigation/native';
import { Stack, useRouter, withLayoutContext } from 'expo-router';
import { upperFirst } from 'lodash';
import { useCallback } from 'react';
import { View, Pressable } from 'react-native';
import { useTranslations } from 'use-intl';
import { HeaderTitle } from '@react-navigation/elements';
import { useTheme } from '../../../../../providers/ThemeProvider';
import UserAvatar from '../../../../../components/user/UserAvatar';
import { useAuth } from '../../../../../providers/AuthProvider';
import useBottomSheetStore from '../../../../../stores/useBottomSheetStore';
import BottomSheetPlaylistCreate from '../../../../../components/bottom-sheets/sheets/BottomSheetPlaylistCreate';
import { Icons } from '../../../../../constants/Icons';
import { SegmentedControlTabBar } from '../../../../../components/ui/segmented-control-tabbar';

const Tab = createMaterialTopTabNavigator();

const MaterialTopTabs = withLayoutContext<
  MaterialTopTabNavigationOptions,
  typeof Tab.Navigator,
  TabNavigationState<ParamListBase>,
  MaterialTopTabNavigationEventMap
>(Tab.Navigator);

const CollectionLayout = () => {
  const t = useTranslations();
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();
  const openSheet = useBottomSheetStore((state) => state.openSheet);

  const handleCreatePlaylist = useCallback(() => {
    openSheet(BottomSheetPlaylistCreate, {});
  }, [openSheet]);

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: () => <></>,
          title: upperFirst(t('common.messages.library')),
          headerLeft: () => (
            <HeaderTitle tintColor={colors.foreground}>
              {upperFirst(t('common.messages.library'))}
            </HeaderTitle>
          ),
          headerRight: () => (
            <View style={tw`flex-row items-center gap-1`}>
              <Button
                variant="ghost"
                icon={Icons.Add}
                size="icon"
                onPress={handleCreatePlaylist}
                style={tw`rounded-full`}
              />
              <UserNav />
            </View>
          ),
          unstable_headerRightItems: (props) => [
            {
              type: 'button',
              label: 'create playlist',
              onPress: handleCreatePlaylist,
              icon: {
                name: 'plus',
                type: 'sfSymbol',
              },
            },
            {
              type: 'custom',
              element: (
                <Pressable
                  onPress={
                    user
                      ? () =>
                          router.push({
                            pathname: '/user/[username]',
                            params: { username: user.username },
                          })
                      : undefined
                  }
                  disabled={!user}
                >
                  <UserAvatar
                    {...(user
                      ? {
                          full_name: user.name,
                          avatar_url: user.avatar,
                        }
                      : {
                          skeleton: true,
                        })}
                    style={{ width: 36, height: 36 }}
                  />
                </Pressable>
              ),
            },
          ],
        }}
      />
      <MaterialTopTabs tabBar={(props) => <SegmentedControlTabBar {...props} />}>
        <MaterialTopTabs.Screen name="index" options={{ title: 'perso' }} />
        <MaterialTopTabs.Screen
          name="saved"
          options={{
            title: upperFirst(t('common.messages.saved', { gender: 'female', count: 2 })),
          }}
        />
      </MaterialTopTabs>
    </>
  );
};

export default CollectionLayout;
