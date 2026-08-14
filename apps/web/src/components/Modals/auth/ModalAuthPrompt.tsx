'use client';

import { useModal } from '@/context/modal-context';
import { Modal, ModalBody, ModalDescription, ModalHeader, ModalTitle, ModalType } from '../Modal';
import { LoginForm } from '@/app/[lang]/(app)/auth/login/_components/LoginForm';
import { useAuthPromptStore } from '@/stores/useAuthPromptStore';
import { usePathname } from '@/lib/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Icons } from '@/config/icons';

export function ModalAuthPrompt({ ...props }: ModalType) {
  const t = useTranslations();
  const { closeModal } = useModal();
  const { dismiss } = useAuthPromptStore();
  // Keep the user on the page they were browsing instead of bouncing them to the homepage.
  const pathname = usePathname();

  const handleDismiss = (open: boolean) => {
    if (!open) {
      dismiss();
      closeModal(props.id);
    }
  };

  const handleLoginSuccess = () => closeModal(props.id);

  return (
    <Modal open={props.open} onOpenChange={handleDismiss}>
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
