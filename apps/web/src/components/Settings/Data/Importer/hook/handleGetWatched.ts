"use server"

import { createServerClient } from "@/lib/supabase/server";

export const handleGetWatched = async (
	movies: {
		date: string;
		movie: {
			title: string;
			year: string;
		},
		liked: boolean;
		rating: number | null;
	}[],
	userId: string
) => {
	const supabase = await createServerClient();

    const success = [];
	const failed = [];

	// const { data, error } = await supabase
	// 	.from('movies')
	// 	.select(`*`)
	// 	.eq('language_id', 'en')
	// 	.in('title_with_year', movies.map(movie => `${movie.movie.title} ${movie.movie.year}`))
	// 	.limit(movies.length);
	
	// data?.forEach(movie => {
	// 	const index = movies.findIndex(m => m.movie.title === movie.title && m.movie.year === movie.release_year);
	// 	if (index !== -1) {
	// 		success.push({
	// 			movie: movie,
	// 			liked: movies[index].liked,
	// 			rating: movies[index].rating,
	// 		});
	// 		movies.splice(index, 1);
	// 	}
	// })

	// movies.forEach(movie => failed.push(movie));

	// return { success, failed };
	
	for (const movie of movies) {
		console.log('movie', movie.movie.title, movie.movie.year);
		const { data, error } = await supabase
			.rpc('importer_best_match_movie', {
				lang: 'en',
				search_title: movie.movie.title,
				search_year: movie.movie.year ? Number(movie.movie.year) : undefined,
			});
		// console.log('data', data);
		// console.log('error', error);
		// const { data, error } = await supabase
		//   .from('movies')
		//   .select(`
		//   	*,
		// 	directors:tmdb_movie_credits(
		// 		id,
		// 		person(*)
		// 	)
		//   `)
		//   .eq('language', 'en')
		//   .gte('release_date', `${movie.movie.year}-01-01`)
		//   .lte('release_date', `${movie.movie.year}-12-31`)
		//   .eq('title', movie.movie.title)
		//   .eq('directors.job', 'Director')
		//   .order('popularity', { ascending: false })
		//   .limit(1);
		if (error) {
			failed.push(movie);
			continue;
		}
		if (data.length > 0) {
			success.push({
				date: movie.date,
				source: movie.movie,
				movie: data[0] as any, // as Movie
				liked: movie.liked,
				rating: movie.rating,
			});
		}
		else
			failed.push(movie);
	}
	return { success, failed };
}
