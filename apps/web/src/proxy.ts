import { NextRequest, NextResponse } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { routing } from './lib/i18n/routing';
import { siteConfig } from './config/site';
import { ensureLocaleCookie } from './lib/i18n/ensure-locale-cookie';
import { getSessionCookie } from 'better-auth/cookies';

const intlMiddleware = createIntlMiddleware(routing);

export async function proxy(request: NextRequest) {
  const response = intlMiddleware(request);

  const [, maybeLocale, ...rest] = new URL(
    response.headers.get('x-middleware-rewrite') || request.url
  ).pathname.split('/');
  const isValidLocale = ([...routing.locales] as string[]).includes(maybeLocale);
  const locale = isValidLocale ? maybeLocale : routing.defaultLocale;
  const pathname = '/' + (isValidLocale ? rest.join('/') : [maybeLocale, ...rest].join('/'));

  const isBrowser =
    request.headers.get("accept")?.includes("text/html") &&
    /Mozilla|Chrome|Safari|Firefox|Edge/i.test(
      request.headers.get("user-agent") || ""
    );

  const session = getSessionCookie(request);

  /**
   * Redirect user if not logged in
   */
  if (session && isAnonOnly(pathname)) {
    if (!isBrowser) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    const redirect = request.nextUrl.searchParams.get('redirect');

    if (redirect) {
      return NextResponse.redirect(
        new URL(`/${locale}${redirect}`, request.url)
      )
    }

    return NextResponse.redirect(
      new URL(`/${locale}`, request.url)
    );
  }

  /**
   * Redirect user if logged in
   */
  if (!session && isProtected(pathname)) {
    if (!isBrowser) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    const redirectTo = encodeURIComponent(pathname);
    return NextResponse.redirect(
      new URL(`/${locale}/auth/login?redirect=${redirectTo}`, request.url)
    );
  }

  ensureLocaleCookie(request, response, locale);
  
  return (response);
}

export const config = {
  matcher: [
    "/((?!\\.well-known|api|_next|favicon\\.ico|robots\\.txt|manifest\\.webmanifest|sitemaps|opensearch\\.xml|assets|.*\\.(?:json|xml|js|css|png|jpg|jpeg|gif|svg)$).*)",
  ],
};

// Utils
const isProtected = (pathname: string) => {
  return (
    /^\/film\/[^/]+\/review\/create$/.test(pathname) ||
    /^\/film\/[^/]+\/review\/[^/]+\/edit$/.test(pathname) ||
    /^\/tv-series\/[^/]+\/review\/create$/.test(pathname) ||
    /^\/tv-series\/[^/]+\/review\/[^/]+\/edit$/.test(pathname) ||
    siteConfig.routes.authRoutes.some((path) => pathname.startsWith(path))
  );
};
const isAnonOnly = (pathname: string) => {
  return siteConfig.routes.anonRoutes.some((path) => pathname.startsWith(path));
}