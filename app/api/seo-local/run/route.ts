import { NextResponse } from "next/server";
import { requireUserFromRequest } from "@/lib/routeAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type SeoLocalProfile = {
  city: string | null;
  area: string | null;
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

type KeywordTop = {
  keyword: string;
  position: number;
  place_name: string;
};

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

function deriveTargetLabels(priorityPages: string[]) {
  const domains = priorityPages
    .map((url) => normalizeDomain(url))
    .filter((value): value is string => Boolean(value));
  return Array.from(new Set(domains.map((domain) => labelFromDomain(domain))));
}

function deriveCompetitorLabels(competitorUrls: string[]) {
  const domains = competitorUrls
    .map((url) => normalizeDomain(url))
    .filter((value): value is string => Boolean(value));
  return Array.from(new Set(domains.map((domain) => labelFromDomain(domain))));
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

  results.sort((a, b) => a.distance_km - b.distance_km);
  return results;
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

  results.sort((a, b) => a.distance_km - b.distance_km);
  return results;
}

async function resolveLocalResultsForKeyword(params: {
  keyword: string;
  city: string;
  centerLat: number;
  centerLon: number;
  areaKm: number;
  preferredProvider: "google_places" | "nominatim";
  googleApiKey: string | null;
}): Promise<{ provider: "google_places" | "nominatim"; results: LocalSearchResult[] }> {
  const {
    keyword,
    city,
    centerLat,
    centerLon,
    areaKm,
    preferredProvider,
    googleApiKey,
  } = params;

  if (preferredProvider === "google_places" && googleApiKey) {
    const googleResults = await fetchGooglePlacesResults(
      keyword,
      city,
      centerLat,
      centerLon,
      areaKm,
      googleApiKey
    );

    if (googleResults.length > 0) {
      return { provider: "google_places", results: googleResults };
    }
  }

  const nominatimResults = await fetchNominatimResults(
    keyword,
    city,
    centerLat,
    centerLon,
    areaKm
  );

  return { provider: "nominatim", results: nominatimResults };
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
    .select("city,area,keywords,competitors,priority_pages")
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
  const keywords = (profile.keywords || []).map((value) => value.trim()).filter(Boolean);
  const areaKm = parseAreaKm(profile.area);
  const competitors = (profile.competitors || []).map((value) => value.trim()).filter(Boolean);
  const priorityPages = (profile.priority_pages || [])
    .map((value) => value.trim())
    .filter(Boolean);

  if (!city || keywords.length === 0) {
    return NextResponse.json(
      {
        error:
          "Configuration incomplete: ville et mots-cles locaux sont obligatoires.",
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
  const runId = crypto.randomUUID();
  const startedAt = new Date().toISOString();

  try {
    const providerEnv = process.env.SEO_LOCAL_PROVIDER?.trim().toLowerCase();
    const preferredProvider =
      providerEnv === "google_places" ? "google_places" : "nominatim";
    const googleApiKey = process.env.GOOGLE_MAPS_API_KEY || null;

    const previousTopByKeyword = new Map<string, KeywordTop>();
    const { data: latestCompletedRun } = await supabaseAdmin
      .from("seo_local_runs")
      .select("id")
      .eq("user_id", userId)
      .eq("status", "completed")
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

    const currentTopByKeyword = new Map<string, KeywordTop>();
    const targetLabels = deriveTargetLabels(priorityPages);
    const competitorLabels = deriveCompetitorLabels(competitors);

    const capturedAt = new Date().toISOString();
    let runProvider: "google_places" | "nominatim" = "nominatim";

    for (const keyword of keywords.slice(0, 30)) {
      const { provider, results } = await resolveLocalResultsForKeyword({
        keyword,
        city,
        centerLat,
        centerLon,
        areaKm,
        preferredProvider,
        googleApiKey,
      });

      if (runProvider === "nominatim" && provider === "google_places") {
        runProvider = "google_places";
      }

      if (results.length === 0) {
        baselineRowsToInsert.push({
          run_id: runId,
          user_id: userId,
          keyword,
          target_position: null,
          target_detected: false,
          competitor_best_position: null,
          competitors_detected: 0,
          top_position: null,
          top_place_name: null,
        });
        continue;
      }

      let targetPosition: number | null = null;
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

        if (
          targetPosition === null &&
          targetLabels.length > 0 &&
          isLikelyMatch(result.place_name, targetLabels)
        ) {
          targetPosition = position;
        }

        if (
          competitorLabels.length > 0 &&
          isLikelyMatch(result.place_name, competitorLabels)
        ) {
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

    await supabaseAdmin.from("seo_local_runs").insert({
      id: runId,
      user_id: userId,
      city,
      area_km: areaKm,
      provider: runProvider,
      status: "completed",
      keywords_count: keywords.length,
      results_count: rowsToInsert.length,
      started_at: startedAt,
      finished_at: new Date().toISOString(),
      error_message: null,
    });

    if (rowsToInsert.length > 0) {
      await supabaseAdmin.from("seo_local_results").insert(rowsToInsert);
      await supabaseAdmin
        .from("seo_local_keyword_positions")
        .insert(positionRowsToInsert);
    }

    if (baselineRowsToInsert.length > 0) {
      const { error } = await supabaseAdmin
        .from("seo_local_keyword_baselines")
        .insert(baselineRowsToInsert);
      if (error) {
        // Keep run execution healthy when migration is not deployed yet.
        console.error("seo_local_keyword_baselines insert failed", error.message);
      }
    }

    if (alertRowsToInsert.length > 0) {
      const { error } = await supabaseAdmin
        .from("seo_local_position_alerts")
        .insert(alertRowsToInsert);
      if (error) {
        // Keep run execution healthy when migration is not deployed yet.
        console.error("seo_local_position_alerts insert failed", error.message);
      }
    }

    return NextResponse.json({
      runId,
      city,
      areaKm,
      provider: runProvider,
      keywordsCount: keywords.length,
      resultsCount: rowsToInsert.length,
      positionsCount: positionRowsToInsert.length,
      baselinesCount: baselineRowsToInsert.length,
      alertsCount: alertRowsToInsert.length,
    });
  } catch (error: unknown) {
    await supabaseAdmin.from("seo_local_runs").insert({
      id: runId,
      user_id: userId,
      city,
      area_km: areaKm,
      provider: "nominatim",
      status: "failed",
      keywords_count: keywords.length,
      results_count: 0,
      started_at: startedAt,
      finished_at: new Date().toISOString(),
      error_message: error instanceof Error ? error.message : "run failed",
    });

    return NextResponse.json(
      { error: "Execution SEO locale impossible." },
      { status: 500 }
    );
  }
}
