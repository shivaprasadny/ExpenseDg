import { dbPromise } from "../database/db";
import { Category, TransactionType } from "../types";

/**
 * Get categories by type: EXPENSE or INCOME.
 */
export async function getCategoriesByType(
  type: TransactionType
): Promise<Category[]> {
  const db = await dbPromise;

  return await db.getAllAsync<Category>(
    `
    SELECT id, name, icon, type
    FROM categories
    WHERE type = ?
    ORDER BY name ASC
    `,
    [type]
  );
}

/**
 * Get all categories.
 */
export async function getAllCategories(): Promise<Category[]> {
  const db = await dbPromise;

  return await db.getAllAsync<Category>(
    `
    SELECT id, name, icon, type
    FROM categories
    ORDER BY type ASC, name ASC
    `
  );
}

/**
 * Add new category.
 */
export async function addCategory(
  name: string,
  icon: string,
  type: TransactionType
): Promise<void> {
  const db = await dbPromise;

  await db.runAsync(
    `
    INSERT INTO categories (name, icon, type)
    VALUES (?, ?, ?)
    `,
    [name.trim(), icon.trim() || "💰", type]
  );
}

/**
 * Delete category and move related records to fallback category.
 */
export async function deleteCategory(category: Category): Promise<void> {
  const db = await dbPromise;

  const fallbackName =
    category.type === "INCOME" ? "Other Income" : "Other";

  const fallback = await db.getFirstAsync<{ id: number }>(
    `
    SELECT id
    FROM categories
    WHERE name = ? AND type = ?
    `,
    [fallbackName, category.type]
  );

  if (!fallback) {
    throw new Error("Fallback category not found");
  }

  await db.runAsync(
    `
    UPDATE expenses
    SET categoryId = ?
    WHERE categoryId = ?
    `,
    [fallback.id, category.id]
  );

  await db.runAsync(
    `
    DELETE FROM categories
    WHERE id = ?
    `,
    [category.id]
  );
}
/**
 * Update an existing category.
 */
export async function updateCategory(
  id: number,
  name: string,
  icon: string,
  type: TransactionType
): Promise<void> {
  const db = await dbPromise;

  await db.runAsync(
    `
    UPDATE categories
    SET name = ?,
        icon = ?,
        type = ?
    WHERE id = ?
    `,
    [name.trim(), icon.trim() || "💰", type, id]
  );
}