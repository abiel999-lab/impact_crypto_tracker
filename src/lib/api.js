/* ===========================================================
   Fetch util dgn cache + backoff (tangguh utk jaringan lambat)
   =========================================================== */
const CG = "https://api.coingecko.com/api/v3";
const PROXIES = [
  "", // langsung dulu
  "https://cors.isomorphic-git.org/",
  "https://api.allorigins.win/raw?url=",
];

// ---- cache helpers ----
function cacheGet(k) {
  try {
    const raw = localStorage.getItem(k);
    if (!raw) return null;
    const o = JSON.parse(raw);
    if (Date.now() > o.exp) return null;
    return o.data;
  } catch {
    return null;
  }
}
function cacheSet(k, data, ttlMs) {
  try {
    localStorage.setItem(k, JSON.stringify({ exp: Date.now() + ttlMs, data }));
  } catch {}
}

// ---- fetch JSON (dengan opsi proxy) ----
async function fetchJSON(
  url,
  { ttlMs = 60_000, retries = 2, cacheKey, signal, noProxy = false } = {}
) {
  const key = cacheKey || `cache:${url}`;
  const cached = cacheGet(key);
  if (cached) return cached;

  const attempts = noProxy ? [""] : PROXIES;
  let lastErr = null;

  for (let i = 0; i < attempts.length && i <= retries; i++) {
    try {
      const p = attempts[i] ?? "";
      const u = p ? p + encodeURI(url) : url;
      const res = await fetch(u, { headers: { accept: "application/json" }, signal });
      const text = await res.text();
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(text.slice(0, 160));
      }
      cacheSet(key, data, ttlMs);
      return data;
    } catch (e) {
      lastErr = e;
      await new Promise((r) => setTimeout(r, 350 * (i + 1))); // backoff ringan
    }
  }
  if (cached) return cached;
  throw lastErr || new Error("Network error");
}

/* =================== CoinGecko (market / coin chart) =================== */
export async function getMarket({
  vsCurrency = "usd",
  perPage = 50,
  page = 1,
  ids,
} = {}) {
  const qs = new URLSearchParams({
    vs_currency: vsCurrency,
    order: "market_cap_desc",
    per_page: String(perPage),
    page: String(page),
    price_change_percentage: "24h",
  });
  if (ids?.length) qs.set("ids", ids.join(","));
  const url = `${CG}/coins/markets?${qs}`;
  return await fetchJSON(url, { ttlMs: 60_000 });
}

export async function getMarketByIds({ vsCurrency = "usd", ids = [] } = {}) {
  if (!ids.length) return [];
  return await getMarket({ vsCurrency, perPage: ids.length, page: 1, ids });
}

export async function getCoinChart(coinId, vsCurrency = "usd", days = 7) {
  const url = `${CG}/coins/${coinId}/market_chart?vs_currency=${vsCurrency}&days=${days}`;
  return await fetchJSON(url, { ttlMs: 10 * 60_000 });
}

/* =================== FX: sumber utama (fawazahmed0/exchange-api) ===================

   Dok: https://github.com/fawazahmed0/exchange-api
   - latest  : /latest/currencies/usd/idr.json
   - history : /YYYY-MM-DD/currencies/usd/idr.json

   NB: update harian (sekitar 1x/hari); untuk tanggal yang belum ada, kita fallback.
============================================================================= */
const FXA = "https://cdn.jsdelivr.net/gh/fawazahmed0/exchange-api@1";

async function fxaLatest(from, to, signal) {
  const f = from.toLowerCase();
  const t = to.toLowerCase();
  const url = `${FXA}/latest/currencies/${f}/${t}.json`;
  const obj = await fetchJSON(url, {
    ttlMs: 30 * 60_000,
    cacheKey: `fxa:${f}:${t}:latest`,
    noProxy: true,
    signal,
  });
  return Number(obj?.[t]);
}

async function fxaOnDate(from, to, ymd, signal) {
  const f = from.toLowerCase();
  const t = to.toLowerCase();
  const url = `${FXA}/${ymd}/currencies/${f}/${t}.json`;
  const obj = await fetchJSON(url, {
    ttlMs: 30 * 60_000,
    cacheKey: `fxa:${f}:${t}:${ymd}`,
    noProxy: true,
    signal,
  });
  return Number(obj?.[t]);
}

/* =================== FX: fallback (open.er-api.com) ===================

   Dok: https://www.exchangerate-api.com/docs/free
   Contoh: /v6/latest/USD  → { rates: { IDR: ... } }
============================================================================= */
async function eraLatest(from, to, signal) {
  const base = from.toUpperCase();
  const sym = to.toUpperCase();
  const url = `https://open.er-api.com/v6/latest/${base}`;
  const obj = await fetchJSON(url, {
    ttlMs: 30 * 60_000,
    cacheKey: `era:${base}:latest`,
    noProxy: true,
    signal,
  });
  const r = Number(obj?.rates?.[sym]);
  return Number.isFinite(r) ? r : NaN;
}

/* =================== Public FX API (dipakai komponen) =================== */

// daftar simbol (ambil dari exchange-api; kalau gagal, pakai list populer)
export async function getFxSymbols() {
  try {
    const url = `${FXA}/latest/currencies.json`;
    const obj = await fetchJSON(url, {
      ttlMs: 24 * 60 * 60_000,
      cacheKey: "fxa:symbols",
      noProxy: true,
    });
    const list = Object.keys(obj || {})
      .map((s) => s.toUpperCase())
      .sort();
    if (list.length) return list;
  } catch {}
  return [
    "USD","EUR","IDR","JPY","GBP","AUD","CAD","CNY","HKD","INR","SGD","KRW","MYR","THB","CHF","NZD",
    "SAR","AED","PHP","VND","BRL","MXN","ZAR","SEK","NOK","DKK","PLN","ILS","TRY"
  ];
}

// konversi amount: coba exchange-api → fallback ke er-api
export async function convertFx(from, to, amount = 1, signal) {
  let rate = NaN;
  try { rate = await fxaLatest(from, to, signal); } catch {}
  if (!Number.isFinite(rate)) {
    try { rate = await eraLatest(from, to, signal); } catch {}
  }
  if (!Number.isFinite(rate)) return 0;
  const a = Number.parseFloat(amount) || 0;
  return a * rate;
}

// timeseries N hari: ambil per-hari dari exchange-api;
// jika ada tanggal yang tidak tersedia, isi dengan last-known rate.
// kalau tetap kosong, fallback ke latest (garis datar — biar tidak blank).
export async function fxTimeseries(from, to, days = 7, signal) {
  const out = [];
  const today = new Date();
  let lastKnown = NaN;

  // urutan kronologis (paling lama → hari ini)
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 86400_000);
    const ds = d.toISOString().slice(0, 10);

    let rate = NaN;
    try { rate = await fxaOnDate(from, to, ds, signal); } catch {}

    if (!Number.isFinite(rate)) rate = lastKnown; // isi tanggal kosong dengan nilai terakhir
    if (Number.isFinite(rate)) {
      out.push({ t: ds, v: rate });
      lastKnown = rate;
    }
  }

  if (out.length < 2) {
    // benar-benar kosong → pakai latest sebagai garis datar
    let latest = NaN;
    try { latest = await fxaLatest(from, to, signal); } catch {}
    if (!Number.isFinite(latest)) {
      try { latest = await eraLatest(from, to, signal); } catch {}
    }
    if (Number.isFinite(latest)) {
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(today.getTime() - i * 86400_000);
        const ds = d.toISOString().slice(0, 10);
        out.push({ t: ds, v: latest });
      }
    }
  }

  return out;
}
