// src/components/CoinTable.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useAppStore } from "../store/useAppStore";
import { getMarket } from "../lib/api";
import { fmtCurrency, pctClass } from "../utils/format";
import { Star, StarOff } from "lucide-react";

const BASE_REFRESH = 120_000; // 2m
const MAX_REFRESH = 300_000;  // 5m

export default function CoinTable({ onSelectCoin }) {
  const { fiat, favorites, toggleFavorite, search } = useAppStore();
  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [onlyFav, setOnlyFav] = useState(false);
  const [intervalMs, setIntervalMs] = useState(BASE_REFRESH);
  const abortRef = useRef();

  async function load() {
    try {
      setLoading(true);
      setError("");
      abortRef.current?.abort();
      abortRef.current = new AbortController();
      const data = await getMarket({
        vsCurrency: fiat.toLowerCase(),
        perPage: 200,
        page: 1,
        signal: abortRef.current.signal,
      });
      setCoins(Array.isArray(data) ? data : []); // guard
      setIntervalMs(BASE_REFRESH);
    } catch (e) {
      if (e?.name !== "AbortError") {
        setError(e?.message || "Failed to fetch market");
        setIntervalMs((ms) => Math.min(ms * 2, MAX_REFRESH)); // backoff
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, intervalMs);
    return () => {
      clearInterval(t);
      abortRef.current?.abort();
    };
  }, [fiat, intervalMs]);

  const query = (search || "").trim().toLowerCase();
  const coinsArr = Array.isArray(coins) ? coins : [];

  const filtered = useMemo(() => {
    let arr = coinsArr;
    if (query) {
      arr = arr.filter(
        (c) =>
          (c.name || "").toLowerCase().includes(query) ||
          (c.symbol || "").toLowerCase().includes(query)
      );
    }
    if (onlyFav) arr = arr.filter((c) => favorites.has(c.id));
    return arr;
  }, [coinsArr, query, onlyFav, favorites]);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3 gap-2">
        <div className="text-sm text-neutral-500 dark:text-slate-400">
          {loading ? "Memuat…" : `${filtered.length} koin`}
          {error && <span className="text-red-500 ml-2">({error})</span>}
        </div>
        <button
          onClick={() => setOnlyFav((v) => !v)}
          className={`px-3 py-1.5 rounded-lg border text-sm transition ${
            onlyFav
              ? "border-yellow-500 text-yellow-300"
              : "border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200"
          }`}
        >
          {onlyFav ? "Favorit ✓" : "Favorit"}
        </button>
      </div>

      <div className="overflow-auto rounded-xl border border-slate-200 dark:border-slate-800">
        <table className="min-w-[800px] w-full text-sm">
          <thead className="bg-neutral-50 dark:bg-slate-800">
            <tr className="[&>th]:px-3 [&>th]:py-2 text-left text-slate-600 dark:text-slate-300">
              <th>#</th>
              <th>Koin</th>
              <th>Harga ({fiat})</th>
              <th>24h</th>
              <th>Market Cap</th>
              <th className="text-center">Fav</th>
            </tr>
          </thead>
          <tbody>
            {(filtered || []).map((c) => (
              <tr
                key={c.id}
                className="border-t dark:border-slate-800 hover:bg-neutral-50 dark:hover:bg-slate-800/60 cursor-pointer"
                onClick={() => onSelectCoin?.(c)}
              >
                <td className="px-3 py-2">{c.market_cap_rank}</td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-3">
                    <img
                      src={c.image}
                      alt={c.symbol}
                      className="w-6 h-6 rounded-full object-contain"
                      loading="lazy"
                    />
                    <div className="flex items-baseline gap-2">
                      <span className="font-medium">{c.name}</span>
                      <span className="uppercase text-neutral-500 dark:text-slate-400">
                        {c.symbol}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2">{fmtCurrency(c.current_price, fiat)}</td>
                <td className={`px-3 py-2 ${pctClass(c.price_change_percentage_24h)}`}>
                  {c.price_change_percentage_24h?.toFixed?.(2)}%
                </td>
                <td className="px-3 py-2">{fmtCurrency(c.market_cap, fiat)}</td>
                <td
                  className="px-3 py-2 text-center"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(c.id);
                  }}
                >
                  {favorites.has(c.id) ? (
                    <Star className="inline-block w-5 h-5 text-yellow-500" />
                  ) : (
                    <StarOff className="inline-block w-5 h-5 text-neutral-400" />
                  )}
                </td>
              </tr>
            ))}
            {!loading && (filtered || []).length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-3 py-6 text-center text-neutral-500 dark:text-slate-400"
                >
                  Tidak ada data.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
