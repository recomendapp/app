import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export const getInitiales = (name: string | undefined | null) => {
  if (!name) return null;
  const words = name.normalize('NFKC').toUpperCase().split(' ');
  let initials = '';
  if (words.length === 1) {
    initials = words[0].charAt(0);
  } else if (words.length >= 2) {
    for (let i = 0; i < 2; i++) {
      initials += words[i].charAt(0);
    }
  }
  return initials;
};

export function ConvertHoursMinutes(runtime: number | null | undefined) {
  if (!runtime) return "N/A";
  const heures = Math.floor(runtime / 60);
  const minutes = runtime % 60;
  const minutesFormat = minutes < 10 ? `0${minutes}` : minutes;

  return `${heures}h${minutesFormat}`;
}

export function convertDate(date: string) {
  const parts = date.split('-');
  const year = parts[0];
  const month = parts[1];
  const day = parts[2];

  return `${day}/${month}/${year}`;
}

export function toISO8601Duration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `PT${h > 0 ? `${h}H` : ''}${m > 0 ? `${m}M` : ''}`;
}

export const getURL = () => {
	let url =
		process?.env?.NEXT_PUBLIC_SITE_URL ?? // Set this to your site URL in production env.
		process?.env?.NEXT_PUBLIC_VERCEL_URL ?? // Automatically set by Vercel.
		'http://localhost:3000/'
	// Make sure to include `https://` when not localhost.
	url = url.includes('http') ? url : `https://${url}`
	// Make sure to not include a trailing `/`.
	url = url.charAt(url.length - 1) === '/' ? url.slice(0, -1) : url
	return url
}

