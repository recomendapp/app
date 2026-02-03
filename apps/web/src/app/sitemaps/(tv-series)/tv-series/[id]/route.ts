import { createAnonClient } from "@/lib/supabase/anon";
import { NextResponse } from "next/server";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = createAnonClient();
  const { id } = await params;
  const { data, error } = await supabase.storage
    .from("sitemaps")
    .download(`tv-series/${id}.xml.gz`);
  if (error || !data) {
    return new NextResponse("[sitemap] tv-series page not found", { status: 404 });
  }
  return new NextResponse(data, {
    headers: {
      "Content-Type": "application/xml",
      "Content-Encoding": "gzip",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
