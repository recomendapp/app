'use client'

import { UserNav } from '../User/UserNav';
import { Button } from '../ui/button';
import { Link } from "@/lib/i18n/navigation";
import { SocialButton } from './components/SocialButton';
import { NotificationsButton } from '../notifications/NotificationsButton';
import { useAuth } from '@/context/auth-context';
import { useTranslations } from 'next-intl';
import { useNotifications } from '@/context/notifications-context';
import { upperFirst } from 'lodash';
import { ButtonGroup } from '../ui/button-group';

export default function HeaderRightSide() {
  const { session } = useAuth();
  const { state } = useNotifications();
  const t = useTranslations();
  return (
    <ButtonGroup>
      {session ? (
        <>
          <ButtonGroup>
            {state === 'success' && <NotificationsButton />}
            <SocialButton />
            <UserNav />
          </ButtonGroup>
        </>
      ) : (
        <Button variant='outline' asChild>
          <Link href={'/auth/login'} className="whitespace-nowrap">
            {upperFirst(t('common.messages.login'))}
          </Link>
        </Button>
      )}
    </ButtonGroup>
  );
}
