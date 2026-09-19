import tw from '../../../lib/tw';
import { useWindowDimensions, View } from 'react-native';
import { clamp, upperFirst } from 'lodash';
import { useTranslations } from 'use-intl';
import { Text } from '../../ui/text';
import { MultiRowHorizontalList } from '../../ui/MultiRowHorizontalList';
import { GAP, PADDING_HORIZONTAL } from '../../../theme/globals';
import { useMemo } from 'react';
import { CardPerson } from '../../cards/CardPerson';
import { useQuery } from '@tanstack/react-query';
import { movieCastingOptions } from '@libs/query-client';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface MovieWidgetCastProps extends React.ComponentPropsWithoutRef<typeof View> {
  movieId: number;
}

const MovieWidgetCast = ({ movieId, style }: MovieWidgetCastProps) => {
  const t = useTranslations();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const width = useMemo(
    () => clamp(screenWidth * 0.8 - (PADDING_HORIZONTAL * 2 + GAP * 2), 400),
    [screenWidth],
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
            marginLeft: insets.left + PADDING_HORIZONTAL,
            marginRight: insets.right + PADDING_HORIZONTAL,
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
          paddingLeft: insets.left + PADDING_HORIZONTAL,
          paddingRight: insets.right + PADDING_HORIZONTAL,
          gap: GAP,
        }}
        columnStyle={{
          width: width,
          gap: GAP,
        }}
        snapToInterval={width + GAP}
        decelerationRate={'fast'}
      />
    </View>
  );
};

export default MovieWidgetCast;
