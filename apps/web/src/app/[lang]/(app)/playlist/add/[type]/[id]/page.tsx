'use client';

import { useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useRouter } from '@/lib/i18n/navigation';
import { ModalPlaylistAdd } from '@/components/Modals/playlists/ModalPlaylistAdd';
import { playlistAddRouteParamsSchema, playlistAddSearchParamsSchema } from './schema';
import Home from '../../../../page';

export default function PlaylistAddPage() {
  const router = useRouter();
  const rawParams = useParams<{ type: string; id: string }>();
  const rawSearchParams = useSearchParams();
  const [open, setOpen] = useState(true);

  const parsedParams = playlistAddRouteParamsSchema.safeParse(rawParams);
  const parsedSearchParams = playlistAddSearchParamsSchema.safeParse({
    mediaTitle: rawSearchParams.get('mediaTitle') ?? undefined,
  });

  if (!parsedParams.success) {
    router.replace('/');
    return null;
  }

  return (
    <>
      <Home />
      <ModalPlaylistAdd
        mediaId={parsedParams.data.id}
        type={parsedParams.data.type}
        mediaTitle={parsedSearchParams.success ? parsedSearchParams.data.mediaTitle : undefined}
        open={open}
        onOpenChange={setOpen}
        onCloseEnd={() => router.push('/')}
      />
    </>
  );
}
