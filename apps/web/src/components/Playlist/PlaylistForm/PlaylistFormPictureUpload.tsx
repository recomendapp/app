'use client';

import { ImageWithFallback } from '@/components/utils/ImageWithFallback';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Loader2 } from 'lucide-react';
import { Dispatch } from 'react';

const PlaylistFormPictureUpload = ({
  playlist,
  loading,
  newPoster,
  setNewPoster,
}: {
  playlist: any;
  loading: boolean;
  newPoster: File | undefined;
  setNewPoster: Dispatch<any>;
}) => {
  return (
    <label className="flex w-full h-full items-center overflow-hidden relative cursor-pointer">
      <div className="w-full shadow-2xl">
        <AspectRatio ratio={1 / 1}>
          {loading && (
            <div className="absolute z-1 w-full h-full flex items-center justify-center bg-black/80">
              <div className=" object-cover">
                <Loader2 className="animate-spin" />
              </div>
            </div>
          )}
          <ImageWithFallback
            src={
              newPoster
                ? URL.createObjectURL(newPoster)
                : playlist?.poster_url ?? ''
            }
            alt={playlist?.title ?? ''}
            fill
            className="rounded-md object-cover"
            type="playlist"
          />
        </AspectRatio>
      </div>
      <input
        disabled={loading}
        type="file"
        accept=".jpg,.png,.jpeg,.webp"
        max="2097152"
        onChange={(e) => {
          e.target.files && setNewPoster(e.target.files[0]);
        }}
        className="hidden"
      />
    </label>
  );
};

export default PlaylistFormPictureUpload;
