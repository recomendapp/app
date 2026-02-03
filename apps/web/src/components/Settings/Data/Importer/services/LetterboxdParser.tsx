import Loader from "@/components/Loader";
import JSZip from "jszip";
import { set } from "lodash";
import { useEffect, useState } from "react";
import { usePapaParse } from 'react-papaparse';
import { handleGetWatchlist } from "../hook/handleGetWatchlist";
import { useAuth } from "@/context/auth-context";
import { ImportResults } from "../ImporterInitiator";
import { handleGetWatched } from "../hook/handleGetWatched";

const LetterboxdParser = ({
	file,
	setStep,
	importResults,
	setImportResults,
} : {
	file: File,
	setStep: (step: number) => void,
	importResults: ImportResults,
	setImportResults: (results: ImportResults) => void,
}) => {
	const { user } = useAuth();
	const [files, setFiles] = useState<{ relativePath: string, content: string }[] | null>(null);
	const [parsingStep, setParsingStep] = useState(1);
	const [parsingStepMsg, setParsingStepMsg] = useState("Initializing");
	const [loadingDots, setLoadingDots] = useState(".");
	const { readString } = usePapaParse();

	useEffect(() => {
		const interval = setInterval(() => {
			setLoadingDots((dots) => {
				if (dots.length === 3) return ".";
				return dots + ".";
			});
		}, 500);
		return () => clearInterval(interval);
	}, []);

	useEffect(() => {
		// start parsing
		if (parsingStep === 1) unzip();
		else if (parsingStep === 2) user_movie();
		else if (parsingStep === 3) watchlist();
		else if (parsingStep === 4) setStep(3);
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [parsingStep]);

	const parseCSV: (content: string) => Promise<any[]> = (content) => {
		return new Promise((resolve, reject) => {
		  readString(content, {
			worker: true,
			complete: (results) => {
			  resolve(results.data);
			},
			error: (error) => {
			  reject([]);
			}
		  });
		});
	  };

	const unzip = async () => {
		setParsingStepMsg("Unzipping file");
		try {
			const zip = new JSZip();
			const content = await file.arrayBuffer();
			const unzipped = await zip.loadAsync(content);

			const files: Promise<{ relativePath: string, content: string }>[] = [];
			unzipped.forEach((relativePath, file) => {
				files.push(file.async("string").then(content => {
					return { relativePath, content };
				}));
			});
			const results = await Promise.all(files);
			setFiles(results);
			setParsingStep(2);
		} catch (error) {
			setParsingStepMsg("Failed to unzip file");
		}
	}

	const user_movie = async () => {
		setParsingStepMsg("Getting movies");
		if (!user) {
			setParsingStepMsg("No user found");
			setStep(1);
			return ;
		}
		const watchedMovie = files?.find(file => file.relativePath === "watched.csv");
		const ratedMovie = files?.find(file => file.relativePath === "ratings.csv");
		const likedMovie = files?.find(file => file.relativePath === "likes/films.csv");
		if (!watchedMovie && !ratedMovie && !likedMovie) {
			setParsingStepMsg("No watched movies found");
			setParsingStep(3);
			return;
		}
		/* ========== PARSE WATCHED MOVIES ========== */
		const watchedMovieData = watchedMovie ? await parseCSV(watchedMovie?.content) : [];
		// get index of "Title" and "Year" columns
		const watchedMovieTitleIndex = watchedMovieData[0].findIndex((column: string) => column.toLowerCase() === "name");
		const watchedMovieYearIndex = watchedMovieData[0].findIndex((column: string) => column.toLowerCase() === "year");
		const watchedMovieDateIndex = watchedMovieData[0].findIndex((column: string) => column.toLowerCase() === "date");
		// skip first row
		watchedMovieData.shift();

		/* ========== PARSE RATED MOVIES ========== */
		const ratedMovieData = ratedMovie ? await parseCSV(ratedMovie?.content) : [];
		// get index of "Title" and "Year" columns
		const ratedMovieTitleIndex = ratedMovieData[0].findIndex((column: string) => column.toLowerCase() === "name");
		const ratedMovieYearIndex = ratedMovieData[0].findIndex((column: string) => column.toLowerCase() === "year");
		const ratedMovieRatingIndex = ratedMovieData[0].findIndex((column: string) => column.toLowerCase() === "rating");
		const ratedMovieDateIndex = ratedMovieData[0].findIndex((column: string) => column.toLowerCase() === "date");
		// skip first row
		ratedMovieData.shift();

		/* ========== PARSE LIKED MOVIES ========== */
		const likedMovieData = likedMovie ? await parseCSV(likedMovie?.content) : [];
		// get index of "Title" and "Year" columns
		const likedMovieTitleIndex = likedMovieData[0].findIndex((column: string) => column.toLowerCase() === "name");
		const likedMovieYearIndex = likedMovieData[0].findIndex((column: string) => column.toLowerCase() === "year");
		const likedMovieDateIndex = likedMovieData[0].findIndex((column: string) => column.toLowerCase() === "date");
		// skip first row
		likedMovieData.shift();
		
		// create array of movies with title and year
		const movieMap: {date: string, movie: { title: string, year: string }, liked: boolean, rating: number | null }[] = [];
	
		// add watched movies
		watchedMovieData.forEach((movie: string[]) => {
			// dont add movie without title
			const title = movie[watchedMovieTitleIndex];
			if (!title) return;
			const year = movie[watchedMovieYearIndex];
			movieMap.push({
				date: movie[watchedMovieDateIndex],
				movie: { title, year },
				liked: false,
				rating: null,
			});
		});
		// add rated movies
		ratedMovieData.forEach((movie: string[]) => {
			const title = movie[ratedMovieTitleIndex];
			if (!title) return;
			const year = movie[ratedMovieYearIndex];
			const rating = Number(movie[ratedMovieRatingIndex]) * 2; // convert 5 star rating to 10 star rating
			const index = movieMap.findIndex((m) => m.movie.title === title && m.movie.year === year);
			if (index !== -1) {
				movieMap[index].rating = rating;
			} else {
				movieMap.push({
					date: movie[ratedMovieDateIndex],
					movie: { title, year },
					liked: false,
					rating: rating,
				});
			}
		});
		// add liked movies
		likedMovieData.forEach((movie: string[]) => {
			const title = movie[likedMovieTitleIndex];
			if (!title) return;
			const year = movie[likedMovieYearIndex];
			const index = movieMap.findIndex((m) => m.movie.title === title && m.movie.year === year);
			if (index !== -1) {
				movieMap[index].liked = true;
			} else {
				movieMap.push({
					date: movie[likedMovieDateIndex],
					movie: { title, year },
					liked: true,
					rating: null,
				});
			}
		});
		// delete duplicates
		movieMap.filter((movie, index) => movieMap.findIndex(m => m.movie.title === movie.movie.title && m.movie.year === movie.movie.year) === index);
		const watchedResults = await handleGetWatched(movieMap, user?.id);
		setImportResults({
			...importResults,
			user_movies: watchedResults,
		});
		setParsingStep(3);
	}

	const watchlist = () => {
		setParsingStepMsg("Getting watchlist");
		if (!user) {
			setParsingStepMsg("No user found");
			setStep(1);
			return ;
		}
		const watchlist = files?.find(file => file.relativePath === "watchlist.csv");
		if (!watchlist) {
			setParsingStepMsg("No watchlist found");
			setParsingStep(4);
			return;
		};
		readString(watchlist.content, {
			worker: true,
			complete: async ({ data} : { data: string[][] }) => {
				// find index of "Name" and "Year" columns
				const nameIndex = data[0].findIndex((column: string) => column.toLowerCase() === "name");
				const yearIndex = data[0].findIndex((column: string) => column.toLowerCase() === "year");
				const dateIndex = data[0].findIndex((column: string) => column.toLowerCase() === "date");
				// create array of movies with title and year
				const movies = data.slice(1).map((movie: string[]) => {
					return {
						title: movie[nameIndex],
						year: movie[yearIndex],
						date: movie[dateIndex],
					};
				});
				// delete duplicates
				movies.filter((movie, index) => movies.findIndex(m => m.title === movie.title && m.year === movie.year) === index);
				// search in database for each movie and if user has watched it
				const watchlistResults = await handleGetWatchlist(movies, user?.id);
				setImportResults({
					...importResults,
					watchlist: watchlistResults,
				});
				setParsingStep(4);
			},
		});

	}
	return (
		<div>
			<span className="italic text-muted-foreground">{parsingStepMsg}{loadingDots}</span>
			<Loader />
		</div>
	)
}

// const unzip = async (file: File, setParsingStep: (step: string) => void) => {
// 	setParsingStep("Unzipping file");
// 	try {
// 		const zip = new JSZip();
// 		const content = await file.arrayBuffer();
// 		const unzipped = await zip.loadAsync(content);

// 		const files: Promise<{ relativePath: string, content: string }>[] = [];
// 		unzipped.forEach((relativePath, file) => {
// 			files.push(file.async("string").then(content => {
// 				return { relativePath, content };
// 			}));
// 		});
// 		const results = await Promise.all(files);
// 		return results;
// 	} catch (error) {
// 		console.error("Failed to unzip file:", error);
// 		setParsingStep("error");
// 	}
// }

// const parseWatchlist = (files: { relativePath: string, content: string }[], setParsingStep: (step: string) => void) => {
// 	const { readString } = usePapaParse();
// 	setParsingStep("Getting watchlist");
// 	const watchlist = files.find(file => file.relativePath === "watchlist.csv");
// 	if (!watchlist) return;
// 	readString(watchlist.content, {
// 		worker: true,
// 		complete: (results) => {
// 			console.log(results.data);
// 		},
// 	});

// }

export default LetterboxdParser;