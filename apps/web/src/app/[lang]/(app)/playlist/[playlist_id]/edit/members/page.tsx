'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from '@/lib/i18n/navigation';
import { ModalPlaylistMembers } from '@/components/Modals/playlists/ModalPlaylistMembers';
import { playlistMembersRouteParamsSchema } from './schema';
import Home from '../../../../page';

export default function PlaylistMembersPage() {
  const router = useRouter();
  const rawParams = useParams<{ playlist_id: string }>();
  const [open, setOpen] = useState(true);

  const parsedParams = playlistMembersRouteParamsSchema.safeParse(rawParams);

  if (!parsedParams.success) {
    router.replace('/');
    return null;
  }

  return (
    <>
      <Home />
      <ModalPlaylistMembers
        playlistId={parsedParams.data.playlist_id}
        open={open}
        onOpenChange={setOpen}
        onCloseEnd={() => router.push('/')}
      />
    </>
  );
}
