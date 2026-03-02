const FETCH_TIMEOUT_MS = 15000;
const FETCH_MAX_ATTEMPTS = 3;
const FETCH_RETRY_BACKOFF_MS = [0, 700, 1600];

export type FetchResult =
  | {
      ok: true;
      status: number;
      html: string;
      attempts: number;
    }
  | {
      ok: false;
      status: number | null;
      html: "";
      attempts: number;
      failureCode: string;
      failureDetail: string;
    };

export async function fetchPageHtml(url: string): Promise<FetchResult> {
  const shouldRetryStatus = (status: number) =>
    [408, 425, 429, 500, 502, 503, 504, 522, 524].includes(status);

  const classifyFetchError = (error: unknown) => {
    if (error instanceof DOMException && error.name === "AbortError") {
      return "TIMEOUT";
    }

    const message = error instanceof Error ? error.message.toLowerCase() : "";
    if (
      message.includes("enotfound") ||
      message.includes("eai_again") ||
      message.includes("dns")
    ) {
      return "DNS_ERROR";
    }
    if (
      message.includes("ssl") ||
      message.includes("tls") ||
      message.includes("certificate")
    ) {
      return "SSL_ERROR";
    }
    return "NETWORK_ERROR";
  };

  let lastFailure: FetchResult = {
    ok: false,
    status: null,
    html: "",
    attempts: 0,
    failureCode: "UNKNOWN_ERROR",
    failureDetail: "Erreur reseau inconnue.",
  };

  for (let attempt = 1; attempt <= FETCH_MAX_ATTEMPTS; attempt += 1) {
    if (attempt > 1) {
      await new Promise((resolve) =>
        setTimeout(resolve, FETCH_RETRY_BACKOFF_MS[attempt - 1] || 2000)
      );
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": "ChronoCrawlBot/1.0 (+https://chronocrawl.com)",
        },
      });

      const html = await response.text();
      if (response.ok) {
        return {
          ok: true,
          status: response.status,
          html,
          attempts: attempt,
        };
      }

      lastFailure = {
        ok: false,
        status: response.status,
        html: "",
        attempts: attempt,
        failureCode: `HTTP_${response.status}`,
        failureDetail: `HTTP_${response.status}`,
      };

      if (!shouldRetryStatus(response.status)) {
        return lastFailure;
      }
    } catch (error: unknown) {
      const failureCode = classifyFetchError(error);
      lastFailure = {
        ok: false,
        status: null,
        html: "",
        attempts: attempt,
        failureCode,
        failureDetail: error instanceof Error ? error.message : "Fetch error",
      };
      if (attempt >= FETCH_MAX_ATTEMPTS) {
        return lastFailure;
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  return lastFailure;
}
