'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useRouter } from '@/lib/i18n/navigation';
import { ModalPlaylistAdd } from '@/components/Modals/playlists/ModalPlaylistAdd';
import {
  playlistAddRouteParamsSchema,
  playlistAddSearchParamsSchema,
} from '@/app/[lang]/(app)/playlist/add/[type]/[id]/schema';

export default function InterceptedPlaylistAddModal() {
  const router = useRouter();
  const rawParams = useParams<{ type: string; id: string }>();
  const rawSearchParams = useSearchParams();
  const [open, setOpen] = useState(true);

  const parsedParams = playlistAddRouteParamsSchema.safeParse(rawParams);
  const parsedSearchParams = playlistAddSearchParamsSchema.safeParse({
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
    <ModalPlaylistAdd
      mediaId={parsedParams.data.id}
      type={parsedParams.data.type}
      mediaTitle={parsedSearchParams.success ? parsedSearchParams.data.mediaTitle : undefined}
      open={open}
      onOpenChange={setOpen}
      onCloseEnd={() => router.back()}
    />
  );
}
