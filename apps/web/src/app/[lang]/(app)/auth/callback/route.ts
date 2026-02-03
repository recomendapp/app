import { createServerClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const proto = new URL(request.url).protocol;
  const host = request.headers.get("host") ?? "";
  try {
    const code = requestUrl.searchParams.get('code');
    // Get error from Supabase OAuth2 callback
    const errorParam = requestUrl.searchParams.get('error');
    const errorDescriptionParam = requestUrl.searchParams.get('error_description');
    const next = requestUrl.searchParams.get('next');
    const redirect = requestUrl.searchParams.get('redirect');
    if (errorParam && !code) throw new Error(errorDescriptionParam || 'Something went wrong');
    if (!code) throw new Error('No code provided');
    const supabase = await createServerClient({ cookieStore: request.cookies });
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw error;
  
    if (redirect)
      return NextResponse.redirect(`${proto}//${host}${redirect}`);
    else if (next)
      return NextResponse.redirect(next);
    else
      return NextResponse.redirect(`${proto}//${host}/`);
  } catch (error) {
    const errorMessage = (error instanceof Error) ? error.message : 'Une erreur est survenue';
    return NextResponse.redirect(`${proto}//${host}/auth/error?error=${errorMessage}`);
  }
}
