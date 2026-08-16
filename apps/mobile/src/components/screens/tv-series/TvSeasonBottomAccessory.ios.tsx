import { useCallback } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useQuery } from '@tanstack/react-query';
import { Host, HStack, Button, Image, Text } from '@expo/ui/swift-ui';
import {
  buttonStyle,
  frame,
  padding,
  foregroundStyle,
  background,
  strokeBorder,
  bold,
  shapes,
} from '@expo/ui/swift-ui/modifiers';
import { TvSeasonCompact } from '@libs/api-js';
import { tvSeasonLogOptions } from '@libs/query-client';
import { useAuth } from '../../../providers/AuthProvider';
import { useTheme } from '../../../providers/ThemeProvider';

interface TvSeasonBottomAccessoryProps {
  tvSeason: TvSeasonCompact;
}

/**
 * Native SwiftUI variant, only rendered when Liquid Glass is available (see (tabs)/_layout.tsx
 * + useBottomAccessoryStore). Only ever mounted inside <NativeTabs.BottomAccessory> —
 * usePlacement() requires that context. Mirrors TvSeriesBottomAccessory.ios.tsx, minus the
 * bookmark/playlist/reco buttons and the heart badge — seasons have none of those.
 */
export const TvSeasonBottomAccessory = ({ tvSeason }: TvSeasonBottomAccessoryProps) => {
  NativeTabs.BottomAccessory.usePlacement();
  const { user } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();

  const { data: log } = useQuery(
    tvSeasonLogOptions({
      userId: user?.id,
      tvSeriesId: tvSeason.tvSeriesId,
      seasonNumber: tvSeason.seasonNumber,
    }),
  );

  const handleOpenLogPress = useCallback(() => {
    router.push({
      pathname: '/tv-series/[tv_series_id]/season/[season_number]/log',
      params: { tv_series_id: tvSeason.tvSeriesId, season_number: tvSeason.seasonNumber },
    });
  }, [tvSeason, router]);

  return (
    <View style={{ flex: 1, width: '100%', justifyContent: 'center' }}>
      <Host matchContents={{ vertical: true }} style={{ width: '100%' }}>
        <HStack
          spacing={8}
          alignment="center"
          modifiers={[
            frame({ maxWidth: Infinity, alignment: 'center' }),
            padding({ horizontal: 16, vertical: 6 }),
          ]}
        >
          <Button
            onPress={handleOpenLogPress}
            modifiers={
              log?.rating
                ? [
                    buttonStyle('plain'),
                    padding({ horizontal: 10, vertical: 6 }),
                    background(
                      colors.accentYellowForeground,
                      shapes.roundedRectangle({ cornerRadius: 8 }),
                    ),
                    strokeBorder({
                      color: colors.accentYellow,
                      shape: 'roundedRectangle',
                      cornerRadius: 8,
                    }),
                    frame({ minWidth: 40, minHeight: 32, alignment: 'center' }),
                  ]
                : [buttonStyle('glass')]
            }
          >
            {log?.rating ? (
              <Text modifiers={[bold(), foregroundStyle(colors.accentYellow)]}>
                {String(log.rating)}
              </Text>
            ) : log?.status === 'watching' ? (
              <Image systemName="clock.fill" color={colors.accentOrange} />
            ) : (
              <Image
                systemName={log ? 'checkmark.circle.fill' : 'checkmark.circle'}
                color={log ? colors.accentBlue : undefined}
              />
            )}
          </Button>
        </HStack>
      </Host>
    </View>
  );
};
