// src/components/FavoritesPage.jsx
import { useEffect, useState } from "react";
import { useAppStore } from "../store/useAppStore";
import { getMarketByIds } from "../lib/api";
import { fmtCurrency, pctClass } from "../utils/format";
import Sparkline from "./Sparkline";

export default function FavoritesPage() {
  const { fiat, favorites } = useAppStore();
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState("");

  const favIds = [...favorites];

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setErr("");
        if (!favIds.length) {
          setRows([]);
          return;
        }
        const data = await getMarketByIds({
          vsCurrency: fiat.toLowerCase(),
          ids: favIds,
        });
        if (alive) setRows(Array.isArray(data) ? data : []);
      } catch (e) {
        if (alive) {
          setErr("Gagal memuat data favorit");
          setRows([]);
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, [fiat, favorites.size]); // size agar re-run saat berubah

  if (!favIds.length) {
    return <div className="text-sm opacity-70">Belum ada favorit. Tandai ☆ di tabel Market.</div>;
  }
  if (err) return <div className="text-sm text-red-500">{err}</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {rows.map((c) => (
        <div
          key={c.id}
          className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={c.image} alt={c.symbol} className="w-7 h-7 rounded-full" />
              <div>
                <div className="font-semibold">{c.name}</div>
                <div className="uppercase text-xs text-slate-500 dark:text-slate-400">
                  {c.symbol}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-semibold">{fmtCurrency(c.current_price, fiat)}</div>
              <div className={`text-xs ${pctClass(c.price_change_percentage_24h)}`}>
                {c.price_change_percentage_24h?.toFixed?.(2)}% (24h)
              </div>
            </div>
          </div>

          <div className="mt-2">
            <Sparkline coinId={c.id} fiat={fiat} days={7} height={90} />
          </div>
        </div>
      ))}
    </div>
  );
}
