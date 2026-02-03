import {NextRequest, NextResponse} from 'next/server';
import { localeCookieName } from './routing';

export function ensureLocaleCookie(
  request: NextRequest,
  response: NextResponse,
  locale: string
) {
  const hasCookie =
    request.cookies.has(localeCookieName) ||
    response.cookies.has(localeCookieName);

  if (hasCookie) return;

  response.cookies.set(localeCookieName, locale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365
  });
}
