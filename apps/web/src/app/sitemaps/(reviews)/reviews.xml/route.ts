import { createAnonClient } from "@/lib/supabase/anon";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = createAnonClient();
  const { data, error } = await supabase.storage
    .from("sitemaps")
    .download("reviews/index.xml.gz");

  if (error || !data) {
    return new NextResponse("[sitemap] reviews index not found", { status: 404 });
  }

  return new NextResponse(data, {
    headers: {
      "Content-Type": "application/xml",
      "Content-Encoding": "gzip",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
