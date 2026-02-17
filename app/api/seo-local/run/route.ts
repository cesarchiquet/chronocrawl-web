import { NextResponse } from "next/server";
import { requireUserFromRequest } from "@/lib/routeAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type SeoLocalProfile = {
  city: string | null;
  area: string | null;
  keywords: string[] | null;
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
    .select("city,area,keywords")
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

    for (const keyword of keywords.slice(0, 30)) {
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
      if (!response.ok) continue;

      const nominatimRows = (await response.json()) as NominatimRow[];
      for (const result of nominatimRows) {
        const lat = Number.parseFloat(result.lat);
        const lon = Number.parseFloat(result.lon);
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
        const distance = haversineKm(centerLat, centerLon, lat, lon);
        if (distance > areaKm) continue;

        rowsToInsert.push({
          run_id: runId,
          user_id: userId,
          keyword,
          place_name: result.display_name,
          latitude: lat,
          longitude: lon,
          distance_km: Number(distance.toFixed(2)),
          source_url: buildOsmUrl(result),
        });
      }
    }

    await supabaseAdmin.from("seo_local_runs").insert({
      id: runId,
      user_id: userId,
      city,
      area_km: areaKm,
      status: "completed",
      keywords_count: keywords.length,
      results_count: rowsToInsert.length,
      started_at: startedAt,
      finished_at: new Date().toISOString(),
      error_message: null,
    });

    if (rowsToInsert.length > 0) {
      await supabaseAdmin.from("seo_local_results").insert(rowsToInsert);
    }

    return NextResponse.json({
      runId,
      city,
      areaKm,
      keywordsCount: keywords.length,
      resultsCount: rowsToInsert.length,
    });
  } catch (error: unknown) {
    await supabaseAdmin.from("seo_local_runs").insert({
      id: runId,
      user_id: userId,
      city,
      area_km: areaKm,
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
