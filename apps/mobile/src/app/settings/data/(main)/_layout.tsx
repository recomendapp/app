import {
  createMaterialTopTabNavigator,
  MaterialTopTabBarProps,
  MaterialTopTabNavigationEventMap,
  MaterialTopTabNavigationOptions,
} from 'expo-router/js-top-tabs';
import { ParamListBase, TabNavigationState } from 'expo-router/react-navigation';
import { Stack, usePathname, useRouter, withLayoutContext } from 'expo-router';
import { upperFirst } from 'lodash';
import { useTranslations } from 'use-intl';
import { SegmentedControlTabBar } from '../../../../components/ui/segmented-control-tabbar';
import { Button } from '../../../../components/ui/Button';
import { Icons } from '../../../../constants/Icons';
import tw from '../../../../lib/tw';
import { useMemo } from 'react';

const Tab = createMaterialTopTabNavigator();

const MaterialTopTabs = withLayoutContext<
  MaterialTopTabNavigationOptions,
  typeof Tab.Navigator,
  TabNavigationState<ParamListBase>,
  MaterialTopTabNavigationEventMap
>(Tab.Navigator);

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
      <MaterialTopTabs
        initialRouteName="imports"
        tabBar={(props: MaterialTopTabBarProps) => <SegmentedControlTabBar {...props} />}
      >
        <MaterialTopTabs.Screen
          name="imports"
          options={{ title: upperFirst(t('pages.settings.data.importer.label')) }}
        />
        <MaterialTopTabs.Screen
          name="exports"
          options={{ title: upperFirst(t('pages.settings.data.exporter.label')) }}
        />
      </MaterialTopTabs>
    </>
  );
};

export default SettingsDataLayout;
