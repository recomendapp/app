'use client';

import React, { useState, useRef, useMemo } from 'react';
import { useMap } from '@/context/map-context';
import { Interface } from './Interface';
import { Icons } from '../../config/icons';
import MapContainer, { Layer, Source } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useLocale } from 'next-intl';

export function Map() {
  const locale = useLocale();
  const {
    mapInitialized,
    setMapInitialized,
    data,
    selectedMovie,
    setSelectedMovie,
    // movieId,
    // setMovieId,
    filters,
    user,
  } = useMap();

  const [cursor, setCursor] = useState<string>('auto');
  const mapSettings = {
    baseZoom: 8,
  };

  const filtersRendered = useMemo(() => {
    const startDate = new Date(`${filters.date.value[0]}`);
    const endDate = new Date(`${filters.date.value[1]}`);
    endDate.setFullYear(endDate.getFullYear() + 1);
    const filtersRendered:any = [
      'all',
      ['>=', ['get', 'release_date'], startDate.toISOString().slice(0, 10)],
      ['<=', ['get', 'release_date'], endDate.toISOString().slice(0, 10)],
      [">=", ["get", "runtime"], filters.runtime.value[0]],
      ["<=", ["get", "runtime"], filters.runtime.value[1]],
    ];
    if (filters.genres.value.length > 0) {
      filters.genres.value.forEach((genreId) => {
        filtersRendered.push(['in', genreId, ['get', 'genres']]);
      });
    }
    // if (selectedMovie) filtersRendered.push(['!=', ['get', 'id'], selectedMovie.movie.id]);
    return filtersRendered;
  }, [filters]);

  if (!data) return null;

  return (
    <div className="w-full h-full flex flex-col relative bg-black">
      {!mapInitialized && (
        <div className="bg-background absolute w-full h-full z-20 flex items-center justify-center">
          <Icons.spinner className="animate-spin" />
        </div>
      )}
      <MapContainer
        initialViewState={user.position}
        maxBounds={[
          [0.5, 47],
          [4.5, 50]
        ]}
        maxZoom={12}
        minZoom={6}
        bearing={0}
        pitch={0}
        padding={user.padding}
        mapStyle="/map/style.json"
        attributionControl={false}
        interactiveLayerIds={['movies']}
        onClick={(e) => {
          const isMoviesLayer = e.features?.find((feature) => feature.layer.id === 'movies');
          if (isMoviesLayer) {
            const parsedLocaleData = JSON.parse(isMoviesLayer.properties[locale === 'fr-FR' ? 'fr-FR' : 'en-US']); // TODO: Use local when supported all languages
            setSelectedMovie({
              movie: {
                id: isMoviesLayer.properties.id,
                title: parsedLocaleData.title,
              },
              location: {
                longitude: (isMoviesLayer.geometry as any).coordinates[0],
                latitude: (isMoviesLayer.geometry as any).coordinates[1],
              }
            });
          }
        }}
        onMouseMove={(e) => {
          const isMoviesLayer = e.features?.find((feature) => feature.layer.id === 'movies');
          if (isMoviesLayer) {
            setCursor('pointer');
          } else {
            setCursor('auto');
          } 
        }}
        onMoveEnd={(e) => {
          // Save the current position of the user
          user.setPosition(e.viewState);
        }}
        cursor={cursor}
        onLoad={() => {
          setMapInitialized(true);
        }}
        locale={{ language: locale }}
      >
          <Source id="movies" type="geojson" data={data.moviesDataset}>
            <Layer
              id="movies"
              type="symbol"
              layout={{
                'text-field': ['get', 'title', ['get', locale === 'fr-FR' ? 'fr-FR' : 'en-US']], // TODO: Use local when supported all languages
                'text-font': ['Open Sans Bold'],
                'text-size': [
                  "interpolate",
                  ["exponential", 2],
                  ["zoom"],
                  0,
                  1.5 * Math.pow(2, 0 - mapSettings.baseZoom),
                  24,
                  1.5 * Math.pow(2, 24 - mapSettings.baseZoom)
                ],
                'text-overlap': 'cooperative',
                'text-allow-overlap': true,
                'text-variable-anchor': ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
                'text-offset': [1, 0],
                'icon-image': [
                  'match',
                  ['at', 0, ['get', 'genres']],
                  ...data.genres.flatMap(({ id }) => [id, `genres/${id}`]),
                  'none'
                ] as any,
                'icon-size': [
                  "interpolate",
                  ["exponential", 2],
                  ["zoom"],
                  0,
                  0.08 * Math.pow(2, 0 - mapSettings.baseZoom),
                  24,
                  0.08 * Math.pow(2, 24 - mapSettings.baseZoom)
                ]
              }}
              paint={{
                // if movie is selected change color to black
                'text-color': [
                  'case',
                  ['==', ['get', 'id'], selectedMovie?.movie.id ?? -1],
                  '#3b82f6',
                  '#ffe974'
                ],
                'text-halo-color': 'black',
                'text-halo-width': [
                  'interpolate',
                  ['exponential', 2],
                  ['zoom'],
                  0,
                  0.01 * Math.pow(2, 0 - mapSettings.baseZoom),
                  24,
                  0.01 * Math.pow(2, 24 - mapSettings.baseZoom)
                ],
                'text-halo-blur': 1,
              }}
              filter={filtersRendered}
            />
          </Source>
          {/* {selectedMovie && (
            <Marker
              longitude={selectedMovie.location.longitude}
              latitude={selectedMovie.location.latitude}
              anchor='center'
              // closeOnClick={false}
              // change backgorund of the popup
              className="bg-background px-4 py-2 rounded-full text-accent-yellow text-lg font-semibold max-w-xs line-clamp-2 text-center"
              // onClose={() => setSelectedMovie(null)}
            >
              {selectedMovie.movie.title}
            </Marker>
          )} */}
          <Interface />
      </MapContainer>
    </div>
  );
}

