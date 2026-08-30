import { useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { upperFirst } from 'lodash';
import toast from 'react-hot-toast';
import { PinnedItemCreate } from '@libs/api-js';
import {
  userPinnedOptions,
  useUserPinnedAddMutation,
  useUserPinnedDeleteMutation,
} from '@libs/query-client';
import { useAuth } from '@/context/auth-context';
import { useRouter } from '@/lib/i18n/navigation';

export const usePinnedItem = ({
  type,
  mediaId,
}: {
  type: PinnedItemCreate['type'];
  mediaId?: number;
}) => {
  const { user } = useAuth();
  const router = useRouter();
  const t = useTranslations();

  const { data: pinnedItems } = useQuery(userPinnedOptions({ userId: user?.id }));

  const pinnedItem = useMemo(
    () => pinnedItems?.find((item) => item.type === type && item.data?.id === mediaId),
    [pinnedItems, type, mediaId],
  );

  const { mutateAsync: addPinned, isPending: isAddPending } = useUserPinnedAddMutation();
  const { mutateAsync: deletePinned, isPending: isDeletePending } = useUserPinnedDeleteMutation();

  const handleError = useCallback(
    (error: unknown) => {
      const errorObject =
        error && typeof error === 'object' ? (error as Record<string, unknown>) : undefined;
      const statusCode =
        typeof errorObject?.statusCode === 'number' ? errorObject.statusCode : undefined;

      if (statusCode === 403) {
        if (errorObject?.upgradable === true) {
          router.push('/upgrade');
          return;
        }

        toast.error(t('common.messages.pinned_limit_reached'));
        return;
      }

      toast.error(upperFirst(t('common.messages.an_error_occurred')));
    },
    [router, t],
  );

  const pin = useCallback(async () => {
    if (!user || !mediaId || pinnedItem) return;
    await addPinned(
      { body: { type, mediaId } },
      {
        onSuccess: () => toast.success(t('common.messages.pinned', { gender: 'male', count: 1 })),
        onError: handleError,
      },
    );
  }, [user, mediaId, pinnedItem, addPinned, type, t, handleError]);

  const unpin = useCallback(async () => {
    if (!pinnedItem) return;
    await deletePinned(
      { body: { itemIds: [pinnedItem.id] } },
      {
        onSuccess: () => toast.success(t('common.messages.unpinned', { gender: 'male', count: 1 })),
        onError: handleError,
      },
    );
  }, [pinnedItem, deletePinned, t, handleError]);

  return {
    isPinned: !!pinnedItem,
    pin,
    unpin,
    isPending: isAddPending || isDeletePending,
  };
};
