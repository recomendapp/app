'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitiales } from '@/lib/utils';
import { User } from '@recomendapp/types';
import { Loader2 } from 'lucide-react';
import { Dispatch } from 'react';

export default function PictureUpload({
  user,
  isUploading,
  newAvatar,
  setNewAvatar,
}: {
  user: User;
  isUploading: boolean;
  newAvatar: File | undefined;
  setNewAvatar: Dispatch<any>;
}) {
  return (
    <label className="flex w-[150px] h-[150px] rounded-full overflow-hidden relative cursor-pointer">
      <Avatar className="w-full h-full">
        {isUploading && (
          <div className="absolute w-full h-full flex items-center justify-center bg-black/80">
            <div className=" object-cover">
              <Loader2 className="animate-spin" />
            </div>
          </div>
        )}
        <AvatarImage
          src={
            newAvatar ? URL.createObjectURL(newAvatar) : user?.avatar_url ?? ''
          }
          alt={user?.username}
        />
        <AvatarFallback className="text-[75px]">
          {getInitiales(user?.full_name)}
        </AvatarFallback>
      </Avatar>
      <input
        disabled={isUploading}
        type={'file'}
        accept=".jpg,.png,.jpeg,.webp"
        max="2097152"
        onChange={(e) => {
          e.target.files && setNewAvatar(e.target.files[0]);
        }}
        className="hidden"
      />
    </label>
  );
}
