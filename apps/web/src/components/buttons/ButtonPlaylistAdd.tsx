import * as React from 'react';
import { Button } from '@libs/ui/components/button';
import { useAuth } from '@/context/auth-context';
import { TooltipBox } from '@/components/Box/TooltipBox';
import { Link } from '@/lib/i18n/navigation';
import { Icons } from '@/config/icons';
import { usePathname } from '@/lib/i18n/navigation';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { upperFirst } from 'lodash';
import { PlaylistsAddTargetsControllerListAllData } from '@libs/api-js';
import { getPlaylistAddHref } from '@/utils/hrefs/get-playlist-add-href';

interface ButtonPlaylistAddProps extends React.ComponentProps<typeof Button> {
  mediaId: PlaylistsAddTargetsControllerListAllData['path']['media_id'];
  mediaType: 'movie' | 'tv_series';
  mediaTitle?: string | null;
  stopPropagation?: boolean;
}

const ButtonPlaylistAdd = React.forwardRef<
  React.ComponentRef<typeof Button>,
  ButtonPlaylistAddProps
>(({ mediaId, mediaType, mediaTitle, stopPropagation = true, className, ...props }, ref) => {
  const { user } = useAuth();
  const t = useTranslations();
  const pathname = usePathname();

  const handleClick = React.useCallback(
    (e: React.MouseEvent) => {
      stopPropagation && e.stopPropagation();
    },
    [stopPropagation],
  );

  if (user === null) {
    return (
      <TooltipBox tooltip={upperFirst(t('common.messages.please_login'))}>
        <Button
          ref={ref}
          size="icon"
          variant={'outline'}
          className={cn('rounded-full', className)}
          asChild
          {...props}
        >
          <Link href={`/auth/login?redirect=${encodeURIComponent(pathname)}`}>
            <Icons.addPlaylist />
          </Link>
        </Button>
      </TooltipBox>
    );
  }

  return (
    <TooltipBox tooltip={upperFirst(t('common.messages.add_to_playlist'))}>
      <Button
        ref={ref}
        disabled={user === undefined}
        size="icon"
        variant={'outline'}
        className={cn('rounded-full', className)}
        asChild
        {...props}
      >
        <Link href={getPlaylistAddHref(mediaType, mediaId, mediaTitle)} onClick={handleClick}>
          {user === undefined ? <Icons.spinner className="animate-spin" /> : <Icons.addPlaylist />}
        </Link>
      </Button>
    </TooltipBox>
  );
});
ButtonPlaylistAdd.displayName = 'ButtonPlaylistAdd';

export default ButtonPlaylistAdd;
