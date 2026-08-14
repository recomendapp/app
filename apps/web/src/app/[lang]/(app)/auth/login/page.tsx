'use client';

import { LoginForm } from './_components/LoginForm';
import { Icons } from '@/config/icons';
import { Images } from '@/config/images';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useRandomImage } from '@/hooks/use-random-image';
import { useTranslations } from 'next-intl';

export default function Login() {
  const t = useTranslations('pages.auth.login');
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect');
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
        <CardHeader className="gap-2">
          <CardTitle className="inline-flex gap-2 items-center justify-center">
            <Icons.site.icon className="fill-accent-yellow w-8" />
            {t('label')}
          </CardTitle>
          <CardDescription className="text-center">{t('description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm redirectTo={redirectTo} />
        </CardContent>
      </Card>
    </div>
  );
}
