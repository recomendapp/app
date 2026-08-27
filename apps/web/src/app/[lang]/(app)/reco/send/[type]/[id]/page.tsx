'use client';

import { useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useRouter } from '@/lib/i18n/navigation';
import { ModalRecoSend } from '@/components/Modals/recos/ModalRecoSend';
import { recoSendRouteParamsSchema, recoSendSearchParamsSchema } from './schema';
import Home from '../../../../page';

export default function RecoSendPage() {
  const router = useRouter();
  const rawParams = useParams<{ type: string; id: string }>();
  const rawSearchParams = useSearchParams();
  const [open, setOpen] = useState(true);

  const parsedParams = recoSendRouteParamsSchema.safeParse(rawParams);
  const parsedSearchParams = recoSendSearchParamsSchema.safeParse({
    mediaTitle: rawSearchParams.get('mediaTitle') ?? undefined,
  });

  if (!parsedParams.success) {
    router.replace('/');
    return null;
  }

  return (
    <>
      <Home />
      <ModalRecoSend
        mediaId={parsedParams.data.id}
        mediaType={parsedParams.data.type}
        mediaTitle={parsedSearchParams.success ? parsedSearchParams.data.mediaTitle : undefined}
        open={open}
        onOpenChange={setOpen}
        onCloseEnd={() => router.push('/')}
      />
    </>
  );
}
