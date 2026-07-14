export const REVENUECAT_API_KEY = process.env.NEXT_PUBLIC_REVENUECAT_API_KEY!;

export const API_URL = process.env.NEXT_PUBLIC_API_URL!;
export const API_ENDPOINT = `${API_URL}/v1`;

export const INTERNAL_API_URL = process.env.INTERNAL_API_URL || API_URL;
export const INTERNAL_API_ENDPOINT = `${INTERNAL_API_URL}/v1`;
