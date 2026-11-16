import { MaterialTopTabBarProps, TopTabs } from 'expo-router/js-top-tabs';
import { upperFirst } from 'lodash';
import { useTranslations } from 'use-intl';
import { SegmentedControlTabBar } from '../../../../components/ui/segmented-control-tabbar';

export const unstable_settings = {
  anchor: 'index',
};

const FeedLayout = () => {
  const t = useTranslations();
  return (
    <TopTabs tabBar={(props: MaterialTopTabBarProps) => <SegmentedControlTabBar {...props} />}>
      <TopTabs.Screen
        name="index"
        options={{ title: upperFirst(t('common.messages.community')) }}
      />
      <TopTabs.Screen
        name="persons"
        options={{ title: upperFirst(t('common.messages.cast_and_crew')) }}
      />
    </TopTabs>
  );
};

export default FeedLayout;
