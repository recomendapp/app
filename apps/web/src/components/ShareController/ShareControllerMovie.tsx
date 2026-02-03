"use client";
import { ShareControllerProps } from "./ShareController";
import { MediaMovie } from "@recomendapp/types";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { upperFirst } from "lodash";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { ImageWithFallback } from "../utils/ImageWithFallback";
import { Icons } from "@/config/icons";
import toast from "react-hot-toast";
import { domToBlob } from "modern-screenshot";

interface ShareControllerMovieProps extends ShareControllerProps {
	movie: MediaMovie;
}

export const ShareControllerMovie: React.FC<ShareControllerMovieProps> = ({ movie, onFileReady }) => {
	const t = useTranslations();

	const captureRef = useRef<HTMLDivElement>(null);
	const directorsText = useMemo(() => movie.directors?.map(d => d.name!).join(', '), [movie.directors]);

	const [isLoading, setIsLoading] = useState(false);
	const [isBackdropLoaded, setIsBackdropLoaded] = useState(false);
	const [isPosterLoaded, setIsPosterLoaded] = useState(false);

	const captureImage = useCallback(async () => {
		if (!captureRef.current) return;
		setIsLoading(true);
		try {
			const blob = await domToBlob(captureRef.current, {
				quality: 1,
				scale: 5,
			});
			if (!blob) {
				throw new Error('Failed to capture image');
			}
			const extension = blob.type.split('/')[1];
			const file = new File([blob], `${movie.title}.${extension}`, { type: blob.type });
			onFileReady?.(file);
		} catch (error) {
        	toast.error(upperFirst(t('common.messages.an_error_occurred')));
		} finally {
			setIsLoading(false);
		}
	}, [movie.title, onFileReady, t]);

	useEffect(() => {
		// if (!isBackdropLoaded || !isPosterLoaded) return;
		captureImage();
	}, [isBackdropLoaded, isPosterLoaded, captureImage]);

	return (
		<div className="w-full flex flex-col items-center gap-2">
			<div className="relative w-[300px] rounded-md overflow-hidden">
				<div
				ref={captureRef}
				className="relative w-full aspect-9/16 flex flex-col justify-center items-center bg-muted p-4 overflow-hidden"
				>
					{movie.backdrop_url && <Image src={movie.backdrop_url} alt={movie.title ?? 'movie poster'} className="absolute inset-0 object-cover" fill onLoad={() => setIsBackdropLoaded(true)} />}
					<div className="absolute inset-0 bg-black/50" />
					<div className="flex flex-col justify-center items-center w-full z-10 gap-4">
						{/* POSTER */}
						<div className="relative overflow-hidden w-2/3 h-auto aspect-2/3 rounded-md">
							<ImageWithFallback type={'movie'} src={movie.poster_url} alt={movie.title ?? 'movie poster'} className="object-cover" fill onLoad={() => setIsPosterLoaded(true)} />
						</div>
						{/* TITLE & DIRECTORS */}
						<div className="flex flex-col items-center">
							<h1 className="text-center font-bold line-clamp-3">{movie.title}</h1>
							{directorsText?.length && <p className="text-center text-xs line-clamp-2">{directorsText}</p>}
						</div>
					</div>
					<Icons.site.logo
					style={{
						bottom: 24,
					}}
					className="fill-accent-yellow absolute w-1/4"
					/>
				</div>
				{isLoading && (
					<div className="z-10 absolute inset-0 flex justify-center items-center bg-black/50">
						<Icons.loader />
					</div>
				)}
			</div>
		</div>
	)
};
