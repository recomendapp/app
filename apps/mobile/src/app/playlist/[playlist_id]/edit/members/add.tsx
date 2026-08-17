import { CardUser } from '../../../../../components/cards/CardUser';
import { Button } from '../../../../../components/ui/Button';
import { Text } from '../../../../../components/ui/text';
import { View } from '../../../../../components/ui/view';
import { Icons } from '../../../../../constants/Icons';
import tw from '../../../../../lib/tw';
import { GAP, PADDING_HORIZONTAL, PADDING_VERTICAL } from '../../../../../theme/globals';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { upperFirst } from 'lodash';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable } from 'react-native';
import { useTranslations } from 'use-intl';
import { Checkbox } from '../../../../../components/ui/checkbox';
import { useToast } from '../../../../../components/Toast';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import {
  playlistMembersAllOptions,
  searchUsersInfiniteOptions,
  usePlaylistMembersAddMutation,
} from '@libs/query-client';
import { UserSummary } from '@libs/api-js';
import { useModalHeaderOptions } from '../../../../../hooks/useModalHeaderOptions';
import useDebounce from '../../../../../hooks/useDebounce';
import { LegendList } from '@legendapp/list/react-native';
import { useHeaderHeight } from 'expo-router/react-navigation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { Badge } from '../../../../../components/ui/Badge';
import { SearchBarCommands } from 'react-native-screens';
import { isIOS } from '../../../../../platform/detection';
import { SearchBar } from '../../../../../components/ui/searchbar';
import { RefreshableStateContainer } from '../../../../../components/ui/RefreshableStateContainer';
import { CardError } from '../../../../../components/cards/CardError';
import { CardEmpty } from '../../../../../components/cards/CardEmpty';
import { useTheme } from '../../../../../providers/ThemeProvider';

const ModalPlaylistEditGuestsAdd = () => {
  const { playlist_id } = useLocalSearchParams<{ playlist_id: string }>();
  const playlistId = Number(playlist_id);
  const t = useTranslations();
  const toast = useToast();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { colors } = useTheme();

  // Refs
  const searchBarRef = useRef<SearchBarCommands>(null);

  // Queries
  const { data: members } = useQuery(
    playlistMembersAllOptions({
      playlistId: playlistId,
    }),
  );
  // Mutations
  const { mutateAsync: addMembers, isPending } = usePlaylistMembersAddMutation();

  // States
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const [selectedUsers, setSelectedUsers] = useState<UserSummary[]>([]);
  const canSave: boolean = useMemo(() => selectedUsers.length > 0, [selectedUsers]);
  const modalHeaderOptions = useModalHeaderOptions({
    isPending,
    confirmExit: !!canSave,
  });
  const { data, isLoading, isRefetching, fetchNextPage, hasNextPage, refetch, isError } =
    useInfiniteQuery(
      searchUsersInfiniteOptions({
        filters: {
          q: debouncedSearch,
        },
      }),
    );
  const users = useMemo(
    () =>
      data?.pages.flatMap((page) =>
        page.data.map((user) => ({
          user,
          isSelected: selectedUsers.some((u) => u.id === user.id),
          alreadyMember: members?.some((m) => m.user.id === user.id) || false,
        })),
      ) || [],
    [data, selectedUsers, members],
  );

  // Handlers
  const handleToggleUser = useCallback((user: UserSummary) => {
    setSelectedUsers((prev) => {
      const isSelected = prev.some((u) => u.id === user.id);
      if (isSelected) {
        return prev.filter((u) => u.id !== user.id);
      }
      return [...prev, user];
    });
  }, []);
  const handleSubmit = useCallback(async () => {
    await addMembers(
      {
        path: {
          playlist_id: playlistId,
        },
        body: {
          userIds: selectedUsers.map((user) => user.id),
        },
      },
      {
        onSuccess: () => {
          toast.success(
            upperFirst(t('common.messages.added', { gender: 'male', count: selectedUsers.length })),
          );
          router.dismiss();
        },
        onError: () => {
          toast.error(upperFirst(t('common.messages.an_error_occurred')));
        },
      },
    );
  }, [selectedUsers, addMembers, toast, router, t, playlistId]);

  // Render
  const renderItem = useCallback(
    ({
      item: { user, isSelected, alreadyMember },
    }: {
      item: { user: UserSummary; isSelected: boolean; alreadyMember: boolean };
    }) => (
      <Pressable
        disabled={alreadyMember}
        onPress={() => handleToggleUser(user)}
        style={tw`flex-row items-center justify-between`}
      >
        <CardUser user={user} linked={false} style={tw`border-0 p-0 h-auto bg-transparent`} />
        <View style={tw`flex-row items-center gap-2`}>
          {alreadyMember && (
            <Badge variant="destructive">{upperFirst(t('common.messages.already_member'))}</Badge>
          )}
          <Checkbox checked={isSelected} onCheckedChange={() => handleToggleUser(user)} />
        </View>
      </Pressable>
    ),
    [handleToggleUser, t],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchBarRef.current) {
        searchBarRef.current.focus();
      }
    }, 600);

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <Stack.Screen
        options={{
          ...modalHeaderOptions,
          headerSearchBarOptions: isIOS
            ? {
                ref: searchBarRef,
                autoCapitalize: 'none',
                placeholder: upperFirst(t('common.messages.search_user', { count: 1 })),
                onChangeText: (e) => setSearch(e.nativeEvent.text),
                hideNavigationBar: false,
                allowToolbarIntegration: false,
                hideWhenScrolling: false,
                autoFocus: true,
              }
            : undefined,
          headerTitle: upperFirst(t('common.messages.add_guest', { count: 2 })),
        }}
      />
      <KeyboardAvoidingView
        style={tw`flex-1`}
        behavior="padding"
        keyboardVerticalOffset={insets.bottom}
      >
        {isLoading ? (
          <RefreshableStateContainer bottomOffset={0} onRefresh={refetch} refreshing={isRefetching}>
            <Icons.Loader />
          </RefreshableStateContainer>
        ) : isError ? (
          <RefreshableStateContainer bottomOffset={0} onRefresh={refetch} refreshing={isRefetching}>
            <CardError />
          </RefreshableStateContainer>
        ) : users.length === 0 && search.length > 0 ? (
          <RefreshableStateContainer bottomOffset={0} onRefresh={refetch} refreshing={isRefetching}>
            <View style={tw`flex-1 items-center p-4`}>
              <Text textColor="muted" style={tw`text-center`}>
                {upperFirst(t('common.messages.no_results'))}
              </Text>
            </View>
          </RefreshableStateContainer>
        ) : users.length === 0 ? (
          <RefreshableStateContainer bottomOffset={0} onRefresh={refetch} refreshing={isRefetching}>
            <CardEmpty icon={'🧑‍🤝‍🧑'} label={t('help_hints.playlists.members.search')} />
          </RefreshableStateContainer>
        ) : (
          <LegendList
            style={tw`flex-1`}
            data={users}
            renderItem={renderItem}
            ListHeaderComponent={
              !isIOS ? (
                <SearchBar
                  autoCapitalize="none"
                  autoFocus
                  placeholder={upperFirst(t('common.messages.search_user', { count: 1 }))}
                  onChangeText={(e) => setSearch(e)}
                />
              ) : null
            }
            keyExtractor={(item) => item.user.id}
            refreshing={isRefetching}
            onRefresh={refetch}
            onEndReached={() => hasNextPage && fetchNextPage()}
            onEndReachedThreshold={0.5}
            maintainVisibleContentPosition={false}
            contentContainerStyle={[
              tw`gap-2 flex-grow`,
              {
                paddingHorizontal: PADDING_HORIZONTAL,
                paddingBottom: PADDING_VERTICAL,
                paddingTop: headerHeight,
              },
            ]}
            progressViewOffset={headerHeight}
            keyboardShouldPersistTaps="handled"
          />
        )}
        <View
          style={[
            tw`gap-2 border-t`,
            {
              borderColor: colors.border,
              paddingHorizontal: PADDING_HORIZONTAL,
              paddingTop: PADDING_VERTICAL,
              paddingBottom: insets.bottom + PADDING_VERTICAL,
            },
          ]}
        >
          <FlatList
            horizontal
            data={selectedUsers}
            renderItem={({ item }) => (
              <CardUser
                user={item}
                variant="icon"
                linked={false}
                onPress={() => handleToggleUser(item)}
                width={50}
                height={50}
              />
            )}
            keyExtractor={(item) => item.id.toString()}
            showsHorizontalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={{ width: GAP / 2 }} />}
          />
          <Button
            disabled={!canSave || isPending}
            loading={isPending}
            variant="outline"
            size="lg"
            onPress={handleSubmit}
          >
            {upperFirst(t('common.messages.add', { count: selectedUsers.length }))}
          </Button>
        </View>
      </KeyboardAvoidingView>
    </>
  );
};

export default ModalPlaylistEditGuestsAdd;
