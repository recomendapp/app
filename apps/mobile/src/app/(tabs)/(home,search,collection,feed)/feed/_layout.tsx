import {
  createMaterialTopTabNavigator,
  MaterialTopTabNavigationEventMap,
  MaterialTopTabNavigationOptions,
  type MaterialTopTabBarProps,
} from '@react-navigation/material-top-tabs';
import { ParamListBase, TabNavigationState } from '@react-navigation/native';
import { withLayoutContext } from 'expo-router';
import { upperFirst } from 'lodash';
import { useTranslations } from 'use-intl';
import { SegmentedControlTabBar } from '../../../../components/ui/segmented-control-tabbar';

const Tab = createMaterialTopTabNavigator();

const MaterialTopTabs = withLayoutContext<
  MaterialTopTabNavigationOptions,
  typeof Tab.Navigator,
  TabNavigationState<ParamListBase>,
  MaterialTopTabNavigationEventMap
>(Tab.Navigator);

const FeedLayout = () => {
  const t = useTranslations();
  return (
    <MaterialTopTabs
      initialRouteName="index"
      tabBar={(props) => <SegmentedControlTabBar {...props} />}
    >
      <MaterialTopTabs.Screen
        name="index"
        options={{ title: upperFirst(t('common.messages.community')) }}
      />
      <MaterialTopTabs.Screen
        name="persons"
        options={{ title: upperFirst(t('common.messages.cast_and_crew')) }}
      />
    </MaterialTopTabs>
  );
};

export default FeedLayout;
