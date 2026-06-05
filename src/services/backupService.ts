import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";

import { dbPromise, resetDatabase } from "../database/db";

/**
 * Create JSON backup and share it.
 */
export async function createBackup() {
  const db = await dbPromise;

  const categories = await db.getAllAsync("SELECT * FROM categories");
  const expenses = await db.getAllAsync("SELECT * FROM expenses");
  const settings = await db.getAllAsync("SELECT * FROM settings");

  const backup = {
    appName: "ExpenseDG",
    version: 1,
    createdAt: new Date().toISOString(),
    categories,
    expenses,
    settings,
  };

  const fileName = `ExpenseDG_Backup_${Date.now()}.json`;
  const fileUri = FileSystem.documentDirectory + fileName;

  await FileSystem.writeAsStringAsync(
    fileUri,
    JSON.stringify(backup, null, 2)
  );

  await Sharing.shareAsync(fileUri);
}

/**
 * Pick a backup JSON file and restore data into SQLite.
 */
export async function restoreBackup() {
  const result = await DocumentPicker.getDocumentAsync({
    type: "application/json",
    copyToCacheDirectory: true,
  });

  if (result.canceled) {
    return;
  }

  const fileUri = result.assets[0].uri;

  const fileContent = await FileSystem.readAsStringAsync(fileUri);

  const backup = JSON.parse(fileContent);

  if (!backup.categories || !backup.expenses) {
    throw new Error("Invalid ExpenseDG backup file");
  }

  const db = await dbPromise;

  await resetDatabase();

  /**
   * Clear default categories after reset.
   * Then restore exact backup categories.
   */
  await db.execAsync(`
    DELETE FROM expenses;
    DELETE FROM categories;
    DELETE FROM settings;
  `);

  for (const category of backup.categories) {
    await db.runAsync(
      `
      INSERT INTO categories (id, name, icon, createdAt)
      VALUES (?, ?, ?, ?)
      `,
      [
        category.id,
        category.name,
        category.icon,
        category.createdAt ?? new Date().toISOString(),
      ]
    );
  }

  for (const expense of backup.expenses) {
    await db.runAsync(
      `
      INSERT INTO expenses
      (id, title, amount, categoryId, paymentMethod, note, expenseDate, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        expense.id,
        expense.title,
        expense.amount,
        expense.categoryId,
        expense.paymentMethod,
        expense.note ?? "",
        expense.expenseDate,
        expense.createdAt ?? new Date().toISOString(),
      ]
    );
  }

  if (backup.settings && backup.settings.length > 0) {
    for (const setting of backup.settings) {
      await db.runAsync(
        `
        INSERT INTO settings (id, monthlyBudget)
        VALUES (?, ?)
        `,
        [setting.id, setting.monthlyBudget ?? 0]
      );
    }
  } else {
    await db.runAsync(
      "INSERT OR IGNORE INTO settings (id, monthlyBudget) VALUES (1, 0)"
    );
  }
}
/**
 * Export all transactions as CSV and share the file.
 */
export async function exportCsv() {
  const db = await dbPromise;

  const rows = await db.getAllAsync<any>(`
    SELECT
      e.expenseDate,
      e.type,
      c.name as categoryName,
      e.title,
      e.amount,
      e.paymentMethod,
      e.note
    FROM expenses e
    LEFT JOIN categories c
      ON c.id = e.categoryId
    ORDER BY datetime(e.expenseDate) DESC
  `);

  const header =
    "Date,Type,Category,Title,Amount,Payment Method,Note\n";

  const csvRows = rows.map((row) => {
    const date = new Date(row.expenseDate).toLocaleDateString();

    return [
      date,
      row.type,
      row.categoryName,
      row.title,
      row.amount,
      row.paymentMethod,
      row.note ?? "",
    ]
      .map((value) => `"${String(value).replace(/"/g, '""')}"`)
      .join(",");
  });

  const csvContent = header + csvRows.join("\n");

  const fileName = `ExpenseDG_Export_${Date.now()}.csv`;
  const fileUri = FileSystem.documentDirectory + fileName;

  await FileSystem.writeAsStringAsync(fileUri, csvContent);

  await Sharing.shareAsync(fileUri);
}