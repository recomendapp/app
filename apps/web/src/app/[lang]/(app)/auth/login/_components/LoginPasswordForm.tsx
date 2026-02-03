'use client'

import { Link } from "@/lib/i18n/navigation";
import { Icons } from '@/config/icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import * as z from 'zod';
import { useAuth } from '@/context/auth-context';
import { useCallback, useMemo, useState } from 'react';
import { InputPassword } from '@/components/ui/input-password';
import { useTranslations } from 'next-intl';

export function LoginPasswordForm({
  className,
  redirectTo,
  ...props
} : React.HTMLAttributes<HTMLDivElement> & { redirectTo: string | null }) {
  const { login } = useAuth();
  const t = useTranslations('pages.auth.login');
  const common = useTranslations('common');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const loginSchema = useMemo(() => z.object({
    email: z.string().email({ message: common('form.email.error.invalid') }),
    password: z.string(),
  }), [common]);

  const onSubmit = useCallback(async (event: React.SyntheticEvent) => {
    event?.preventDefault();
    try {
      setIsLoading(true);
      const emailForm = (event.target as HTMLFormElement).email.value;
      const passwordForm = (event.target as HTMLFormElement).password.value;
      const { email, password } = loginSchema.parse({ email: emailForm, password: passwordForm });
      await login({
        email,
        password,
        redirectTo,
      });
    } finally {
      setIsLoading(false);
    }
  }, [login, redirectTo, loginSchema]);

  return (
    <form onSubmit={onSubmit}>
      <div className="grid gap-2">
        <div className="grid gap-1">
          <Label htmlFor="email">
            {common('form.email.label')}
          </Label>
          <Input
            id="email"
            type="email"
            placeholder={common('form.email.placeholder')}
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect="off"
            disabled={isLoading}
          />
        </div>
        <div className="grid gap-1">
          <Label htmlFor="password">
            {t('form.password.label')}
          </Label>
          <InputPassword
            id="password"
            placeholder={t('form.password.placeholder')}
            autoComplete="current-password"
            disabled={isLoading}
          />
        </div>
        <Button disabled={isLoading}>
          {isLoading ? (<Icons.loader />) : null}
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
