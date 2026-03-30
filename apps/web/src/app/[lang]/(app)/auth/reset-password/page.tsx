'use client';

import { Icons } from '@/config/icons';
import { Images } from '@/config/images';

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useCallback, useState } from 'react';
import * as z from 'zod';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { useRandomImage } from '@/hooks/use-random-image';
import { Link, useRouter } from "@/lib/i18n/navigation";
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { upperFirst } from 'lodash';
import { authClient } from '@/lib/auth/client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { InputPassword } from '@/components/ui/input-password';

const PASSWORD_MIN_LENGTH = 8;

export default function ResetPassword() {
  const t = useTranslations('pages.auth.reset_password');
  const common = useTranslations('common');
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const redirectTo = searchParams.get('redirect');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const bgImage = useRandomImage(Images.auth.forgotPassword.background);

  const resetPasswordSchema = z.object({
    password: z
      .string()
      .min(PASSWORD_MIN_LENGTH, {
        message: common('form.length.char_min', { count: PASSWORD_MIN_LENGTH }),
      })
      .regex(/[A-Z]/, {
        message: common('form.password.schema.uppercase'),
      })
      .regex(/[a-z]/, {
        message: common('form.password.schema.lowercase'),
      })
      .regex(/[0-9]/, {
        message: common('form.password.schema.number'),
      })
      .regex(/[\W_]/, {
        message: common('form.password.schema.special'),
      }),
    confirm_password: z
      .string()
  }).refine(data => data.password === data.confirm_password, {
    message: common('form.password.schema.match'),
    path: ['confirm_password'],
  });
  type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
  const defaultValues: Partial<ResetPasswordFormValues> = {
		password: '',
		confirm_password: '',
	};
  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    mode: 'onChange',
    defaultValues,
  });

  const handleSubmit = useCallback(async (data: ResetPasswordFormValues) => {
    if (!token) {
      toast.error(common('messages.invalid_token'));
      return;
    }
    try {
      setIsLoading(true);
      const { error } = await authClient.resetPassword({
        newPassword: data.password,
        token,
      });
      if (error) {
        switch (error.code) {
          case 'INVALID_TOKEN':
            toast.error(common('messages.invalid_code'));
            break;
          default:
            toast.error(upperFirst(common('messages.an_error_occurred')));
        }
        return;
      }
      toast.success(common('messages.password_reset'));
      router.push(redirectTo || '/auth/login');
    } finally {
      setIsLoading(false);
    }
  }, [common, t]);

  if (!token) {
    throw new Error(common('messages.no_token_found'));
  } 

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
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <Card className="w-full max-w-[400px]">
            <CardHeader className='gap-2'>
              <CardTitle className='inline-flex gap-2 items-center justify-center'>
                <Icons.site.icon className='fill-accent-yellow w-8' />
                {common('messages.reset_password')}
              </CardTitle>
            </CardHeader>
            <CardContent className='grid gap-2'>
                <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{common('form.password.label')}</FormLabel>
                    <FormControl>
                      <InputPassword
                      disabled={isLoading}
                      type="password"
                      autoComplete="new-password"
                      placeholder={common('form.password.placeholder')}
                      {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="confirm_password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{common('form.password.confirm.label')}</FormLabel>
                    <FormControl>
                      <InputPassword
                      disabled={isLoading}
                      type="password"
                      autoComplete="new-password"
                      placeholder={common('form.password.confirm.placeholder')}
                      {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
                />
            </CardContent>
            <CardFooter className='grid gap-2'>
              <Button className="w-full" disabled={isLoading}>
                {isLoading ? (<Icons.loader />) : null}
                {upperFirst(common('messages.save'))}
              </Button>
              <p className="px-8 text-center text-sm text-muted-foreground">
                {common('messages.return_to_login')}{' '}
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
      </Form>
    </div>
  );
}