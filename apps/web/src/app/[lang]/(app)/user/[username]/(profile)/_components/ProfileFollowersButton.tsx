'use client'

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ProfileFollowersModal } from '@/components/Modals/profiles/ProfileFollowersModal';
import { useModal } from '@/context/modal-context';
import { TooltipBox } from '@/components/Box/TooltipBox';
import { useTranslations } from 'next-intl';
import { upperFirst } from 'lodash';
import { useCallback } from 'react';

interface ProfileFollowersButtonProps {
  userId?: string;
  className?: string;
  disabled?: boolean;
}

export const ProfileFollowersButton = ({
	userId,
	className,
  disabled = false,
} : ProfileFollowersButtonProps) => {
  const t = useTranslations();
  const { createModal } = useModal();

  const handleOpenFollowersModal = useCallback(() => {
    if (!userId) return;
    createModal({
      header: {
        title: upperFirst(t('common.messages.follower', { count: 2 })),
      },
      content: <ProfileFollowersModal userId={userId} />,
    });
  }, [createModal, t, userId]);

  return (
      <TooltipBox tooltip={upperFirst(t('common.messages.see_followers'))}>
        <Button
        variant={'outline'}
        onClick={handleOpenFollowersModal}
        className={cn(className)}
        disabled={disabled || !userId}
        >
        {t('common.messages.follower', { count: 2 })}
        </Button>
      </TooltipBox>
  );
}
