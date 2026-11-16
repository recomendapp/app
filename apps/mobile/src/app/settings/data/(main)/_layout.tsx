import { MaterialTopTabBarProps, TopTabs } from 'expo-router/js-top-tabs';
import { Stack, usePathname, useRouter } from 'expo-router';
import { upperFirst } from 'lodash';
import { useTranslations } from 'use-intl';
import { SegmentedControlTabBar } from '../../../../components/ui/segmented-control-tabbar';
import { Button } from '../../../../components/ui/Button';
import { Icons } from '../../../../constants/Icons';
import tw from '../../../../lib/tw';
import { useMemo } from 'react';

export const unstable_settings = {
  anchor: 'imports',
};

const SettingsDataLayout = ({ segment }: { segment: string }) => {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const routeName = useMemo(() => {
    const match = pathname.match(/\/settings\/data\/([^/]+)/);
    switch (match?.[1]) {
      case 'exports':
        return 'exports';
      case 'imports':
      default:
        return 'imports';
    }
  }, [pathname]);
  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () =>
            routeName === 'imports' ? (
              <Button
                variant="ghost"
                size="icon"
                icon={Icons.Add}
                onPress={() => router.push({ pathname: '/settings/data/import/add' })}
                style={tw`rounded-full`}
              />
            ) : null,
          unstable_headerRightItems: () =>
            routeName === 'imports'
              ? [
                  {
                    type: 'button',
                    label: upperFirst(t('common.messages.add')),
                    onPress: () => router.push({ pathname: '/settings/data/import/add' }),
                    icon: {
                      name: 'plus',
                      type: 'sfSymbol',
                    },
                  },
                ]
              : [],
        }}
      />
      <TopTabs tabBar={(props: MaterialTopTabBarProps) => <SegmentedControlTabBar {...props} />}>
        <TopTabs.Screen
          name="imports"
          options={{ title: upperFirst(t('pages.settings.data.importer.label')) }}
        />
        <TopTabs.Screen
          name="exports"
          options={{ title: upperFirst(t('pages.settings.data.exporter.label')) }}
        />
      </TopTabs>
    </>
  );
};

export default SettingsDataLayout;
