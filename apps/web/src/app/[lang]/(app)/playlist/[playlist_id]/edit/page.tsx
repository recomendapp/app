'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from '@/lib/i18n/navigation';
import { ModalPlaylist } from '@/components/Modals/playlists/ModalPlaylist';
import { playlistEditRouteParamsSchema } from './schema';
import Home from '../../../page';

// Direct-load fallback for the "/playlist/[playlist_id]/edit" intercepted
// route: since a hard navigation (or refresh) bypasses route interception,
// this renders the same background (Home) the modal would otherwise be
// layered over, so the URL stays put and the modal never falls back to a
// full page.
export default function PlaylistEditPage() {
  const router = useRouter();
  const rawParams = useParams<{ playlist_id: string }>();
  const [open, setOpen] = useState(true);

  const parsedParams = playlistEditRouteParamsSchema.safeParse(rawParams);

  if (!parsedParams.success) {
    router.replace('/');
    return null;
  }

  return (
    <>
      <Home />
      <ModalPlaylist
        playlistId={parsedParams.data.playlist_id}
        open={open}
        onOpenChange={setOpen}
        onCloseEnd={() => router.push('/')}
      />
    </>
  );
}
