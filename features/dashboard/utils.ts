import type { MonitorRunLog } from "@/features/dashboard/types";
import type { ChangeEvent } from "@/features/dashboard/types";

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
      detail: "Le site a dépassé le délai de réponse.",
      hint: "Relance plus tard ou vérifie la latence du site cible.",
    };
  }

  if (status === "DNS_ERROR") {
    return {
      label: "DNS_ERROR",
      badgeClass: "bg-rose-500/20 text-rose-300",
      detail: "Le domaine est introuvable via DNS.",
      hint: "Vérifie l'URL et le nom de domaine.",
    };
  }

  if (status === "SSL_ERROR") {
    return {
      label: "SSL_ERROR",
      badgeClass: "bg-rose-500/20 text-rose-300",
      detail: "Erreur TLS/SSL sur le site cible.",
      hint: "Vérifie le certificat HTTPS du site.",
    };
  }

  if (status === "NETWORK_ERROR" || status === "ERROR") {
    return {
      label: status,
      badgeClass: "bg-amber-500/20 text-amber-300",
      detail: "Erreur réseau temporaire.",
      hint: "Relance l'analyse ; si c'est récurrent, vérifie l'accessibilité.",
    };
  }

  if (status.startsWith("HTTP_")) {
    const code = Number(status.replace("HTTP_", ""));
    if (code === 403) {
      return {
        label: status,
        badgeClass: "bg-rose-500/20 text-rose-300",
        detail: "Accès refusé par le site cible.",
        hint: "Le site bloque probablement les bots ou nécessite une authentification.",
      };
    }
    if (code === 404) {
      return {
        label: status,
        badgeClass: "bg-amber-500/20 text-amber-300",
        detail: "Page introuvable.",
        hint: "Mets à jour ou supprime cette URL.",
      };
    }
    if (code >= 500) {
      return {
        label: status,
        badgeClass: "bg-amber-500/20 text-amber-300",
        detail: "Erreur serveur du site cible.",
        hint: "Réessaie plus tard.",
      };
    }
    return {
      label: status,
      badgeClass: "bg-amber-500/20 text-amber-300",
      detail: "Requête HTTP en échec.",
      hint: "Vérifie la page et ses restrictions d'accès.",
    };
  }

  return {
    label: status,
    badgeClass: "bg-amber-500/20 text-amber-300",
    detail: "Statut de surveillance non standard.",
    hint: "Relance une analyse pour rafraîchir l'état.",
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
      label: "AUCUNE EXÉCUTION",
      badgeClass: "bg-white/10 text-gray-200",
      detail: "Lance une première analyse pour initialiser le suivi.",
    };
  }

  const status = (runLog.status || "unknown").toUpperCase();
  if (status === "SUCCESS" && failureRate <= 20) {
    return {
      label: "STABLE",
      badgeClass: "bg-emerald-500/20 text-emerald-200",
      detail: `Dernière exécution en ${runLog.duration_ms} ms.`,
    };
  }
  if (status === "PARTIAL_SUCCESS" || status === "PARTIAL") {
    return {
      label: "PARTIEL",
      badgeClass: "bg-amber-500/20 text-amber-200",
      detail:
        "Certaines URLs n'ont pas été traitées. Relance une analyse pour compléter.",
    };
  }
  if (status === "FAILED" || failureRate > 20) {
    return {
      label: "A SURVEILLER",
      badgeClass: "bg-rose-500/20 text-rose-200",
      detail: "Taux d'échec élevé. Vérifie les URLs en erreur et relance.",
    };
  }
  return {
    label: status,
    badgeClass: "bg-amber-500/20 text-amber-200",
    detail: `Exécution récente : ${runLog.duration_ms} ms, ${failureRate}% d'échec.`,
  };
}

export function getAlertPriorityInfo(event: ChangeEvent) {
  const confidence = typeof event.confidence_score === "number"
    ? event.confidence_score
    : typeof event.metadata?.priority_score === "number"
      ? event.metadata.priority_score
      : event.severity === "high"
        ? 82
        : 58;

  if (confidence >= 80) {
    return {
      label: "Priorité haute",
      reason:
        event.metadata?.priority_reason ||
        "Signal structurel ou changement fort détecté.",
      badgeClass: "bg-red-500/15 text-red-200",
    };
  }
  if (confidence >= 60) {
    return {
      label: "Priorité moyenne",
      reason:
        event.metadata?.priority_reason ||
        "Changement a suivre rapidement.",
      badgeClass: "bg-amber-500/15 text-amber-200",
    };
  }
  return {
      label: "Priorité faible",
    reason:
      event.metadata?.priority_reason ||
      "Signal peu stable ou partiellement bruité.",
    badgeClass: "bg-emerald-500/15 text-emerald-200",
  };
}
