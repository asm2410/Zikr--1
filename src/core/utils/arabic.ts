export function normalizeArabicForSearch(input: string): string {
  const s = (input ?? '').toString();
  const withoutMarks = s.replace(/[\u0640\u064B-\u065F\u0670\u06D6-\u06ED]/g, '');
  return withoutMarks
    .replace(/[إأآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .trim()
    .toLowerCase();
}

export function extractPreamble(arabic: string): {
  istiaadha: string | null;
  basmala: string | null;
  verseRef: string | null;
  remaining: string;
} {
  let text = arabic.trim();
  let istiaadha: string | null = null;
  let basmala: string | null = null;
  let verseRef: string | null = null;

  const istiaadhaMatch = text.match(/^أعوذ\s*بالـ?لـ?ه\s*من\s*الشيطان\s*الـ?رجـ?يم/u);
  if (istiaadhaMatch) {
    istiaadha = istiaadhaMatch[0].trim();
    text = text.slice(istiaadhaMatch[0].length).trim();
  }

  const basmalaMatch = text.match(/^بسم\s*الله\s*الرحمن\s*الرحيم/u);
  if (basmalaMatch) {
    basmala = basmalaMatch[0].trim();
    text = text.slice(basmalaMatch[0].length).trim();
  }

  const verseMatch = text.match(/\s*\[[^\[\]]+\]\.?\s*$/u);
  if (verseMatch) {
    verseRef = verseMatch[0].trim();
    text = text.slice(0, verseMatch.index).trim();
  }

  return { istiaadha, basmala, verseRef, remaining: text };
}

export function parseHexColor(hex: string): { r: number; g: number; b: number } | null {
  const h = hex.replace('#', '').trim();
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  if (full.length !== 6) return null;
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return null;
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export function rgbaFromHex(hex: string, a: number): string {
  const rgb = parseHexColor(hex);
  if (!rgb) return `rgba(0,0,0,${a})`;
  return `rgba(${rgb.r},${rgb.g},${rgb.b},${a})`;
}
