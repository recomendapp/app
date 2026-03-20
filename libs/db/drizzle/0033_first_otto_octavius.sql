ALTER TABLE "tmdb"."movie_image" ADD CONSTRAINT "unique_movie_image" UNIQUE("movie_id","file_path","type");--> statement-breakpoint
ALTER TABLE "tmdb"."movie_release_date" ADD CONSTRAINT "unique_movie_release_date" UNIQUE("movie_id","iso_3166_1","iso_639_1","release_type");--> statement-breakpoint
ALTER TABLE "tmdb"."person_also_known_as" ADD CONSTRAINT "unique_person_also_known_as" UNIQUE("person_id","name");--> statement-breakpoint
ALTER TABLE "tmdb"."person_image" ADD CONSTRAINT "unique_person_image" UNIQUE("person_id","file_path");