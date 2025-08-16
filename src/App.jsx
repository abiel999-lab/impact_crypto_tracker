// src/App.jsx
import { useEffect, useState } from "react";
import { useAppStore } from "./store/useAppStore";
import CoinTable from "./components/CoinTable";
import CoinChart from "./components/CoinChart";
import FavoritesPage from "./components/FavoritesPage";
import MoneyChanger from "./components/MoneyChanger";
import { getMarket } from "./lib/api";

/* ===== i18n ===== */
const STR = {
  id: {
    app_title: "Impact Crypto",
    dashboard: "Dashboard",
    favorites: "Favorites",
    changer: "Money Changer",
    settings: "Settings",
    search_placeholder: "Cari koin (mis. BTC / ETH...)",
    theme: "Tema",
    language: "Bahasa",
    currency: "Mata uang",
    range: "Rentang",
    dark: "Dark",
    light: "Light",
    id: "ID",
    en: "EN",
    stats_watchlist: "Watchlist",
    stats_btc: "Harga BTC",
    stats_eth: "Harga ETH",
    stats_dom: "Dominance BTC",
    market: "Market",
  },
  en: {
    app_title: "Impact Crypto",
    dashboard: "Dashboard",
    favorites: "Favorites",
    changer: "Money Changer",
    settings: "Settings",
    search_placeholder: "Search coins (e.g. BTC / ETH...)",
    theme: "Theme",
    language: "Language",
    currency: "Currency",
    range: "Range",
    dark: "Dark",
    light: "Light",
    id: "ID",
    en: "EN",
    stats_watchlist: "Watchlist",
    stats_btc: "BTC Price",
    stats_eth: "ETH Price",
    stats_dom: "BTC Dominance",
    market: "Market",
  },
};

export default function App() {
  const [route, setRoute] = useState("dashboard");
  const { fiat, setFiat, search, setSearch, days, setDays, favorites } = useAppStore();

  const [dark, setDark] = useState(document.documentElement.classList.contains("dark"));
  const [lang, setLang] = useState(localStorage.getItem("ict:lang") || "id");
  const t = (k) => STR[lang]?.[k] ?? k;

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("ict:dark", dark ? "1" : "0");
  }, [dark]);
  useEffect(() => localStorage.setItem("ict:lang", lang), [lang]);

  const [btc, setBtc] = useState(null);
  const [eth, setEth] = useState(null);
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await getMarket({
          vsCurrency: fiat.toLowerCase(),
          ids: ["bitcoin", "ethereum"],
          perPage: 2,
          page: 1,
        });
        if (!alive) return;
        setBtc(data.find((x) => x.id === "bitcoin") || null);
        setEth(data.find((x) => x.id === "ethereum") || null);
      } catch {
        if (!alive) return;
        setBtc(null);
        setEth(null);
      }
    })();
    return () => {
      alive = false;
    };
  }, [fiat]);

  const fmt = (n) =>
    new Intl.NumberFormat(lang === "id" ? "id-ID" : "en-US", {
      style: "currency",
      currency: fiat,
      maximumFractionDigits: fiat === "IDR" ? 0 : 2,
    }).format(n || 0);

  const [selected, setSelected] = useState(null);

  return (
    <div className="min-h-dvh w-full bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-0">
        {/* Sidebar */}
        <aside className="flex flex-col shrink-0 p-4 border-r border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/70 backdrop-blur z-10 md:sticky md:top-0 md:h-dvh">
          <div className="flex items-center gap-2 font-bold text-lg">
            <span className="px-2 py-1 rounded-xl bg-violet-600 text-white dark:bg-white dark:text-violet-600">
              {t("app_title")}
            </span>
          </div>

          <nav className="hidden md:flex flex-col gap-1 mt-4" aria-label="Primary">
            <SidebarLink label={t("dashboard")} active={route === "dashboard"} onClick={() => setRoute("dashboard")} />
            <SidebarLink label={t("favorites")} active={route === "favorites"} onClick={() => setRoute("favorites")} />
            <SidebarLink label={t("changer")} active={route === "changer"} onClick={() => setRoute("changer")} />
            <SidebarLink label={t("settings")} active={route === "settings"} onClick={() => setRoute("settings")} />
          </nav>

          <div className="mt-4">
            <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">Favorites</div>
            <div className="space-y-1">
              {favorites.size === 0 && <div className="text-xs text-slate-500 dark:text-slate-500">—</div>}
              {[...favorites].slice(0, 10).map((id) => (
                <div key={id} className="px-3 py-1.5 rounded-lg text-sm text-violet-400 bg-violet-500/10 border border-violet-500/20">
                  {id}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-auto text-xs text-slate-500">powered by CoinGecko</div>
        </aside>

        {/* Main */}
        <section className="min-w-0">
          <Topbar
            route={route}
            lang={lang}
            setLang={setLang}
            dark={dark}
            setDark={setDark}
            fiat={fiat}
            setFiat={setFiat}
            days={days}
            setDays={setDays}
          >
            {(route === "dashboard" || route === "favorites") && (
              <input
                id="global-search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full max-w-2xl px-4 py-2 rounded-2xl border
                           border-slate-300 dark:border-slate-700
                           bg-white/90 dark:bg-slate-900/80
                           placeholder-slate-400 dark:placeholder-slate-500 text-slate-800 dark:text-slate-100"
                placeholder={t("search_placeholder")}
              />
            )}
          </Topbar>

          {/* Hero */}
          <section className="bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 dark:from-violet-700 dark:via-fuchsia-700 dark:to-pink-700">
            <div className="max-w-7xl mx-auto px-4 py-8 text-white">
              <div className="text-2xl font-semibold">
                {route === "favorites" ? t("favorites") : route === "changer" ? t("changer") : route === "settings" ? t("settings") : t("dashboard")}
              </div>
              <div className="opacity-90">
                {route === "changer" ? "Konversi semua mata uang dunia + grafik 7 hari." : "Harga real-time, watchlist, chart historis."}
              </div>
            </div>
          </section>

          {/* Content switcher */}
          {route === "dashboard" && (
            <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label={t("stats_watchlist")} value={favorites.size} sub="Jumlah koin favorit" />
                <StatCard label={t("stats_btc")} value={btc ? fmt(btc.current_price) : "—"} />
                <StatCard label={t("stats_eth")} value={eth ? fmt(eth.current_price) : "—"} />
                <StatCard
                  label={t("stats_dom")}
                  value={
                    btc?.market_cap && eth?.market_cap
                      ? `${((btc.market_cap / (btc.market_cap + eth.market_cap)) * 100).toFixed(1)}%`
                      : "—"
                  }
                />
              </div>

              <Card>
                <div className="mb-3 font-semibold">{t("market")}</div>
                <CoinTable onSelectCoin={(c) => setSelected(c)} />
              </Card>
            </div>
          )}

          {route === "favorites" && (
            <div className="max-w-7xl mx-auto px-4 py-6">
              <FavoritesPage />
            </div>
          )}

          {route === "changer" && (
            <div className="max-w-7xl mx-auto px-4 py-6">
              <Card>
                <MoneyChanger />
              </Card>
            </div>
          )}

          {route === "settings" && (
            <div className="max-w-7xl mx-auto px-4 py-6 space-y-4">
              <Card>
                <div className="font-semibold mb-2">{t("theme")}</div>
                <Segmented
                  options={[
                    { k: "light", label: t("light") },
                    { k: "dark", label: t("dark") },
                  ]}
                  value={dark ? "dark" : "light"}
                  onChange={(v) => setDark(v === "dark")}
                />
              </Card>
              <Card>
                <div className="font-semibold mb-2">{t("language")}</div>
                <Segmented
                  options={[
                    { k: "id", label: t("id") },
                    { k: "en", label: t("en") },
                  ]}
                  value={lang}
                  onChange={setLang}
                />
              </Card>
              <Card>
                <div className="font-semibold mb-2">{t("currency")}</div>
                <Segmented
                  options={[
                    { k: "USD", label: "USD" },
                    { k: "IDR", label: "IDR" },
                    { k: "EUR", label: "EUR" },
                  ]}
                  value={fiat}
                  onChange={setFiat}
                />
              </Card>
              <Card>
                <div className="font-semibold mb-2">{t("range")}</div>
                <Segmented options={[{ k: 7, label: "7D" }, { k: 30, label: "30D" }]} value={days} onChange={setDays} />
              </Card>
            </div>
          )}
        </section>
      </div>

      {selected && <CoinChart coin={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

/* ---- UI helpers ---- */
function Topbar({ route, lang, setLang, dark, setDark, fiat, setFiat, days, setDays, children }) {
  const labelByRoute = { dashboard: "dashboard", favorites: "favorites", changer: "changer", settings: "settings" };
  const t = (k) => STR[lang]?.[k] ?? k;

  return (
    <header className="sticky top-0 z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur border-b border-slate-200 dark:border-slate-800">
      <div className="px-4 h-16 flex items-center gap-3 justify-between">
        <div className="hidden md:flex items-center gap-2 text-sm opacity-60">
          <span className="px-2 py-0.5 rounded-md bg-violet-600 text-white dark:bg-white dark:text-violet-600">
            {t(labelByRoute[route] || "dashboard")}
          </span>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-2xl">{children}</div>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <ControlGroup label={t("currency")}>
            <Segmented options={[{ k: "USD", label: "USD" }, { k: "IDR", label: "IDR" }, { k: "EUR", label: "EUR" }]} value={fiat} onChange={setFiat} />
          </ControlGroup>
          <ControlGroup label={t("range")}>
            <Segmented options={[{ k: 7, label: "7D" }, { k: 30, label: "30D" }]} value={days} onChange={setDays} />
          </ControlGroup>
          <ControlGroup label={t("theme")}>
            <Segmented options={[{ k: "light", label: "Light" }, { k: "dark", label: "Dark" }]} value={dark ? "dark" : "light"} onChange={(v) => setDark(v === "dark")} />
          </ControlGroup>
          <ControlGroup label={t("language")}>
            <Segmented options={[{ k: "id", label: "ID" }, { k: "en", label: "EN" }]} value={lang} onChange={setLang} />
          </ControlGroup>
        </div>
      </div>
    </header>
  );
}

function SidebarLink({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-between gap-2 text-left px-3 py-2 rounded-xl text-sm transition border
        focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400
        focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950
        ${
          active
            ? "bg-violet-600 text-white border-violet-600"
            : "text-violet-400 hover:bg-violet-500/10 border-transparent"
        }`}
      aria-current={active ? "page" : undefined}
    >
      <span>{label}</span>
    </button>
  );
}

function ControlGroup({ label, children }) {
  return (
    <div className="flex flex-col items-start gap-1" aria-label={label}>
      <span className="text-[11px] uppercase tracking-wide text-slate-600 dark:text-slate-400">{label}</span>
      {children}
    </div>
  );
}

function Segmented({ options, value, onChange }) {
  return (
    <div className="inline-flex rounded-2xl overflow-hidden border border-violet-500/50 bg-white dark:bg-slate-800">
      {options.map((opt, idx) => {
        const active = String(value) === String(opt.k);
        return (
          <button
            key={String(opt.k)}
            onClick={() => onChange(opt.k)}
            className={[
              "px-3 py-1.5 text-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400",
              active ? "bg-violet-600 text-white" : "text-violet-700 dark:text-violet-300 hover:bg-violet-500/10",
              idx === 0 ? "border-r border-violet-500/30" : "",
            ].join(" ")}
            aria-pressed={active}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function Card({ children, className = "" }) {
  return (
    <div className={`rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-4 ${className}`}>
      {children}
    </div>
  );
}

function StatCard({ label, value, sub }) {
  return (
    <Card>
      <div className="text-sm text-slate-600 dark:text-slate-400">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">{value}</div>
      {sub && <div className="mt-1 text-xs text-slate-500 dark:text-slate-500">{sub}</div>}
    </Card>
  );
}
