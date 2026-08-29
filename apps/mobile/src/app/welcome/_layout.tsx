import { createContext, useCallback, useContext, useEffect, useRef } from 'react';
import { Stack } from 'expo-router';
import { useMeUpdateMutation } from '@libs/query-client';
import { useTheme } from '../../providers/ThemeProvider';
import { useTranslations } from 'use-intl';

interface WelcomeContextValue {
  finish: () => void;
}

const WelcomeContext = createContext<WelcomeContextValue | undefined>(undefined);

export const useWelcomeFinish = () => {
  const context = useContext(WelcomeContext);
  if (!context) throw new Error('useWelcomeFinish must be used within the /welcome stack');
  return context.finish;
};

const WelcomeLayout = () => {
  const t = useTranslations();
  const { defaultScreenOptions } = useTheme();
  const { mutate: updateMe } = useMeUpdateMutation();
  const hasFinishedRef = useRef(false);

  const finish = useCallback(() => {
    if (hasFinishedRef.current) return;
    hasFinishedRef.current = true;
    updateMe({ body: { welcomed: true } });
  }, [updateMe]);

  useEffect(() => () => finish(), [finish]);

  return (
    <WelcomeContext.Provider value={{ finish }}>
      <Stack screenOptions={defaultScreenOptions}>
        <Stack.Screen
          name="index"
          options={{
            title: t('common.messages.welcome'),
          }}
        />
        <Stack.Screen
          name="follow"
          options={{
            title: t('pages.welcome.follow.title'),
          }}
        />
        <Stack.Screen
          name="import"
          options={{
            title: t('common.messages.import'),
          }}
        />
      </Stack>
    </WelcomeContext.Provider>
  );
};

export default WelcomeLayout;
