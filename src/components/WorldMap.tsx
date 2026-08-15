import { useMemo } from "react";
import { geoArea, geoGraticule10, geoNaturalEarth1, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import worldData from "world-atlas/countries-110m.json";

export type Phase = "el-nino" | "la-nina";
export type Season = "DJF" | "MAM" | "JJA" | "SON";
export type Signal = "wetter" | "drier" | "warmer" | "cooler";

export interface ImpactRegion {
  id: string;
  name: string;
  hemisphere: string;
  confidence: string;
  shape: { type: string; coordinates: number[][][] };
  signals: Record<Phase, Record<Season, Signal[]>>;
  notes?: Record<Phase, Partial<Record<Season, string>>>;
  sources?: string[];
}

export const SEASONS: Season[] = ["SON", "DJF", "MAM", "JJA"];
export const SEASON_LABELS: Record<Season, string> = {
  DJF: "Dec-Feb",
  MAM: "Mar-May",
  JJA: "Jun-Aug",
  SON: "Sep-Nov",
};

export const SIGNAL_LABELS: Record<Signal, string> = {
  wetter: "Wetter",
  drier: "Drier",
  warmer: "Warmer",
  cooler: "Cooler",
};

const SIGNAL_COLORS: Record<string, string> = {
  wetter: "#1a7f37",
  drier: "#d9760d",
  warmer: "#c62310",
  cooler: "#2a5db0",
};

const WIDTH = 980;
const HEIGHT = 500;

interface Props {
  regions: ImpactRegion[];
  phase: Phase;
  season: Season;
  selectedId: string;
  onSelect: (id: string) => void;
}

export function signalsFor(region: ImpactRegion, phase: Phase, season: Season): Signal[] {
  return region.signals[phase]?.[season] ?? [];
}

// d3-geo reads a ring that winds the wrong way as "everything except the blob".
// If the spherical area is more than half the sphere, reverse the ring.
function normalizeRing(ring: number[][]): number[][] {
  const area = geoArea({ type: "Polygon", coordinates: [ring] } as never);
  if (area > 2 * Math.PI) return [...ring].reverse();
  return ring;
}

// Chaikin corner cutting rounds the rough polygons into smooth blobs.
function smoothRing(ring: number[][], iterations = 2): number[][] {
  let pts = ring;
  for (let it = 0; it < iterations; it++) {
    const out: number[][] = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % pts.length];
      out.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25]);
      out.push([a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]);
    }
    pts = out;
  }
  return pts;
}

export default function WorldMap({ regions, phase, season, selectedId, onSelect }: Props) {
  const land = useMemo(() => {
    const projection = geoNaturalEarth1().fitSize([WIDTH, HEIGHT], { type: "Sphere" });
    return geoPath(projection)({ type: "Sphere" }) ?? "";
  }, []);

  const graticule = useMemo(() => {
    const projection = geoNaturalEarth1().fitSize([WIDTH, HEIGHT], { type: "Sphere" });
    return geoPath(projection)(geoGraticule10() as never) ?? "";
  }, []);

  const countryPaths = useMemo(() => {
    const topo = worldData as unknown as { objects: Record<string, unknown> };
    const projection = geoNaturalEarth1().fitSize([WIDTH, HEIGHT], { type: "Sphere" });
    const path = geoPath(projection);
    const collection = feature(topo as never, topo.objects.countries as never) as never as {
      features: unknown[];
    };
    return collection.features.map((f) => path(f as never) ?? "");
  }, []);

  const regionPaths = useMemo(() => {
    const projection = geoNaturalEarth1().fitSize([WIDTH, HEIGHT], { type: "Sphere" });
    const path = geoPath(projection);
    return regions.map((region) => {
      const ring = smoothRing(normalizeRing(region.shape.coordinates[0]));
      return (
        path({ type: "Polygon", coordinates: [ring] } as never) ?? ""
      );
    });
  }, [regions]);

  const visibleRegions = regions.filter((region) => signalsFor(region, phase, season).length > 0);

  const summary = `World map of typical ${phase === "el-nino" ? "El Niño" : "La Niña"} impacts for the ${SEASON_LABELS[season]} season. Each region shows a typical tendency such as wetter, drier, warmer, or cooler.`;

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="h-auto w-full" role="img" aria-label={summary}>
      <path d={land} fill="#cfe0f0" stroke="#8fa6bb" strokeWidth={1.25} vectorEffect="non-scaling-stroke" />
      <path d={graticule} fill="none" stroke="#b3c9da" strokeWidth={0.8} vectorEffect="non-scaling-stroke" />
      {countryPaths.map((d, i) => (
        <path key={`c-${i}`} d={d} fill="#eef2f6" stroke="#7f93a6" strokeWidth={1} vectorEffect="non-scaling-stroke" />
      ))}
      {visibleRegions.map((region) => {
        const signals = signalsFor(region, phase, season);
        const color = SIGNAL_COLORS[signals[0]];
        const isSelected = region.id === selectedId;
        const d = regionPaths[regions.findIndex((r) => r.id === region.id)];
        return (
          <g key={region.id}>
            <path
              d={d}
              fill={color}
              fillOpacity={isSelected ? 0.8 : 0.5}
              stroke={isSelected ? "#1b1b1b" : color}
              strokeWidth={isSelected ? 2.25 : 1.25}
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
            <path
              d={d}
              fill="transparent"
              stroke="transparent"
              className="cursor-pointer"
              onClick={() => onSelect(region.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") onSelect(region.id);
              }}
              role="button"
              tabIndex={0}
              aria-label={`${region.name}: ${signals.map((s) => SIGNAL_LABELS[s]).join(", ")}`}
            >
              <title>
                {region.name}: {signals.map((s) => SIGNAL_LABELS[s]).join(", ")}
              </title>
            </path>
          </g>
        );
      })}
      {countryPaths.map((d, i) => (
        <path key={`b-${i}`} d={d} fill="none" stroke="#ffffff" strokeOpacity={0.65} strokeWidth={0.75} vectorEffect="non-scaling-stroke" pointerEvents="none" />
      ))}
    </svg>
  );
}
