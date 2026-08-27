'use client';

import { useRouter } from '@/lib/i18n/navigation';
import { ModalWelcome } from '@/components/Modals/ModalWelcome';

export default function InterceptedWelcomeModal() {
  const router = useRouter();
  return <ModalWelcome onClose={() => router.back()} />;
}
