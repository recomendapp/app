import tw from '../../../lib/tw';
import { upperFirst } from 'lodash';
import useBottomSheetStore from '../../../stores/useBottomSheetStore';
import { Button } from '../../ui/Button';
import TrueSheet from '../../ui/TrueSheet';
import { BottomSheetProps } from '../BottomSheetManager';
import { useTranslations } from 'use-intl';
import { GAP, PADDING_HORIZONTAL, PADDING_VERTICAL } from '../../../theme/globals';
import { Input } from '../../ui/Input';
import { Text } from '../../ui/text';
import { z } from 'zod';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { View } from '../../ui/view';
import { useTheme } from '../../../providers/ThemeProvider';
import { useToast } from '../../Toast';
import { forwardRef, useCallback } from 'react';
import { Bookmark } from '@libs/api-js';
import { useUserBookmarkSetByMediaMutation } from '@libs/query-client';

interface BottomSheetBookmarkCommentProps extends BottomSheetProps {
  data: Bookmark;
}

const COMMENT_MIN_LENGTH = 0;
const COMMENT_MAX_LENGTH = 180;

export const BottomSheetBookmarkComment = forwardRef<
  React.ComponentRef<typeof TrueSheet>,
  BottomSheetBookmarkCommentProps
>(({ id, data, ...props }, ref) => {
  const toast = useToast();
  const { colors } = useTheme();
  const closeSheet = useBottomSheetStore((state) => state.closeSheet);
  const t = useTranslations();
  const { mutateAsync: updateWatchlist, isPending } = useUserBookmarkSetByMediaMutation();

  /* ---------------------------------- FORM ---------------------------------- */
  const watchlistSchema = z.object({
    comment: z
      .string()
      .min(COMMENT_MIN_LENGTH, {
        message: upperFirst(t('common.form.length.char_min', { count: COMMENT_MIN_LENGTH })),
      })
      .max(COMMENT_MAX_LENGTH, {
        message: upperFirst(t('common.form.length.char_max', { count: COMMENT_MAX_LENGTH })),
      }),
  });
  type WatchlistFormValues = z.infer<typeof watchlistSchema>;
  const defaultValues: Partial<WatchlistFormValues> = {
    comment: data.comment || '',
  };
  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<WatchlistFormValues>({
    resolver: zodResolver(watchlistSchema),
    defaultValues: defaultValues,
    mode: 'onChange',
  });
  /* -------------------------------------------------------------------------- */

  // Handlers
  const handleUpdateComment = useCallback(
    async (values: WatchlistFormValues) => {
      if (values.comment === data.comment) {
        closeSheet(id);
        return;
      }
      await updateWatchlist(
        {
          path: {
            media_id: data.mediaId,
            type: data.type,
          },
          body: {
            comment: values.comment.replace(/\s+/g, ' ').trimStart(),
          },
        },
        {
          onSuccess: () => {
            toast.success(upperFirst(t('common.messages.saved', { count: 1, gender: 'male' })));
            closeSheet(id);
          },
          onError: () => {
            toast.error(upperFirst(t('common.messages.error')), {
              description: upperFirst(t('common.messages.an_error_occurred')),
            });
          },
        },
      );
    },
    [closeSheet, id, toast],
  );

  return (
    <TrueSheet
      ref={ref}
      style={{
        gap: GAP,
        paddingTop: PADDING_VERTICAL * 2,
        paddingHorizontal: PADDING_HORIZONTAL,
      }}
      {...props}
    >
      <Text style={tw`text-center text-xl font-bold`}>
        {upperFirst(t('common.messages.comment', { count: 1 }))}
      </Text>
      <Controller
        name="comment"
        control={control}
        render={({ field: { onChange, onBlur, value } }) => (
          <View style={tw`gap-2 w-full`}>
            <Input
              variant="outline"
              placeholder={upperFirst(t('common.messages.add_comment', { count: 1 }))}
              value={value}
              autoCorrect={false}
              onBlur={onBlur}
              onChangeText={onChange}
              type="textarea"
            />
            {errors.comment && (
              <Text style={{ color: colors.destructive }}>{errors.comment.message}</Text>
            )}
          </View>
        )}
      />
      <Button
        loading={isPending}
        onPress={handleSubmit(handleUpdateComment)}
        disabled={isPending || !isValid}
      >
        {upperFirst(t('common.messages.save'))}
      </Button>
    </TrueSheet>
  );
});
BottomSheetBookmarkComment.displayName = 'BottomSheetBookmarkComment';
