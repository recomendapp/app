'use client';

import { useState } from 'react';
import { useRouter } from '@/lib/i18n/navigation';
import { ModalPlaylist } from '@/components/Modals/playlists/ModalPlaylist';

export default function InterceptedPlaylistCreateModal() {
  const router = useRouter();
  const [open, setOpen] = useState(true);

  return <ModalPlaylist open={open} onOpenChange={setOpen} onCloseEnd={() => router.back()} />;
}
