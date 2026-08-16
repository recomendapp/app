import { useEffect, createElement } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useAuth } from '../../providers/AuthProvider';
import { useTheme } from '../../providers/ThemeProvider';
import { useTranslations } from 'use-intl';
import { upperFirst } from 'lodash';
import { useUIStore } from '../../stores/useUIStore';
import useBottomAccessoryStore from '../../stores/useBottomAccessoryStore';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { isIOS } from '../../platform/detection';

const TabsLayout = () => {
  const { user } = useAuth();
  const { colors, isLiquidGlassAvailable } = useTheme();
  const t = useTranslations();
  const router = useRouter();
  const hasOnboarded = useUIStore((state) => state.hasOnboarded);
  const segment = useSegments();
  const AccessoryComponent = useBottomAccessoryStore((state) => state.Component);
  const accessoryProps = useBottomAccessoryStore((state) => state.props);

  useEffect(() => {
    if (!hasOnboarded && !segment.some((seg) => seg === 'onboarding')) {
      router.replace({ pathname: '/onboarding' });
    }
  }, [hasOnboarded, router, segment]);

  return (
    <NativeTabs
      iconColor={{
        default: colors.foreground,
        selected: isIOS ? colors.primary : colors.foreground,
      }}
      labelStyle={{
        default: {
          color: colors.foreground,
        },
        selected: {
          color: isLiquidGlassAvailable ? colors.primary : colors.foreground,
        },
      }}
      rippleColor={colors.primary}
      backgroundColor={colors.muted}
      indicatorColor={colors.mutedForeground}
      disableTransparentOnScrollEdge
      minimizeBehavior={AccessoryComponent ? 'onScrollDown' : undefined}
    >
      {AccessoryComponent && (
        <NativeTabs.BottomAccessory>
          {createElement(AccessoryComponent, accessoryProps)}
        </NativeTabs.BottomAccessory>
      )}
      <NativeTabs.Trigger name="(home)" disableAutomaticContentInsets>
        <NativeTabs.Trigger.Label hidden>
          {upperFirst(t('common.messages.home'))}
        </NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} md="home" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(search)" disableAutomaticContentInsets>
        <NativeTabs.Trigger.Label hidden>
          {upperFirst(t('common.messages.search'))}
        </NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'magnifyingglass', selected: 'magnifyingglass' }}
          md="search"
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(feed)" disableAutomaticContentInsets hidden={!user}>
        <NativeTabs.Trigger.Label hidden>
          {upperFirst(t('common.messages.feed', { count: 2 }))}
        </NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'bolt', selected: 'bolt.fill' }} md="bolt" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(collection)" disableAutomaticContentInsets hidden={!user}>
        <NativeTabs.Trigger.Label hidden>
          {upperFirst(t('common.messages.library', { count: 2 }))}
        </NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'books.vertical', selected: 'books.vertical.fill' }}
          md="books_movies_and_music"
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger
        name="auth"
        disableAutomaticContentInsets
        hidden={!!user}
        role="search"
        disabled
        listeners={() => ({
          tabPress: () => {
            router.push('/auth');
          },
        })}
      >
        <NativeTabs.Trigger.Label hidden>
          {upperFirst(t('common.messages.login'))}
        </NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'person', selected: 'person.fill' }} md="person" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
};

export default TabsLayout;
