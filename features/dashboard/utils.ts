import type { MonitorRunLog } from "@/features/dashboard/types";

export function getUrlStatusInfo(statusRaw: string | null) {
  const status = (statusRaw || "OK").toUpperCase();

  if (status === "OK") {
    return {
      label: "OK",
      badgeClass: "bg-emerald-500/20 text-emerald-300",
      detail: "Surveillance active.",
      hint: "",
    };
  }

  if (status === "TIMEOUT") {
    return {
      label: "TIMEOUT",
      badgeClass: "bg-amber-500/20 text-amber-300",
      detail: "Le site a depasse le delai de reponse.",
      hint: "Relance plus tard ou verifie la latence du site cible.",
    };
  }

  if (status === "DNS_ERROR") {
    return {
      label: "DNS_ERROR",
      badgeClass: "bg-rose-500/20 text-rose-300",
      detail: "Le domaine est introuvable via DNS.",
      hint: "Verifie l'URL et le nom de domaine.",
    };
  }

  if (status === "SSL_ERROR") {
    return {
      label: "SSL_ERROR",
      badgeClass: "bg-rose-500/20 text-rose-300",
      detail: "Erreur TLS/SSL sur le site cible.",
      hint: "Verifie le certificat HTTPS du site.",
    };
  }

  if (status === "NETWORK_ERROR" || status === "ERROR") {
    return {
      label: status,
      badgeClass: "bg-amber-500/20 text-amber-300",
      detail: "Erreur reseau temporaire.",
      hint: "Relance l'analyse; si recurrent, verifier l'accessibilite.",
    };
  }

  if (status.startsWith("HTTP_")) {
    const code = Number(status.replace("HTTP_", ""));
    if (code === 403) {
      return {
        label: status,
        badgeClass: "bg-rose-500/20 text-rose-300",
        detail: "Acces refuse par le site cible.",
        hint: "Le site bloque probablement les bots ou necessite auth.",
      };
    }
    if (code === 404) {
      return {
        label: status,
        badgeClass: "bg-amber-500/20 text-amber-300",
        detail: "Page introuvable.",
        hint: "Met a jour ou supprime cette URL.",
      };
    }
    if (code >= 500) {
      return {
        label: status,
        badgeClass: "bg-amber-500/20 text-amber-300",
        detail: "Erreur serveur du site cible.",
        hint: "Reessaye plus tard.",
      };
    }
    return {
      label: status,
      badgeClass: "bg-amber-500/20 text-amber-300",
      detail: "Requete HTTP en echec.",
      hint: "Verifier la page et ses restrictions d'acces.",
    };
  }

  return {
    label: status,
    badgeClass: "bg-amber-500/20 text-amber-300",
    detail: "Statut de surveillance non standard.",
    hint: "Relance une analyse pour rafraichir l'etat.",
  };
}

export function normalizeMonitoredUrl(rawUrl: string) {
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return null;
    }

    parsed.hash = "";
    if (parsed.pathname.endsWith("/") && parsed.pathname !== "/") {
      parsed.pathname = parsed.pathname.slice(0, -1);
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

export function formatDateTimeFr(value: string | null) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("fr-FR");
}

export function getRunHealthInfo(
  runLog: MonitorRunLog | null,
  failureRate: number
): { label: string; badgeClass: string; detail: string } {
  if (!runLog) {
    return {
      label: "AUCUNE EXECUTION",
      badgeClass: "bg-white/10 text-gray-200",
      detail: "Lance une premiere analyse pour initialiser le suivi.",
    };
  }

  const status = (runLog.status || "unknown").toUpperCase();
  if (status === "SUCCESS" && failureRate <= 20) {
    return {
      label: "STABLE",
      badgeClass: "bg-emerald-500/20 text-emerald-200",
      detail: `Derniere execution en ${runLog.duration_ms} ms.`,
    };
  }
  if (status === "PARTIAL_SUCCESS" || status === "PARTIAL") {
    return {
      label: "PARTIEL",
      badgeClass: "bg-amber-500/20 text-amber-200",
      detail:
        "Certaines URLs n'ont pas ete traitees. Relance une analyse pour completer.",
    };
  }
  if (status === "FAILED" || failureRate > 20) {
    return {
      label: "A SURVEILLER",
      badgeClass: "bg-rose-500/20 text-rose-200",
      detail: "Taux d'echec eleve. Verifie les URLs en erreur et relance.",
    };
  }
  return {
    label: status,
    badgeClass: "bg-amber-500/20 text-amber-200",
    detail: `Execution recente: ${runLog.duration_ms} ms, ${failureRate}% d'echec.`,
  };
}
