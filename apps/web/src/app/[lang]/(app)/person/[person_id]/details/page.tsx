'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from '@/lib/i18n/navigation';
import { ModalPersonDetails } from '@/components/Modals/persons/ModalPersonDetails';
import { personDetailsRouteParamsSchema } from './schema';
import Home from '../../../page';

export default function PersonDetailsPage() {
  const router = useRouter();
  const rawParams = useParams<{ person_id: string }>();
  const [open, setOpen] = useState(true);

  const parsedParams = personDetailsRouteParamsSchema.safeParse(rawParams);

  if (!parsedParams.success) {
    router.replace('/');
    return null;
  }

  return (
    <>
      <Home />
      <ModalPersonDetails
        personId={parsedParams.data.person_id}
        open={open}
        onOpenChange={setOpen}
        onCloseEnd={() => router.push('/')}
      />
    </>
  );
}
