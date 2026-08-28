'use client';

import { Modal, ModalBody, ModalDescription, ModalHeader, ModalTitle } from '../Modal';
import { LoginForm } from '@/app/[lang]/(app)/auth/login/_components/LoginForm';
import { useAuthPromptStore } from '@/stores/useAuthPromptStore';
import { usePathname } from '@/lib/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Icons } from '@/config/icons';

interface ModalAuthPromptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCloseEnd?: () => void;
}

export function ModalAuthPrompt({ open, onOpenChange, onCloseEnd }: ModalAuthPromptProps) {
  const t = useTranslations();
  const { dismiss } = useAuthPromptStore();
  // Keep the user on the page they were browsing instead of bouncing them to the homepage.
  const pathname = usePathname();

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) dismiss();
    onOpenChange(nextOpen);
  };

  const handleLoginSuccess = () => onOpenChange(false);

  return (
    <Modal open={open} onOpenChange={handleOpenChange} onCloseEnd={onCloseEnd}>
      <ModalHeader>
        <ModalTitle className="inline-flex gap-2 items-center justify-center">
          <Icons.site.icon className="fill-accent-yellow w-8" />
          {t('pages.auth.login.label')}
        </ModalTitle>
        <ModalDescription className="text-center">
          {t('pages.auth.login.description')}
        </ModalDescription>
      </ModalHeader>
      <ModalBody>
        <LoginForm redirectTo={pathname} onSuccess={handleLoginSuccess} />
      </ModalBody>
    </Modal>
  );
}
