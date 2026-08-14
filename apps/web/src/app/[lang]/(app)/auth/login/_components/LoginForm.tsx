'use client';

import { LoginPasswordForm } from './LoginPasswordForm';
import { Icons } from '@/config/icons';
import { Link } from '@/lib/i18n/navigation';
import { useAuth } from '@/context/auth-context';
import { useCallback, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { RectangleEllipsisIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { upperFirst } from 'lodash';
import { SocialProvider } from 'better-auth';

interface LoginFormProps {
  redirectTo: string | null;
  onSuccess?: () => void;
}

export function LoginForm({ redirectTo, onSuccess }: LoginFormProps) {
  const { loginOAuth2 } = useAuth();
  const t = useTranslations('pages.auth.login');
  const common = useTranslations('common');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const oAuth2Providers = useMemo(
    (): { value: SocialProvider; label: string; icon: any; enabled: boolean }[] => [
      {
        value: 'google',
        label: 'Google',
        icon: Icons.google,
        enabled: true,
      },
      {
        value: 'facebook',
        label: 'Facebook',
        icon: Icons.facebook,
        enabled: true,
      },
      {
        value: 'apple',
        label: 'Apple',
        icon: Icons.apple,
        enabled: true,
      },
      {
        value: 'github',
        label: 'Github',
        icon: Icons.gitHub,
        enabled: true,
      },
    ],
    [],
  );

  const handleLoginOAuth2 = useCallback(
    async (provider: SocialProvider) => {
      try {
        setIsLoading(true);
        await loginOAuth2(provider, redirectTo);
        onSuccess?.();
      } finally {
        setIsLoading(false);
      }
    },
    [loginOAuth2, redirectTo, onSuccess],
  );

  return (
    <div className="@container grid gap-4">
      <LoginPasswordForm redirectTo={redirectTo} onSuccess={onSuccess} />
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-muted px-2 text-muted-foreground">{t('or_continue_with')}</span>
        </div>
      </div>
      <div className="grid @xs:grid-cols-2 gap-2 @xs:gap-4">
        <Button variant={'outline'} disabled={isLoading} className="col-span-2" asChild>
          <Link
            href={{
              pathname: '/auth/login/otp',
              query: redirectTo ? { redirect: redirectTo } : undefined,
            }}
          >
            <RectangleEllipsisIcon className="mr-2 h-4 w-4" />
            OTP
          </Link>
        </Button>
        {oAuth2Providers.map((provider, i) => (
          <Button
            key={provider.value}
            variant={'outline'}
            onClick={() => handleLoginOAuth2(provider.value)}
            disabled={!provider.enabled || isLoading}
            className={
              oAuth2Providers.length % 2 !== 0 && i === oAuth2Providers.length - 1
                ? 'col-span-2'
                : ''
            }
          >
            <provider.icon className="mr-2 h-4 w-4" />
            {provider.label}
          </Button>
        ))}
      </div>
      <p className="px-8 text-center text-sm text-muted-foreground">
        {t('no_account_yet')}{' '}
        <Button variant={'link'} className="inline p-0 text-accent-yellow" asChild>
          <Link
            href={{
              pathname: '/auth/signup',
              query: redirectTo ? { redirect: redirectTo } : undefined,
            }}
          >
            {upperFirst(common('messages.signup'))}
          </Link>
        </Button>
      </p>
    </div>
  );
}
