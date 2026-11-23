import tw from '../../../lib/tw';
import { useWindowDimensions, View } from 'react-native';
import { clamp, upperFirst } from 'lodash';
import { useTranslations } from 'use-intl';
import { Text } from '../../ui/text';
import { MultiRowHorizontalList } from '../../ui/MultiRowHorizontalList';
import { useMemo } from 'react';
import { CardPerson } from '../../cards/CardPerson';
import { useQuery } from '@tanstack/react-query';
import { movieCastingOptions } from '@libs/query-client';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../providers/ThemeProvider';

interface MovieWidgetCastProps extends React.ComponentPropsWithoutRef<typeof View> {
  movieId: number;
}

const MovieWidgetCast = ({ movieId, style }: MovieWidgetCastProps) => {
  const { theme } = useTheme();
  const t = useTranslations();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const width = useMemo(
    () => clamp(screenWidth * 0.8 - (theme.spaces.horizontal * 2 + theme.spaces.md * 2), 400),
    [screenWidth, theme],
  );

  const { data } = useQuery(
    movieCastingOptions({
      movieId,
    }),
  );

  if (!data?.length) return null;

  return (
    <View>
      <Text
        style={[
          tw`text-sm font-medium`,
          {
            marginLeft: insets.left + theme.spaces.horizontal,
            marginRight: insets.right + theme.spaces.horizontal,
          },
        ]}
      >
        {`${upperFirst(t('common.messages.starring'))} :`}
      </Text>
      <MultiRowHorizontalList
        data={data}
        renderItem={(item) => <CardPerson variant="list" person={item.person} style={tw`h-12`} />}
        keyExtractor={(item) => item.personId.toString()}
        contentContainerStyle={{
          paddingLeft: insets.left + theme.spaces.horizontal,
          paddingRight: insets.right + theme.spaces.horizontal,
          gap: theme.spaces.md,
        }}
        columnStyle={{
          width: width,
          gap: theme.spaces.md,
        }}
        snapToInterval={width + theme.spaces.md}
        decelerationRate={'fast'}
      />
    </View>
  );
};

export default MovieWidgetCast;
