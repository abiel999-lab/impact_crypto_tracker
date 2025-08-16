import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { useAppStore } from "../store/useAppStore";
import { getCoinChart } from "../lib/api";
import { fmtCurrency } from "../utils/format";

export default function CoinChart({ coin, onClose }) {
  const { fiat } = useAppStore();
  const [rows, setRows] = useState([]);
  const [range, setRange] = useState(7);

  const isDark = document.documentElement.classList.contains("dark");
  const axisColor = isDark ? "#94a3b8" : "#334155";               // slate-400 / slate-700
  const gridColor = isDark ? "rgba(148,163,184,.25)" : "rgba(100,116,139,.2)";
  const lineColor = "#a78bfa";                                    // violet-400
  const tooltipBg = isDark ? "#0f172a" : "#ffffff";               // slate-950 / white
  const tooltipBorder = isDark ? "#334155" : "#e2e8f0";           // slate-700 / slate-200
  const tooltipColor = isDark ? "#e2e8f0" : "#0f172a";            // slate-200 / slate-950

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await getCoinChart(coin.id, fiat.toLowerCase(), range);
        const rs = (data?.prices || []).map(([t, v]) => ({
          t: new Date(t).toLocaleDateString(),
          v,
        }));
        if (alive) setRows(rs);
      } catch {
        if (alive) setRows([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, [coin.id, fiat, range]);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-[92vw] max-w-5xl rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl">
        {/* header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <img src={coin.image} alt={coin.symbol} className="w-6 h-6 rounded-full" />
            <div className="font-semibold text-slate-900 dark:text-slate-100">{coin.name}</div>
            <div className="uppercase text-xs text-slate-500 dark:text-slate-400">{coin.symbol}</div>
          </div>
          <div className="flex items-center gap-2">
            <RangeSegment value={range} onChange={setRange} />
            <button
              onClick={onClose}
              className="px-3 py-1 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Tutup
            </button>
          </div>
        </div>

        {/* chart */}
        <div className="h-[360px] p-3">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={rows} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="4 4" stroke={gridColor} />
              <XAxis
                dataKey="t"
                tick={{ fill: axisColor, fontSize: 12 }}
                tickMargin={8}
                axisLine={{ stroke: gridColor }}
                tickLine={{ stroke: gridColor }}
              />
              <YAxis
                tick={{ fill: axisColor, fontSize: 12 }}
                width={80}
                axisLine={{ stroke: gridColor }}
                tickLine={{ stroke: gridColor }}
                tickFormatter={(v) => fmtCurrency(v, fiat)}
              />
              <Tooltip
                contentStyle={{
                  background: tooltipBg,
                  color: tooltipColor,
                  border: `1px solid ${tooltipBorder}`,
                  borderRadius: 12,
                  boxShadow: "0 10px 30px rgba(0,0,0,.2)",
                }}
                labelStyle={{ color: tooltipColor, marginBottom: 6 }}
                itemStyle={{ color: tooltipColor }}
                formatter={(v) => [fmtCurrency(v, fiat), ""]}
              />
              <Line
                type="monotone"
                dataKey="v"
                stroke={lineColor}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: lineColor, stroke: lineColor }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function RangeSegment({ value, onChange }) {
  const options = [
    { k: 7, label: "7D" },
    { k: 30, label: "30D" },
  ];
  return (
    <div className="inline-flex rounded-xl overflow-hidden border border-violet-500/50 bg-white dark:bg-slate-800">
      {options.map((o, i) => {
        const active = value === o.k;
        return (
          <button
            key={o.k}
            onClick={() => onChange(o.k)}
            className={[
              "px-3 py-1 text-sm focus:outline-none",
              active ? "bg-violet-600 text-white" : "text-violet-700 dark:text-violet-300 hover:bg-violet-500/10",
              i === 0 ? "border-r border-violet-500/30" : "",
            ].join(" ")}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
