'use client'

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/auth-context';
import { Icons } from '@/config/icons';
import { useCallback, useEffect } from 'react';
import Loader from '@/components/Loader';
import { Switch } from '@/components/ui/switch';
import { useTranslations } from 'next-intl';
import { useUsernameAvailability } from '@/hooks/use-username-availability';
import useDebounce from '@/hooks/use-debounce';
import { upperFirst } from 'lodash';
import { useUserUpdateMutation } from '@/api/client/mutations/userMutations';

const USERNAME_MIN_LENGTH = 3;
const USERNAME_MAX_LENGTH = 15;

export function AccountForm() {
  const t = useTranslations();
  const { user, session } = useAuth();
  const { mutateAsync: updateProfile, isPending } = useUserUpdateMutation();

  const date = new Date();

  const dateLastUsernameUpdate = user?.username_updated_at
    ? new Date(user.username_updated_at)
    : new Date('01/01/1970');

  const accountFormSchema = z.object({
    username: z
      .string()
      .min(USERNAME_MIN_LENGTH, {
        message: t('common.form.length.char_min', { count: USERNAME_MIN_LENGTH }),
      })
      .max(USERNAME_MAX_LENGTH, {
        message: t('common.form.length.char_max', { count: USERNAME_MAX_LENGTH }),
      })
      .regex(/^[^\W]/, {
        message: t('common.form.username.schema.first_char'),
      })
      .regex(/^(?!.*\.\.)/, {
        message: t('common.form.username.schema.double_dot'),
      })
      .regex(/^(?!.*\.$)/, {
        message: t('common.form.username.schema.ends_with_dot'),
      })
      .regex(/^[\w.]+$/, {
        message: t('common.form.username.schema.format'),
      }),
    private: z.boolean(),
    email: z.string()
      .email({
        message: t('common.form.email.error.invalid'),
      })
  });

  type AccountFormValues = z.infer<typeof accountFormSchema>;

  const defaultValues: Partial<AccountFormValues> = {
    username: user?.username,
    private: user?.private,
    email: session?.user.email,
  };

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    defaultValues,
    mode: 'onChange',
  });
  const usernameAvailability = useUsernameAvailability();
  const usernameToCheck = useDebounce(form.watch('username'), 500);

  const handleSubmit = useCallback(async (data: AccountFormValues) => {
    await updateProfile({
      username: data.username,
      private: data.private,
    }, {
      onSuccess: () => {
        toast.success(upperFirst(t('common.messages.saved', { gender: 'male', count: 1 })));
      },
      onError: () => {
        toast.error(upperFirst(t('common.messages.an_error_occurred')));
      },
    });
  }, [t, updateProfile]);

  useEffect(() => {
    user &&
      form.reset({
        username: user.username,
        private: user.private,
        email: session?.user.email,
      });
  }, [form, session?.user.email, user]);

  useEffect(() => {
		if (!form.formState.errors.username?.message && usernameToCheck && usernameToCheck !== user?.username) {
			usernameAvailability.check(usernameToCheck);
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [usernameToCheck]);

	useEffect(() => {
		if (usernameAvailability.isAvailable === false) {
			form.setError('username', {
				message: t('common.form.username.schema.unavailable'),
			});
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [usernameAvailability.isAvailable, t]);

  if (!user) return <Loader />;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex justify-between gap-4">
                <p>{t('pages.settings.account.username.label')}</p>
                <p className="">{field?.value?.length ?? 0} / 15</p>
              </FormLabel>
              <FormControl>
                <Input
                  disabled={
                    (date.getTime() - dateLastUsernameUpdate.getTime()) /
                      (1000 * 60 * 60 * 24) <
                    30
                      ? true
                      : false
                  }
                  placeholder={t('pages.settings.account.username.placeholder')}
                  {...field}
                />
              </FormControl>
              <FormDescription className="text-justify">{t('pages.settings.account.username.description')}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="private"
          render={({ field }) => (
            <FormItem className='flex items-center gap-2'>
              <FormLabel>{t('pages.settings.account.private.label')}</FormLabel>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              {/* <FormDescription className="text-justify">{t('pages.settings.account.private.description')}</FormDescription> */}
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('common.form.email.label')}</FormLabel>
              <FormControl>
                <Input placeholder={t('common.form.email.placeholder')} {...field} disabled />
              </FormControl>
              <FormDescription className="flex flex-col md:flex-row w-full justify-between gap-4">{t('pages.settings.account.email.description')}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isPending}>
          {isPending && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
          {upperFirst(t('common.messages.save'))}
        </Button>
      </form>
    </Form>
  );
}