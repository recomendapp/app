import { Button } from "@/components/ui/button";
import { useMap } from "../../../context/map-context"
import { TriangleAlert, XIcon } from "lucide-react";
import MediaPoster from "@/components/Media/MediaPoster";
import Loader from "@/components/Loader";
import { MovieTrailerButton } from "@/app/[lang]/(app)/film/[film_id]/(default)/_components/MovieHeader";
import { Link } from "@/lib/i18n/navigation";
import { RuntimeTooltip } from "@/components/utils/RuntimeTooltip";
import { DateOnlyYearTooltip } from "@/components/utils/Date";
import { IconMediaRating } from "@/components/Media/icons/IconMediaRating";
import ButtonUserWatchlistMovie from "@/components/buttons/ButtonUserWatchlistMovie";
import ButtonLogMovieLike from "@/components/buttons/ButtonLogMovieLike";
import ButtonLogMovieRating from "@/components/buttons/ButtonLogMovieRating";
import ButtonLogMovieWatch from "@/components/buttons/ButtonLogMovieWatch";
import ButtonLogMovieWatchedDate from "@/components/buttons/ButtonLogMovieWatchedDate";
import ButtonPlaylistAdd from "@/components/buttons/ButtonPlaylistAdd";
import { getTmdbImage } from "@/lib/tmdb/getTmdbImage";
import { useQuery } from "@tanstack/react-query";
import { movieOptions } from "@libs/query-client";
import ButtonUserRecoSend from "@/components/buttons/ButtonUserRecoSend";

export const MovieWidget = () => {
	const {
		selectedMovie,
		setSelectedMovie,
	} = useMap();

	const {
		data: movie,
		isLoading,
		isError,
	} = useQuery(movieOptions({
		movieId: selectedMovie?.movie.id,
	}));

	if (!selectedMovie?.movie.id) return null;

	return (
		<div className="p-2 relative bg-background rounded-md md:max-w-sm w-full max-h-48 md:max-h-52 h-full pointer-events-auto overflow-hidden overflow-y-scroll">
			<Button
				variant={'ghost'}
				size={'icon'}
				onClick={() => setSelectedMovie(null)}
				className="absolute top-2 right-2 rounded-full w-5 h-5"
			>
				<XIcon className="h-4 w-4"/>
			</Button>
			{isError ? (
				<div className="h-full w-full flex flex-col items-center justify-center">
					<TriangleAlert />
					<>Une erreur s&apos;est produite</>
				</div>
			) : (isLoading || !movie) ? (
				<div className="h-full w-full flex items-center justify-center">
					<Loader />
				</div>
			) : (
				<div className="w-full h-full flex flex-col gap-2">
					<div className="w-full h-full flex gap-2 items-center">
						<MediaPoster
						className="h-full w-fit"
						src={getTmdbImage({ path: movie.posterPath, size: 'w342' })}
						alt={movie.title ?? ''}
						width={96}
						height={144}
						unoptimized
						>
							{movie.voteCount && (
							<div className='absolute flex flex-col gap-2 top-1 right-1 w-10'>
								{movie.voteAverage ? <IconMediaRating
									rating={movie.voteAverage}
									variant="general"
									className="w-full"
								/> : null}
								{movie.followerAvgRating ? <IconMediaRating
									rating={movie.followerAvgRating}
									variant="follower"
									className="w-full"
								/> : null}
							</div>
							)}
							{movie.trailers && movie.trailers.length > 0 && (
								<MovieTrailerButton
									videos={movie.trailers}
									className="absolute bottom-2 right-2"
								/>
							)}
						</MediaPoster>
						<div className="flex flex-col justify-between w-full h-full">
							{/* TYPE & GENRES */}
							<div className=" line-clamp-1">
							<span className='text-accent-yellow'>Film</span>
							<span className=" before:content-['_|_']">
								{movie.genres?.map((genre, index) => (
									<span key={index}>
										<Button
											variant="link"
											className="w-fit p-0 h-full font-normal"
											asChild
										>
										<Link href={`/genre/${genre.id}`}>
											{genre.name}
										</Link>
										</Button>
										{index !== movie.genres.length - 1 && (
										<span>, </span>
										)}
									</span>
								))}
							</span>
							</div>
							{/* TITLE */}
							<div className="space-x-1">
								<Link
									href={`/film/${movie.id}`}
									className='font-bold text-lg line-clamp-2'
								>
									{movie.title}
								</Link>
								{/* DATE */}
								{movie.releaseDate && (
									<sup>
										<DateOnlyYearTooltip date={movie.releaseDate ?? ''} className=' text-xs font-medium'/>
									</sup>
								)}
								{movie.originalTitle !== movie.title && (
									<div className='text-xs ml-0! font-semibold text-muted-foreground line-clamp-1'>{movie.originalTitle}</div>
								)}
							</div>
							<div className="line-clamp-1">
								{movie.directors?.map((person, index) => (
								<>
									{index > 0 && <span>, </span>}
									<span key={index}>
										<Button
											variant="link"
											className="w-fit p-0 h-full hover:text-accent-yellow transition"
											asChild
										>
											<Link href={person.url ?? ''}>
											{person.name}
											</Link>
										</Button>
									</span>
								</>
								)) ?? <span className="w-fit p-0 h-full font-bold">Unknown</span>}
								{/* RUNTIME */}
								<RuntimeTooltip runtime={movie.runtime ?? 0} className=" before:content-['_•_']" />
							</div>
						</div>
					</div>
					<div className="flex justify-between gap-2 px-4 pb-4">
						<div className="flex gap-2 overflow-x-auto items-center">
						<ButtonLogMovieRating movieId={movie.id} />
						<ButtonLogMovieLike movieId={movie.id} />
						<ButtonLogMovieWatch movieId={movie.id} />
						<ButtonUserWatchlistMovie movieId={movie.id} />
						<ButtonLogMovieWatchedDate movieId={movie.id} />
						</div>
						<div className="flex gap-2 items-center">
						<ButtonPlaylistAdd mediaId={movie.id} mediaType="movies" mediaTitle={movie.title} />
						<ButtonUserRecoSend mediaId={movie.id} mediaType="movie" mediaTitle={movie.title} />
						</div>
					</div>
				</div>
			)}
		</div>
	)
}