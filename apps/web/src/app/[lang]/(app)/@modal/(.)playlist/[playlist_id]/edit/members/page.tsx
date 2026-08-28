'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from '@/lib/i18n/navigation';
import { ModalPlaylistMembers } from '@/components/Modals/playlists/ModalPlaylistMembers';
import { playlistMembersRouteParamsSchema } from '@/app/[lang]/(app)/playlist/[playlist_id]/edit/members/schema';

export default function InterceptedPlaylistMembersModal() {
  const router = useRouter();
  const rawParams = useParams<{ playlist_id: string }>();
  const [open, setOpen] = useState(true);

  const parsedParams = playlistMembersRouteParamsSchema.safeParse(rawParams);

  useEffect(() => {
    if (!parsedParams.success) {
      router.back();
    }
  }, [parsedParams.success]);

  if (!parsedParams.success) {
    return null;
  }

  return (
    <ModalPlaylistMembers
      playlistId={parsedParams.data.playlist_id}
      open={open}
      onOpenChange={setOpen}
      onCloseEnd={() => router.back()}
    />
  );
}
