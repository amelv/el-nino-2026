import type { ImpactRegion, Phase } from "./WorldMap";
import { SEASONS, SEASON_LABELS, SIGNAL_LABELS, signalsFor } from "./WorldMap";

interface Props {
  region: ImpactRegion | null;
  phase: Phase;
}

const PHASE_LABELS: Record<Phase, string> = {
  "el-nino": "El Niño",
  "la-nina": "La Niña",
};

export default function RegionDetail({ region, phase }: Props) {
  if (!region) {
    return (
      <aside className="border border-gray-20 bg-gray-5 p-5">
        <p className="text-sm text-muted">Select a region on the map to see its typical pattern.</p>
      </aside>
    );
  }

  const activeSeasons = SEASONS.filter((season) => signalsFor(region, phase, season).length > 0);

  return (
    <aside className="border border-gray-20 bg-white p-5" aria-live="polite">
      <p className="text-2xs font-bold uppercase tracking-wide text-primary">
        {PHASE_LABELS[phase]} · typical pattern
      </p>
      <h3 className="mt-2 text-lg font-bold text-primary-darker">{region.name}</h3>

      <table className="site-table mt-4">
        <thead>
          <tr>
            <th scope="col">Season</th>
            <th scope="col">Tendency</th>
          </tr>
        </thead>
        <tbody>
          {activeSeasons.map((season) => {
            const signals = signalsFor(region, phase, season);
            const note = region.notes?.[phase]?.[season];
            return (
              <tr key={season}>
                <td className="font-bold">{SEASON_LABELS[season]}</td>
                <td>
                  <span className="inline-flex flex-wrap gap-1">
                    {signals.map((signal) => (
                      <span key={signal} className="rounded-sm px-2 py-0.5 text-2xs font-bold text-white" style={{ background: signalColor(signal) }}>
                        {SIGNAL_LABELS[signal]}
                      </span>
                    ))}
                  </span>
                  {note && <span className="mt-1 block text-2xs text-muted">{note}</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <dl className="mt-4 grid gap-2 text-2xs">
        <div>
          <dt className="font-bold text-muted">Confidence</dt>
          <dd className="capitalize">{region.confidence}</dd>
        </div>
        {region.sources && region.sources.length > 0 && (
          <div>
            <dt className="font-bold text-muted">Sources</dt>
            <dd>{region.sources.join(", ")}</dd>
          </div>
        )}
      </dl>
    </aside>
  );
}

function signalColor(signal: string): string {
  switch (signal) {
    case "wetter":
      return "#1a7f37";
    case "drier":
      return "#d9760d";
    case "warmer":
      return "#c62310";
    case "cooler":
      return "#2a5db0";
    default:
      return "#5c5c5c";
  }
}
