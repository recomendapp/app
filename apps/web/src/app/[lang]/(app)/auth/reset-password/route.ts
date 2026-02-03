import { createServerClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const proto = new URL(request.url).protocol;
  const host = request.headers.get("host") ?? "";
  try {
    const code = requestUrl.searchParams.get('code');
    if (!code) throw new Error('No code provided');
    const supabase = await createServerClient({ cookieStore: request.cookies });
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw error;

    return NextResponse.redirect(`${proto}//${host}/settings/security`);
  } catch (error) {
    const errorMessage = (error instanceof Error) ? error.message : 'Une erreur est survenue';
    return NextResponse.redirect(`${proto}//${host}/auth/error?error=${errorMessage}`);
  }
}
