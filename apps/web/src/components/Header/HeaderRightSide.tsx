'use client';

import { UserNav } from '../User/UserNav';
import { Button } from '@libs/ui/components/button';
import { Link } from '@/lib/i18n/navigation';
import { SocialButton } from './components/SocialButton';
import { useAuth } from '@/context/auth-context';
import { useTranslations } from 'next-intl';
import { upperFirst } from 'lodash';
import { ButtonGroup } from '@libs/ui/components/button-group';

export default function HeaderRightSide() {
  const { user } = useAuth();
  const t = useTranslations();
  return (
    <ButtonGroup>
      {user ? (
        <>
          <ButtonGroup>
            <SocialButton />
            <UserNav />
          </ButtonGroup>
        </>
      ) : (
        <Button variant="outline" asChild>
          <Link href={'/auth/login'} className="whitespace-nowrap">
            {upperFirst(t('common.messages.login'))}
          </Link>
        </Button>
      )}
    </ButtonGroup>
  );
}
