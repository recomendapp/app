'use client';

import { useRouter } from '@/lib/i18n/navigation';
import { ModalWelcome } from '@/components/Modals/ModalWelcome';
import Home from '../page';

export default function WelcomePage() {
  const router = useRouter();
  return (
    <>
      <Home />
      <ModalWelcome onClose={() => router.push('/')} />
    </>
  );
}
