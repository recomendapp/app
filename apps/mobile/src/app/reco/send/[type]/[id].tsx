import { Button } from '../../../../components/ui/Button';
import { View } from '../../../../components/ui/view';
import { useAuth } from '../../../../providers/AuthProvider';
import { zodResolver } from '@hookform/resolvers/zod';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { upperFirst } from 'lodash';
import { useCallback, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { FlatList, Pressable } from 'react-native';
import { useTranslations } from 'use-intl';
import { z } from 'zod';
import tw from '../../../../lib/tw';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { GAP, PADDING_HORIZONTAL, PADDING_VERTICAL } from '../../../../theme/globals';
import Fuse from 'fuse.js';
import { Icons } from '../../../../constants/Icons';
import { Badge } from '../../../../components/ui/Badge';
import { Input } from '../../../../components/ui/Input';
import { CardUser } from '../../../../components/cards/CardUser';
import { Checkbox } from '../../../../components/ui/checkbox';
import { useToast } from '../../../../components/Toast';
import { useQuery } from '@tanstack/react-query';
import { userRecoSendAllOptions, useUserRecoSendMutation } from '@libs/query-client';
import { RecoTarget, UserSummary } from '@libs/api-js';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useModalHeaderOptions } from '../../../../hooks/useModalHeaderOptions';
import { RefreshableStateContainer } from '../../../../components/ui/RefreshableStateContainer';
import { CardError } from '../../../../components/cards/CardError';
import { CardEmpty } from '../../../../components/cards/CardEmpty';
import { useTheme } from '../../../../providers/ThemeProvider';
import { LegendList } from '@legendapp/list/react-native';
import { useHeaderHeight } from 'expo-router/react-navigation';
import { Text } from '../../../../components/ui/text';

const COMMENT_MAX_LENGTH = 180;

const RecoSend = () => {
  const t = useTranslations();
  const router = useRouter();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { colors } = useTheme();
  const { user } = useAuth();
  const { type, id } = useLocalSearchParams();
  const mediaId = Number(id);
  const mediaType = type === 'movie' ? 'movie' : 'tv_series';

  // Form
  const sendRecoFormSchema = z.object({
    comment: z
      .string()
      .max(COMMENT_MAX_LENGTH, {
        message: upperFirst(t('common.form.length.char_max', { count: COMMENT_MAX_LENGTH })),
      })
      .regex(/^(?!\s+$)(?!.*\n\s*\n)[\s\S]*$/)
      .optional()
      .nullable(),
  });
  type SendRecoFormValues = z.infer<typeof sendRecoFormSchema>;
  const defaultValues: Partial<SendRecoFormValues> = {
    comment: '',
  };
  const form = useForm<SendRecoFormValues>({
    resolver: zodResolver(sendRecoFormSchema),
    defaultValues,
    mode: 'onChange',
  });

  // Mutations
  const { mutateAsync: sendReco, isPending: isSendingReco } = useUserRecoSendMutation();

  // States
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<UserSummary[]>([]);
  const canSave = useMemo(() => {
    return selected.length > 0;
  }, [selected]);

  const modalHeaderOptions = useModalHeaderOptions({
    isPending: isSendingReco,
    forceCross: true,
    confirmExit: !!canSave,
  });

  // Queries
  const {
    data: friends,
    isRefetching,
    refetch,
    isLoading,
    isError,
  } = useQuery(
    userRecoSendAllOptions({
      userId: user?.id,
      mediaId: mediaId,
      mediaType: mediaType,
    }),
  );

  // Search
  const fuse = useMemo(() => {
    return new Fuse(friends || [], {
      keys: ['username', 'name'],
      threshold: 0.5,
    });
  }, [friends]);
  const results = useMemo(() => {
    if (search && search.length > 0) {
      return fuse?.search(search).map((result) => result.item);
    }
    return friends;
  }, [search, friends, fuse]);

  const resultsRender = useMemo(
    () =>
      results?.map((item) => ({
        item: item,
        isSelected: selected.some((selectedItem) => selectedItem.id === item.id),
      })) || [],
    [results, selected],
  );

  // Handlers
  const handleToggleUser = useCallback((user: UserSummary) => {
    setSelected((prev) => {
      const isSelected = prev.some((p) => p.id === user.id);
      if (isSelected) {
        return prev.filter((p) => p.id !== user.id);
      }
      return [...prev, user];
    });
  }, []);
  const handleSubmit = useCallback(
    async (values: SendRecoFormValues) => {
      if (!user?.id) return;
      if (selected.length === 0) return;
      await sendReco(
        {
          path: {
            media_id: mediaId,
            type: mediaType,
          },
          body: {
            userIds: selected.map((user) => user.id),
            comment: values.comment,
          },
        },
        {
          onSuccess: () => {
            toast.success(
              upperFirst(t('common.messages.sent', { count: selected.length, gender: 'female' })),
            );
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
    [user, selected, mediaId, mediaType, sendReco, toast, router, t],
  );

  // Render
  const renderItem = useCallback(
    ({
      item: {
        item: { alreadySeen, alreadySent, ...friend },
        isSelected,
      },
    }: {
      item: { item: RecoTarget; isSelected: boolean };
    }) => (
      <Pressable
        disabled={alreadySeen}
        onPress={() => handleToggleUser(friend)}
        style={tw`flex-row items-center justify-between`}
      >
        <CardUser user={friend} linked={false} style={tw`border-0 p-0 h-auto bg-transparent`} />
        <View style={tw`flex-row items-center gap-2`}>
          {alreadySent && (
            <Badge variant="accent-yellow">{upperFirst(t('common.messages.already_sent'))}</Badge>
          )}
          {alreadySeen && (
            <Badge variant="destructive">{upperFirst(t('common.messages.already_watched'))}</Badge>
          )}
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => handleToggleUser(friend)}
            disabled={alreadySeen}
          />
        </View>
      </Pressable>
    ),
    [handleToggleUser, t],
  );

  return (
    <>
      <Stack.Screen
        options={{
          ...modalHeaderOptions,
          headerTransparent: true,
          headerSearchBarOptions: {
            autoCapitalize: 'none',
            placeholder: upperFirst(t('common.messages.search_user', { count: 1 })),
            onChangeText: (e) => setSearch(e.nativeEvent.text),
            hideNavigationBar: false,
            allowToolbarIntegration: false,
            hideWhenScrolling: false,
          },
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
        ) : resultsRender.length === 0 && search.length > 0 ? (
          <RefreshableStateContainer bottomOffset={0} onRefresh={refetch} refreshing={isRefetching}>
            <View style={tw`flex-1 items-center p-4`}>
              <Text textColor="muted" style={tw`text-center`}>
                {upperFirst(t('common.messages.no_results'))}
              </Text>
            </View>
          </RefreshableStateContainer>
        ) : resultsRender.length === 0 ? (
          <RefreshableStateContainer bottomOffset={0} onRefresh={refetch} refreshing={isRefetching}>
            <CardEmpty icon={'📬'} label={t('help_hints.recos.send_to.empty')} />
          </RefreshableStateContainer>
        ) : (
          <LegendList
            style={tw`flex-1`}
            data={resultsRender}
            renderItem={renderItem}
            keyExtractor={({ item }) => item.id}
            refreshing={isRefetching}
            onRefresh={refetch}
            maintainVisibleContentPosition={false}
            contentContainerStyle={[
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
            data={selected}
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
                disabled={isSendingReco}
                error={form.formState.errors.comment?.message}
              />
            )}
          />
          <Button
            disabled={!canSave || isSendingReco}
            variant="outline"
            size="lg"
            onPress={form.handleSubmit(handleSubmit)}
          >
            {upperFirst(t('common.messages.send'))}
          </Button>
        </View>
      </KeyboardAvoidingView>
    </>
  );
};

export default RecoSend;
