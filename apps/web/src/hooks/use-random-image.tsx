import { useMemo } from "react";

export type ImageObject = {
  src: string;
  alt?: string;
};

export function useRandomImage(images: ImageObject[]): ImageObject | null {
  const image = useMemo(() => {
    if (!images.length) return null;
    const index = Math.floor(Math.random() * images.length);
    return images[index];
  }, [images]);

  return image;
}
