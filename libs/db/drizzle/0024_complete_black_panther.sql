ALTER TABLE "playlist_item" DROP CONSTRAINT "check_playlist_item_rank";--> statement-breakpoint
ALTER TABLE "playlist_item" ALTER COLUMN "rank" SET DATA TYPE varchar(255);