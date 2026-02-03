'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn, getInitiales } from '@/lib/utils';

interface UserAvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  avatarUrl?: string | null;
  username: string;
}

export const UserAvatar = ({
  avatarUrl,
  username,
  className,
  ...props
} : UserAvatarProps) => {
  return (
    <Avatar className={cn('@container/avatar h-8 w-8', className)} {...props}>
      <AvatarImage src={avatarUrl ?? undefined} alt={username} />
      <AvatarFallback className="text-xl @[50px]/avatar:text-3xl @[100px]/avatar:text-5xl">
        {getInitiales(username)}
      </AvatarFallback>
    </Avatar>
  );
}
