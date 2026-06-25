// Per-verse recitation audio from the everyayah.com CDN (Mishary Alafasy).
// Stable public URLs of the form .../{surah:03d}{ayah:03d}.mp3.
export function verseAudioUrl(surah: number, ayah: number): string {
  const s = String(surah).padStart(3, "0");
  const a = String(ayah).padStart(3, "0");
  return `https://everyayah.com/data/Alafasy_128kbps/${s}${a}.mp3`;
}
