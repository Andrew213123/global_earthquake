from __future__ import annotations

import json
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any


PROJECT_ROOT = Path(__file__).resolve().parents[1]
OUTPUT_ROOT = PROJECT_ROOT / "data" / "geoboundaries"
ADM1_OUTPUT_ROOT = OUTPUT_ROOT / "adm1"
TRANSLATION_CACHE_PATH = OUTPUT_ROOT / "translation-cache.json"
LOCAL_ADM0_SOURCE_PATH = PROJECT_ROOT / "geo_data" / "geoBoundariesCGAZ_ADM0.geojson"
LOCAL_ADM1_SOURCE_PATH = PROJECT_ROOT / "geo_data" / "geoBoundariesCGAZ_ADM1.geojson"
ADM0_API_URL = "https://www.geoboundaries.org/api/current/gbOpen/ALL/ADM0/"
ADM1_API_URL = "https://www.geoboundaries.org/api/current/gbOpen/ALL/ADM1/"
USER_AGENT = "QuakePrototype/1.0 (geoBoundaries importer)"
REQUEST_TIMEOUT = 120
TRANSLATE_DELAY_SECONDS = 0.08
RETRY_LIMIT = 4
ADM0_SIMPLIFY_TOLERANCE = 0.01
ADM1_SIMPLIFY_TOLERANCE = 0.005
COORDINATE_PRECISION = 4

COUNTRY_NAME_OVERRIDES_ZH = {
    "Taiwan": "中国台湾",
}

SUBDIVISION_NAME_OVERRIDES_ZH = {
    ("CHN", "Inner Mongolia"): "内蒙古自治区",
    ("CHN", "Xinjiang Uyghur Autonomous Region"): "新疆维吾尔自治区",
    ("CHN", "Ningxia Hui Autonomous Region"): "宁夏回族自治区",
    ("CHN", "Guangxi Zhuang Autonomous Region"): "广西壮族自治区",
    ("CHN", "Tibet Autonomous Region"): "西藏自治区",
    ("CHN", "Hong Kong"): "香港特别行政区",
    ("CHN", "Macau"): "澳门特别行政区",
}

ATTRIBUTION_TEXT = """geoBoundaries data integrated from https://www.geoboundaries.org/globalDownloads.html
API reference: https://www.geoboundaries.org/api.html
Release type: gbOpen
Products used:
- Global ADM0 built from per-country simplifiedGeometryGeoJSON downloads
- ADM1 per-country simplifiedGeometryGeoJSON downloads
Attribution is required by geoBoundaries for dataset use.
"""


def log(message: str) -> None:
    safe = message.encode(sys.stdout.encoding or "utf-8", errors="replace").decode(
        sys.stdout.encoding or "utf-8",
        errors="replace",
    )
    print(safe, flush=True)


def ensure_output_dirs() -> None:
    OUTPUT_ROOT.mkdir(parents=True, exist_ok=True)
    ADM1_OUTPUT_ROOT.mkdir(parents=True, exist_ok=True)


def fetch_json(url: str) -> Any:
    request = urllib.request.Request(
        url,
        headers={
            "User-Agent": USER_AGENT,
            "Accept": "application/json, application/geo+json",
        },
    )
    last_error: Exception | None = None
    for attempt in range(1, RETRY_LIMIT + 1):
        try:
            with urllib.request.urlopen(request, timeout=REQUEST_TIMEOUT) as response:
                charset = response.headers.get_content_charset() or "utf-8"
                return json.loads(response.read().decode(charset))
        except Exception as error:  # noqa: BLE001
            last_error = error
            if attempt >= RETRY_LIMIT:
                break
            time.sleep(1.2 * attempt)
    raise RuntimeError(f"Failed to fetch JSON from {url}") from last_error


def load_translation_cache() -> dict[str, str]:
    if not TRANSLATION_CACHE_PATH.exists():
        return {}
    return json.loads(TRANSLATION_CACHE_PATH.read_text(encoding="utf-8"))


def save_translation_cache(cache: dict[str, str]) -> None:
    TRANSLATION_CACHE_PATH.write_text(
        json.dumps(cache, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )


def contains_cjk(value: str) -> bool:
    return any("\u4e00" <= char <= "\u9fff" for char in value)


def is_blank(value: str | None) -> bool:
    return not str(value or "").strip()


def translate_to_zh(text: str, cache: dict[str, str]) -> str:
    source = text.strip()
    if not source:
        return ""
    if contains_cjk(source):
        return source
    if source in cache:
        return cache[source]

    url = (
        "https://translate.googleapis.com/translate_a/single"
        f"?client=gtx&sl=auto&tl=zh-CN&dt=t&q={urllib.parse.quote(source)}"
    )

    last_error: Exception | None = None
    for attempt in range(1, RETRY_LIMIT + 1):
        try:
            request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
            with urllib.request.urlopen(request, timeout=REQUEST_TIMEOUT) as response:
                payload = json.loads(response.read().decode("utf-8"))
            translated = "".join(
                part[0] for part in payload[0] if isinstance(part, list) and part and part[0]
            ).strip()
            cache[source] = translated or source
            time.sleep(TRANSLATE_DELAY_SECONDS)
            return cache[source]
        except Exception as error:  # noqa: BLE001
            last_error = error
            if attempt >= RETRY_LIMIT:
                break
            time.sleep(1.5 * attempt)

    cache[source] = source
    log(f"[warn] translate fallback: {source} ({last_error})")
    return source


def translate_many_to_zh(texts: list[str], cache: dict[str, str]) -> None:
    uncached = []
    seen = set()
    for text in texts:
        source = text.strip()
        if not source or contains_cjk(source) or source in cache or source in seen:
            continue
        seen.add(source)
        uncached.append(source)

    if not uncached:
        return

    max_chunk_chars = 3200
    chunks: list[list[str]] = []
    current_chunk: list[str] = []
    current_size = 0

    for text in uncached:
        projected_size = current_size + len(text) + 1
        if current_chunk and projected_size > max_chunk_chars:
            chunks.append(current_chunk)
            current_chunk = [text]
            current_size = len(text) + 1
        else:
            current_chunk.append(text)
            current_size = projected_size

    if current_chunk:
        chunks.append(current_chunk)

    for chunk in chunks:
        source = "\n".join(chunk)
        url = (
            "https://translate.googleapis.com/translate_a/single"
            f"?client=gtx&sl=auto&tl=zh-CN&dt=t&q={urllib.parse.quote(source)}"
        )
        last_error: Exception | None = None
        translated_lines: list[str] | None = None
        for attempt in range(1, RETRY_LIMIT + 1):
            try:
                request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
                with urllib.request.urlopen(request, timeout=REQUEST_TIMEOUT) as response:
                    payload = json.loads(response.read().decode("utf-8"))
                translated = "".join(
                    part[0] for part in payload[0] if isinstance(part, list) and part and part[0]
                )
                translated_lines = translated.splitlines()
                if len(translated_lines) != len(chunk):
                    translated_lines = None
                    raise ValueError("Translated line count mismatch")
                break
            except Exception as error:  # noqa: BLE001
                last_error = error
                if attempt >= RETRY_LIMIT:
                    break
                time.sleep(1.5 * attempt)

        if translated_lines is None:
            log(f"[warn] batch translate fallback for {len(chunk)} items ({last_error})")
            for text in chunk:
                translate_to_zh(text, cache)
            continue

        for original, translated in zip(chunk, translated_lines, strict=True):
            cache[original] = translated.strip() or original


def normalize_continent(continent: str, subregion: str) -> str:
    continent_value = (continent or "").strip().lower()
    subregion_value = (subregion or "").strip().lower()

    if "antarctica" in continent_value:
        return "antarctica"
    if "africa" in continent_value:
        return "africa"
    if "asia" in continent_value:
        return "asia"
    if "europe" in continent_value:
        return "europe"
    if "oceania" in continent_value:
        return "oceania"
    if "northern america" in subregion_value:
        return "north-america"
    if "central america" in subregion_value:
        return "north-america"
    if "caribbean" in subregion_value:
        return "north-america"
    if "south america" in subregion_value:
        return "south-america"
    if "latin america" in continent_value:
        return "south-america"
    return "all"


def compact_properties(properties: dict[str, Any], allowed_keys: list[str]) -> dict[str, Any]:
    return {key: properties.get(key) for key in allowed_keys if properties.get(key) not in (None, "")}


def load_local_geojson(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def round_coordinate(value: float) -> float:
    return round(float(value), COORDINATE_PRECISION)


def remove_duplicate_points(points: list[list[float]]) -> list[list[float]]:
    cleaned: list[list[float]] = []
    for point in points:
        if len(point) < 2:
            continue
        normalized = [round_coordinate(point[0]), round_coordinate(point[1])]
        if not cleaned or cleaned[-1] != normalized:
            cleaned.append(normalized)
    return cleaned


def perpendicular_distance(point: list[float], start: list[float], end: list[float]) -> float:
    if start == end:
        return ((point[0] - start[0]) ** 2 + (point[1] - start[1]) ** 2) ** 0.5

    dx = end[0] - start[0]
    dy = end[1] - start[1]
    numerator = abs(dy * point[0] - dx * point[1] + end[0] * start[1] - end[1] * start[0])
    denominator = (dx * dx + dy * dy) ** 0.5 or 1e-9
    return numerator / denominator


def rdp(points: list[list[float]], tolerance: float) -> list[list[float]]:
    if len(points) <= 2:
        return points[:]

    max_distance = -1.0
    split_index = -1
    start = points[0]
    end = points[-1]

    for index in range(1, len(points) - 1):
        distance = perpendicular_distance(points[index], start, end)
        if distance > max_distance:
            max_distance = distance
            split_index = index

    if max_distance > tolerance and split_index != -1:
        left = rdp(points[: split_index + 1], tolerance)
        right = rdp(points[split_index:], tolerance)
        return left[:-1] + right

    return [start, end]


def simplify_ring(points: list[list[float]], tolerance: float) -> list[list[float]]:
    cleaned = remove_duplicate_points(points)
    if len(cleaned) < 4:
        return cleaned

    is_closed = cleaned[0] == cleaned[-1]
    open_points = cleaned[:-1] if is_closed else cleaned
    if len(open_points) < 3:
        return cleaned

    simplified_open = rdp(open_points, tolerance)
    if len(simplified_open) < 3:
        simplified_open = open_points

    simplified_closed = simplified_open + [simplified_open[0]]
    if len(simplified_closed) < 4:
        return cleaned
    return simplified_closed


def simplify_geometry(geometry: dict[str, Any] | None, tolerance: float) -> dict[str, Any] | None:
    if not geometry:
        return None

    geometry_type = geometry.get("type")
    coordinates = geometry.get("coordinates")
    if not geometry_type or coordinates is None:
        return None

    if geometry_type == "Polygon":
        rings = [simplify_ring(ring, tolerance) for ring in coordinates]
        rings = [ring for ring in rings if len(ring) >= 4]
        if not rings:
            return None
        return {"type": "Polygon", "coordinates": rings}

    if geometry_type == "MultiPolygon":
        polygons = []
        for polygon in coordinates:
            rings = [simplify_ring(ring, tolerance) for ring in polygon]
            rings = [ring for ring in rings if len(ring) >= 4]
            if rings:
                polygons.append(rings)
        if not polygons:
            return None
        return {"type": "MultiPolygon", "coordinates": polygons}

    return geometry


def process_adm0_feature(feature: dict[str, Any], meta: dict[str, Any], cache: dict[str, str]) -> dict[str, Any]:
    properties = feature.get("properties") or {}
    country_name_en = str(properties.get("shapeName") or meta.get("boundaryName") or "").strip()
    country_iso = str(properties.get("shapeISO") or meta.get("boundaryISO") or "").strip().upper()
    country_name_zh = COUNTRY_NAME_OVERRIDES_ZH.get(country_name_en) or translate_to_zh(country_name_en, cache)

    next_properties = compact_properties(
        {
            "name": country_name_en,
            "nameZh": country_name_zh,
            "iso_a3": country_iso,
            "shapeGroup": properties.get("shapeGroup") or country_iso,
            "shapeType": "ADM0",
            "gbContinent": meta.get("Continent") or "",
            "gbSubregion": meta.get("UNSDG-subregion") or "",
            "gbContinentKey": normalize_continent(
                str(meta.get("Continent") or ""),
                str(meta.get("UNSDG-subregion") or ""),
            ),
            "gbBoundaryId": meta.get("boundaryID") or "",
            "gbBuildDate": meta.get("buildDate") or "",
            "gbLicense": meta.get("boundaryLicense") or "",
            "gbSource": meta.get("boundarySource") or "",
            "gbSourceUrl": meta.get("boundarySourceURL") or meta.get("licenseSource") or "",
        },
        [
            "name",
            "nameZh",
            "iso_a3",
            "shapeGroup",
            "shapeType",
            "gbContinent",
            "gbSubregion",
            "gbContinentKey",
            "gbBoundaryId",
            "gbBuildDate",
            "gbLicense",
            "gbSource",
            "gbSourceUrl",
        ],
    )

    return {
        "type": "Feature",
        "id": country_iso or feature.get("id") or country_name_en,
        "properties": next_properties,
        "geometry": feature.get("geometry"),
    }


def process_adm1_feature(
    feature: dict[str, Any],
    meta: dict[str, Any],
    country_name_zh: str,
    cache: dict[str, str],
) -> dict[str, Any]:
    properties = feature.get("properties") or {}
    country_iso = str(properties.get("shapeISO") or meta.get("boundaryISO") or "").strip().upper()
    subdivision_name_en = str(properties.get("shapeName") or "").strip()
    subdivision_name_zh = SUBDIVISION_NAME_OVERRIDES_ZH.get((country_iso, subdivision_name_en))
    if is_blank(subdivision_name_zh):
        subdivision_name_zh = translate_to_zh(subdivision_name_en, cache)

    next_properties = compact_properties(
        {
            "shapeName": subdivision_name_en,
            "shapeNameZh": subdivision_name_zh,
            "shapeISO": country_iso,
            "shapeID": properties.get("shapeID") or "",
            "shapeGroup": properties.get("shapeGroup") or country_iso,
            "shapeType": "ADM1",
            "countryName": meta.get("boundaryName") or "",
            "countryNameZh": country_name_zh,
            "gbContinent": meta.get("Continent") or "",
            "gbSubregion": meta.get("UNSDG-subregion") or "",
            "gbContinentKey": normalize_continent(
                str(meta.get("Continent") or ""),
                str(meta.get("UNSDG-subregion") or ""),
            ),
            "gbBoundaryId": meta.get("boundaryID") or "",
            "gbBuildDate": meta.get("buildDate") or "",
            "gbLicense": meta.get("boundaryLicense") or "",
            "gbSource": meta.get("boundarySource") or "",
            "gbSourceUrl": meta.get("boundarySourceURL") or meta.get("licenseSource") or "",
        },
        [
            "shapeName",
            "shapeNameZh",
            "shapeISO",
            "shapeID",
            "shapeGroup",
            "shapeType",
            "countryName",
            "countryNameZh",
            "gbContinent",
            "gbSubregion",
            "gbContinentKey",
            "gbBoundaryId",
            "gbBuildDate",
            "gbLicense",
            "gbSource",
            "gbSourceUrl",
        ],
    )

    return {
        "type": "Feature",
        "id": properties.get("shapeID") or feature.get("id") or subdivision_name_en,
        "properties": next_properties,
        "geometry": feature.get("geometry"),
    }


def process_local_adm0_feature(feature: dict[str, Any], cache: dict[str, str]) -> dict[str, Any] | None:
    properties = feature.get("properties") or {}
    country_name_en = str(properties.get("shapeName") or "").strip()
    country_iso = str(properties.get("shapeGroup") or properties.get("shapeISO") or "").strip().upper()
    if not country_name_en or not country_iso:
        return None

    country_name_zh = COUNTRY_NAME_OVERRIDES_ZH.get(country_name_en) or translate_to_zh(country_name_en, cache)
    geometry = simplify_geometry(feature.get("geometry"), ADM0_SIMPLIFY_TOLERANCE)
    if not geometry:
        return None

    return {
        "type": "Feature",
        "id": country_iso,
        "properties": {
            "name": country_name_en,
            "nameZh": country_name_zh,
            "iso_a3": country_iso,
            "shapeGroup": country_iso,
            "shapeType": "ADM0",
            "gbSource": "geoBoundaries CGAZ local",
            "gbSourceUrl": "https://www.geoboundaries.org/globalDownloads.html",
        },
        "geometry": geometry,
    }


def process_local_adm1_feature(
    feature: dict[str, Any],
    country_name_en: str,
    country_name_zh: str,
    cache: dict[str, str],
) -> dict[str, Any] | None:
    properties = feature.get("properties") or {}
    country_iso = str(properties.get("shapeGroup") or properties.get("shapeISO") or "").strip().upper()
    subdivision_name_en = str(properties.get("shapeName") or "").strip()
    subdivision_id = str(properties.get("shapeID") or "").strip()
    if not country_iso or not subdivision_name_en:
        return None

    subdivision_name_zh = SUBDIVISION_NAME_OVERRIDES_ZH.get((country_iso, subdivision_name_en))
    if is_blank(subdivision_name_zh):
        subdivision_name_zh = translate_to_zh(subdivision_name_en, cache)

    geometry = simplify_geometry(feature.get("geometry"), ADM1_SIMPLIFY_TOLERANCE)
    if not geometry:
        return None

    return {
        "type": "Feature",
        "id": subdivision_id or f"{country_iso}-{subdivision_name_en}",
        "properties": {
            "shapeName": subdivision_name_en,
            "shapeNameZh": subdivision_name_zh,
            "shapeISO": country_iso,
            "shapeID": subdivision_id,
            "shapeGroup": country_iso,
            "shapeType": "ADM1",
            "countryName": country_name_en,
            "countryNameZh": country_name_zh,
            "gbSource": "geoBoundaries CGAZ local",
            "gbSourceUrl": "https://www.geoboundaries.org/globalDownloads.html",
        },
        "geometry": geometry,
    }


def build_local_adm0_dataset(raw_adm0: dict[str, Any], cache: dict[str, str]) -> tuple[dict[str, Any], dict[str, dict[str, str]]]:
    features: list[dict[str, Any]] = []
    labels_by_iso: dict[str, dict[str, str]] = {}
    raw_features = raw_adm0.get("features") or []
    total = len(raw_features)
    for index, feature in enumerate(raw_features, start=1):
        properties = feature.get("properties") or {}
        country_iso = str(properties.get("shapeGroup") or properties.get("shapeISO") or "").strip().upper()
        country_name = str(properties.get("shapeName") or country_iso)
        log(f"[ADM0 {index}/{total}] {country_iso} {country_name}")
        processed = process_local_adm0_feature(feature, cache)
        if not processed:
            continue
        features.append(processed)
        labels_by_iso[country_iso] = {
            "countryName": processed["properties"]["name"],
            "countryNameZh": processed["properties"]["nameZh"],
        }

    payload = {
        "type": "FeatureCollection",
        "metadata": {
            "source": "geoBoundaries CGAZ local",
            "sourceUrl": "https://www.geoboundaries.org/globalDownloads.html",
            "featureCount": len(features),
            "boundaryType": "ADM0",
            "geometry": "locally-simplified",
        },
        "features": features,
    }
    return payload, labels_by_iso


def build_local_adm1_datasets(
    raw_adm1: dict[str, Any],
    labels_by_iso: dict[str, dict[str, str]],
    cache: dict[str, str],
) -> dict[str, Any]:
    grouped: dict[str, list[dict[str, Any]]] = {}
    for feature in raw_adm1.get("features") or []:
        properties = feature.get("properties") or {}
        country_iso = str(properties.get("shapeGroup") or properties.get("shapeISO") or "").strip().upper()
        if not country_iso:
            continue
        grouped.setdefault(country_iso, []).append(feature)

    manifest_entries: list[dict[str, Any]] = []
    total = len(grouped)
    for index, country_iso in enumerate(sorted(grouped), start=1):
        label_meta = labels_by_iso.get(country_iso) or {
            "countryName": country_iso,
            "countryNameZh": translate_to_zh(country_iso, cache),
        }
        country_name_en = label_meta["countryName"]
        country_name_zh = label_meta["countryNameZh"]
        output_path = ADM1_OUTPUT_ROOT / f"{country_iso}.geojson"
        if output_path.exists():
            log(f"[ADM1 {index}/{total}] {country_iso} {country_name_en} (skip existing)")
            existing_payload = json.loads(output_path.read_text(encoding="utf-8"))
            metadata = existing_payload.get("metadata") or {}
            manifest_entries.append(
                {
                    "countryIso": country_iso,
                    "countryName": metadata.get("countryName") or country_name_en,
                    "countryNameZh": metadata.get("countryNameZh") or country_name_zh,
                    "featureCount": int(metadata.get("featureCount") or len(existing_payload.get("features") or [])),
                    "path": f"./adm1/{country_iso}.geojson",
                    "gbSource": "geoBoundaries CGAZ local",
                    "gbSourceUrl": "https://www.geoboundaries.org/globalDownloads.html",
                }
            )
            continue

        log(f"[ADM1 {index}/{total}] {country_iso} {country_name_en}")
        subdivision_names = [
            str((feature.get("properties") or {}).get("shapeName") or "").strip()
            for feature in grouped[country_iso]
        ]
        translate_many_to_zh(subdivision_names, cache)

        features = []
        for feature in grouped[country_iso]:
            processed = process_local_adm1_feature(feature, country_name_en, country_name_zh, cache)
            if processed:
                features.append(processed)

        output_payload = {
            "type": "FeatureCollection",
            "metadata": {
                "countryIso": country_iso,
                "countryName": country_name_en,
                "countryNameZh": country_name_zh,
                "featureCount": len(features),
                "boundaryType": "ADM1",
                "source": "geoBoundaries CGAZ local",
                "sourceUrl": "https://www.geoboundaries.org/globalDownloads.html",
            },
            "features": features,
        }
        output_path.write_text(
            json.dumps(output_payload, ensure_ascii=False, separators=(",", ":")),
            encoding="utf-8",
        )
        save_translation_cache(cache)

        manifest_entries.append(
            {
                "countryIso": country_iso,
                "countryName": country_name_en,
                "countryNameZh": country_name_zh,
                "featureCount": len(features),
                "path": f"./adm1/{country_iso}.geojson",
                "gbSource": "geoBoundaries CGAZ local",
                "gbSourceUrl": "https://www.geoboundaries.org/globalDownloads.html",
            }
        )

    return {
        "source": "geoBoundaries CGAZ local",
        "sourceUrl": "https://www.geoboundaries.org/globalDownloads.html",
        "boundaryType": "ADM1",
        "countryCount": len(manifest_entries),
        "countries": manifest_entries,
    }


def build_adm0_dataset(adm0_meta: list[dict[str, Any]], cache: dict[str, str]) -> dict[str, Any]:
    features: list[dict[str, Any]] = []
    total = len(adm0_meta)
    for index, meta in enumerate(adm0_meta, start=1):
        country_iso = str(meta.get("boundaryISO") or "").strip().upper()
        country_name = str(meta.get("boundaryName") or country_iso)
        log(f"[ADM0 {index}/{total}] {country_iso} {country_name}")
        geojson = fetch_json(str(meta.get("simplifiedGeometryGeoJSON")))
        raw_features = geojson.get("features") or []
        if not raw_features:
            log(f"[warn] empty ADM0 feature list for {country_iso}")
            continue
        features.append(process_adm0_feature(raw_features[0], meta, cache))

    return {
        "type": "FeatureCollection",
        "metadata": {
            "source": "geoBoundaries gbOpen",
            "sourceUrl": "https://www.geoboundaries.org/globalDownloads.html",
            "apiUrl": ADM0_API_URL,
            "featureCount": len(features),
            "boundaryType": "ADM0",
            "geometry": "simplifiedGeometryGeoJSON",
        },
        "features": features,
    }


def build_adm1_datasets(adm1_meta: list[dict[str, Any]], cache: dict[str, str]) -> dict[str, Any]:
    manifest_entries: list[dict[str, Any]] = []
    total = len(adm1_meta)
    for index, meta in enumerate(adm1_meta, start=1):
        country_iso = str(meta.get("boundaryISO") or "").strip().upper()
        country_name_en = str(meta.get("boundaryName") or country_iso)
        country_name_zh = COUNTRY_NAME_OVERRIDES_ZH.get(country_name_en) or translate_to_zh(country_name_en, cache)
        log(f"[ADM1 {index}/{total}] {country_iso} {country_name_en}")
        geojson = fetch_json(str(meta.get("simplifiedGeometryGeoJSON")))
        raw_features = geojson.get("features") or []
        features = [
            process_adm1_feature(feature, meta, country_name_zh, cache)
            for feature in raw_features
            if feature.get("geometry")
        ]

        output_path = ADM1_OUTPUT_ROOT / f"{country_iso}.geojson"
        output_payload = {
            "type": "FeatureCollection",
            "metadata": {
                "countryIso": country_iso,
                "countryName": country_name_en,
                "countryNameZh": country_name_zh,
                "featureCount": len(features),
                "boundaryType": "ADM1",
                "source": "geoBoundaries gbOpen",
                "sourceUrl": "https://www.geoboundaries.org/globalDownloads.html",
                "apiUrl": f"https://www.geoboundaries.org/api/current/gbOpen/{country_iso}/ADM1/",
                "buildDate": meta.get("buildDate") or "",
            },
            "features": features,
        }
        output_path.write_text(
            json.dumps(output_payload, ensure_ascii=False, separators=(",", ":")),
            encoding="utf-8",
        )

        manifest_entries.append(
            {
                "countryIso": country_iso,
                "countryName": country_name_en,
                "countryNameZh": country_name_zh,
                "featureCount": len(features),
                "path": f"./adm1/{country_iso}.geojson",
                "gbContinentKey": normalize_continent(
                    str(meta.get("Continent") or ""),
                    str(meta.get("UNSDG-subregion") or ""),
                ),
                "gbContinent": meta.get("Continent") or "",
                "gbSubregion": meta.get("UNSDG-subregion") or "",
                "gbBoundaryId": meta.get("boundaryID") or "",
                "gbBuildDate": meta.get("buildDate") or "",
                "gbLicense": meta.get("boundaryLicense") or "",
                "gbSource": meta.get("boundarySource") or "",
                "gbSourceUrl": meta.get("boundarySourceURL") or meta.get("licenseSource") or "",
            }
        )

    manifest_entries.sort(key=lambda item: item["countryIso"])
    return {
        "source": "geoBoundaries gbOpen",
        "sourceUrl": "https://www.geoboundaries.org/globalDownloads.html",
        "apiUrl": ADM1_API_URL,
        "boundaryType": "ADM1",
        "countryCount": len(manifest_entries),
        "countries": manifest_entries,
    }


def main() -> int:
    ensure_output_dirs()
    cache = load_translation_cache()

    if LOCAL_ADM0_SOURCE_PATH.exists() and LOCAL_ADM1_SOURCE_PATH.exists():
        log("Using local geoBoundaries CGAZ files from geo_data...")
        raw_adm1 = load_local_geojson(LOCAL_ADM1_SOURCE_PATH)
        adm0_path = OUTPUT_ROOT / "adm0.geojson"
        if adm0_path.exists():
            log(f"Reusing existing {adm0_path}")
            adm0_payload = json.loads(adm0_path.read_text(encoding="utf-8"))
            labels_by_iso = {
                str((feature.get("properties") or {}).get("iso_a3") or "").strip().upper(): {
                    "countryName": str((feature.get("properties") or {}).get("name") or "").strip(),
                    "countryNameZh": str((feature.get("properties") or {}).get("nameZh") or "").strip(),
                }
                for feature in adm0_payload.get("features") or []
                if str((feature.get("properties") or {}).get("iso_a3") or "").strip()
            }
        else:
            raw_adm0 = load_local_geojson(LOCAL_ADM0_SOURCE_PATH)
            adm0_payload, labels_by_iso = build_local_adm0_dataset(raw_adm0, cache)
            save_translation_cache(cache)
            adm0_path.write_text(
                json.dumps(adm0_payload, ensure_ascii=False, separators=(",", ":")),
                encoding="utf-8",
            )
            log(f"Wrote {adm0_path}")

        adm1_manifest = build_local_adm1_datasets(raw_adm1, labels_by_iso, cache)
        save_translation_cache(cache)
        adm1_manifest_path = OUTPUT_ROOT / "adm1-manifest.json"
        adm1_manifest_path.write_text(
            json.dumps(adm1_manifest, ensure_ascii=False, separators=(",", ":")),
            encoding="utf-8",
        )
        log(f"Wrote {adm1_manifest_path}")
    else:
        log("Fetching geoBoundaries metadata lists...")
        adm0_meta = fetch_json(ADM0_API_URL)
        adm1_meta = fetch_json(ADM1_API_URL)

        log(f"ADM0 countries: {len(adm0_meta)}")
        log(f"ADM1 countries: {len(adm1_meta)}")

        adm0_payload = build_adm0_dataset(adm0_meta, cache)
        save_translation_cache(cache)
        adm0_path = OUTPUT_ROOT / "adm0.geojson"
        adm0_path.write_text(
            json.dumps(adm0_payload, ensure_ascii=False, separators=(",", ":")),
            encoding="utf-8",
        )
        log(f"Wrote {adm0_path}")

        adm1_manifest = build_adm1_datasets(adm1_meta, cache)
        save_translation_cache(cache)
        adm1_manifest_path = OUTPUT_ROOT / "adm1-manifest.json"
        adm1_manifest_path.write_text(
            json.dumps(adm1_manifest, ensure_ascii=False, separators=(",", ":")),
            encoding="utf-8",
        )
        log(f"Wrote {adm1_manifest_path}")

    attribution_path = OUTPUT_ROOT / "ATTRIBUTION.txt"
    attribution_path.write_text(ATTRIBUTION_TEXT, encoding="utf-8")
    log(f"Wrote {attribution_path}")

    save_translation_cache(cache)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
