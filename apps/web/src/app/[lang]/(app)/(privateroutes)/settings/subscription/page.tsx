'use client';

import Loader from '@/components/Loader';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/context/auth-context';
import { Sparkles } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import { Link } from "@/lib/i18n/navigation";
import { useMemo } from 'react';
import { upperFirst } from 'lodash';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Icons } from '@/config/icons';

export default function SettingsAccountPage() {
  const { customerInfo } = useAuth();
  const t = useTranslations();
  const formatter = useFormatter();

  const activeSubscriptions = useMemo(() => {
    return Object.values(customerInfo?.entitlements.active || {});
  }, [customerInfo]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">{t('pages.settings.subscription.label')}</h3>
      </div>
      <Separator />
      {!customerInfo ? (
        <Loader />
      ) : (
        <div className="flex flex-col gap-2">
          {activeSubscriptions.length > 0 ? (
            <>
              {activeSubscriptions.map((subscription) => (
                <Card key={subscription.identifier} className='w-full'>
                  <CardHeader>
                    <CardTitle>
                      {upperFirst(subscription.identifier)}
                    </CardTitle>
                    <CardDescription>

                    </CardDescription>
                    
                  </CardHeader>
                  <CardContent className='text-muted-foreground'>
                    <p>
                      {
                        subscription.store === 'rc_billing'
                          ? 'Web'
                          : subscription.store === 'app_store'
                          ? 'iOS'
                          : subscription.store === 'play_store'
                          ? 'Android'
                          : subscription.store
                      }
                    </p>
                    <p>
                      {upperFirst(t('common.messages.started_on_date', { date: formatter.dateTime(new Date(subscription.originalPurchaseDate), { dateStyle: 'long' }) }))}
                    </p>
                    <p>
                      {upperFirst(t('common.messages.last_renewed_on_date', { date: formatter.dateTime(new Date(subscription.latestPurchaseDate), { dateStyle: 'long' }) }))}
                    </p>
                  </CardContent>
                </Card>  
              ))}
              <Button
              variant={'outline'}
              disabled={!customerInfo.managementURL}
              asChild
              >
                {customerInfo.managementURL ? (
                  <Link href={customerInfo.managementURL}>
                    {upperFirst(t('common.messages.manage_subscription'))}
                  </Link>
                ) : (
                  <Icons.loader />
                )}
              </Button>
            </>
          ) : (
            <>
              <p className="text-muted-foreground pb-4 sm:pb-0">
                {upperFirst(t('common.messages.no_active_subscription'))}
              </p>
              <Button asChild>
                <Link href={'/upgrade'}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  <span>{upperFirst(t('common.messages.upgrade'))}</span>
                </Link>
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
