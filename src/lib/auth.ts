import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Server-side auth guard. Used instead of Next middleware because Next 16
// runs `proxy` only on the Node runtime, which the Cloudflare OpenNext
// adapter does not support. Call at the top of every protected layout/page.
export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return user;
}
