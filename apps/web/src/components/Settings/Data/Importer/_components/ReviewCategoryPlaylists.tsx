'use client';

import { useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import { useInfiniteQuery } from '@tanstack/react-query';
import { importPlaylistsInfiniteOptions, useImportPatchPlaylistMutation } from '@libs/query-client';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Icons } from '@/config/icons';
import { ChevronRightIcon, Undo2Icon, XIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TableImportPlaylistItems } from './TableImportPlaylistItems/TableImportPlaylistItems';

// playlistId/onSelectPlaylist are lifted to ImporterInitiator so the modal header can render a
// single breadcrumb spanning the full depth ("Review your import > Lists > My Playlist") instead
// of a second breadcrumb nested inside this component.
export function ReviewCategoryPlaylists({
  jobId,
  playlistId,
  onSelectPlaylist,
}: {
  jobId: number;
  playlistId: number | null;
  onSelectPlaylist: (id: number, title: string) => void;
}) {
  const { ref, inView } = useInView();
  const patchMutation = useImportPatchPlaylistMutation();
  const { data, isFetching, fetchNextPage, hasNextPage } = useInfiniteQuery(
    importPlaylistsInfiniteOptions({ id: jobId }),
  );

  useEffect(() => {
    if (inView && hasNextPage) fetchNextPage();
  }, [inView, hasNextPage, fetchNextPage]);

  if (playlistId) {
    return <ReviewPlaylistItems jobId={jobId} playlistId={playlistId} />;
  }

  return (
    <ScrollArea className="h-[50vh] pr-4">
      <div className="space-y-1">
        {data?.pages.map((page) =>
          page.data.map((p) => {
            const isSkipped = p.matchStatus === 'skipped';
            return (
              <div
                key={p.id}
                onClick={() => onSelectPlaylist(p.id, p.title)}
                className={cn(
                  'flex items-center justify-between w-full p-2 rounded-md hover:bg-background transition-colors cursor-pointer',
                  isSkipped && 'opacity-40',
                )}
              >
                <span className="font-medium truncate">{p.title}</span>
                <div className="flex items-center gap-1 shrink-0">
                  {isSkipped ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        patchMutation.mutate({
                          path: { id: jobId, itemId: p.id },
                          body: { matchStatus: 'matched' },
                        });
                      }}
                    >
                      <Undo2Icon size={15} />
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        patchMutation.mutate({
                          path: { id: jobId, itemId: p.id },
                          body: { matchStatus: 'skipped' },
                        });
                      }}
                    >
                      <XIcon size={15} />
                    </Button>
                  )}
                  <ChevronRightIcon size={16} className="text-muted-foreground" />
                </div>
              </div>
            );
          }),
        )}
        {isFetching ? (
          <div className="flex items-center justify-center p-4">
            <Icons.loader />
          </div>
        ) : (
          <div ref={ref} />
        )}
      </div>
    </ScrollArea>
  );
}

function ReviewPlaylistItems({ jobId, playlistId }: { jobId: number; playlistId: number }) {
  return <TableImportPlaylistItems jobId={jobId} playlistId={playlistId} />;
}
