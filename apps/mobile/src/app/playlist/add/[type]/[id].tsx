import BottomSheetPlaylistCreate from '../../../../components/bottom-sheets/sheets/BottomSheetPlaylistCreate';
import { Button } from '../../../../components/ui/Button';
import { Text } from '../../../../components/ui/text';
import { View } from '../../../../components/ui/view';
import { useAuth } from '../../../../providers/AuthProvider';
import { zodResolver } from '@hookform/resolvers/zod';
import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { upperFirst } from 'lodash';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable } from 'react-native';
import { useTranslations } from 'use-intl';
import { z } from 'zod';
import { SelectionFooter } from '../../../../components/ui/SelectionFooter';
import { ImageWithFallback } from '../../../../components/utils/ImageWithFallback';
import tw from '../../../../lib/tw';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { GAP, PADDING_HORIZONTAL, PADDING_VERTICAL } from '../../../../theme/globals';
import Fuse from 'fuse.js';
import { Icons } from '../../../../constants/Icons';
import { Badge } from '../../../../components/ui/Badge';
import { useQuery } from '@tanstack/react-query';
import { Input } from '../../../../components/ui/Input';
import { Checkbox } from '../../../../components/ui/checkbox';
import { useToast } from '../../../../components/Toast';
import { usePlaylistItemsAddMutation, userPlaylistsAddTargetsAllOptions } from '@libs/query-client';
import { Playlist, PlaylistsAddTarget, PlaylistWithOwner } from '@libs/api-js';
import { useTheme } from '../../../../providers/ThemeProvider';
import { FlashList } from '@shopify/flash-list';
import { useModalHeaderOptions } from '../../../../hooks/useModalHeaderOptions';
import { RefreshableStateContainer } from '../../../../components/ui/RefreshableStateContainer';
import { CardError } from '../../../../components/cards/CardError';
import { CardEmpty } from '../../../../components/cards/CardEmpty';

const COMMENT_MAX_LENGTH = 180;

const PlaylistAddTo = () => {
  const t = useTranslations();
  const router = useRouter();
  const { colors } = useTheme();
  const toast = useToast();
  const { user } = useAuth();
  const { type, id, title } = useLocalSearchParams();
  const mediaId = Number(id);
  const mediaType = type === 'movie' ? 'movie' : 'tv_series';
  const mediaTitle = title ? String(title) : undefined;

  // Form
  const addToPlaylistFormSchema = z.object({
    comment: z
      .string()
      .max(COMMENT_MAX_LENGTH, {
        message: upperFirst(t('common.form.length.char_max', { count: COMMENT_MAX_LENGTH })),
      })
      .regex(/^(?!\s+$)(?!.*\n\s*\n)[\s\S]*$/)
      .optional()
      .nullable(),
  });
  type AddToPlaylistFormValues = z.infer<typeof addToPlaylistFormSchema>;
  const defaultValues: Partial<AddToPlaylistFormValues> = {
    comment: '',
  };
  const form = useForm<AddToPlaylistFormValues>({
    resolver: zodResolver(addToPlaylistFormSchema),
    defaultValues,
    mode: 'onChange',
  });

  // Mutations
  const { mutateAsync: addToPlaylistMutation, isPending: isAddingToPlaylist } =
    usePlaylistItemsAddMutation({
      userId: user?.id,
    });

  // REFs
  const BottomSheetPlaylistCreateRef = useRef<TrueSheet>(null);

  // SharedValues
  const footerHeight = useSharedValue(0);

  // States
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<typeof playlists>([]);
  const [selected, setSelected] = useState<PlaylistWithOwner[]>([]);
  const resultsRender = useMemo(
    () =>
      results?.map((item) => ({
        item: item,
        isSelected: selected.some((selectedItem) => selectedItem.id === item.id),
      })) || [],
    [results, selected],
  );
  const canSave = useMemo(() => selected.length > 0, [selected]);

  const modalHeaderOptions = useModalHeaderOptions({
    isPending: isAddingToPlaylist,
    forceCross: true,
    confirmExit: !!canSave,
  });

  // Queries
  const {
    data: playlists,
    isRefetching,
    refetch,
    isLoading,
    isError,
  } = useQuery(
    userPlaylistsAddTargetsAllOptions({
      userId: user?.id,
      mediaId: mediaId,
      type: mediaType,
    }),
  );
  // Search
  const fuse = useMemo(() => {
    return new Fuse(playlists || [], {
      keys: ['title', 'owner.username', 'owner.name'],
      threshold: 0.5,
    });
  }, [playlists]);
  useEffect(() => {
    if (search && search.length > 0) {
      setResults(fuse?.search(search).map((result) => result.item));
    } else {
      setResults(playlists);
    }
  }, [search, playlists, fuse]);

  // Handlers
  const handleTogglePlaylist = useCallback((playlist: PlaylistWithOwner) => {
    setSelected((prev) => {
      const isSelected = prev.some((p) => p.id === playlist.id);
      if (isSelected) {
        return prev.filter((p) => p.id !== playlist.id);
      }
      return [...prev, playlist];
    });
  }, []);
  const handleSubmit = useCallback(
    async (values: AddToPlaylistFormValues) => {
      await addToPlaylistMutation(
        {
          path: {
            media_id: mediaId,
            type: mediaType,
          },
          body: {
            playlistIds: selected.map((playlist) => playlist.id),
            comment: values.comment || null,
          },
        },
        {
          onSuccess: () => {
            toast.success(upperFirst(t('common.messages.saved', { count: 1, gender: 'male' })));
            router.dismiss();
          },
          onError: () => {
            toast.error(upperFirst(t('common.messages.error')), {
              description: upperFirst(t('common.messages.an_error_occurred')),
            });
          },
        },
      );
    },
    [addToPlaylistMutation, mediaId, mediaType, selected, toast, router, t],
  );
  const onCreatePlaylist = useCallback(
    (playlist: Playlist) => {
      if (!user) return;
      BottomSheetPlaylistCreateRef.current?.dismiss();
      const playlistWithOwner: PlaylistWithOwner = {
        ...playlist,
        owner: user,
      };
      setSelected((prev) => [...prev, playlistWithOwner]);
    },
    [user],
  );

  // AnimatedStyles
  const animatedFooterStyle = useAnimatedStyle(() => {
    return {
      marginBottom: withTiming(footerHeight.value, { duration: 200 }),
    };
  });

  // Render
  const renderItem = useCallback(
    ({
      item: {
        item: { alreadyAdded, ...playlist },
        isSelected,
      },
    }: {
      item: { item: PlaylistsAddTarget; isSelected: boolean };
    }) => (
      <Pressable
        disabled={alreadyAdded}
        onPress={() => handleTogglePlaylist(playlist)}
        style={tw`flex-row items-center justify-between gap-2`}
      >
        <View style={tw`shrink flex-row items-center gap-2`}>
          <ImageWithFallback
            source={{ uri: playlist.poster ?? '' }}
            alt={playlist.title}
            style={tw`rounded-md w-14 h-14`}
            type="playlist"
          />
          <View>
            <Text style={tw`shrink`} numberOfLines={1}>
              {playlist.title}
            </Text>
            {playlist.role !== 'owner' && (
              <View style={tw`flex-row items-center gap-1`}>
                <Text textColor="muted" style={tw`text-xs`}>
                  @{playlist.owner.username}
                </Text>
                {playlist.owner.isPremium && <Icons.premium color={colors.accentBlue} size={12} />}
              </View>
            )}
          </View>
        </View>
        <View style={tw`flex-row items-center gap-2 shrink-0`}>
          {alreadyAdded && (
            <Badge variant="destructive">
              {upperFirst(t('common.messages.already_added', { count: 1, gender: 'male' }))}
            </Badge>
          )}
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => handleTogglePlaylist(playlist)}
            disabled={alreadyAdded}
          />
        </View>
      </Pressable>
    ),
    [handleTogglePlaylist, t, colors.accentBlue],
  );

  // useEffects
  useEffect(() => {
    return () => {
      BottomSheetPlaylistCreateRef.current?.dismiss();
    };
  }, []);

  return (
    <>
      <Stack.Screen
        options={{
          ...modalHeaderOptions,
          headerSearchBarOptions: {
            autoCapitalize: 'none',
            placeholder: upperFirst(t('common.messages.search_playlist', { count: 1 })),
            onChangeText: (e) => setSearch(e.nativeEvent.text),
            hideNavigationBar: false,
            allowToolbarIntegration: false,
            hideWhenScrolling: false,
          },
          headerRight: () => (
            <Button
              variant="outline"
              icon={Icons.Add}
              size="icon"
              onPress={() => BottomSheetPlaylistCreateRef.current?.present()}
              style={tw`rounded-full`}
            />
          ),
          unstable_headerRightItems: (props) => [
            {
              type: 'button',
              label: upperFirst(t('common.messages.add')),
              onPress: () => BottomSheetPlaylistCreateRef.current?.present(),
              icon: {
                name: 'plus',
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
      ) : resultsRender.length === 0 ? (
        <RefreshableStateContainer onRefresh={refetch} refreshing={isRefetching}>
          <CardEmpty icon={'▶️'} label={t('help_hints.playlists.add_to.empty')} />
        </RefreshableStateContainer>
      ) : (
        <FlashList
          data={resultsRender}
          renderItem={renderItem}
          keyExtractor={({ item }) => item.id.toString()}
          refreshing={isRefetching}
          onRefresh={refetch}
          maintainVisibleContentPosition={{
            disabled: true,
          }}
          ItemSeparatorComponent={() => <View style={{ height: GAP }} />}
          contentContainerStyle={[
            {
              paddingHorizontal: PADDING_HORIZONTAL,
              paddingBottom: PADDING_VERTICAL,
            },
          ]}
          keyboardShouldPersistTaps="handled"
        />
      )}
      <Animated.View style={animatedFooterStyle} />
      <SelectionFooter
        data={selected}
        visibleHeight={footerHeight}
        renderItem={({ item }) => (
          <Pressable key={item.id} onPress={() => handleTogglePlaylist(item)}>
            <ImageWithFallback
              source={{ uri: item.poster ?? '' }}
              alt={item.title}
              style={tw`rounded-md w-10 h-10`}
              type="playlist"
            />
          </Pressable>
        )}
        keyExtractor={(item) => item.id.toString()}
      >
        <View style={tw`gap-2`}>
          <Controller
            name="comment"
            control={form.control}
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                placeholder={upperFirst(t('common.messages.add_comment', { count: 1 }))}
                autoCapitalize="sentences"
                value={value || ''}
                onChangeText={onChange}
                onBlur={onBlur}
                disabled={isAddingToPlaylist}
                error={form.formState.errors.comment?.message}
              />
            )}
          />
          <Button
            disabled={!canSave || isAddingToPlaylist}
            variant="outline"
            size="lg"
            onPress={form.handleSubmit(handleSubmit)}
          >
            {upperFirst(t('common.messages.add', { count: selected.length }))}
          </Button>
        </View>
      </SelectionFooter>
      <BottomSheetPlaylistCreate
        ref={BottomSheetPlaylistCreateRef}
        id={`${mediaType}-${mediaId}-create-playlist`}
        onCreate={onCreatePlaylist}
        placeholder={mediaTitle}
      />
    </>
  );
};

export default PlaylistAddTo;
