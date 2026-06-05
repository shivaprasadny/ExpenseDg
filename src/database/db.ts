import * as SQLite from "expo-sqlite";

export const dbPromise = SQLite.openDatabaseAsync("expensedg.db");

/**
 * Create database tables and run small migrations.
 */
export async function initDatabase() {
  const db = await dbPromise;

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      icon TEXT NOT NULL DEFAULT '💰',
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      amount REAL NOT NULL,
      categoryId INTEGER NOT NULL,
      paymentMethod TEXT NOT NULL DEFAULT 'Cash',
      note TEXT,
      expenseDate TEXT NOT NULL,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (categoryId) REFERENCES categories(id)
    );

    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      monthlyBudget REAL NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS profile (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      userName TEXT NOT NULL DEFAULT '',
      currencySymbol TEXT NOT NULL DEFAULT '$',
      savingsGoal REAL NOT NULL DEFAULT 0
    );
  `);

  // Migration: add type column to categories
  try {
    await db.execAsync(
      `ALTER TABLE categories ADD COLUMN type TEXT DEFAULT 'EXPENSE';`
    );
  } catch {}

  // Migration: add type column to expenses/transactions
  try {
    await db.execAsync(
      `ALTER TABLE expenses ADD COLUMN type TEXT DEFAULT 'EXPENSE';`
    );
  } catch {}

  await insertDefaultCategories();
  await insertDefaultSettings();
  await insertDefaultProfile();
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
 * Insert default settings row.
 */
async function insertDefaultSettings() {
  const db = await dbPromise;

  await db.runAsync(
    "INSERT OR IGNORE INTO settings (id, monthlyBudget) VALUES (1, 0)"
  );
}

/**
 * Insert default profile row.
 */
async function insertDefaultProfile() {
  const db = await dbPromise;

  await db.runAsync(
    `
    INSERT OR IGNORE INTO profile
    (id, userName, currencySymbol, savingsGoal)
    VALUES (1, '', '$', 0)
    `
  );
}

/**
 * Reset all data and recreate defaults.
 */
export async function resetDatabase() {
  const db = await dbPromise;

  await db.execAsync(`
    DELETE FROM expenses;
    DELETE FROM categories;
    DELETE FROM settings;
    DELETE FROM profile;
  `);

  await insertDefaultCategories();
  await insertDefaultSettings();
  await insertDefaultProfile();
}

/**
 * Clear all data without recreating defaults.
 */
export async function clearDatabase() {
  const db = await dbPromise;

  await db.execAsync(`
    DELETE FROM expenses;
    DELETE FROM categories;
    DELETE FROM settings;
    DELETE FROM profile;
  `);
}