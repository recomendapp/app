'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from '@/lib/i18n/navigation';
import { ModalPlaylistMembersAdd } from '@/components/Modals/playlists/ModalPlaylistMembersAdd';
import { playlistMembersAddRouteParamsSchema } from './schema';
import Home from '../../../../../page';

export default function PlaylistMembersAddPage() {
  const router = useRouter();
  const rawParams = useParams<{ playlist_id: string }>();
  const [open, setOpen] = useState(true);

  const parsedParams = playlistMembersAddRouteParamsSchema.safeParse(rawParams);

  if (!parsedParams.success) {
    router.replace('/');
    return null;
  }

  return (
    <>
      <Home />
      <ModalPlaylistMembersAdd
        playlistId={parsedParams.data.playlist_id}
        open={open}
        onOpenChange={setOpen}
        onCloseEnd={() => router.push('/')}
      />
    </>
  );
}
