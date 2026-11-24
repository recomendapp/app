import { useAuth } from '../../../../../providers/AuthProvider';
import tw from '../../../../../lib/tw';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Button } from '../../../../../components/ui/Button';
import { useTranslations } from 'use-intl';
import { upperFirst } from 'lodash';
import { Icons } from '../../../../../constants/Icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Text } from '../../../../../components/ui/text';
import { View } from '../../../../../components/ui/view';
import Fuse from 'fuse.js';
import { CardUser } from '../../../../../components/cards/CardUser';
import app from '../../../../../constants/app';
import { SwipeableActionsRow } from '../../../../../components/ui/swippeable/SwipeableActionsRow';
import { NativeIcons } from '../../../../../constants/native-icons';
import { useToast } from '../../../../../components/Toast';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PlaylistMemberWithUser } from '@libs/api-js';
import { useQuery } from '@tanstack/react-query';
import {
  playlistMembersAllOptions,
  playlistOptions,
  usePlaylistMembersDeleteMutation,
  usePlaylistMemberUpdateMutation,
} from '@libs/query-client';
import { useModalHeaderOptions } from '../../../../../hooks/useModalHeaderOptions';
import { usePlaylistMembers } from '../../../../../hooks/usePlaylistMembers';
import { useActionSheet } from '@expo/react-native-action-sheet';
import { KeyboardAvoidingLegendList } from '@legendapp/list/keyboard-legacy';
import { LegendListRef } from '@legendapp/list/react-native';
import { RefreshableStateContainer } from '../../../../../components/ui/RefreshableStateContainer';
import { CardError } from '../../../../../components/cards/CardError';
import { CardEmpty } from '../../../../../components/cards/CardEmpty';
import { useTheme } from '../../../../../providers/ThemeProvider';

const ModalPlaylistEditMembers = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { playlist_id } = useLocalSearchParams<{ playlist_id: string }>();
  const playlistId = Number(playlist_id);
  const router = useRouter();
  const toast = useToast();
  const t = useTranslations();
  const insets = useSafeAreaInsets();
  const { showActionSheetWithOptions } = useActionSheet();
  const { playlistMembersRoleValues } = usePlaylistMembers();
  // Refs
  const listRef = useRef<LegendListRef>(null);
  // Queries
  const { data: playlist } = useQuery(
    playlistOptions({
      playlistId: playlistId,
    }),
  );
  const {
    data: members,
    isLoading,
    isRefetching,
    refetch,
    isError,
  } = useQuery(
    playlistMembersAllOptions({
      playlistId: playlist?.id,
    }),
  );

  // Mutations
  const { mutateAsync: updateMember, isPending: isUpdatingMember } =
    usePlaylistMemberUpdateMutation({
      userId: user?.id,
    });
  const { mutateAsync: deleteMember, isPending: isDeletingMember } =
    usePlaylistMembersDeleteMutation({
      userId: user?.id,
    });
  const isPending = useMemo(
    () => isUpdatingMember || isDeletingMember,
    [isUpdatingMember, isDeletingMember],
  );
  const modalHeaderOptions = useModalHeaderOptions({
    isPending,
  });

  // Search
  const [search, setSearch] = useState('');
  const fuse = useMemo(() => {
    return new Fuse(members || [], {
      keys: ['user.username', 'user.name'],
      threshold: 0.5,
    });
  }, [members]);
  const results = useMemo(() => {
    if (search.length > 0) {
      return fuse?.search(search).map(({ item }) => item);
    }
    return members || [];
  }, [search, members, fuse]);
  /* -------------------------------------------------------------------------- */

  // Handlers
  const handleDeleteMember = useCallback(
    async (userId: string) => {
      await deleteMember(
        {
          path: {
            playlist_id: playlistId,
          },
          body: {
            userIds: [userId],
          },
        },
        {
          onError: () => {
            toast.error(upperFirst(t('common.messages.an_error_occurred')));
          },
        },
      );
    },
    [deleteMember, playlistId, toast],
  );

  const handleSelectRole = useCallback(
    (member: PlaylistMemberWithUser) => {
      const roleOptionsWithCancel = [
        ...playlistMembersRoleValues,
        { label: upperFirst(t('common.messages.cancel')), value: 'cancel' },
      ];
      const cancelIndex = roleOptionsWithCancel.length - 1;

      showActionSheetWithOptions(
        {
          title: upperFirst(t('common.messages.select_role')),
          options: roleOptionsWithCancel.map((option) => option.label),
          cancelButtonIndex: cancelIndex,
        },
        async (selectedIndex) => {
          if (selectedIndex === undefined || selectedIndex === cancelIndex) return;

          const selectedRole = playlistMembersRoleValues[selectedIndex].value;

          if (selectedRole !== 'viewer' && !user?.isPremium) {
            router.push({
              pathname: '/upgrade',
              params: { feature: app.features.playlist_collaborators },
            });
            return;
          }

          await updateMember(
            {
              path: {
                playlist_id: playlistId,
                user_id: member.userId,
              },
              body: {
                role: selectedRole,
              },
            },
            {
              onError: () => {
                toast.error(upperFirst(t('common.messages.an_error_occurred')));
              },
            },
          );
        },
      );
    },
    [
      playlistMembersRoleValues,
      showActionSheetWithOptions,
      t,
      user?.isPremium,
      router,
      updateMember,
      playlistId,
      toast,
    ],
  );

  // Render
  const renderItem = useCallback(
    ({ item }: { item: PlaylistMemberWithUser }) => {
      return (
        <SwipeableActionsRow
          actionsRight={[
            {
              label: t('common.messages.remove'),
              icon: NativeIcons.close,
              onPress: () => handleDeleteMember(item.user.id!),
            },
          ]}
          style={{ paddingHorizontal: theme.spaces.horizontal }}
        >
          <View style={tw`flex-row items-center justify-between gap-2 w-full`}>
            <CardUser
              user={item.user}
              linked={false}
              style={tw`border-0 p-0 h-auto bg-transparent`}
            />
            <View style={tw`flex-row items-center gap-2`}>
              <Button variant="outline" onPress={() => handleSelectRole(item)}>
                {playlistMembersRoleValues.find((r) => r.value === item.role)?.label}
              </Button>
            </View>
          </View>
        </SwipeableActionsRow>
      );
    },
    [handleDeleteMember, handleSelectRole, playlistMembersRoleValues, t, theme],
  );

  return (
    <>
      <Stack.Screen
        options={{
          ...modalHeaderOptions,
          title: upperFirst(t('common.messages.manage_members', { count: 2 })),
          headerSearchBarOptions: {
            autoCapitalize: 'none',
            placeholder: upperFirst(t('common.messages.search_user', { count: 1 })),
            onChangeText: (e) => {
              setSearch(e.nativeEvent.text);
              listRef.current?.scrollToOffset({ offset: 0, animated: false });
            },
            hideNavigationBar: false,
            allowToolbarIntegration: false,
            hideWhenScrolling: false,
          },
          headerRight: () => (
            <Button
              variant="ghost"
              icon={Icons.Add}
              size="icon"
              onPress={() =>
                router.push({
                  pathname: '/playlist/[playlist_id]/edit/members/add',
                  params: { playlist_id: playlistId },
                })
              }
              style={tw`rounded-full`}
            />
          ),
          unstable_headerRightItems: (props) => [
            {
              type: 'button',
              label: upperFirst(t('common.messages.add_member', { count: 2 })),
              onPress: () =>
                router.push({
                  pathname: '/playlist/[playlist_id]/edit/members/add',
                  params: { playlist_id: playlistId },
                }),
              icon: {
                name: 'person.badge.plus',
                type: 'sfSymbol',
              },
            },
          ],
        }}
      />
      {isLoading ? (
        <RefreshableStateContainer onRefresh={refetch} refreshing={isRefetching}>
          <Icons.Loader />
        </RefreshableStateContainer>
      ) : isError ? (
        <RefreshableStateContainer onRefresh={refetch} refreshing={isRefetching}>
          <CardError />
        </RefreshableStateContainer>
      ) : results.length === 0 && search.length > 0 ? (
        <RefreshableStateContainer onRefresh={refetch} refreshing={isRefetching}>
          <View style={tw`flex-1 items-center p-4`}>
            <Text textColor="muted" style={tw`text-center`}>
              {upperFirst(t('common.messages.no_results'))}
            </Text>
          </View>
        </RefreshableStateContainer>
      ) : results.length === 0 ? (
        <RefreshableStateContainer onRefresh={refetch} refreshing={isRefetching}>
          <CardEmpty icon={'🧑‍🤝‍🧑'} label={t('help_hints.playlists.members.empty')} />
        </RefreshableStateContainer>
      ) : (
        <KeyboardAvoidingLegendList
          ref={listRef}
          data={results}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          refreshing={isRefetching}
          onRefresh={refetch}
          contentContainerStyle={[
            tw`gap-2 flex-grow`,
            {
              paddingBottom: insets.bottom,
              paddingLeft: insets.left,
              paddingRight: insets.right,
            },
          ]}
          keyboardShouldPersistTaps="handled"
        />
      )}
    </>
  );
};

export default ModalPlaylistEditMembers;
