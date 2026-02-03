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
import { useUserFollowProfileOptions } from '@/api/client/options/userOptions';
import { useUserFollowProfileInsertMutation, useUserUnfollowProfileDeleteMutation } from '@/api/client/mutations/userMutations';

interface UserFollowButtonProps extends React.HTMLAttributes<HTMLDivElement> {
  profileId: string;
}

export const ProfileFollowButton = ({
  className,
  profileId,
}: UserFollowButtonProps) => {
  const t = useTranslations();
  const { session } = useAuth();
  const { createConfirmModal } = useModal();

  const {
    data: isFollow,
    isLoading,
  } = useQuery(useUserFollowProfileOptions({
    userId: session?.user.id,
    profileId: profileId,
  }));

  const { mutateAsync: insertFollow } = useUserFollowProfileInsertMutation();
  const { mutateAsync: deleteFollow } = useUserUnfollowProfileDeleteMutation();

  const followUser = useCallback(async () => {
    if (!session?.user.id) return;
    await insertFollow({
      userId: session?.user.id,
      followeeId: profileId,
    }, {
      onError: (error) => {
        toast.error(upperFirst(t('common.messages.an_error_occurred')));
      }
    });
  }, [insertFollow, profileId, session, t]);

  const unfollowUser = useCallback(async () => {
    if (!session?.user.id) return;
    createConfirmModal({
      title: upperFirst(t('common.messages.are_u_sure')),
      confirmLabel: upperFirst(t('common.messages.unfollow')),
      onConfirm: async () => {
        await deleteFollow({
          userId: session?.user.id,
          followeeId: profileId,
        }, {
          onError: (error) => {
            toast.error(upperFirst(t('common.messages.an_error_occurred')));
          }
        });
      },
    });
  }, [deleteFollow, profileId, session, t, createConfirmModal]);

  if (!session || session.user.id == profileId) return null;

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
            isFollow.is_pending ? upperFirst(t('common.messages.request_sent')) : upperFirst(t('common.messages.followed'))
          ) : upperFirst(t('common.messages.follow'))}
        </Button>
      )}
    </div>
  );
}
