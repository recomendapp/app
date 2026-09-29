import { useCallback, useMemo } from 'react';
import { Linking } from 'react-native';
import { useTranslations } from 'use-intl';
import { useToast } from '../../components/Toast';
import { useVersionPolicy } from '../../providers/VersionPolicyProvider';
import { MOBILE_APP_STORE_URL } from '../../lib/api/app-version';
import { AppGate } from './types';

const UPDATE_TOAST_DURATION_MS = 10_000;

export const useUpdateAvailableGate = (): AppGate => {
  const t = useTranslations();
  const toast = useToast();
  const { isUpdateAvailable } = useVersionPolicy();

  const present = useCallback(() => {
    const storeUrl = MOBILE_APP_STORE_URL;
    if (!storeUrl) return;
    toast.info(t('common.messages.update_available'), {
      description: t('common.messages.update_available_description'),
      duration: UPDATE_TOAST_DURATION_MS,
      action: {
        label: t('common.messages.update_app'),
        onClick: () => Linking.openURL(storeUrl),
      },
    });
  }, [t, toast]);

  return useMemo(
    () => ({
      id: 'update-available',
      isNeeded: isUpdateAvailable && !!MOBILE_APP_STORE_URL,
      isPresented: false,
      present,
    }),
    [isUpdateAvailable, present],
  );
};
