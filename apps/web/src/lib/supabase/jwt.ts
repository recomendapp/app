import { jwtVerify } from "jose";
import { SUPABASE_JWT_SECRET } from "../env";
import { JwtPayload } from "@supabase/supabase-js";
import { NextRequest } from "next/server";
import { createServerClient } from "./server";
import { SupportedLocale } from "@/translations/locales";

const JWT_SECRET = new TextEncoder().encode(SUPABASE_JWT_SECRET);

export const getSupabaseClaims = async (
  request: NextRequest,
  locale?: SupportedLocale
): Promise<JwtPayload | null> => {
  try {
    const supabase = await createServerClient({ cookieStore: request.cookies, locale });
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    if (!session) {
      return null;
    }
    const { payload } = await jwtVerify(session.access_token, JWT_SECRET);
    return payload as JwtPayload;
  } catch (err) {
    console.error("[auth] error verifying token:", err);
    return null;
  }
};