"use client";

import type { Surah } from "@/lib/api/types";

export function SurahSelect({
  surahs,
  value,
  onChange,
  label,
}: {
  surahs: Surah[];
  value: number;
  onChange: (n: number) => void;
  label?: string;
}) {
  return (
    <label className="flex items-center gap-2 text-sm">
      {label && <span className="text-lapis/60 dark:text-parchment/60">{label}</span>}
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="rounded-lg border border-sand bg-white px-3 py-1.5 text-lapis focus:border-khatulistiwa focus:outline-none"
      >
        {surahs.map((s) => (
          <option key={s.number} value={s.number}>
            {s.number}. {s.name_transliteration}
          </option>
        ))}
      </select>
    </label>
  );
}
