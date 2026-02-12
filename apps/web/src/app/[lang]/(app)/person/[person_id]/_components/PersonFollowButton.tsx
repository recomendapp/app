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
import { userPersonFollowOptions, useUserPersonFollowMutation, useUserPersonUnfollowMutation } from '@libs/query-client/src';

interface PersonFollowButtonProps extends React.HTMLAttributes<HTMLDivElement> {
  personId: number;
}

export function PersonFollowButton({
  className,
  personId,
}: PersonFollowButtonProps) {
  const { user } = useAuth();
  const t = useTranslations();
  const { createConfirmModal } = useModal();

  const {
    data: isFollow,
    isLoading,
  } = useQuery(userPersonFollowOptions({
    userId: user?.id,
    personId: personId,
  }));
  const { mutateAsync: follow } = useUserPersonFollowMutation();
  const { mutateAsync: unfollow } = useUserPersonUnfollowMutation();

  const followPerson = useCallback(async () => {
    await follow({
      path: {
        person_id: personId,
      }
    }, {
      onError: (error) => {
        toast.error(upperFirst(t('common.messages.an_error_occurred')));
      }
    });
  }, [follow, personId, t]);

  const unfollowUser = useCallback(async () => {
    createConfirmModal({
      title: upperFirst(t('common.messages.are_u_sure')),
      confirmLabel: upperFirst(t('common.messages.unfollow')),
      onConfirm: async () => {
        await unfollow({
          path: {
            person_id: personId,
          }
        }, {
          onError: (error) => {
            toast.error(upperFirst(t('common.messages.an_error_occurred')));
          }
        });
      },
    });
  }, [unfollow, personId, t, createConfirmModal]);

  if (!user) return (null);

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
