import { personOptions } from '@libs/query-client';
import { useQuery } from '@tanstack/react-query';
import ButtonPersonFollow from '../../../../../components/buttons/ButtonPersonFollow';
import { usePersonHeaderMenu } from '../../../../../components/header-menus/usePersonHeaderMenu';
import { PersonHeader } from '../../../../../components/screens/person/PersonHeader';
import PersonWidgetFilms from '../../../../../components/screens/person/PersonWidgetFilms';
import PersonWidgetTvSeries from '../../../../../components/screens/person/PersonWidgetTvSeries';
import AnimatedStackScreen from '../../../../../components/ui/AnimatedStackScreen';
import { Button } from '../../../../../components/ui/Button';
import { Icons } from '../../../../../constants/Icons';
import tw from '../../../../../lib/tw';
import { useAuth } from '../../../../../providers/AuthProvider';
import { GAP, PADDING_VERTICAL } from '../../../../../theme/globals';
import { getIdFromSlug } from '../../../../../utils/getIdFromSlug';
import { useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const PersonScreen = () => {
  const { person_id } = useLocalSearchParams<{ person_id: string }>();
  const { id: personId } = getIdFromSlug(person_id);
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  // Queries
  const { data: person, isLoading } = useQuery(
    personOptions({
      personId: personId,
    }),
  );
  const loading = useMemo(() => person === undefined || isLoading, [person, isLoading]);
  // SharedValue
  const headerHeight = useSharedValue(0);
  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      'worklet';
      scrollY.value = event.contentOffset.y;
    },
  });

  const { onMenuPress, headerRightItems } = usePersonHeaderMenu({ person });

  return (
    <>
      <AnimatedStackScreen
        options={{
          headerTitle: person?.name || '',
          headerTransparent: true,
          headerRight: () => (
            <View style={tw`flex-row items-center gap-1`}>
              {user && <ButtonPersonFollow personId={personId} />}
              <Button
                variant="ghost"
                size="icon"
                icon={Icons.EllipsisVertical}
                onPress={onMenuPress}
              />
            </View>
          ),
          unstable_headerRightItems: headerRightItems,
        }}
        scrollY={scrollY}
        triggerHeight={headerHeight}
      />
      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollToOverflowEnabled
        contentContainerStyle={[
          {
            paddingBottom: insets.bottom + PADDING_VERTICAL,
            gap: GAP,
          },
        ]}
      >
        <PersonHeader
          person={person}
          loading={loading}
          scrollY={scrollY}
          triggerHeight={headerHeight}
        />
        {!loading && (
          <>
            <PersonWidgetFilms
              personId={personId}
              url={{
                pathname: `/person/[person_id]/films`,
                params: { person_id: personId },
              }}
            />
            <PersonWidgetTvSeries
              personId={personId}
              url={{
                pathname: `/person/[person_id]/tv-series`,
                params: { person_id: personId },
              }}
            />
          </>
        )}
      </Animated.ScrollView>
    </>
  );
};

export default PersonScreen;
