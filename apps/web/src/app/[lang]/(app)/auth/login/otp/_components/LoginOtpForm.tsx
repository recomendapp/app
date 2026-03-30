'use client';

import { Icons } from '@/config/icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import toast from 'react-hot-toast';
import * as z from 'zod';
import { useCallback, useState } from 'react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { ArrowLeftIcon } from 'lucide-react';
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/lib/i18n/navigation';
import { upperFirst } from 'lodash';
import { authClient } from '@/lib/auth/client';

export function LoginOtpForm({
  className,
  redirectTo,
  ...props
} : React.HTMLAttributes<HTMLDivElement> & { redirectTo: string | null }) {
  const t = useTranslations('pages.auth.login');
  const common = useTranslations('common');
  const router = useRouter();
  const [email, setEmail] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  // OTP
  const numberOfDigits = 6;
  const [showOtp, setShowOtp] = useState<boolean>(false);

  const emailSchema = z
    .email({
      message: common('form.email.error.invalid'),
    });

  const handleSubmit = useCallback(async (event?: React.SyntheticEvent) => {
    event?.preventDefault();
    try {
      setIsLoading(true);
      emailSchema.parse(email);
      const { error } = await authClient.emailOtp.sendVerificationOtp({
        email,
        type: 'sign-in',
      });
      if (error) {
        switch (error.status) {
          default:
            toast.error(upperFirst(common('messages.an_error_occurred')));
        }
        return;
      }
      setShowOtp(true);
    } finally {
      setIsLoading(false);
    }
  }, [email, emailSchema, common, t]);

  const handleVerifyOtp = useCallback(async (otp: string) => {
    try {
      setIsLoading(true);
      const { error } = await authClient.signIn.emailOtp({
        email,
        otp,
      });
      if (error) {
        switch (error.code) {
          case 'INVALID_OTP':
            toast.error(common('form.error.invalid_code'));
            break;
          default:
            toast.error(upperFirst(common('messages.an_error_occurred')));
        }
        return;
      }
      toast.success(t('otp.form.success'));
      router.push(redirectTo || '/');
      router.refresh();
    } finally {
      setIsLoading(false);
    }
  }, [email, common, t, router, redirectTo]);

  if (showOtp) return (
    <>
      <CardHeader className='p-0'>
        <CardTitle className='flex items-center gap-2'>
          <Button variant={"ghost"} onClick={() => setShowOtp(false)}>
            <ArrowLeftIcon className='w-6' />
          </Button>
          {t('otp.confirm_form.label')}
        </CardTitle>
        <CardDescription>
          {t('otp.confirm_form.description', { email: email })}
        </CardDescription>
      </CardHeader>
      <CardContent className='p-0 grid gap-2 justify-items-center'>
        <InputOTP disabled={isLoading} maxLength={numberOfDigits} onChange={(e) => e.length === numberOfDigits && handleVerifyOtp(e)}>
          <InputOTPGroup>
            {Array.from({ length: numberOfDigits }).map((_, index) => (
              <InputOTPSlot key={index} index={index}/>
            ))}
          </InputOTPGroup>
        </InputOTP>
        <p className="px-8 text-center text-sm text-muted-foreground">
          {common('form.error.not_received_code')}{' '}
          <Button variant={"link"} className='p-0' onClick={() => handleSubmit()} disabled={isLoading}>
            {common('form.resend_code')}
          </Button>
        </p>
      </CardContent>
    </>
  )

  return (
    <form onSubmit={handleSubmit}>
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
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <Button disabled={isLoading}>
          {isLoading ? (<Icons.loader />) : null}
          {t('otp.form.submit')}
        </Button>
      </div>
    </form>
  );
}
