import useDebounce from "@/hooks/use-debounce";
import { useEffect, useRef, useState } from "react";
import { useMap } from "../../../context/map-context";
import MediaPoster from "@/components/Media/MediaPoster";
import { SearchIcon } from "lucide-react";
import { useInView } from "react-intersection-observer";
import Fuse from "fuse.js";
import { Button } from "@/components/ui/button";
import { Link } from "@/lib/i18n/navigation";
import {LngLatLike, useMap as useMapContext} from 'react-map-gl/maplibre';

export const MapSearchbar = () => {
	const {
		setSelectedMovie,
		data,
	} = useMap();
	const {
		current: map
	} = useMapContext();
	const { ref, inView } = useInView();
	const mainRef = useRef<HTMLDivElement>(null);
	const numberOfResult = 10;
	const [onFocus, setOnFocus] = useState(false);
	const [displayedCount, setDisplayedCount] = useState(numberOfResult);
	const [search, setSearch] = useState('');
	const debouncedSearch = useDebounce(search, 500);
	const [results, setResults] = useState(data?.movies);

	const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
		event.target.select();
		event.currentTarget.select();
		setOnFocus(true);
	}

	const handleClick = (event: MouseEvent) => {
		if (mainRef.current && !mainRef.current.contains(event.target as Node)) {
			setOnFocus(false);
		}
	};

	useEffect(() => {
		document.addEventListener('mousedown', handleClick);
		return () => {
			document.removeEventListener('mousedown', handleClick);
		};
	}, []);

	useEffect(() => {
		if (inView && data?.movies && displayedCount < data.movies.length) {
			setDisplayedCount((prev) => prev + numberOfResult);
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [inView, data?.movies]);

	useEffect(() => {
		if (!onFocus) {
			setDisplayedCount(numberOfResult);
		}
	}, [onFocus]);
	
	// handle search
	useEffect(() => {
		if (debouncedSearch && data?.movies) {
			const fuse = new Fuse(data?.movies, {
				keys: ['title', 'release_date', 'directors.name', 'original_title'],
				threshold: 0.4,
			});
			const searchResults = fuse.search(debouncedSearch).map(result => result.item);
			setResults(searchResults);
		} else {
			setResults(data?.movies);
		}
	}, [debouncedSearch, data?.movies]);

	return (
		<div ref={mainRef} className="md:w-2/5 pointer-events-auto relative">
			{/* INPUT */}
			<div
				className={`
					flex items-center px-3 bg-background border shadow-md
					${onFocus ? ' rounded-t-lg' : 'rounded-lg'}
				`}
			>
				<SearchIcon className="w-4 h-4 shrink-0 mr-2 opacity-50" />
				<input
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					onFocus={handleFocus}
					placeholder="Chercher un film sur la carte..."
					className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-hidden placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
				/>
			</div>
			{/* RESULTS */}
			{onFocus && <div className=" z-1 absolute bg-background w-full max-h-80 overflow-hidden overflow-y-auto p-1 rounded-b-lg">
				{(results && results?.length > 0) ? results?.slice(0, displayedCount).map((movie, i) => (
					<div
						key={i}
						onClick={() => {
							// setMovieId(movie.id)
							setSelectedMovie({
								movie: {
									id: movie.id,
									title: movie.title,
								},
								location: {
									longitude: movie.position[0],
									latitude: movie.position[1],
								}
							})
							setOnFocus(false)
							map?.flyTo({
								center: movie.position as LngLatLike,
								zoom: 12,
								speed: 1.5,
							})
						}}
						className="hover:bg-muted p-2 cursor-pointer rounded-md flex justify-between items-center"
						{...(i === displayedCount - 1 ? { ref: ref } : {})}
					>
						<div className="flex items-center gap-2">
							<MediaPoster
								className="w-10"
								src={`https://image.tmdb.org/t/p/original/${movie.poster_path}`}
								alt={movie.title}
								width={40}
								height={60}
							/>
							<div>
								<p>
									{movie.title}
								</p>
								<div className="line-clamp-1">
									{movie.directors.length ? (
										movie.directors.map(
											(director, index: number) => (
											<span key={director.id}>
												<Button
												variant={'link'}
													className="w-fit p-0 h-full italic text-muted-foreground hover:text-accent-yellow transition"
													asChild
												>
													<Link href={`/person/${director.id}`}>
													{director.name}
													</Link>
												</Button>
												{index !== movie.directors.length - 1 && (
													<span className='text-muted-foreground'>, </span>
												)}
											</span>
											)
										)
										) : (
										<span className="w-fit p-0 h-full italic text-muted-foreground hover:text-accent-yellow transition">
											Unknown
										</span>
									)}
								</div>

							</div>
						</div>
						<div className="flex items-center text-sm">
							{movie.release_date ? new Date(movie.release_date).getFullYear() : 'n/a'}
						</div>
					</div>
				)) : (
					<div className="p-2">
						<p>Aucun résultat.</p>
					</div>
				)}
			</div>}
		</div>
	)
}