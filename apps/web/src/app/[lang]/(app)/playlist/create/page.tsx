'use client';

import { useState } from 'react';
import { useRouter } from '@/lib/i18n/navigation';
import { ModalPlaylist } from '@/components/Modals/playlists/ModalPlaylist';
import Home from '../../page';

// Direct-load fallback for the "/playlist/create" intercepted route: since a
// hard navigation (or refresh) bypasses route interception, this renders the
// same background (Home) the modal would otherwise be layered over, so the
// URL stays put and the modal never falls back to a full page.
export default function PlaylistCreatePage() {
  const router = useRouter();
  const [open, setOpen] = useState(true);

  return (
    <>
      <Home />
      <ModalPlaylist open={open} onOpenChange={setOpen} onCloseEnd={() => router.push('/')} />
    </>
  );
}
