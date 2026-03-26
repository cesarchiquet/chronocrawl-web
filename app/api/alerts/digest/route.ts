import { NextResponse } from "next/server";
import { requireUserFromRequest } from "@/lib/routeAuth";

function errorResponse(message: string, status: number, code: string) {
  return NextResponse.json(
    {
      error: message,
      code,
    },
    { status }
  );
}

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => ({}))) as {
    userId?: string;
  };
  const userId = payload.userId?.trim();
  const hasBearer = request.headers.get("authorization")?.startsWith("Bearer ");

  if (hasBearer) {
    const auth = await requireUserFromRequest(request);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    if (userId && userId !== auth.user.id) {
      return errorResponse("Utilisateur invalide.", 403, "USER_FORBIDDEN");
    }
  } else {
    return errorResponse("Non autorisé.", 401, "UNAUTHORIZED");
  }

  return NextResponse.json({
    sent: 0,
    processed: userId ? 1 : 0,
    code: "DISABLED",
    message:
      "Les emails liés aux alertes de monitoring sont désactivés. Seuls les emails de bienvenue et d'abonnement restent actifs.",
  });
}
