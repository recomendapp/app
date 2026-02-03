import { cn } from '@/lib/utils';

function YoutubeEmbed({
  embedId,
  className,
}: {
  embedId: string;
  className?: string;
}) {
  return (
    <div className={cn('video-responsive', className)}>
      <iframe
        className="w-full h-full"
        src={`https://www.youtube.com/embed/${embedId}`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title="Embedded youtube"
      />
    </div>
  );
}

export default YoutubeEmbed;
