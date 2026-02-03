'use client';

import { Icons } from '@/config/icons';
import { Images } from '@/config/images';
import { useRandomImage } from '@/hooks/use-random-image';
import { Link } from "@/lib/i18n/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Alert, AlertTitle } from '@/components/ui/alert';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';

export default function AuthError() {
  const searchParams = useSearchParams();
  const t = useTranslations('pages.auth.error');
  const errorMsg = searchParams.get('error');
  const bgImage = useRandomImage(Images.auth.error.background);
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
      <Card className="w-full max-w-[400px]">
        <CardHeader className='gap-2'>
          <CardTitle className='inline-flex gap-2 items-center justify-center'>
            <Icons.site.icon className='fill-accent-yellow w-8' />
            {t('label')}
          </CardTitle>
          <CardDescription>{t('description')}</CardDescription>
        </CardHeader>
        <CardContent className='grid gap-4'>
          <Alert>
            <AlertTitle className='select-all'>{errorMsg}</AlertTitle>
          </Alert>
        </CardContent>
        <CardFooter>
          <Button className='w-full' asChild>
            <Link href="/auth/login">{t('return_to_login')}</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
