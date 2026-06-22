import * as SQLite from "expo-sqlite";

export const dbPromise = SQLite.openDatabaseAsync("expensedg.db");

/**
 * Create database tables and run migrations.
 *
 * This app is local-only. All data stays on the user's device.
 */
export async function initDatabase() {
  const db = await dbPromise;

  /**
   * Create base tables.
   */
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      icon TEXT NOT NULL DEFAULT '💰',
      type TEXT DEFAULT 'EXPENSE',
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      paymentMethod TEXT NOT NULL,
      provider TEXT NOT NULL DEFAULT '',
      lastFour TEXT NOT NULL DEFAULT '',
      icon TEXT NOT NULL DEFAULT '💳',
      isDefault INTEGER NOT NULL DEFAULT 0,
      isArchived INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      amount REAL NOT NULL,
      categoryId INTEGER NOT NULL,
      paymentMethod TEXT NOT NULL DEFAULT 'Cash',
      accountId INTEGER,
      note TEXT,
      expenseDate TEXT NOT NULL,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      type TEXT DEFAULT 'EXPENSE',
      isFavorite INTEGER DEFAULT 0,
      recurringGroupId TEXT,
      isRecurring INTEGER DEFAULT 0,
      recurringStatus TEXT DEFAULT 'ACTIVE',
      FOREIGN KEY (categoryId) REFERENCES categories(id),
      FOREIGN KEY (accountId) REFERENCES accounts(id)
    );

    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      monthlyBudget REAL NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS profile (
      id INTEGER PRIMARY KEY,
      userName TEXT DEFAULT '',
      nickname TEXT DEFAULT '',
      dateOfBirth TEXT DEFAULT '',
      pinHint TEXT DEFAULT '',
      currencySymbol TEXT DEFAULT '$',
      theme TEXT DEFAULT 'SYSTEM',
      biometricEnabled INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS notification_settings (
      id INTEGER PRIMARY KEY,
      smartReminder INTEGER DEFAULT 1,
      weeklyReview INTEGER DEFAULT 1,
      monthlyBackup INTEGER DEFAULT 1
    );
  `);

  /**
   * Migrations for users who already have an older database.
   * Each migration is wrapped in try/catch because SQLite throws
   * if the column already exists.
   */
  await runMigrations();

  /**
   * Insert default rows after tables and migrations are ready.
   */
  await insertDefaultCategories();
  await insertDefaultSettings();
  await insertDefaultProfile();
  await insertDefaultNotificationSettings();
}

/**
 * Run safe schema migrations.
 */
async function runMigrations() {
  const db = await dbPromise;

  // Category type support: EXPENSE / INCOME
  try {
    await db.execAsync(`
      ALTER TABLE categories ADD COLUMN type TEXT DEFAULT 'EXPENSE';
    `);
  } catch {}

  // Transaction type support: EXPENSE / INCOME
  try {
    await db.execAsync(`
      ALTER TABLE expenses ADD COLUMN type TEXT DEFAULT 'EXPENSE';
    `);
  } catch {}

  // Specific card/bank/payment source for a transaction
  try {
    await db.execAsync(`
      ALTER TABLE expenses ADD COLUMN accountId INTEGER;
    `);
  } catch {}

  // Favorite records
  try {
    await db.execAsync(`
      ALTER TABLE expenses ADD COLUMN isFavorite INTEGER DEFAULT 0;
    `);
  } catch {}

  // Recurring records group id
  try {
    await db.execAsync(`
      ALTER TABLE expenses ADD COLUMN recurringGroupId TEXT;
    `);
  } catch {}

  // Marks a record as recurring
  try {
    await db.execAsync(`
      ALTER TABLE expenses ADD COLUMN isRecurring INTEGER DEFAULT 0;
    `);
  } catch {}

  // Recurring status: ACTIVE / PAUSED
  try {
    await db.execAsync(`
      ALTER TABLE expenses ADD COLUMN recurringStatus TEXT DEFAULT 'ACTIVE';
    `);
  } catch {}

  // User nickname
  try {
    await db.execAsync(`
      ALTER TABLE profile ADD COLUMN nickname TEXT DEFAULT '';
    `);
  } catch {}

  // User birthday
  try {
    await db.execAsync(`
      ALTER TABLE profile ADD COLUMN dateOfBirth TEXT DEFAULT '';
    `);
  } catch {}

  // PIN hint
  try {
    await db.execAsync(`
      ALTER TABLE profile ADD COLUMN pinHint TEXT DEFAULT '';
    `);
  } catch {}

  // Theme support: LIGHT / DARK / SYSTEM
  try {
    await db.execAsync(`
      ALTER TABLE profile ADD COLUMN theme TEXT DEFAULT 'SYSTEM';
    `);
  } catch {}

  // Biometric unlock ON/OFF
  try {
    await db.execAsync(`
      ALTER TABLE profile ADD COLUMN biometricEnabled INTEGER DEFAULT 0;
    `);
  } catch {}

  // Some older versions had currency without default.
  try {
    await db.execAsync(`
      ALTER TABLE profile ADD COLUMN currencySymbol TEXT DEFAULT '$';
    `);
  } catch {}
}

/**
 * Insert default expense and income categories.
 */
async function insertDefaultCategories() {
  const db = await dbPromise;

  const categories = [
    ["Food", "🍔", "EXPENSE"],
    ["Travel", "🚕", "EXPENSE"],
    ["Groceries", "🛒", "EXPENSE"],
    ["Shopping", "🛍️", "EXPENSE"],
    ["Bills", "💡", "EXPENSE"],
    ["Health", "💊", "EXPENSE"],
    ["Entertainment", "🎬", "EXPENSE"],
    ["Subscription", "🔁", "EXPENSE"],
    ["Other", "💰", "EXPENSE"],

    ["Salary", "💼", "INCOME"],
    ["Freelance", "💻", "INCOME"],
    ["Gift", "🎁", "INCOME"],
    ["Refund", "↩️", "INCOME"],
    ["Investment", "📈", "INCOME"],
    ["Other Income", "💰", "INCOME"],
  ];

  for (const [name, icon, type] of categories) {
    await db.runAsync(
      `
      INSERT INTO categories (name, icon, type)
      SELECT ?, ?, ?
      WHERE NOT EXISTS (
        SELECT 1
        FROM categories
        WHERE name = ? AND type = ?
      )
      `,
      [name, icon, type, name, type]
    );
  }
}

/**
 * Insert default app settings row.
 */
async function insertDefaultSettings() {
  const db = await dbPromise;

  await db.runAsync(`
    INSERT OR IGNORE INTO settings (id, monthlyBudget)
    VALUES (1, 0)
  `);
}

/**
 * Insert default profile row.
 *
 * Important:
 * This must match the current profile table.
 * Do NOT insert savingsGoal here because the profile table no longer uses it.
 */
async function insertDefaultProfile() {
  const db = await dbPromise;

  await db.runAsync(
    `
    INSERT OR IGNORE INTO profile
    (
      id,
      userName,
      nickname,
      dateOfBirth,
      pinHint,
      currencySymbol,
      theme,
      biometricEnabled
    )
    VALUES
    (
      1,
      '',
      '',
      '',
      '',
      '$',
      'SYSTEM',
      0
    )
    `
  );
}

/**
 * Insert default notification settings.
 */
async function insertDefaultNotificationSettings() {
  const db = await dbPromise;

  await db.runAsync(`
    INSERT OR IGNORE INTO notification_settings
    (id, smartReminder, weeklyReview, monthlyBackup)
    VALUES (1, 1, 1, 1)
  `);
}

/**
 * Reset all local app data and recreate defaults.
 */
export async function resetDatabase() {
  const db = await dbPromise;

  await db.execAsync(`
    DELETE FROM expenses;
    DELETE FROM accounts;
    DELETE FROM categories;
    DELETE FROM settings;
    DELETE FROM profile;
    DELETE FROM notification_settings;
  `);

  await insertDefaultCategories();
  await insertDefaultSettings();
  await insertDefaultProfile();
  await insertDefaultNotificationSettings();
}

/**
 * Clear all local app data without recreating defaults.
 */
export async function clearDatabase() {
  const db = await dbPromise;

  await db.execAsync(`
    DELETE FROM expenses;
    DELETE FROM accounts;
    DELETE FROM categories;
    DELETE FROM settings;
    DELETE FROM profile;
    DELETE FROM notification_settings;
  `);
}

/**
 * Delete only income and expense records.
 *
 * Keeps:
 * - categories
 * - profile
 * - currency
 * - theme
 * - biometric setting
 * - notification settings
 */
export async function clearRecordsOnly() {
  const db = await dbPromise;

  await db.execAsync(`
    DELETE FROM expenses;
  `);
}
