import {
  Area,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface OniRow {
  season: string;
  anomaly: number;
}

export default function OniChart({ history }: { history: OniRow[] }) {
  const rows = history.map((row) => ({ ...row, label: row.season }));

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={rows} margin={{ top: 8, right: 12, bottom: 4, left: -8 }}>
          <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={{ stroke: "#c6cace" }} interval="preserveStartEnd" minTickGap={28} />
          <YAxis domain={[-1, 1.6]} ticks={[-1, -0.5, 0, 0.5, 1, 1.5]} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v: number) => `${v > 0 ? "+" : ""}${v}`} />
          <Tooltip formatter={(value) => [`${Number(value).toFixed(2)}°C`, "ONI"]} labelFormatter={(label) => `Season: ${label}`} />
          <ReferenceLine y={0.5} stroke="#c05600" strokeDasharray="4 3" strokeWidth={1.5} />
          <ReferenceLine y={-0.5} stroke="#2a5db0" strokeDasharray="4 3" strokeWidth={1.5} />
          <ReferenceLine y={0} stroke="#c6cace" />
          <Area dataKey="anomaly" fill="#fa9441" fillOpacity={0.35} stroke="#fa9441" strokeWidth={0} />
          <Line type="monotone" dataKey="anomaly" stroke="#c05600" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
