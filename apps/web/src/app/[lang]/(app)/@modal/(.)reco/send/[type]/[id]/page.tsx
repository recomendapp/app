'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useRouter } from '@/lib/i18n/navigation';
import { ModalRecoSend } from '@/components/Modals/recos/ModalRecoSend';
import {
  recoSendRouteParamsSchema,
  recoSendSearchParamsSchema,
} from '@/app/[lang]/(app)/reco/send/[type]/[id]/schema';

export default function InterceptedRecoSendModal() {
  const router = useRouter();
  const rawParams = useParams<{ type: string; id: string }>();
  const rawSearchParams = useSearchParams();
  const [open, setOpen] = useState(true);

  const parsedParams = recoSendRouteParamsSchema.safeParse(rawParams);
  const parsedSearchParams = recoSendSearchParamsSchema.safeParse({
    mediaTitle: rawSearchParams.get('mediaTitle') ?? undefined,
  });

  useEffect(() => {
    if (!parsedParams.success) {
      router.back();
    }
  }, [parsedParams.success]);

  if (!parsedParams.success) {
    return null;
  }

  return (
    <ModalRecoSend
      mediaId={parsedParams.data.id}
      mediaType={parsedParams.data.type}
      mediaTitle={parsedSearchParams.success ? parsedSearchParams.data.mediaTitle : undefined}
      open={open}
      onOpenChange={setOpen}
      onCloseEnd={() => router.back()}
    />
  );
}
