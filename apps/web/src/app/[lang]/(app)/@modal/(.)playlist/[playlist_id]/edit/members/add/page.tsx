'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from '@/lib/i18n/navigation';
import { ModalPlaylistMembersAdd } from '@/components/Modals/playlists/ModalPlaylistMembersAdd';
import { playlistMembersAddRouteParamsSchema } from '@/app/[lang]/(app)/playlist/[playlist_id]/edit/members/add/schema';

export default function InterceptedPlaylistMembersAddModal() {
  const router = useRouter();
  const rawParams = useParams<{ playlist_id: string }>();
  const [open, setOpen] = useState(true);

  const parsedParams = playlistMembersAddRouteParamsSchema.safeParse(rawParams);

  useEffect(() => {
    if (!parsedParams.success) {
      router.back();
    }
  }, [parsedParams.success]);

  if (!parsedParams.success) {
    return null;
  }

  return (
    <ModalPlaylistMembersAdd
      playlistId={parsedParams.data.playlist_id}
      open={open}
      onOpenChange={setOpen}
      onCloseEnd={() => router.back()}
    />
  );
}
