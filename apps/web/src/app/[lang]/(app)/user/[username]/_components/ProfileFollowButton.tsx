'use client'

import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context';
import toast from 'react-hot-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { upperFirst } from 'lodash';
import { useCallback } from 'react';
import { useModal } from '@/context/modal-context';
import { useQuery } from '@tanstack/react-query';
import { userFollowOptions, useUserFollowMutation, useUserUnfollowMutation } from '@libs/query-client';

interface UserFollowButtonProps extends React.HTMLAttributes<HTMLDivElement> {
  profileId: string;
}

export const ProfileFollowButton = ({
  className,
  profileId,
}: UserFollowButtonProps) => {
  const t = useTranslations();
  const { user } = useAuth();
  const { createConfirmModal } = useModal();

  const {
    data: isFollow,
    isLoading,
  } = useQuery(userFollowOptions({
    userId: user?.id,
    profileId: profileId,
  }));

  const { mutateAsync: insertFollow } = useUserFollowMutation();
  const { mutateAsync: deleteFollow } = useUserUnfollowMutation();

  const followUser = useCallback(async () => {
    await insertFollow({
      path: {
        user_id: profileId,
      }
    }, {
      onError: () => {
        toast.error(upperFirst(t('common.messages.an_error_occurred')));
      }
    });
  }, [insertFollow, profileId, t]);

  const unfollowUser = useCallback(async () => {
    createConfirmModal({
      title: upperFirst(t('common.messages.are_u_sure')),
      confirmLabel: upperFirst(t('common.messages.unfollow')),
      onConfirm: async () => {
        await deleteFollow({
          path: {
            user_id: profileId,
          }
        }, {
          onError: () => {
            toast.error(upperFirst(t('common.messages.an_error_occurred')));
          }
        });
      },
    });
  }, [deleteFollow, profileId, t, createConfirmModal]);

  if (!user || user.id == profileId) return null;

  return (
    <div className={cn('flex items-center', className)}>
      {isLoading ? (
        <Skeleton className="h-10 w-20 rounded-full" />
      ) : (
        <Button
        variant={isFollow ? 'outline' : 'default'}
        onClick={isFollow ? unfollowUser : followUser}
        className="rounded-full"
        >
          {isFollow ? (
            isFollow.status === 'pending' ? upperFirst(t('common.messages.request_sent')) : upperFirst(t('common.messages.followed'))
          ) : upperFirst(t('common.messages.follow'))}
        </Button>
      )}
    </div>
  );
}
