export const CREATE_TABLES_SQL = `
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY NOT NULL,
    title TEXT NOT NULL,
    subtitle TEXT NOT NULL,
    orderIndex INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS zikr (
    id INTEGER PRIMARY KEY NOT NULL,
    categoryId INTEGER NOT NULL,
    title TEXT,
    arabicText TEXT NOT NULL,
    transliteration TEXT,
    translation TEXT NOT NULL,
    repeatCount INTEGER NOT NULL DEFAULT 1,
    notes TEXT,
    sourceReference TEXT,
    fadl TEXT,
    sourceReferenceEn TEXT,
    fadlEn TEXT,
    orderIndex INTEGER NOT NULL DEFAULT 0,
    tags TEXT DEFAULT '[]',
    titleAr TEXT,
    FOREIGN KEY (categoryId) REFERENCES categories(id)
  );

  CREATE INDEX IF NOT EXISTS idx_zikr_category ON zikr(categoryId);
  CREATE INDEX IF NOT EXISTS idx_zikr_order ON zikr(orderIndex);
`;

export const DROP_TABLES_SQL = `
  DROP TABLE IF EXISTS zikr;
  DROP TABLE IF EXISTS categories;
`;
