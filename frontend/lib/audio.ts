// Per-verse recitation audio from the everyayah.com CDN. Each reciter is a
// folder of files named {surah:03d}{ayah:03d}.mp3.

export interface Reciter {
  id: string;
  name: string;
  folder: string;
}

// Folder names verified against everyayah.com.
export const RECITERS: Reciter[] = [
  { id: "alafasy", name: "Mishary Alafasy", folder: "Alafasy_128kbps" },
  { id: "husary", name: "Mahmoud Al-Husary", folder: "Husary_128kbps" },
  {
    id: "abdulbasit",
    name: "Abdul Basit (Murattal)",
    folder: "Abdul_Basit_Murattal_192kbps",
  },
  { id: "minshawi", name: "Al-Minshawi", folder: "Minshawy_Murattal_128kbps" },
  {
    id: "sudais",
    name: "Abdurrahman As-Sudais",
    folder: "Abdurrahmaan_As-Sudais_192kbps",
  },
];

export const DEFAULT_RECITER = RECITERS[0];

export function reciterById(id: string | null | undefined): Reciter {
  return RECITERS.find((r) => r.id === id) ?? DEFAULT_RECITER;
}

export function verseAudioUrl(
  surah: number,
  ayah: number,
  folder: string = DEFAULT_RECITER.folder,
): string {
  const s = String(surah).padStart(3, "0");
  const a = String(ayah).padStart(3, "0");
  return `https://everyayah.com/data/${folder}/${s}${a}.mp3`;
}
