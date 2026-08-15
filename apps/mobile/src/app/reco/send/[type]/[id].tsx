import { Button } from '../../../../components/ui/Button';
import { View } from '../../../../components/ui/view';
import { useAuth } from '../../../../providers/AuthProvider';
import { zodResolver } from '@hookform/resolvers/zod';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { upperFirst } from 'lodash';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable } from 'react-native';
import { useTranslations } from 'use-intl';
import { z } from 'zod';
import { SelectionFooter } from '../../../../components/ui/SelectionFooter';
import tw from '../../../../lib/tw';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { PADDING_HORIZONTAL, PADDING_VERTICAL } from '../../../../theme/globals';
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
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useModalHeaderOptions } from '../../../../hooks/useModalHeaderOptions';
import { RefreshableStateContainer } from '../../../../components/ui/RefreshableStateContainer';
import { CardError } from '../../../../components/cards/CardError';
import { CardEmpty } from '../../../../components/cards/CardEmpty';

const COMMENT_MAX_LENGTH = 180;

const RecoSend = () => {
  const t = useTranslations();
  const router = useRouter();
  const toast = useToast();
  const insets = useSafeAreaInsets();
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

  // SharedValues
  const footerHeight = useSharedValue(0);

  // States
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<typeof friends>([]);
  const [selected, setSelected] = useState<UserSummary[]>([]);
  const resultsRender = useMemo(
    () =>
      results?.map((item) => ({
        item: item,
        isSelected: selected.some((selectedItem) => selectedItem.id === item.id),
      })) || [],
    [results, selected],
  );
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
  useEffect(() => {
    if (search && search.length > 0) {
      setResults(fuse?.search(search).map((result) => result.item));
    } else {
      setResults(friends);
    }
  }, [search, friends, fuse]);

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

  // AnimatedStyles
  const animatedFooterStyle = useAnimatedStyle(() => {
    return {
      height: Math.max(footerHeight.value, insets.bottom),
    };
  });

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
          <CardEmpty icon={'📬'} label={t('help_hints.recos.send_to.empty')} />
        </RefreshableStateContainer>
      ) : (
        <FlashList
          data={resultsRender}
          renderItem={renderItem}
          keyExtractor={({ item }) => item.id}
          refreshing={isRefetching}
          onRefresh={refetch}
          maintainVisibleContentPosition={{
            disabled: true,
          }}
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
      </SelectionFooter>
    </>
  );
};

export default RecoSend;
