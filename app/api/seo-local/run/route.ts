import { NextResponse } from "next/server";
import { requireUserFromRequest } from "@/lib/routeAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type SeoLocalProfile = {
  city: string | null;
  area: string | null;
  website_url: string | null;
  keywords: string[] | null;
  competitors: string[] | null;
  priority_pages: string[] | null;
};

type CommuneRow = {
  nom?: string;
  population?: number;
  centre?: {
    coordinates?: [number, number];
  };
};

type NominatimRow = {
  lat: string;
  lon: string;
  display_name: string;
  osm_type?: "node" | "way" | "relation";
  osm_id?: number;
};

type GooglePlacesResponse = {
  places?: Array<{
    displayName?: { text?: string };
    formattedAddress?: string;
    location?: { latitude?: number; longitude?: number };
    googleMapsUri?: string;
    websiteUri?: string;
  }>;
};

type LocalSearchResult = {
  place_name: string;
  distance_km: number;
  source_url: string | null;
  latitude: number;
  longitude: number;
  business_url: string | null;
};

type MatchSource = "name" | "source_url" | "business_url";

type MatchConfig = {
  domains: string[];
  labels: string[];
};

type KeywordTop = {
  keyword: string;
  position: number;
  place_name: string;
};

type RunStatus = "completed" | "partial" | "failed";

function haversineKm(
  originLat: number,
  originLon: number,
  targetLat: number,
  targetLon: number
) {
  const earthRadiusKm = 6371;
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const dLat = toRadians(targetLat - originLat);
  const dLon = toRadians(targetLon - originLon);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(originLat)) *
      Math.cos(toRadians(targetLat)) *
      Math.sin(dLon / 2) ** 2;
  return 2 * earthRadiusKm * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function parseAreaKm(areaValue: string | null) {
  if (!areaValue) return 10;
  const parsed = Number.parseInt(areaValue.replace(/[^0-9]/g, ""), 10);
  return [5, 10, 25, 50].includes(parsed) ? parsed : 10;
}

function buildOsmUrl(row: NominatimRow) {
  if (!row.osm_type || !row.osm_id) return null;
  return `https://www.openstreetmap.org/${row.osm_type}/${row.osm_id}`;
}

function normalizeDomain(value: string | null | undefined) {
  if (!value) return null;
  try {
    const parsed = new URL(value);
    return parsed.hostname.replace(/^www\./i, "").toLowerCase();
  } catch {
    return null;
  }
}

function labelFromDomain(domain: string) {
  const chunk = domain.split(".")[0] || "";
  return chunk.replace(/[-_]/g, " ").trim().toLowerCase();
}

function normalizeLabel(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function isLikelyMatch(placeName: string, labels: string[]) {
  const normalizedPlace = normalizeLabel(placeName);
  return labels.some((label) => normalizedPlace.includes(label));
}

function deriveMatchConfig(urls: string[]): MatchConfig {
  const domains = urls
    .map((url) => normalizeDomain(url))
    .filter((value): value is string => Boolean(value));
  const uniqueDomains = Array.from(new Set(domains));
  const labels = Array.from(
    new Set(uniqueDomains.map((domain) => normalizeLabel(labelFromDomain(domain))))
  ).filter(Boolean);
  return { domains: uniqueDomains, labels };
}

function domainMatches(candidateDomain: string, configuredDomains: string[]) {
  const normalizedCandidate = candidateDomain.replace(/^www\./i, "").toLowerCase();
  return configuredDomains.some((domain) => {
    const normalizedDomain = domain.replace(/^www\./i, "").toLowerCase();
    return (
      normalizedCandidate === normalizedDomain ||
      normalizedCandidate.endsWith(`.${normalizedDomain}`)
    );
  });
}

function detectMatchSource(result: LocalSearchResult, config: MatchConfig): MatchSource | null {
  if (config.labels.length > 0 && isLikelyMatch(result.place_name, config.labels)) {
    return "name";
  }

  const sourceDomain = normalizeDomain(result.source_url);
  if (sourceDomain && domainMatches(sourceDomain, config.domains)) {
    return "source_url";
  }

  const businessDomain = normalizeDomain(result.business_url);
  if (businessDomain && domainMatches(businessDomain, config.domains)) {
    return "business_url";
  }

  return null;
}

function dedupeResults(results: LocalSearchResult[]) {
  const unique = new Map<string, LocalSearchResult>();

  for (const row of results) {
    if (!row.place_name.trim()) continue;

    const nameKey = normalizeLabel(row.place_name.split("(")[0] || row.place_name)
      .replace(/\s+/g, " ")
      .trim();
    const domainKey =
      normalizeDomain(row.business_url) || normalizeDomain(row.source_url) || "no-domain";
    const latKey = row.latitude.toFixed(4);
    const lonKey = row.longitude.toFixed(4);
    const key = `${nameKey}|${domainKey}|${latKey}|${lonKey}`;

    const existing = unique.get(key);
    if (!existing || row.distance_km < existing.distance_km) {
      unique.set(key, row);
    }
  }

  return Array.from(unique.values()).sort((a, b) => a.distance_km - b.distance_km);
}

async function fetchNominatimResults(
  keyword: string,
  city: string,
  centerLat: number,
  centerLon: number,
  areaKm: number
): Promise<LocalSearchResult[]> {
  const query = `${keyword} ${city} france`;
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=jsonv2&countrycodes=fr&limit=25&q=${encodeURIComponent(
      query
    )}`,
    {
      headers: {
        "User-Agent": "ChronoCrawl/1.0 (seo-local engine)",
      },
    }
  );

  if (!response.ok) return [];

  const nominatimRows = (await response.json()) as NominatimRow[];
  const results: LocalSearchResult[] = [];

  for (const row of nominatimRows) {
    const lat = Number.parseFloat(row.lat);
    const lon = Number.parseFloat(row.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;

    const distance = haversineKm(centerLat, centerLon, lat, lon);
    if (distance > areaKm) continue;

    results.push({
      place_name: row.display_name,
      distance_km: Number(distance.toFixed(2)),
      source_url: buildOsmUrl(row),
      latitude: lat,
      longitude: lon,
      business_url: null,
    });
  }

  return dedupeResults(results);
}

async function fetchGooglePlacesResults(
  keyword: string,
  city: string,
  centerLat: number,
  centerLon: number,
  areaKm: number,
  apiKey: string
): Promise<LocalSearchResult[]> {
  const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask":
        "places.displayName,places.formattedAddress,places.location,places.googleMapsUri,places.websiteUri",
    },
    body: JSON.stringify({
      textQuery: `${keyword} ${city} france`,
      languageCode: "fr",
      regionCode: "FR",
      pageSize: 20,
      locationBias: {
        circle: {
          center: { latitude: centerLat, longitude: centerLon },
          radius: areaKm * 1000,
        },
      },
    }),
  });

  if (!response.ok) return [];

  const payload = (await response.json()) as GooglePlacesResponse;
  const places = payload.places || [];
  const results: LocalSearchResult[] = [];

  for (const place of places) {
    const lat = place.location?.latitude ?? Number.NaN;
    const lon = place.location?.longitude ?? Number.NaN;
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;

    const distance = haversineKm(centerLat, centerLon, lat, lon);
    if (distance > areaKm) continue;

    const label = place.displayName?.text || place.formattedAddress || "Resultat local";
    const address = place.formattedAddress ? ` (${place.formattedAddress})` : "";

    results.push({
      place_name: `${label}${address}`,
      distance_km: Number(distance.toFixed(2)),
      source_url: place.googleMapsUri || null,
      latitude: lat,
      longitude: lon,
      business_url: place.websiteUri || null,
    });
  }

  return dedupeResults(results);
}

async function resolveLocalResultsForKeyword(params: {
  keyword: string;
  city: string;
  centerLat: number;
  centerLon: number;
  areaKm: number;
  preferredProvider: "google_places" | "nominatim";
  googleApiKey: string | null;
}): Promise<{
  requestedProvider: "google_places" | "nominatim";
  usedProvider: "google_places" | "nominatim";
  usedFallback: boolean;
  results: LocalSearchResult[];
  candidateCount: number;
}> {
  const {
    keyword,
    city,
    centerLat,
    centerLon,
    areaKm,
    preferredProvider,
    googleApiKey,
  } = params;

  if (preferredProvider === "google_places") {
    if (googleApiKey) {
      const googleResults = await fetchGooglePlacesResults(
        keyword,
        city,
        centerLat,
        centerLon,
        areaKm,
        googleApiKey
      );

      if (googleResults.length > 0) {
        return {
          requestedProvider: "google_places",
          usedProvider: "google_places",
          usedFallback: false,
          results: googleResults,
          candidateCount: googleResults.length,
        };
      }
    }

    const nominatimResults = await fetchNominatimResults(
      keyword,
      city,
      centerLat,
      centerLon,
      areaKm
    );

    return {
      requestedProvider: "google_places",
      usedProvider: "nominatim",
      usedFallback: true,
      results: nominatimResults,
      candidateCount: nominatimResults.length,
    };
  }

  const nominatimResults = await fetchNominatimResults(
    keyword,
    city,
    centerLat,
    centerLon,
    areaKm
  );

  return {
    requestedProvider: "nominatim",
    usedProvider: "nominatim",
    usedFallback: false,
    results: nominatimResults,
    candidateCount: nominatimResults.length,
  };
}

export async function POST(request: Request) {
  const auth = await requireUserFromRequest(request);
  if ("error" in auth) {
    return NextResponse.json(
      { error: auth.error || "Session invalide." },
      { status: auth.status || 401 }
    );
  }

  const userId = auth.user.id;

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("seo_local_profiles")
    .select("city,area,website_url,keywords,competitors,priority_pages")
    .eq("user_id", userId)
    .maybeSingle<SeoLocalProfile>();

  if (profileError || !profile) {
    return NextResponse.json(
      {
        error:
          "Configuration SEO locale introuvable. Complete d'abord /seo-local/setup.",
      },
      { status: 400 }
    );
  }

  const city = (profile.city || "").trim();
  const websiteUrl = (profile.website_url || "").trim();
  const keywords = (profile.keywords || [])
    .map((value) => value.trim())
    .filter(Boolean)
    .slice(0, 30);
  const areaKm = parseAreaKm(profile.area);
  const competitors = (profile.competitors || []).map((value) => value.trim()).filter(Boolean);
  const priorityPages = (profile.priority_pages || [])
    .map((value) => value.trim())
    .filter(Boolean);

  if (!city || keywords.length === 0 || !websiteUrl) {
    return NextResponse.json(
      {
        error:
          "Configuration incomplete: ville, URL du site et recherches locales sont obligatoires.",
      },
      { status: 400 }
    );
  }

  const geoResponse = await fetch(
    `https://geo.api.gouv.fr/communes?nom=${encodeURIComponent(
      city
    )}&fields=nom,population,centre&boost=population&limit=10`
  );
  if (!geoResponse.ok) {
    return NextResponse.json(
      { error: "Geolocalisation ville indisponible pour le moment." },
      { status: 502 }
    );
  }

  const geoRows = (await geoResponse.json()) as CommuneRow[];
  const cityRow = geoRows.find(
    (row) =>
      Array.isArray(row.centre?.coordinates) &&
      row.centre?.coordinates?.length === 2
  );

  if (!cityRow || !cityRow.centre?.coordinates) {
    return NextResponse.json(
      { error: "Impossible de geolocaliser la ville choisie." },
      { status: 400 }
    );
  }

  const [centerLon, centerLat] = cityRow.centre.coordinates;

  const startedAtDate = new Date();
  const startedAt = startedAtDate.toISOString();

  // Soft idempotence: avoid duplicate runs launched in burst.
  const { data: previousRun } = await supabaseAdmin
    .from("seo_local_runs")
    .select("id,city,area_km,keywords_count,started_at,status")
    .eq("user_id", userId)
    .in("status", ["completed", "partial"])
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle<{
      id: string;
      city: string;
      area_km: number;
      keywords_count: number;
      started_at: string;
      status: RunStatus;
    }>();

  if (previousRun) {
    const previousTs = new Date(previousRun.started_at).getTime();
    const nowTs = startedAtDate.getTime();
    const launchedRecently = Number.isFinite(previousTs) && nowTs - previousTs < 30_000;
    const sameConfig =
      previousRun.city === city &&
      previousRun.area_km === areaKm &&
      previousRun.keywords_count === keywords.length;

    if (launchedRecently && sameConfig) {
      return NextResponse.json({
        runId: previousRun.id,
        city,
        areaKm,
        reused: true,
        message: "Une analyse identique vient d'etre lancee. Reutilisation du dernier resultat.",
      });
    }
  }

  const runId = crypto.randomUUID();

  try {
    const providerEnv = process.env.SEO_LOCAL_PROVIDER?.trim().toLowerCase();
    const googleApiKey = process.env.GOOGLE_MAPS_API_KEY || null;
    const preferredProvider: "google_places" | "nominatim" =
      providerEnv === "nominatim"
        ? "nominatim"
        : googleApiKey
          ? "google_places"
          : "nominatim";

    const previousTopByKeyword = new Map<string, KeywordTop>();
    const { data: latestCompletedRun } = await supabaseAdmin
      .from("seo_local_runs")
      .select("id")
      .eq("user_id", userId)
      .in("status", ["completed", "partial"])
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle<{ id: string }>();

    if (latestCompletedRun?.id) {
      const { data: previousRows } = await supabaseAdmin
        .from("seo_local_keyword_positions")
        .select("keyword,position,place_name")
        .eq("run_id", latestCompletedRun.id)
        .order("keyword", { ascending: true })
        .order("position", { ascending: true });

      for (const row of previousRows || []) {
        const typedRow = row as KeywordTop;
        if (!previousTopByKeyword.has(typedRow.keyword)) {
          previousTopByKeyword.set(typedRow.keyword, typedRow);
        }
      }
    }

    const rowsToInsert: Array<{
      run_id: string;
      user_id: string;
      keyword: string;
      place_name: string;
      latitude: number;
      longitude: number;
      distance_km: number;
      source_url: string | null;
    }> = [];

    const positionRowsToInsert: Array<{
      run_id: string;
      user_id: string;
      city: string;
      area_km: number;
      keyword: string;
      position: number;
      place_name: string;
      distance_km: number;
      source_url: string | null;
      captured_at: string;
    }> = [];

    const baselineRowsToInsert: Array<{
      run_id: string;
      user_id: string;
      keyword: string;
      target_position: number | null;
      target_detected: boolean;
      target_match_source: MatchSource | null;
      competitor_best_position: number | null;
      competitors_detected: number;
      top_position: number | null;
      top_place_name: string | null;
    }> = [];

    const alertRowsToInsert: Array<{
      user_id: string;
      run_id: string;
      keyword: string;
      previous_position: number;
      current_position: number;
      delta: number;
      severity: "medium" | "high";
      created_at: string;
    }> = [];

    const keywordLogRows: Array<{
      run_id: string;
      user_id: string;
      keyword: string;
      requested_provider: "google_places" | "nominatim";
      used_provider: "google_places" | "nominatim";
      used_fallback: boolean;
      candidates_found: number;
      results_kept: number;
      status: "ok" | "empty";
      latency_ms: number;
      created_at: string;
    }> = [];

    const currentTopByKeyword = new Map<string, KeywordTop>();
    const targetMatchConfig = deriveMatchConfig([websiteUrl, ...priorityPages]);
    const competitorMatchConfig = deriveMatchConfig(competitors);

    const capturedAt = new Date().toISOString();
    let runProvider: "google_places" | "nominatim" = preferredProvider;
    let fallbackUsed = false;
    let keywordsWithResults = 0;
    let totalCandidates = 0;

    for (const keyword of keywords) {
      const keywordStarted = Date.now();
      const resolved = await resolveLocalResultsForKeyword({
        keyword,
        city,
        centerLat,
        centerLon,
        areaKm,
        preferredProvider,
        googleApiKey,
      });
      const keywordDuration = Date.now() - keywordStarted;

      if (resolved.usedProvider !== preferredProvider) {
        fallbackUsed = true;
      }
      if (resolved.usedProvider === "nominatim") {
        runProvider = "nominatim";
      }

      const results = resolved.results;
      totalCandidates += resolved.candidateCount;

      keywordLogRows.push({
        run_id: runId,
        user_id: userId,
        keyword,
        requested_provider: resolved.requestedProvider,
        used_provider: resolved.usedProvider,
        used_fallback: resolved.usedFallback,
        candidates_found: resolved.candidateCount,
        results_kept: results.length,
        status: results.length > 0 ? "ok" : "empty",
        latency_ms: keywordDuration,
        created_at: capturedAt,
      });

      if (results.length === 0) {
        baselineRowsToInsert.push({
          run_id: runId,
          user_id: userId,
          keyword,
          target_position: null,
          target_detected: false,
          target_match_source: null,
          competitor_best_position: null,
          competitors_detected: 0,
          top_position: null,
          top_place_name: null,
        });
        continue;
      }

      keywordsWithResults += 1;

      let targetPosition: number | null = null;
      let targetMatchSource: MatchSource | null = null;
      let competitorBestPosition: number | null = null;
      let competitorsDetected = 0;

      for (const [index, result] of results.entries()) {
        const position = index + 1;

        rowsToInsert.push({
          run_id: runId,
          user_id: userId,
          keyword,
          place_name: result.place_name,
          latitude: result.latitude,
          longitude: result.longitude,
          distance_km: result.distance_km,
          source_url: result.source_url,
        });

        positionRowsToInsert.push({
          run_id: runId,
          user_id: userId,
          city,
          area_km: areaKm,
          keyword,
          position,
          place_name: result.place_name,
          distance_km: result.distance_km,
          source_url: result.source_url,
          captured_at: capturedAt,
        });

        if (!currentTopByKeyword.has(keyword)) {
          currentTopByKeyword.set(keyword, {
            keyword,
            position,
            place_name: result.place_name,
          });
        }

        const targetMatch = detectMatchSource(result, targetMatchConfig);
        if (targetPosition === null && targetMatch) {
          targetPosition = position;
          targetMatchSource = targetMatch;
        }

        if (detectMatchSource(result, competitorMatchConfig)) {
          competitorsDetected += 1;
          if (competitorBestPosition === null || position < competitorBestPosition) {
            competitorBestPosition = position;
          }
        }
      }

      baselineRowsToInsert.push({
        run_id: runId,
        user_id: userId,
        keyword,
        target_position: targetPosition,
        target_detected: targetPosition !== null,
        target_match_source: targetMatchSource,
        competitor_best_position: competitorBestPosition,
        competitors_detected: competitorsDetected,
        top_position: 1,
        top_place_name: results[0]?.place_name || null,
      });
    }

    for (const [keyword, currentTop] of currentTopByKeyword.entries()) {
      const previousTop = previousTopByKeyword.get(keyword);
      if (!previousTop) continue;

      const delta = currentTop.position - previousTop.position;
      if (delta < 2) continue;

      alertRowsToInsert.push({
        user_id: userId,
        run_id: runId,
        keyword,
        previous_position: previousTop.position,
        current_position: currentTop.position,
        delta,
        severity: delta >= 5 ? "high" : "medium",
        created_at: capturedAt,
      });
    }

    const finishedAt = new Date();
    const executionMs = finishedAt.getTime() - startedAtDate.getTime();
    const runStatus: RunStatus =
      keywordsWithResults === 0
        ? "failed"
        : keywordsWithResults < keywords.length
          ? "partial"
          : "completed";

    await supabaseAdmin.from("seo_local_runs").insert({
      id: runId,
      user_id: userId,
      city,
      area_km: areaKm,
      provider: runProvider,
      provider_requested: preferredProvider,
      provider_fallback_used: fallbackUsed,
      status: runStatus,
      keywords_count: keywords.length,
      keywords_with_results: keywordsWithResults,
      candidates_count: totalCandidates,
      results_count: rowsToInsert.length,
      started_at: startedAt,
      finished_at: finishedAt.toISOString(),
      execution_ms: executionMs,
      error_message: runStatus === "failed" ? "no local results" : null,
    });

    if (rowsToInsert.length > 0) {
      await supabaseAdmin.from("seo_local_results").insert(rowsToInsert);
      await supabaseAdmin.from("seo_local_keyword_positions").insert(positionRowsToInsert);
    }

    if (baselineRowsToInsert.length > 0) {
      const { error } = await supabaseAdmin
        .from("seo_local_keyword_baselines")
        .insert(baselineRowsToInsert);
      if (error) {
        console.error("seo_local_keyword_baselines insert failed", error.message);
      }
    }

    if (alertRowsToInsert.length > 0) {
      const { error } = await supabaseAdmin
        .from("seo_local_position_alerts")
        .insert(alertRowsToInsert);
      if (error) {
        console.error("seo_local_position_alerts insert failed", error.message);
      }
    }

    if (keywordLogRows.length > 0) {
      const { error } = await supabaseAdmin
        .from("seo_local_engine_logs")
        .insert(keywordLogRows);
      if (error) {
        console.error("seo_local_engine_logs insert failed", error.message);
      }
    }

    return NextResponse.json({
      runId,
      city,
      areaKm,
      provider: runProvider,
      providerRequested: preferredProvider,
      fallbackUsed,
      status: runStatus,
      keywordsCount: keywords.length,
      keywordsWithResults,
      candidatesCount: totalCandidates,
      resultsCount: rowsToInsert.length,
      positionsCount: positionRowsToInsert.length,
      baselinesCount: baselineRowsToInsert.length,
      alertsCount: alertRowsToInsert.length,
      executionMs,
    });
  } catch (error: unknown) {
    await supabaseAdmin.from("seo_local_runs").insert({
      id: runId,
      user_id: userId,
      city,
      area_km: areaKm,
      provider: "nominatim",
      provider_requested: "nominatim",
      provider_fallback_used: false,
      status: "failed",
      keywords_count: keywords.length,
      keywords_with_results: 0,
      candidates_count: 0,
      results_count: 0,
      started_at: startedAt,
      finished_at: new Date().toISOString(),
      execution_ms: Date.now() - startedAtDate.getTime(),
      error_message: error instanceof Error ? error.message : "run failed",
    });

    return NextResponse.json(
      { error: "Execution SEO locale impossible." },
      { status: 500 }
    );
  }
}
