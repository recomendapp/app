'use client';

import { useState } from 'react';
import { useRouter } from '@/lib/i18n/navigation';
import { ModalWelcome } from '@/components/Modals/ModalWelcome';
import Home from '../page';

export default function WelcomePage() {
  const router = useRouter();
  const [open, setOpen] = useState(true);
  return (
    <>
      <Home />
      <ModalWelcome open={open} onOpenChange={setOpen} onCloseEnd={() => router.push('/')} />
    </>
  );
}
