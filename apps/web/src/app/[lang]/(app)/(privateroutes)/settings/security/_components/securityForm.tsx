'use client';

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
import { useSupabaseClient } from '@/context/supabase-context';
import { useTranslations } from 'next-intl';
import { upperFirst } from 'lodash';

export function SecurityForm() {
  const supabase = useSupabaseClient();
  const t = useTranslations('pages.settings');
  const common = useTranslations('common');
  const profileFormSchema = z.object({
    newpassword: z
      .string()
      .min(8, {
        message: t('security.new_password.form.min_length'),
      })
      .regex(/[A-Z]/, {
        message: t('security.new_password.form.uppercase'),
      })
      .regex(/[a-z]/, {
        message: t('security.new_password.form.lowercase'),
      })
      .regex(/[0-9]/, {
        message: t('security.new_password.form.number'),
      })
      .regex(/[\W_]/, {
        message: t('security.new_password.form.special'),
      }),
    confirmnewpassword: z.string(),
  }).refine((data) => data.newpassword === data.confirmnewpassword, {
    message: t('security.confirm_password.form.match'),
    path: ['confirmnewpassword'],
  });

  type ProfileFormValues = z.infer<typeof profileFormSchema>;

  const defaultValues: Partial<ProfileFormValues> = {
    newpassword: '',
    confirmnewpassword: '',
  };

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues,
    mode: 'onChange',
  });

  async function onSubmit(data: ProfileFormValues) {
    try {
      const { error } = await supabase.auth.updateUser({
        password: data.newpassword,
      });
      if (error) throw error;
      toast.success(upperFirst(common('messages.saved', { gender: 'male', count: 1 })));
      form.reset();
    } catch (error) {
      toast.error(upperFirst(common('messages.an_error_occurred')));
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="newpassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('security.new_password.label')}</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  autoComplete="new-password"
                  placeholder={t('security.new_password.placeholder')}
                  {...field}
                />
              </FormControl>
              <FormDescription></FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmnewpassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('security.confirm_password.label')}</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  autoComplete="new-password"
                  placeholder={t('security.confirm_password.placeholder')}
                  {...field}
                />
              </FormControl>
              <FormDescription></FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">{upperFirst(common('messages.save'))}</Button>
      </form>
    </Form>
  );
}
