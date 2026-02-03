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
import toast from 'react-hot-toast';
import { useNotifications } from '@/context/notifications-context';
import { Switch } from '@/components/ui/switch';
import { useTranslations } from 'next-intl';
import { upperFirst } from 'lodash';

export function NotificationsForm() {
	const { permission } = useNotifications();
  const t = useTranslations('pages.settings');
  const common = useTranslations('common');
	const notificationsFormSchema = z.object({
		pushNotifications: z.boolean(),
	});

	type NotificationsFormValues = z.infer<typeof notificationsFormSchema>;

	const defaultValues: Partial<NotificationsFormValues> = {
		pushNotifications: permission.permission === 'granted',
	};

  const form = useForm<NotificationsFormValues>({
    resolver: zodResolver(notificationsFormSchema),
    defaultValues,
    mode: 'onChange',
  });

  async function onSubmit(data: NotificationsFormValues) {
    try {
      // updat permission
      data.pushNotifications ?
        await permission.enableNotifications() :
        permission.disableNotifications();
		  toast.success(upperFirst(common('messages.saved', { gender: 'male', count: 1 })));
    } catch (error) {
    	toast.error(upperFirst(common('messages.an_error_occurred')));
      form.reset();
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <h2>{t('notifications.push_notifications.label')}</h2>
		    {permission.permission === 'default' ? (
          <FormField
            control={form.control}
            name="pushNotifications"
            render={({ field }) => (
              <FormItem className='space-y-0 flex flex-row items-center gap-2'>
                <FormLabel>{t('notifications.push_notifications.form.enable')}</FormLabel>
                <FormControl>
                  <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormDescription></FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : (
          <p className='text-muted-foreground'>{t('notifications.push_notifications.already_granted')}</p>
        )}
        <Button
        type="submit"
        disabled={form.formState.isSubmitting || (permission.permission === 'granted' || permission.permission === 'denied')}
        >
          {upperFirst(common('messages.save'))}
        </Button>
      </form>
    </Form>
  );
}
