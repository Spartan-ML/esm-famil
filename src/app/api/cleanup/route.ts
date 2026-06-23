import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// Called by Vercel Cron (see vercel.json) every 5 minutes.
// Deletes rooms that have been closed for more than 10 minutes.
export async function GET(request: Request) {
  // Simple shared secret to prevent unauthorized calls
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - 10 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("rooms")
    .delete()
    .eq("status", "closed")
    .lt("closed_at", cutoff)
    .select("code");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    deleted: data?.length ?? 0,
    codes: data?.map((r) => r.code),
  });
}
