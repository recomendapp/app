'use client';

import { Link } from '@/lib/i18n/navigation';
import { Icons } from '@/config/icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import * as z from 'zod';
import { useAuth } from '@/context/auth-context';
import { useCallback, useMemo, useState } from 'react';
import { InputPassword } from '@/components/ui/input-password';
import { useTranslations } from 'next-intl';

const identifierEmailSchema = z.string().email();

export function LoginPasswordForm({
  className,
  redirectTo,
  onSuccess,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { redirectTo: string | null; onSuccess?: () => void }) {
  const { login } = useAuth();
  const t = useTranslations('pages.auth.login');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const loginSchema = useMemo(
    () =>
      z.object({
        identifier: z.string().min(1),
        password: z.string(),
      }),
    [],
  );

  const onSubmit = useCallback(
    async (event: React.SyntheticEvent) => {
      event?.preventDefault();
      try {
        setIsLoading(true);
        const identifierForm = (event.target as HTMLFormElement).identifier.value;
        const passwordForm = (event.target as HTMLFormElement).password.value;
        const { identifier, password } = loginSchema.parse({
          identifier: identifierForm,
          password: passwordForm,
        });
        const isEmail = identifierEmailSchema.safeParse(identifier).success;
        await login({
          ...(isEmail ? { email: identifier } : { username: identifier }),
          password,
          redirectTo,
        });
        onSuccess?.();
      } finally {
        setIsLoading(false);
      }
    },
    [login, redirectTo, loginSchema, onSuccess],
  );

  return (
    <form onSubmit={onSubmit}>
      <div className="grid gap-2">
        <div className="grid gap-1">
          <Label htmlFor="identifier">{t('form.identifier.label')}</Label>
          <Input
            id="identifier"
            type="text"
            placeholder={t('form.identifier.placeholder')}
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect="off"
            disabled={isLoading}
          />
        </div>
        <div className="grid gap-1">
          <Label htmlFor="password">{t('form.password.label')}</Label>
          <InputPassword
            id="password"
            placeholder={t('form.password.placeholder')}
            autoComplete="current-password"
            disabled={isLoading}
          />
        </div>
        <Button disabled={isLoading}>
          {isLoading ? <Icons.loader /> : null}
          {t('form.submit')}
        </Button>
        <Link
          href={{
            pathname: '/auth/forgot-password',
            query: redirectTo ? { redirect: redirectTo } : undefined,
          }}
          className="text-right text-sm text-muted-foreground hover:text-foreground"
        >
          {t('form.forgot_password')}
        </Link>
      </div>
    </form>
  );
}
