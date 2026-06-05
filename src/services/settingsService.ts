import { dbPromise } from "../database/db";

/**
 * Get monthly budget from settings table.
 */
export async function getMonthlyBudget(): Promise<number> {
  const db = await dbPromise;

  const result = await db.getFirstAsync<{ monthlyBudget: number }>(
    `
    SELECT monthlyBudget
    FROM settings
    WHERE id = 1
    `
  );

  return result?.monthlyBudget ?? 0;
}

/**
 * Update monthly budget in settings table.
 */
export async function updateMonthlyBudget(amount: number): Promise<void> {
  const db = await dbPromise;

  await db.runAsync(
    `
    INSERT OR REPLACE INTO settings (id, monthlyBudget)
    VALUES (1, ?)
    `,
    [amount]
  );
}