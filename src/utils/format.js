// src/utils/format.js

/** Format angka ke mata uang dengan fallback aman */
export function fmtCurrency(n, code = "USD", locale = "en-US") {
  const value = Number(n ?? 0);
  const maxFrac = (code === "IDR" || code === "VND") ? 0 : 2;

  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: code,
      maximumFractionDigits: maxFrac,
    }).format(value);
  } catch {
    // fallback bila currency code tidak dikenal oleh Intl
    return `${code} ${value.toLocaleString(locale, { maximumFractionDigits: maxFrac })}`;
  }
}

/** Format angka biasa */
export function fmtNumber(n, locale = "en-US") {
  return new Intl.NumberFormat(locale).format(Number(n ?? 0));
}

/** Kelas warna persen (positif / negatif / netral) */
export function pctClass(p) {
  if (p == null || Number.isNaN(p)) return "text-slate-600 dark:text-slate-300";
  return p >= 0
    ? "text-emerald-600 dark:text-emerald-400"
    : "text-rose-600 dark:text-rose-400";
}
