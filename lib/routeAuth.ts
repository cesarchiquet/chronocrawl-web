import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function requireUserFromRequest(request: Request) {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length).trim()
    : "";

  if (!token) {
    return { error: "Session manquante.", status: 401 as const };
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) {
    return { error: "Session invalide.", status: 401 as const };
  }

  return { user: data.user, token };
}
