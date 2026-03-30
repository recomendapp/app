'use client';

import { Icons } from '@/config/icons';
import { Images } from '@/config/images';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useCallback, useState } from 'react';
import * as z from 'zod';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { useRandomImage } from '@/hooks/use-random-image';
import { Link } from "@/lib/i18n/navigation";
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { upperFirst } from 'lodash';
import { authClient } from '@/lib/auth/client';

export default function ForgotPassword() {
  const t = useTranslations('pages.auth.forgot_password');
  const common = useTranslations('common');
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect');
  const [email, setEmail] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const bgImage = useRandomImage(Images.auth.forgotPassword.background);

  const emailSchema = z
    .email({
      message: common('form.email.error.invalid'),
    });

  const handleSubmit = useCallback(async (event?: React.SyntheticEvent) => {
    event?.preventDefault();
    try {
      setIsLoading(true);
      emailSchema.parse(email);
      const { error } = await authClient.requestPasswordReset({
        email,
        redirectTo: `${location.origin}/auth/reset-password`,
      });
      if (error) {
        switch (error.status) {
          default:
            toast.error(upperFirst(common('messages.an_error_occurred')));
        }
        return;
      }
      toast.success(t('form.code_sent'));
    } finally {
      setIsLoading(false);
    }
  }, [email, emailSchema, common, t]);

  return (
    <div
      className="h-full w-full flex items-center justify-center"
      style={{
        backgroundImage: `url(${bgImage?.src})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <form onSubmit={handleSubmit}>
        <Card className="w-full max-w-[400px]">
          <CardHeader className='gap-2'>
            <CardTitle className='inline-flex gap-2 items-center justify-center'>
              <Icons.site.icon className='fill-accent-yellow w-8' />
              {t('label')}
            </CardTitle>
            <CardDescription>{t('description')}</CardDescription>
          </CardHeader>
          <CardContent className='grid gap-2'>
                <Label htmlFor="email">{common('form.email.label')}</Label>
                <Input
                id="email"
                type="email"
                placeholder={t('form.email.placeholder')}
                autoCapitalize='none'
                autoComplete='email'
                autoCorrect='off'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                />
          </CardContent>
          <CardFooter className='grid gap-2'>
            <Button className="w-full" disabled={isLoading}>
              {isLoading ? (<Icons.loader />) : null}
              {t('form.submit')}
            </Button>
            <p className="px-8 text-center text-sm text-muted-foreground">
              {t('return_to_login')}{' '}
              <Button variant={'link'} className='inline p-0 text-accent-yellow' asChild>
                <Link
                  href={{
                    pathname: '/auth/login',
                    query: redirectTo ? { redirect: redirectTo } : undefined,
                  }}
                >
                  {upperFirst(common('messages.login'))}
                </Link>

              </Button>
            </p>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}