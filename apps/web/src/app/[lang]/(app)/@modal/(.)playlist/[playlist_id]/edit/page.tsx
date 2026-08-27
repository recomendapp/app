'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from '@/lib/i18n/navigation';
import { ModalPlaylist } from '@/components/Modals/playlists/ModalPlaylist';
import { playlistEditRouteParamsSchema } from '@/app/[lang]/(app)/playlist/[playlist_id]/edit/schema';

export default function InterceptedPlaylistEditModal() {
  const router = useRouter();
  const rawParams = useParams<{ playlist_id: string }>();
  const [open, setOpen] = useState(true);

  const parsedParams = playlistEditRouteParamsSchema.safeParse(rawParams);

  useEffect(() => {
    if (!parsedParams.success) {
      router.back();
    }
  }, [parsedParams.success]);

  if (!parsedParams.success) {
    return null;
  }

  return (
    <ModalPlaylist
      playlistId={parsedParams.data.playlist_id}
      open={open}
      onOpenChange={setOpen}
      onCloseEnd={() => router.back()}
    />
  );
}
