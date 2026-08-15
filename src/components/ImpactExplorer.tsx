import { useState } from "react";
import WorldMap, {
  type ImpactRegion,
  type Phase,
  type Season,
  SEASONS,
  SEASON_LABELS,
  SIGNAL_LABELS,
  signalsFor,
} from "./WorldMap";
import RegionDetail from "./RegionDetail";

interface Props {
  regions: ImpactRegion[];
}

const PHASES: { id: Phase; label: string }[] = [
  { id: "el-nino", label: "El Niño" },
  { id: "la-nina", label: "La Niña" },
];

const NORTHERN: Record<Season, string> = {
  DJF: "Winter",
  MAM: "Spring",
  JJA: "Summer",
  SON: "Fall",
};

const SOUTHERN: Record<Season, string> = {
  DJF: "Summer",
  MAM: "Fall",
  JJA: "Winter",
  SON: "Spring",
};

export default function ImpactExplorer({ regions }: Props) {
  const [phase, setPhase] = useState<Phase>("el-nino");
  const [season, setSeason] = useState<Season>("SON");
  const [selectedId, setSelectedId] = useState(regions[0]?.id ?? "");

  const visibleRegions = regions.filter((region) => signalsFor(region, phase, season).length > 0);
  const activeId = visibleRegions.some((region) => region.id === selectedId)
    ? selectedId
    : visibleRegions[0]?.id ?? "";
  const selected = visibleRegions.find((region) => region.id === activeId) ?? null;

  const selectRegion = (id: string) => setSelectedId(id);
  const phaseLabel = PHASES.find((p) => p.id === phase)?.label;

  return (
    <div>
      <div className="mb-6 grid gap-4 sm:grid-cols-[auto_1fr] sm:items-end">
        <fieldset>
          <legend className="mb-2 text-2xs font-bold uppercase tracking-wide text-muted">Phase</legend>
          <div className="flex gap-2">
            {PHASES.map((p) => (
              <button
                key={p.id}
                type="button"
                aria-pressed={phase === p.id}
                onClick={() => setPhase(p.id)}
                className={`border px-4 py-2 text-sm font-bold ${phase === p.id ? "border-primary bg-primary text-white" : "border-gray-30 bg-white text-ink hover:bg-blue-5"}`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-2xs font-bold uppercase tracking-wide text-muted">Season</legend>
          <div className="flex flex-wrap gap-2">
            {SEASONS.map((s) => (
              <button
                key={s}
                type="button"
                aria-pressed={season === s}
                onClick={() => setSeason(s)}
                className={`border px-3 py-2 text-sm font-bold ${season === s ? "border-primary bg-primary text-white" : "border-gray-30 bg-white text-ink hover:bg-blue-5"}`}
              >
                {SEASON_LABELS[s]}
                <span className="ml-1 text-2xs font-normal opacity-80">
                  {NORTHERN[s]} / {SOUTHERN[s]}
                </span>
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="border border-gray-20 bg-white p-2 sm:p-4">
          <WorldMap regions={visibleRegions} phase={phase} season={season} selectedId={activeId} onSelect={selectRegion} />
          <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 border-t border-gray-20 pt-3 text-2xs">
            <li><span className="mr-1 inline-block h-3 w-3 align-middle" style={{ background: "#1a7f37" }} />Wetter</li>
            <li><span className="mr-1 inline-block h-3 w-3 align-middle" style={{ background: "#d9760d" }} />Drier</li>
            <li><span className="mr-1 inline-block h-3 w-3 align-middle" style={{ background: "#c62310" }} />Warmer</li>
            <li><span className="mr-1 inline-block h-3 w-3 align-middle" style={{ background: "#2a5db0" }} />Cooler</li>
          </ul>
        </div>

        <div className="space-y-4">
          <RegionDetail region={selected} phase={phase} />
        </div>
      </div>

      <section className="mt-8" aria-labelledby="regionListHeading">
        <h3 id="regionListHeading" className="mb-3 text-lg font-bold text-primary-darker">
          Regions affected during {phaseLabel}, {SEASON_LABELS[season]}
        </h3>
        <ul className="grid gap-2 sm:grid-cols-2">
          {visibleRegions.map((region) => {
            const signals = signalsFor(region, phase, season);
            return (
              <li key={region.id}>
                <button
                  type="button"
                  onClick={() => selectRegion(region.id)}
                  className={`w-full border p-3 text-left text-sm ${activeId === region.id ? "border-primary bg-blue-5" : "border-gray-20 bg-white hover:bg-gray-5"}`}
                >
                  <span className="font-bold text-primary-darker">{region.name}</span>
                  <span className="mt-1 block text-2xs text-muted">
                    {signals.map((s) => SIGNAL_LABELS[s]).join(", ")}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
