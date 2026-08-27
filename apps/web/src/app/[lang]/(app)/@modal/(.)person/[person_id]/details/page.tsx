'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from '@/lib/i18n/navigation';
import { ModalPersonDetails } from '@/components/Modals/persons/ModalPersonDetails';
import { personDetailsRouteParamsSchema } from '@/app/[lang]/(app)/person/[person_id]/details/schema';

export default function InterceptedPersonDetailsModal() {
  const router = useRouter();
  const rawParams = useParams<{ person_id: string }>();
  const [open, setOpen] = useState(true);

  const parsedParams = personDetailsRouteParamsSchema.safeParse(rawParams);

  useEffect(() => {
    // An unparseable deep link never had a real modal to show — close it
    // immediately instead of rendering something broken.
    if (!parsedParams.success) {
      router.back();
    }
  }, [parsedParams.success]);

  if (!parsedParams.success) {
    return null;
  }

  return (
    <ModalPersonDetails
      personId={parsedParams.data.person_id}
      open={open}
      onOpenChange={setOpen}
      onCloseEnd={() => router.back()}
    />
  );
}
