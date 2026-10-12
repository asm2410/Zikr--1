import type { ZikrData, ZikrCategory } from '../core/types';

export function generateSeedSQL(data: ZikrData): { categoriesSQL: string[]; zikrSQL: string[] } {
  const categoriesSQL = (data.categories || []).map(
    (c: ZikrCategory) =>
      `INSERT OR REPLACE INTO categories (id, title, subtitle, orderIndex) VALUES (${c.id}, '${escapeSQL(c.title)}', '${escapeSQL(c.subtitle)}', ${c.orderIndex ?? 0});`
  );

  const zikrSQL = (data.adhkar || []).map((a: any) => {
    const tags = JSON.stringify(a.tags || []);
    return `INSERT OR REPLACE INTO zikr (id, categoryId, title, titleAr, arabicText, transliteration, translation, repeatCount, notes, sourceReference, fadl, sourceReferenceEn, fadlEn, orderIndex, tags) VALUES (${a.id}, ${a.categoryId}, ${nullOrStr(a.title)}, ${nullOrStr(a.titleAr)}, '${escapeSQL(a.arabicText ?? a.arabic ?? '')}', ${nullOrStr(a.transliteration)}, '${escapeSQL(a.translation)}', ${a.repeatCount ?? 1}, ${nullOrStr(a.notes)}, ${nullOrStr(a.sourceReference)}, ${nullOrStr(a.fadl)}, ${nullOrStr(a.sourceReferenceEn)}, ${nullOrStr(a.fadlEn)}, ${a.orderIndex ?? 0}, '${escapeSQL(tags)}');`;
  });

  return { categoriesSQL, zikrSQL };
}

function escapeSQL(str: string): string {
  if (!str) return '';
  return str.replace(/'/g, "''");
}

function nullOrStr(val: string | null | undefined): string {
  if (val == null || val === '') return 'NULL';
  return `'${escapeSQL(val)}'`;
}
