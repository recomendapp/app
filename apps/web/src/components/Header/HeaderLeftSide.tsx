'use client';

import { Link, usePathname, useRouter } from '@/lib/i18n/navigation';
import SearchBar from '@/components/Search/SearchBar';
import { SidebarTrigger } from '@libs/ui/components/sidebar';
import { Button } from '@libs/ui/components/button';
import { upperFirst } from 'lodash';
import { useTranslations } from 'next-intl';
import { Icons } from '@/config/icons';
import { ButtonGroup } from '@libs/ui/components/button-group';
import { getPlaylistCreateHref } from '@/utils/hrefs/get-playlist-create-href';

export default function HeaderLeftSide({ className }: { className?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const common = useTranslations('common');
  return (
    <ButtonGroup className="w-full">
      <ButtonGroup>
        <SidebarTrigger className="md:hidden" />
      </ButtonGroup>
      <ButtonGroup>
        <Button
          variant="outline"
          size="icon"
          aria-label={upperFirst(common('messages.backward'))}
          onClick={router.back}
        >
          <Icons.chevronLeft />
          <span className="sr-only">{upperFirst(common('messages.backward'))}</span>
        </Button>
        <Button
          variant="outline"
          size="icon"
          aria-label={upperFirst(common('messages.forward'))}
          onClick={router.forward}
        >
          <Icons.chevronRight />
          <span className="sr-only">{upperFirst(common('messages.forward'))}</span>
        </Button>
      </ButtonGroup>
      <SearchBar />
      {pathname == '/collection' && (
        <ButtonGroup>
          <ButtonPlaylistCreate />
        </ButtonGroup>
      )}
    </ButtonGroup>
  );
}

const ButtonPlaylistCreate = () => {
  const t = useTranslations();
  return (
    <Button
      variant="outline"
      size="icon"
      aria-label={upperFirst(t('common.messages.create_a_playlist'))}
      asChild
    >
      <Link href={getPlaylistCreateHref()}>
        <Icons.add />
        <span className="sr-only">{upperFirst(t('common.messages.create_a_playlist'))}</span>
      </Link>
    </Button>
  );
};
