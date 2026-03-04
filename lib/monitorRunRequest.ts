import type { MonitorSeverity } from "@/lib/monitorDiff";

export type MonitorRunRequestParsed = {
  continueQueue: boolean;
  selectedSeverities: MonitorSeverity[];
};

export type MonitorRunRequestError = {
  message: string;
  code: string;
};

export function parseMonitorRunRequestBody(rawBody: {
  continueQueue?: unknown;
  severities?: unknown;
  minSeverity?: unknown;
}): MonitorRunRequestParsed | MonitorRunRequestError {
  let continueQueue = false;
  let selectedSeverities: MonitorSeverity[] = ["medium", "high"];

  if (
    Object.prototype.hasOwnProperty.call(rawBody, "continueQueue") &&
    typeof rawBody.continueQueue !== "boolean"
  ) {
    return {
      message: "Le champ continueQueue doit etre un booleen.",
      code: "INVALID_BODY",
    };
  }
  continueQueue = rawBody.continueQueue === true;

  if (Object.prototype.hasOwnProperty.call(rawBody, "severities")) {
    if (
      !Array.isArray(rawBody.severities) ||
      rawBody.severities.some(
        (value) => !["medium", "high"].includes(String(value))
      )
    ) {
      return {
        message: "Le champ severities doit etre une liste parmi medium, high.",
        code: "INVALID_BODY",
      };
    }

    const deduped = Array.from(
      new Set(rawBody.severities.map((value) => String(value)))
    ) as MonitorSeverity[];

    if (deduped.length === 0) {
      return {
        message: "Le champ severities doit contenir au moins une valeur.",
        code: "INVALID_BODY",
      };
    }

    selectedSeverities = ["medium", "high"].filter((severity) =>
      deduped.includes(severity as MonitorSeverity)
    ) as MonitorSeverity[];
  }

  if (Object.prototype.hasOwnProperty.call(rawBody, "minSeverity")) {
    const validSeverities = ["all", "medium", "high"];
    if (
      typeof rawBody.minSeverity !== "string" ||
      !validSeverities.includes(rawBody.minSeverity)
    ) {
      return {
        message: "Le champ minSeverity doit valoir all, medium ou high.",
        code: "INVALID_BODY",
      };
    }
    const minSeverity = rawBody.minSeverity as "all" | "medium" | "high";
    selectedSeverities =
      minSeverity === "all"
        ? ["medium", "high"]
        : minSeverity === "medium"
            ? ["medium", "high"]
            : ["high"];
  }

  return { continueQueue, selectedSeverities };
}
