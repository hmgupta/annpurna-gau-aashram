/** Convert Motoko Time (bigint nanoseconds) to a readable date string */
export function formatTime(time: bigint, lang: "en" | "hi" = "en"): string {
  const ms = Number(time) / 1_000_000;
  const date = new Date(ms);
  const locale = lang === "hi" ? "hi-IN" : "en-IN";
  return date.toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** Format currency */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Encode birth year+month into YYYYMM bigint */
export function encodeBirthDate(year: number, month: number): bigint {
  return BigInt(year * 100 + month);
}

/** Decode YYYYMM bigint to {year, month}. Returns null if value < 190000 (old year-only data). */
export function decodeBirthDate(
  age: bigint,
): { year: number; month: number } | null {
  const n = Number(age);
  if (n < 190000) return null; // old data stored as plain years
  const year = Math.floor(n / 100);
  const month = n % 100;
  if (year < 1900 || year > 2100 || month < 1 || month > 12) return null;
  return { year, month };
}

/** Calculate age in years and months from YYYYMM bigint */
export function calcAgeFromBirth(age: bigint): {
  years: number;
  months: number;
  display: (lang: "en" | "hi") => string;
} {
  const birth = decodeBirthDate(age);
  if (!birth) {
    const years = Number(age);
    return {
      years,
      months: 0,
      display: (lang) => (lang === "hi" ? `${years} वर्ष` : `${years} yr`),
    };
  }
  const now = new Date();
  let years = now.getFullYear() - birth.year;
  let months = now.getMonth() + 1 - birth.month;
  if (months < 0) {
    years--;
    months += 12;
  }
  return {
    years,
    months,
    display: (lang) => {
      if (lang === "hi") {
        if (years === 0) return `${months} महीने`;
        if (months === 0) return `${years} साल`;
        return `${years} साल ${months} महीने`;
      }
      if (years === 0) return `${months} mo`;
      if (months === 0) return `${years} yr`;
      return `${years} yr ${months} mo`;
    },
  };
}
