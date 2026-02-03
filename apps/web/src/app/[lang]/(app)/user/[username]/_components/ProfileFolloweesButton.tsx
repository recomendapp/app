'use client'

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ProfileFolloweesModal } from '@/components/Modals/profiles/ProfileFolloweesModal';
import { useModal } from '@/context/modal-context';
import { TooltipBox } from '@/components/Box/TooltipBox';
import { useTranslations } from 'next-intl';
import { upperFirst } from 'lodash';
import { useCallback } from 'react';

interface ProfileFolloweesButtonProps {
  userId?: string;
  className?: string;
  disabled?: boolean;
}

export const ProfileFolloweesButton = ({
	userId,
	className,
  disabled = false,
} : ProfileFolloweesButtonProps) => {
  const t = useTranslations();
  const { createModal } = useModal();

  const handleOpenFolloweesModal = useCallback(() => {
    if (!userId) return;
    createModal({
      header: {
        title: upperFirst(t('common.messages.followee', { count: 2 })),
      },
      content: <ProfileFolloweesModal userId={userId} />,
    });
  }, [createModal, t, userId]);

  return (
    <TooltipBox tooltip={upperFirst(t('common.messages.see_followees'))}>
      <Button
      variant={'outline'}
      onClick={handleOpenFolloweesModal}
      className={cn(className)}
      disabled={disabled || !userId}
      >
      {t('common.messages.followee', { count: 2 })}
      </Button>
    </TooltipBox>
  );
}
