import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const cacheTags = request.nextUrl.searchParams.get('cacheTags');

  if (!cacheTags) {
    return NextResponse.json(
      { message: 'Missing cacheTags param' },
      { status: 401 }
    );
  }

  const parsedCacheTags = cacheTags.split(',');
  parsedCacheTags.forEach((cacheTag: string) => {
    // revalidateTag(cacheTag, 'manual');
  });

  return NextResponse.json({ revalidated: true, now: Date.now() });
}