'use client'

import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context';
import toast from 'react-hot-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { upperFirst } from 'lodash';
import { useTranslations } from 'next-intl';
import { useCallback } from 'react';
import { useModal } from '@/context/modal-context';
import { useQuery } from '@tanstack/react-query';
import { useUserFollowPersonOptions } from '@/api/client/options/userOptions';
import { useUserFollowPersonInsertMutation, useUserUnfollowPersonDeleteMutation } from '@/api/client/mutations/userMutations';

interface PersonFollowButtonProps extends React.HTMLAttributes<HTMLDivElement> {
  personId: number;
}

export function PersonFollowButton({
  className,
  personId,
}: PersonFollowButtonProps) {
  const { session } = useAuth();
  const t = useTranslations();
  const { createConfirmModal } = useModal();

  const {
    data: isFollow,
    isLoading,
  } = useQuery(useUserFollowPersonOptions({
    userId: session?.user.id,
    personId: personId,
  }));
  const { mutateAsync: insertFollow} = useUserFollowPersonInsertMutation();
  const { mutateAsync: deleteFollow } = useUserUnfollowPersonDeleteMutation();

  const followPerson = useCallback(async () => {
    if (!session?.user.id) return;
    await insertFollow({
      userId: session?.user.id,
      personId: personId,
    }, {
      onError: (error) => {
        toast.error(upperFirst(t('common.messages.an_error_occurred')));
      }
    });
  }, [insertFollow, personId, session, t]);

  const unfollowUser = useCallback(async () => {
    if (!session?.user.id) return;
    createConfirmModal({
      title: upperFirst(t('common.messages.are_u_sure')),
      confirmLabel: upperFirst(t('common.messages.unfollow')),
      onConfirm: async () => {
        await deleteFollow({
          userId: session?.user.id,
          personId: personId,
        }, {
          onError: (error) => {
            toast.error(upperFirst(t('common.messages.an_error_occurred')));
          }
        });
      },
    });
  }, [deleteFollow, personId, session, t, createConfirmModal]);

  if (!session) return (null);

  return (
    <div className={cn('flex items-center', className)}>
      {(isLoading) ? (
        <Skeleton className="h-10 w-20 rounded-full" />
      ) : (
        <Button onClick={isFollow ? unfollowUser : followPerson} variant={isFollow ? 'outline' : 'default'} className="rounded-full">
          {isFollow ? 'Suivi(e)' : 'Suivre'}
        </Button>
      )}
    </div>
  );
}
