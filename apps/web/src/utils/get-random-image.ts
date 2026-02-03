import { ImageObject } from "../hooks/use-random-image";

export function getRandomImage(images: ImageObject[]): ImageObject | null {
  const randomIndex = Math.floor(Math.random() * images.length);
  return images[randomIndex] ?? null;
}
