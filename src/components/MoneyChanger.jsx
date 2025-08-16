import { useEffect, useMemo, useRef, useState } from "react";
import { getFxSymbols, convertFx, fxTimeseries } from "../lib/api";
import { fmtCurrency } from "../utils/format";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export default function MoneyChanger() {
  const [symbols, setSymbols] = useState([]);
  const [from, setFrom] = useState("USD");
  const [to, setTo] = useState("IDR");
  const [amount, setAmount] = useState("1");

  const [result, setResult] = useState(0);
  const [series, setSeries] = useState([]); // [{t, v}] → v = rate
  const [loading, setLoading] = useState(false);
  const [chartLoading, setChartLoading] = useState(false);
  const [error, setError] = useState("");

  const convAbort = useRef(null);
  const serieAbort = useRef(null);

  // ----- load symbols sekali -----
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const list = await getFxSymbols();
        if (!alive) return;
        setSymbols(list);
        if (!list.includes(from)) setFrom(list.includes("USD") ? "USD" : list[0]);
        if (!list.includes(to)) setTo(list.includes("IDR") ? "IDR" : list[1] || list[0]);
      } catch {
        if (!alive) return;
        setSymbols(["USD", "EUR", "IDR", "JPY", "GBP"]);
      }
    })();
    return () => { alive = false; };
  }, []);

  // ----- konversi realtime (latest) tiap input berubah -----
  useEffect(() => {
    const amt = Number.parseFloat(String(amount).replace(/,/g, "")) || 0;
    if (!from || !to) return;

    setLoading(true);
    setError("");

    convAbort.current?.abort();
    convAbort.current = new AbortController();

    (async () => {
      try {
        if (from === to) {
          setResult(amt);
        } else {
          const val = await convertFx(from, to, amt, convAbort.current.signal);
          setResult(val);
        }
      } catch (e) {
        setResult(0);
        setError(e?.message || "Gagal konversi");
      } finally {
        setLoading(false);
      }
    })();

    return () => convAbort.current?.abort();
  }, [from, to, amount]);

  // ----- ambil timeseries untuk grafik -----
  useEffect(() => {
    if (!from || !to) return;

    setChartLoading(true);
    setError("");

    serieAbort.current?.abort();
    serieAbort.current = new AbortController();

    (async () => {
      try {
        if (from === to) {
          // flat line = 1 untuk 7 hari
          setSeries(
            Array.from({ length: 7 }, (_, i) => {
              const d = new Date(Date.now() - (6 - i) * 86400000)
                .toISOString()
                .slice(0, 10);
              return { t: d, v: 1 };
            })
          );
        } else {
          const ts = await fxTimeseries(from, to, 7, serieAbort.current.signal);
          setSeries(ts);
        }
      } catch (e) {
        setSeries([]);
        setError((prev) => prev || e?.message || "Gagal memuat grafik");
      } finally {
        setChartLoading(false);
      }
    })();

    return () => serieAbort.current?.abort();
  }, [from, to]);

  // nilai grafik = rate × amount (biar sesuai “Result” & terasa perubahan jika amount besar)
  const amt = useMemo(
    () => Number.parseFloat(String(amount).replace(/,/g, "")) || 0,
    [amount]
  );
  const chartData = useMemo(
    () => series.map((p) => ({ t: p.t, v: p.v * (amt || 1) })),
    [series, amt]
  );

  // persentase perubahan selama 7 hari (pakai rate murni supaya fair)
  const pctChange = useMemo(() => {
    if (!series.length) return 0;
    const a = series[0].v;
    const b = series[series.length - 1].v;
    if (!a || !b) return 0;
    return ((b - a) / a) * 100;
  }, [series]);

  const pretty = (v, code) => fmtCurrency(v, code);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* FROM */}
        <Field label="From">
          <select
            className="w-full px-3 py-2 rounded-xl border bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          >
            {symbols.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </Field>

        {/* TO */}
        <Field label="To">
          <select
            className="w-full px-3 py-2 rounded-xl border bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          >
            {symbols.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </Field>

        {/* AMOUNT */}
        <Field label="Amount">
          <input
            type="number"
            inputMode="decimal"
            className="w-full px-3 py-2 rounded-xl border bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="0"
            step="any"
          />
        </Field>

        {/* RESULT */}
        <Field label="Result">
          <div className="w-full px-3 py-2 rounded-xl border bg-slate-200/60 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-lg font-semibold">
            {loading ? "…" : pretty(result, to)}
          </div>
        </Field>
      </div>

      <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-3">
        <div className="flex items-center justify-between mb-2 text-sm">
          <div className="font-medium">{from} → {to} (7 hari)</div>
          <div className={pctChange >= 0 ? "text-emerald-500" : "text-rose-500"}>
            {pctChange.toFixed(2)}%
          </div>
        </div>

        <div className="h-[260px] w-full">
          {chartLoading ? (
            <div className="h-full grid place-items-center text-slate-500">Memuat grafik…</div>
          ) : chartData.length === 0 ? (
            <div className="h-full grid place-items-center text-slate-500">
              Tidak ada data grafik.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#64748b22" />
                <XAxis
                  dataKey="t"
                  tick={{ fill: "currentColor" }}
                  stroke="currentColor"
                  className="text-slate-500"
                />
                <YAxis
                  tick={{ fill: "currentColor" }}
                  stroke="currentColor"
                  className="text-slate-500"
                  tickFormatter={(v) => pretty(v, to)}
                  width={90}
                />
                <Tooltip
                  contentStyle={{
                    background: "rgb(15 23 42)",            // slate-900
                    border: "1px solid rgb(51 65 85)",      // slate-700
                    color: "white",
                  }}
                  formatter={(v) => [pretty(v, to), `${from}→${to}`]}
                  labelFormatter={(l) => l}
                />
                <Line
                  type="monotone"
                  dataKey="v"
                  dot={false}
                  stroke="#a78bfa"          // violet-400, kontras utk dark
                  strokeWidth={2}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="mt-3 text-[12px] text-slate-500">
          * Sumber kurs: <code>fawazahmed0/exchange-api</code> via jsDelivr (update harian).
          Cache otomatis ±30 menit di browser. Fallback: <code>open.er-api.com</code>.
        </div>

        {error && (
          <div className="mt-2 text-sm text-rose-400">Error: {String(error)}</div>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <div className="mb-1 text-sm opacity-70">{label}</div>
      {children}
    </label>
  );
}
