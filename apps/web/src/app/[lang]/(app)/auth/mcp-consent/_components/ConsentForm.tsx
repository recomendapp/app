'use client';

import { useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { z } from 'zod';
import { authClient } from '@/lib/auth/client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@libs/ui/components/button';
import { Skeleton } from '@libs/ui/components/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@libs/ui/components/alert';
import { Badge } from '@libs/ui/components/badge';
import { CircleAlertIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

const consentQuerySchema = z.object({
  client_id: z.string().min(1),
  scope: z.string().min(1),
});

const publicClientSchema = z.object({
  client_id: z.string(),
  client_name: z.string().optional(),
  client_uri: z.string().optional(),
  logo_uri: z.string().optional(),
});

export function ConsentForm() {
  const t = useTranslations('pages.auth.mcp_consent');
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState<'accept' | 'deny' | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const parsedQuery = useMemo(
    () => consentQuerySchema.safeParse(Object.fromEntries(searchParams.entries())),
    [searchParams],
  );

  const scopes = useMemo(
    () => (parsedQuery.success ? parsedQuery.data.scope.split(' ').filter(Boolean) : []),
    [parsedQuery],
  );

  const clientQuery = useQuery({
    queryKey: ['oauth2-public-client', parsedQuery.success ? parsedQuery.data.client_id : null],
    enabled: parsedQuery.success,
    queryFn: async () => {
      if (!parsedQuery.success) throw new Error('invalid query');
      const { data, error } = await authClient.$fetch('/oauth2/public-client', {
        method: 'GET',
        query: { client_id: parsedQuery.data.client_id },
      });
      if (error) throw error;
      const result = publicClientSchema.safeParse(data);
      if (!result.success) throw new Error('invalid client response');
      return result.data;
    },
  });

  const handleSubmit = useCallback(
    async (accept: boolean) => {
      setSubmitError(null);
      setIsSubmitting(accept ? 'accept' : 'deny');
      try {
        // No `oauth_query` here on purpose: oauthProviderClient()'s fetch
        // plugin auto-attaches the current page's signed query to any
        // non-GET/DELETE request that doesn't already set one. Setting it
        // ourselves (e.g. from useSearchParams().toString()) skips that
        // auto-attach and sends an unsigned value instead, which the API
        // rejects with `invalid_signature`.
        const { data, error } = await authClient.$fetch<{ redirect_uri: string }>(
          '/oauth2/consent',
          {
            method: 'POST',
            body: { accept },
          },
        );
        if (error || !data?.redirect_uri) {
          setSubmitError(t('error.submit_failed'));
          return;
        }
        window.location.href = data.redirect_uri;
      } catch {
        setSubmitError(t('error.submit_failed'));
      } finally {
        setIsSubmitting(null);
      }
    },
    [t],
  );

  if (!parsedQuery.success) {
    return (
      <Alert variant="destructive">
        <CircleAlertIcon className="h-4 w-4" />
        <AlertTitle>{t('error.invalid_request')}</AlertTitle>
        <AlertDescription>{t('error.invalid_request_description')}</AlertDescription>
      </Alert>
    );
  }

  if (clientQuery.isPending) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    );
  }

  if (clientQuery.isError) {
    return (
      <Alert variant="destructive">
        <CircleAlertIcon className="h-4 w-4" />
        <AlertTitle>{t('error.client_not_found')}</AlertTitle>
      </Alert>
    );
  }

  const clientName = clientQuery.data.client_name || clientQuery.data.client_id;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-center">{t('description', { client: clientName })}</p>
      {scopes.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-muted-foreground">{t('scopes_label')}</p>
          <div className="flex flex-wrap gap-2">
            {scopes.map((scope) => (
              <Badge key={scope} variant="secondary">
                {scope}
              </Badge>
            ))}
          </div>
        </div>
      )}
      {submitError && (
        <Alert variant="destructive">
          <CircleAlertIcon className="h-4 w-4" />
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          disabled={isSubmitting !== null}
          onClick={() => handleSubmit(false)}
        >
          {t('deny')}
        </Button>
        <Button disabled={isSubmitting !== null} onClick={() => handleSubmit(true)}>
          {t('accept')}
        </Button>
      </div>
    </div>
  );
}
