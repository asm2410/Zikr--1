import * as SQLite from 'expo-sqlite';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DB_NAME, SEED_VERSION_KEY } from '../core/constants';
import { CREATE_TABLES_SQL } from './schema';
import { logger } from '../core/utils/logger';
import type { Zikr, ZikrCategory } from '../core/types';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync(DB_NAME);
  await db.execAsync(CREATE_TABLES_SQL);
  logger.info('Database initialized');
  return db;
}

async function migrateSchema(database: SQLite.SQLiteDatabase): Promise<void> {
  const migrations = [
    `ALTER TABLE zikr ADD COLUMN sourceReferenceEn TEXT`,
    `ALTER TABLE zikr ADD COLUMN fadlEn TEXT`,
    `ALTER TABLE zikr ADD COLUMN titleAr TEXT`,
  ];
  for (const sql of migrations) {
    try {
      await database.execAsync(sql);
      logger.info(`Migration applied: ${sql}`);
    } catch (_err) {
      // Column already exists — ignore
    }
  }
}

export async function seedDatabase(data: { categoriesSQL: string[]; zikrSQL: string[] }, seedVersion: number): Promise<void> {
  const database = await getDatabase();
  const storedVersion = await AsyncStorage.getItem(SEED_VERSION_KEY).catch(() => null);
  const savedVersion = storedVersion ? parseInt(storedVersion, 10) : 0;

  if (savedVersion >= seedVersion) {
    logger.info(`Database already seeded (v${savedVersion}), skipping`);
    return;
  }

  await migrateSchema(database);

  try {
    await database.withTransactionAsync(async () => {
      for (const sql of data.categoriesSQL) {
        await database.execAsync(sql);
      }
      for (const sql of data.zikrSQL) {
        await database.execAsync(sql);
      }
    });
    await AsyncStorage.setItem(SEED_VERSION_KEY, String(seedVersion)).catch(() => {});
    logger.info(`Database seeded successfully (v${seedVersion})`);
  } catch (err) {
    logger.error(`Seed INSERT failed, falling back to individual statements`, err);
    try {
      for (const sql of data.categoriesSQL) {
        await database.execAsync(sql).catch(() => {});
      }
      for (const sql of data.zikrSQL) {
        await database.execAsync(sql).catch(() => {});
      }
      await AsyncStorage.setItem(SEED_VERSION_KEY, String(seedVersion)).catch(() => {});
    } catch (_fallbackErr) {
      logger.error(`Fallback seeding failed`, _fallbackErr);
    }
  }
}

export async function getAllCategories(): Promise<ZikrCategory[]> {
  const database = await getDatabase();
  return await database.getAllAsync<ZikrCategory>('SELECT * FROM categories ORDER BY orderIndex ASC');
}

export async function getAllZikr(): Promise<Zikr[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<any>('SELECT * FROM zikr ORDER BY categoryId ASC, orderIndex ASC');
  return rows.map(parseZikrRow);
}

function parseZikrRow(row: any): Zikr {
  return {
    id: Number(row.id),
    categoryId: Number(row.categoryId),
    title: row.title ?? null,
    titleAr: row.titleAr ?? null,
    arabic: row.arabicText,
    transliteration: row.transliteration ?? null,
    translation: row.translation,
    count: Number(row.repeatCount ?? 1),
    notes: row.notes ?? null,
    sourceReference: row.sourceReference ?? null,
    fadl: row.fadl ?? null,
    sourceReferenceEn: row.sourceReferenceEn ?? null,
    fadlEn: row.fadlEn ?? null,
    orderIndex: Number(row.orderIndex ?? 0),
    tags: row.tags ? JSON.parse(row.tags) : [],
  };
}
