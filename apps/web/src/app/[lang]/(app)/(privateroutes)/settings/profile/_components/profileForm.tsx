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
import { Textarea } from '@/components/ui/textarea';
import toast from 'react-hot-toast';
import PictureUpload from './pictureUpload';
import { useAuth } from '@/context/auth-context';
import { Icons } from '@/config/icons';
import { useCallback, useEffect, useState } from 'react';
import Loader from '@/components/Loader';
import { useTranslations } from 'next-intl';
import { upperFirst } from 'lodash';
import { useUserUpdateMutation } from '@/api/client/mutations/userMutations';

export function ProfileForm() {
  const t = useTranslations();
  const { user } = useAuth();

  const { mutateAsync: updateProfile, isPending: isUpdating } = useUserUpdateMutation();

  const [newAvatar, setNewAvatar] = useState<File>();

  const profileFormSchema = z.object({
    full_name: z
      .string()
      .min(1, {
        message: t('pages.settings.profile.full_name.form.min_length'),
      })
      .max(30, {
        message: t('pages.settings.profile.full_name.form.max_length'),
      })
      .regex(/^(?!\s+$)[a-zA-Z0-9\s\S]*$/),
    bio: z
      .string()
      .max(150, {
        message: t('pages.settings.profile.bio.form.max_length'),
      })
      .optional(),
    website: z
      .string()
      .url({
        message: t('pages.settings.profile.url.form.invalid'),
      })
      .or(z.literal(''))
      .optional(),
  });

  type ProfileFormValues = z.infer<typeof profileFormSchema>;

  const defaultValues: Partial<ProfileFormValues> = {
    full_name: user?.full_name,
    bio: user?.bio ?? undefined,
    website: user?.website ?? undefined,
  };

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues,
    mode: 'onChange',
  });

  const handleSubmit = useCallback(async (data: ProfileFormValues) => {
    if (!user) return;
    if (!newAvatar && user.full_name === data.full_name && user.bio === data.bio && user.website === data.website) return;
    await updateProfile({
      full_name: data.full_name,
      bio: data.bio?.trim() || null,
      website: data.website?.trim() || null,
      avatar: newAvatar,
    }, {
      onSuccess: () => {
        toast.success(upperFirst(t('common.messages.saved', { gender: 'male', count: 1 })));
      },
      onError: () => {
        toast.error(upperFirst(t('common.messages.an_error_occurred')));
      },
    });
  }, [newAvatar, t, updateProfile, user]);

  const handleDeleteAvatar = useCallback(async () => {
    await updateProfile({
      avatar: null,
    }, {
      onSuccess: () => {
        toast.success(upperFirst(t('common.messages.saved', { gender: 'male', count: 1 })));
      },
      onError: () => {
        toast.error(upperFirst(t('common.messages.an_error_occurred')));
      },
    });
  }, [updateProfile, t]);

  useEffect(() => {
    if (user)
    {
      form.setValue('full_name', user.full_name);
      form.setValue('bio', user?.bio ?? undefined);
      form.setValue('website', user?.website ?? undefined);
    }
  }, [form, user]);

  if (!user) return <Loader />;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <div className="flex gap-4 items-center">
          <PictureUpload
            user={user}
            isUploading={isUpdating}
            newAvatar={newAvatar}
            setNewAvatar={setNewAvatar}
          />
          {user.avatar_url && (
            <Button type='button' variant={'destructive'} onClick={handleDeleteAvatar}>
              {t('pages.settings.profile.avatar.delete')}
            </Button>
          )}
        </div>
        <FormField
          control={form.control}
          name="full_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex justify-between gap-4">
                <p>{t('pages.settings.profile.full_name.label')}</p>
                <p className="text-muted-foreground">{field?.value?.length ?? 0} / 50</p>
              </FormLabel>
              <FormControl>
                <Input placeholder={t('pages.settings.profile.full_name.placeholder')} {...field} />
              </FormControl>
              <FormDescription className="text-justify">
                {t('pages.settings.profile.full_name.description')}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex justify-between gap-4">
                <p>{t('pages.settings.profile.bio.label')}</p>
                <p className="text-muted-foreground">{field?.value?.length ?? 0} / 150</p>
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t('pages.settings.profile.bio.placeholder')}
                  className="resize-none h-32"
                  {...field}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={'website'}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('pages.settings.profile.url.label')}</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  placeholder="https://examples.com"
                  {...field}
                />
              </FormControl>

              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isUpdating}>
          {isUpdating && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
          {upperFirst(t('common.messages.save'))}
        </Button>
      </form>
    </Form>
  );
}
