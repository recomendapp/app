'use client';

import { CheckedState } from "@radix-ui/react-checkbox";
import { createContext, use, useMemo, useState } from "react";
import moviesDataset from "@/components/Map/Data/movies.json"
import genresDataset from "@/components/Map/Data/genres.json"
import { useLocale } from "next-intl";
import { PaddingOptions } from "maplibre-gl";
import { FeatureCollection, GeoJsonProperties, Geometry } from "geojson";

interface MapContextProps {
	mapInitialized: boolean;
	setMapInitialized: (value: boolean) => void;
	selectedMovie: {
		movie: {
			id: number;
			title: string;
		},
		location: {
			latitude: number;
			longitude: number;
		};
	} | null;
	setSelectedMovie: (value: {
		movie: {
			id: number;
			title: string;
		},
		location: {
			latitude: number;
			longitude: number;
		};
	} | null) => void;
	// movieId: number | null;
	// setMovieId: (movieId: number | null) => void;
	filters: {
		date: {
			defaultValue: number[];
			value: number[];
			setValue: (value: number[]) => void;
		},
		genres: {
			value: number[];
			setValue: (value: number[]) => void;
		},
		runtime: {
			defaultValue: number[];
			value: number[];
			setValue: (value: number[]) => void;
		},
		activity: {
			hideWatched: {
				value: CheckedState;
				setValue: (value: CheckedState) => void;
			}
		}
	};
	data?: {
		moviesDataset: FeatureCollection<Geometry, GeoJsonProperties>;
		movies: {
			id: number;
			title: string;
			poster_path: string;
			genres: number[];
			directors: {
				id: number;
				name: string;
			}[];
			release_date: string;
			original_title: string;
			position: number[];
			// coord_x: number;
			// coord_y: number;
			runtime: number;
		}[];
		genres: {
			id: number;
			name: string;
		}[];
	};
	user: {
		position: {
			bearing?: number;
			latitude: number;
			longitude: number;
			pitch?: number;
			zoom: number;
		},
		setPosition: (position: {
			bearing?: number;
			latitude: number;
			longitude: number;
			pitch?: number;
			zoom: number;
		}) => void;
		padding: PaddingOptions;
		setPadding: (padding: PaddingOptions) => void;
	}
	debug?: boolean;
}

const MapProvider = createContext<MapContextProps | undefined>(undefined);

export const MapContext = ({
	children
} : {
	children: React.ReactNode
}) => {
	const locale = useLocale();
	/* Map */
	const [mapInitialized, setMapInitialized] = useState(false);
	/* Data */
	const data = useMemo(() => {
		const movies = moviesDataset.features.map(({ properties: movie, geometry }) => {
			return {
				id: movie.id,
				title: locale === 'fr-FR' ? movie["fr-FR"].title : movie["en-US"].title,
				poster_path: locale === 'fr-FR' ? movie["fr-FR"].poster_path : movie["en-US"].poster_path,
				genres: movie.genres,
				directors: movie.directors,
				release_date: movie.release_date,
				original_title: movie.original_title,
				// position: movie.position,
				position: geometry.coordinates,
				// coord_x: movie.coord_x ?? 0,
				// coord_y: movie.coord_y ?? 0,
				runtime: movie.runtime,
			}
		});
		// show duplicate movies
		// const duplicateMovies = movies.filter((movie, index, self) => self.findIndex(m => m.id === movie.id) !== index);
		// console.log('duplicateMovies', duplicateMovies);
		// order genres alphabetically
		const genres = genresDataset.map((genre) => {
			return {
				id: genre.id,
				name: locale === 'fr-FR' ? genre["fr-FR"] : genre["en-US"],
			}
		}).sort((a, b) => a.name.localeCompare(b.name));
		return {
			moviesDataset: moviesDataset as FeatureCollection<Geometry, GeoJsonProperties>, // TODO: Fix type
			movies,
			genres,
		}
	}, [locale]);
	/* Movie */
	const [selectedMovie, setSelectedMovie] = useState<{
		movie: {
			id: number;
			title: string;
		},
		location: {
			latitude: number;
			longitude: number;
		};
	} | null>(null);
	// const [movieId, setMovieId] = useState<number | null>(null);
	/* Filters */
	const defaultFilterDate = [data.movies.reduce((acc, movie) => Math.min(acc, new Date(movie.release_date).getFullYear()), Infinity), data.movies.reduce((acc, movie) => Math.max(acc, new Date(movie.release_date).getFullYear()), 0)];
	const [filterDate, setFilterDate] = useState<number[]>(defaultFilterDate);
	const [filterGenres, setFilterGenres] = useState<number[]>([]);
	const defaultFilterRuntime = [data.movies.reduce((acc, movie) => Math.min(acc, movie.runtime), Infinity), data.movies.reduce((acc, movie) => Math.max(acc, movie.runtime), 0)];
	const [filterRuntime, setFilterRuntime] = useState<number[]>(defaultFilterRuntime);
	const [filterActivityHideWatched, setFilterActivityHideWatched] = useState<CheckedState>(false);
	/* User */
	const [userPosition, setUserPosition] = useState({
		latitude: 48.5,
		longitude: 2.5,
		zoom: 8,
	});
	const [userPadding, setUserPadding] = useState<PaddingOptions>({
		top: 0,
		right: 0,
		bottom: 0,
		left: 0,
	});
	/* Debug */
	const debug = process.env.NODE_ENV === 'development';
	return (
		<MapProvider.Provider value={{
			mapInitialized,
			setMapInitialized,
			selectedMovie,
			setSelectedMovie,
			// movieId,
			// setMovieId,
			filters: {
				date: {
					defaultValue: defaultFilterDate,
					value: filterDate,
					setValue: setFilterDate
				},
				genres: {
					value: filterGenres,
					setValue: setFilterGenres
				},
				runtime: {
					defaultValue: defaultFilterRuntime,
					value: filterRuntime,
					setValue: setFilterRuntime
				},
				activity: {
					hideWatched: {
						value: filterActivityHideWatched,
						setValue: setFilterActivityHideWatched
					}
				}
			},
			data: data,
			user: {
				position: userPosition,
				setPosition: setUserPosition,
				padding: userPadding,
				setPadding: setUserPadding,
			},
			debug: debug,
		}}>
			{children}
		</MapProvider.Provider>
	);
};

export const useMap = () => {
	const context = use(MapProvider);
	if (context === undefined) {
		throw new Error('useMap must be used within a MapProvider');
	}
	return context;
}