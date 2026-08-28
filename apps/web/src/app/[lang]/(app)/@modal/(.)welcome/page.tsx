'use client';

import { useState } from 'react';
import { useRouter } from '@/lib/i18n/navigation';
import { ModalWelcome } from '@/components/Modals/ModalWelcome';

export default function InterceptedWelcomeModal() {
  const router = useRouter();
  const [open, setOpen] = useState(true);
  return <ModalWelcome open={open} onOpenChange={setOpen} onCloseEnd={() => router.back()} />;
}
