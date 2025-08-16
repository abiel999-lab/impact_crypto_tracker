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
import { getCoinChart } from "../lib/api";

export default function Sparkline({ coinId, fiat = "USD", days = 7, height = 70 }) {
  const [rows, setRows] = useState([]);
  const isDark = document.documentElement.classList.contains("dark");

  const grid = isDark ? "rgba(148,163,184,.2)" : "rgba(100,116,139,.15)";
  const tooltipBg = isDark ? "#0f172a" : "#ffffff";
  const tooltipBorder = isDark ? "#334155" : "#e2e8f0";
  const tooltipColor = isDark ? "#e2e8f0" : "#0f172a";
  const line = "#a78bfa"; // violet-400

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await getCoinChart(coinId, fiat.toLowerCase(), days);
        const rs = (data?.prices || []).map(([t, v]) => ({ t, v }));
        if (alive) setRows(rs);
      } catch {
        if (alive) setRows([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, [coinId, fiat, days]);

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={rows}>
          <CartesianGrid strokeDasharray="3 3" stroke={grid} />
          <XAxis dataKey="t" hide />
          <YAxis hide />
          <Tooltip
            labelFormatter={(ts) => new Date(ts).toLocaleDateString()}
            contentStyle={{
              background: tooltipBg,
              color: tooltipColor,
              border: `1px solid ${tooltipBorder}`,
              borderRadius: 10,
            }}
            itemStyle={{ color: tooltipColor }}
          />
          <Line dataKey="v" type="monotone" stroke={line} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
