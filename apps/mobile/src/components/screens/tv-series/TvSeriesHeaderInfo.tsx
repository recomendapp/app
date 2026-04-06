import { TvSeries } from "@packages/api-js";
import { Text } from "apps/mobile/src/components/ui/text";
import { View } from "apps/mobile/src/components/ui/view";
import tw from "apps/mobile/src/lib/tw";
import { useTheme } from "apps/mobile/src/providers/ThemeProvider";
import { upperFirst } from "lodash";
import { forwardRef, Fragment, ReactNode, useMemo } from "react";
import { ViewProps } from "react-native";
import { useTranslations } from "use-intl";

type TvSeriesHeaderInfoProps = Omit<ViewProps, 'children'> & {
  tvSeries: TvSeries;
};

export const TvSeriesHeaderInfo = forwardRef<
  React.ComponentRef<typeof View>,
  TvSeriesHeaderInfoProps
>(({ tvSeries, style, ...props }, ref) => {
  const t = useTranslations();
  const { colors } = useTheme();
  
  const items = useMemo((): (string | ReactNode)[] => {
    const result: (string | ReactNode)[] = [];
    // Date
    if (tvSeries.firstAirDate) {
      result.push(new Date(tvSeries.firstAirDate).getFullYear());
    }
    // Genres
    if (tvSeries.genres?.length) {
      result.push(tvSeries.genres.at(0)!.name);
    }

    if (tvSeries.numberOfSeasons) {
      result.push(upperFirst(t("common.messages.tv_season_count", { count: tvSeries.numberOfSeasons })));
    }

    if (tvSeries.numberOfEpisodes) {
      result.push(upperFirst(t("common.messages.tv_episode_count", { count: tvSeries.numberOfEpisodes })));
    }
    return result;
  }, [tvSeries, t]);

  return (
    <View ref={ref} style={[tw`flex-row flex-wrap items-center justify-center`, style]} {...props}>
      <Text style={[tw`mr-1`, { color: colors.accentYellow }]}>
        {upperFirst(t("common.messages.film", { count: 1 }))}
      </Text>
      {items.length > 0 && <Text style={{ color: colors.mutedForeground }}> • </Text>}
      {items.map((item, i) => (
        <Fragment key={i}>
          {i > 0 && <Text style={{ color: colors.mutedForeground }}> • </Text>}
          <Text style={{ color: colors.mutedForeground }}>
            {item}
          </Text>
        </Fragment>
      ))}
    </View>
  );
});
TvSeriesHeaderInfo.displayName = "TvSeriesHeaderInfo";