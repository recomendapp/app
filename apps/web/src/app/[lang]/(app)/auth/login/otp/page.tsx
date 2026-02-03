"use client";

import { Icons } from '@/config/icons';
import { Images } from '@/config/images';
import { Link } from "@/lib/i18n/navigation";
import { useSearchParams } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from '@/components/ui/button';
import { useRandomImage } from '@/hooks/use-random-image';
import { LoginOtpForm } from './_components/LoginOtpForm';
import { useTranslations } from 'next-intl';
import { upperFirst } from 'lodash';

export default function Login() {
  const t = useTranslations();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('pages.auth.login.redirect');
  const bgImage = useRandomImage(Images.auth.login.background);

  return (
    <div
      className="h-full w-full flex flex-col items-center justify-center"
      style={{
        backgroundImage: `url(${bgImage?.src})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <Card className="@container w-full max-w-[400px]">
        <CardHeader className='gap-2'>
          <CardTitle className='inline-flex gap-2 items-center justify-center'>
            <Icons.site.icon className='fill-accent-yellow w-8' />
            {t('pages.auth.login.label')}
          </CardTitle>
          <CardDescription className='text-center'>{t('pages.auth.login.description')}</CardDescription>
        </CardHeader>
        <CardContent className='grid gap-4'>
          <LoginOtpForm redirectTo={redirectTo} />
        </CardContent>
        <CardFooter>
          <p className="px-8 text-center text-sm text-muted-foreground">
            {t('pages.auth.login.otp.password_login')}{' '}
            <Button variant={'link'} className='inline p-0 text-accent-yellow' asChild>
              <Link href={{ pathname: '/auth/login', query: redirectTo ? { redirect: redirectTo } : undefined }}>
                {upperFirst(t('common.messages.click_here'))}
              </Link>
            </Button>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
