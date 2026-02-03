import MediaPoster from "@/components/Media/MediaPoster";
import ActivityIcon from "@/components/Review/ActivityIcon";
import { DateOnlyYearTooltip } from "@/components/utils/Date";
import { MediaPerson } from "@recomendapp/types";
import { HeartIcon } from "lucide-react";

export default function MovieCard({
	id,
	title,
	poster_url,
	release_date,
	directors,
	rating,
	liked,
} : {
	id: number | undefined;
	title: string | null | undefined;
	poster_url: string | null | undefined;
	release_date: string | null | undefined;
	directors: any | null | undefined;
	rating?: number | null;
	liked?: boolean | null;
}) {
	return (
	  <div className="flex gap-4 items-center">
		{/* MOVIE POSTER */}
		<MediaPoster
		className="w-[60px]"
		src={poster_url ?? ''}
		alt={title ?? ''}
		width={60}
		height={90}
		/>
		{/* MOVIE DATAT */}
		<div className="w-full block">
		  {/* TITLE */}
		  <p className="font-medium line-clamp-2">
			{title ?? 'Unknown'}
		  </p>
  
		  {/* DATE / GENRES / RUNTIME */}
		  <div className="line-clamp-1">
			{directors?.map(({ person } : { person: MediaPerson }, index: number) => (
			  <>
				{index > 0 && <span className='text-muted-foreground'>, </span>}
				<span key={person?.id} className="italic text-muted-foreground">
					{person?.name}
				</span>
			  </>
			)) ?? <span className="w-fit p-0 h-full font-bold">Unknown</span>}
		  </div>
  
		  {/* DATE */}
		  <p>
			<DateOnlyYearTooltip date={release_date} />
		  </p>
		</div>
		{rating && (
			<ActivityIcon
				movieId={id ?? 0}
				rating={rating}
			/>
		)}
		{liked && (
			<HeartIcon size={45} className="shadow-xs text-background fill-accent-pink" />
		)}
	  </div>
	);
  }