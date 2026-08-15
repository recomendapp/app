import {
  Camera,
  CameraRef,
  FilterSpecification,
  GeoJSONSource,
  Layer,
  Map,
  MapRef,
  PressEventWithFeatures,
} from '@maplibre/maplibre-react-native';
import { NativeSyntheticEvent } from 'react-native';
import styleJSON from '../../assets/map/style.json';
import { Text } from '../../components/ui/text';
import { View } from '../../components/ui/view';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  BORDER_RADIUS,
  BORDER_RADIUS_FULL,
  GAP,
  PADDING_HORIZONTAL,
  PADDING_VERTICAL,
} from '../../theme/globals';
import { useQuery } from '@tanstack/react-query';
import { exploreGenresOptions, useExplore, useExploreItemsAll } from '@libs/query-client';
import { ExploreItemWithMovie, ExploreItemWithTvSeries } from '@libs/api-js';
import { Stack, useRouter } from 'expo-router';
import { useTheme } from '../../providers/ThemeProvider';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import Color from 'color';
import { Button } from '../../components/ui/Button';
import { Icons } from '../../constants/Icons';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { useWindowDimensions } from 'react-native';
import {
  LocationDetailsBottomSheet,
  LocationDetailsBottomSheetMethods,
} from './sheets/LocationDetailsBottomSheet';
import { withModalProvider } from '../../components/utils/withModalProvider';
import { useHeaderHeight } from 'expo-router/react-navigation';
import { useExploreStore } from '../../stores/useExploreStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { Input } from '../../components/ui/Input';
import { useUIStore } from '../../stores/useUIStore';

const MOVE_DELAY = 500;
const EXPLORE_SLUG = 'paradise-picture';

type ExploreItem = ExploreItemWithMovie | ExploreItemWithTvSeries;

const ExploreScreen = () => {
  const router = useRouter();
  const filters = useExploreStore((state) => state.filters);
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const headerHeight = useHeaderHeight();
  const { height: screenHeight } = useWindowDimensions();

  // REFs
  const mapRef = useRef<MapRef>(null);
  const cameraRef = useRef<CameraRef>(null);
  const searchRef = useRef<TrueSheet>(null);
  const locationDetailsRef = useRef<LocationDetailsBottomSheetMethods>(null);

  // SharedValues
  const animatedPOIListIndex = useSharedValue(0);
  const animatedPOIListPosition = useSharedValue(screenHeight);
  const animatedPOIDetailsIndex = useSharedValue(0);
  const animatedPOIDetailsPosition = useSharedValue(screenHeight);
  const animatedFiltersIndex = useSharedValue(0);
  const animatedFiltersPosition = useSharedValue(screenHeight);
  const optionsHeight = useSharedValue(0);

  // States
  const { map, setMapCamera } = useUIStore((state) => state);
  const [selectedItem, setSelectedItem] = useState<ExploreItem | null>(null);
  const [showRecenter, setShowRecenter] = useState(false);

  const baseZoom = 8;

  // `useExplore` persists its result and handles its own daily staleness/invalidation
  // (see libs/query-client/src/lib/explore/exploreHooks.ts) — `items` is only refetched
  // when it detects the explore's `updatedAt` changed.
  const { data: explore } = useExplore({ identifier: EXPLORE_SLUG });
  const { data: items } = useExploreItemsAll({ identifier: EXPLORE_SLUG });

  // No separate genres fetch — useExploreItemsAll() derives this from `media.genres` across
  // `items` and keeps it in this (persisted) query, recomputed only when the item list changes.
  const { data: availableGenres } = useQuery(exploreGenresOptions({ identifier: EXPLORE_SLUG }));

  // `Map` is shadowed by the maplibre `Map` component import above, hence the plain record.
  const itemsById = useMemo(() => {
    const byId: Record<number, ExploreItem> = {};
    items?.forEach((item) => {
      byId[item.id] = item;
    });
    return byId;
  }, [items]);

  // GeoJSON built client-side from the flat item list.
  const featureCollection = useMemo(
    (): GeoJSON.FeatureCollection => ({
      type: 'FeatureCollection',
      features: (items ?? []).map((item) => ({
        type: 'Feature',
        id: item.id,
        geometry: {
          type: 'Point',
          coordinates: [item.location.lng, item.location.lat],
        },
        properties: {
          id: item.id,
          title: item.type === 'movie' ? item.media.title : item.media.name,
          releaseDate: item.type === 'movie' ? item.media.releaseDate : item.media.firstAirDate,
          genresIds: (item.media.genres ?? []).map((genre) => genre.id),
        },
      })),
    }),
    [items],
  );

  const symbolFilter = useMemo(
    () =>
      [
        'all',
        ...(filters.releaseDate.min
          ? [['>=', ['slice', ['get', 'releaseDate'], 0, 4], String(filters.releaseDate.min)]]
          : []),
        ...(filters.releaseDate.max
          ? [['<=', ['slice', ['get', 'releaseDate'], 0, 4], String(filters.releaseDate.max)]]
          : []),
        ...(filters.genres.selected.length > 0
          ? [
              filters.genres.match === 'all'
                ? [
                    'all',
                    ...filters.genres.selected.map((genreId) => [
                      'in',
                      genreId,
                      ['get', 'genresIds'],
                    ]),
                  ]
                : [
                    'any',
                    ...filters.genres.selected.map((genreId) => [
                      'in',
                      genreId,
                      ['get', 'genresIds'],
                    ]),
                  ],
            ]
          : []),
      ] as unknown as FilterSpecification,
    [filters],
  );

  // Handlers
  const handleSaveCameraPosition = useCallback(async () => {
    if (!mapRef.current) return;
    try {
      const center = await mapRef.current.getCenter();
      const zoom = await mapRef.current.getZoom();

      const lng = center[0];
      const lat = center[1];

      setMapCamera([lng, lat], zoom);
    } catch (error) {
      console.error('Error getting camera position:', error);
    }
  }, [setMapCamera]);

  const handleOnLocationPress = useCallback(
    (e: NativeSyntheticEvent<PressEventWithFeatures>) => {
      const featureId = e.nativeEvent.features.at(0)?.properties?.id;
      if (featureId === undefined) return;
      const item = itemsById[featureId];
      if (!item) return;
      setSelectedItem(item);
    },
    [itemsById],
  );

  // const handleOnSearchItemPress = useCallback((item: ExploreItem) => {
  // 	setSelectedItem(item);
  // }, []);

  // const handleOnLocationClose = useCallback(() => {
  // 	setSelectedItem(null);
  // }, []);

  // Styles
  const animatedOptionsStyle = useAnimatedStyle(() => {
    const activeSheetY = Math.min(
      animatedPOIListPosition.get(),
      animatedPOIDetailsPosition.get(),
      animatedFiltersPosition.get(),
    );
    const B = insets.bottom + PADDING_VERTICAL; // bottom safe area + padding
    const H = optionsHeight.get(); // Options height
    const top0 = screenHeight - (B + H); //
    const bottomOffset = screenHeight - activeSheetY; // hauteur visible de la sheet

    const dDesired = bottomOffset - B + PADDING_VERTICAL; // coller au-dessus de la sheet
    const dMax = top0 - (headerHeight + PADDING_VERTICAL); // ne pas dépasser le header
    const d = Math.max(0, Math.min(dDesired, dMax)); // clamp

    return { transform: [{ translateY: -d }] };
  });

  // useEffects
  useEffect(() => {
    if (selectedItem) {
      cameraRef.current?.flyTo({
        center: [selectedItem.location.lng, selectedItem.location.lat],
        duration: MOVE_DELAY,
      });
      // The details sheet only supports movies for now — tv_series items are selectable
      // (highlighted on the map) but don't open a sheet yet.
      if (selectedItem.type === 'movie') {
        locationDetailsRef.current?.present({ movieId: selectedItem.mediaId });
      }
    }
    setShowRecenter(false);
  }, [selectedItem]);

  useLayoutEffect(() => {
    return () => {
      searchRef.current?.dismiss();
    };
  }, []);

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: () => <></>,
          headerShown: true,
          headerTransparent: true,
          headerStyle: {
            backgroundColor: 'transparent',
          },
        }}
      />
      <Map
        ref={mapRef}
        style={{ flex: 1 }}
        mapStyle={JSON.stringify(styleJSON)}
        attribution={false}
        logo={false}
        onRegionDidChange={async () => {
          handleSaveCameraPosition();

          if (!mapRef.current || !selectedItem) return;

          try {
            const bounds = await mapRef.current.getBounds();
            if (!bounds || bounds.length !== 4) return;

            const minLng = bounds[0];
            const minLat = bounds[1];
            const maxLng = bounds[2];
            const maxLat = bounds[3];

            const lng = selectedItem.location.lng;
            const lat = selectedItem.location.lat;

            const isVisible = lng >= minLng && lng <= maxLng && lat >= minLat && lat <= maxLat;

            setShowRecenter(!isVisible);
          } catch (error) {
            console.error('Error getting visible bounds:', error);
          }
        }}
      >
        <Camera
          ref={cameraRef}
          initialViewState={{
            center: map.center,
            zoom: map.zoom,
          }}
          maxZoom={12}
          minZoom={7}
          maxBounds={[0.5, 47, 4.5, 50]}
        />
        <GeoJSONSource id="explore-items" data={featureCollection} onPress={handleOnLocationPress}>
          <Layer
            id="explore-items-symbols"
            type="symbol"
            filter={symbolFilter}
            layout={{
              // TEXT
              'text-field': ['get', 'title'],
              'text-font': ['Open Sans Bold'],
              'text-size': [
                'interpolate',
                ['exponential', 2],
                ['zoom'],
                0,
                1.5 * Math.pow(2, 0 - baseZoom),
                24,
                1.5 * Math.pow(2, 24 - baseZoom),
              ],
              'text-allow-overlap': true,
              'text-variable-anchor': [
                'left',
                'right',
                'top-left',
                'top-right',
                'bottom-left',
                'bottom-right',
              ],
              'text-offset': [1, 0],
              // ICON — sprite named after the item's first genre id, falling back to a default.
              'icon-image': [
                'coalesce',
                ['image', ['concat', 'genres/', ['to-string', ['at', 0, ['get', 'genresIds']]]]],
                'genres/default',
              ],
              'icon-size': [
                'interpolate',
                ['exponential', 2],
                ['zoom'],
                0,
                0.08 * Math.pow(2, 0 - baseZoom),
                24,
                0.08 * Math.pow(2, 24 - baseZoom),
              ],
            }}
            paint={{
              'text-color': [
                'case',
                ['==', ['get', 'id'], selectedItem?.id ?? -1],
                Color(colors.accentBlue).hex(),
                Color(colors.accentYellow).hex(),
              ],
              'text-halo-color': '#000000',
              'text-halo-width': [
                'interpolate',
                ['exponential', 2],
                ['zoom'],
                0,
                0.01 * Math.pow(2, 0 - baseZoom),
                24,
                0.01 * Math.pow(2, 24 - baseZoom),
              ],
              'text-halo-blur': 1,
            }}
          />
        </GeoJSONSource>
      </Map>

      {/* <TrueSheet
		ref={searchRef}
		detents={['auto', 0.8]}
		initialDetentIndex={0}
		dimmed={false}
		dismissible={false}
		header={
			<View>
				<Input placeholder="Search..." />
			</View>
		}
		>
			<View>
				<Text>Test Sheet Content</Text>
			</View>
		</TrueSheet> */}
      <Animated.View
        onLayout={(e) => (optionsHeight.value = e.nativeEvent.layout.height)}
        style={[
          {
            position: 'absolute',
            bottom: insets.bottom + PADDING_VERTICAL,
            right: PADDING_HORIZONTAL,
            gap: GAP,
          },
          animatedOptionsStyle,
        ]}
      >
        {showRecenter && (
          <Button
            icon={Icons.Navigation}
            size="icon"
            variant="muted"
            onPress={() => {
              if (selectedItem) {
                cameraRef.current?.flyTo({
                  center: [selectedItem.location.lng, selectedItem.location.lat],
                  duration: MOVE_DELAY,
                });
              }
            }}
          />
        )}
      </Animated.View>
      <LocationDetailsBottomSheet
        ref={locationDetailsRef}
        index={animatedPOIDetailsIndex}
        position={animatedPOIDetailsPosition}
        onClose={() => setSelectedItem(null)}
      />
    </>
  );
};

export default withModalProvider(ExploreScreen);
