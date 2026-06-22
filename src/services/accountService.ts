import { dbPromise } from "../database/db";
import { Account } from "../types";

export interface SaveAccountInput {
  name: string;
  paymentMethod: string;
  provider?: string;
  lastFour?: string;
  icon?: string;
  isDefault?: boolean;
}

export async function getActiveAccounts(): Promise<Account[]> {
  const db = await dbPromise;

  return await db.getAllAsync<Account>(`
    SELECT
      id,
      name,
      paymentMethod,
      provider,
      lastFour,
      icon,
      isDefault,
      isArchived
    FROM accounts
    WHERE isArchived = 0
    ORDER BY isDefault DESC, name ASC
  `);
}

export async function getAccountById(id: number): Promise<Account | null> {
  const db = await dbPromise;

  return (
    (await db.getFirstAsync<Account>(
      `
      SELECT
        id,
        name,
        paymentMethod,
        provider,
        lastFour,
        icon,
        isDefault,
        isArchived
      FROM accounts
      WHERE id = ?
      `,
      [id]
    )) ?? null
  );
}

export async function addAccount(input: SaveAccountInput): Promise<void> {
  const db = await dbPromise;

  await db.withTransactionAsync(async () => {
    if (input.isDefault) {
      await db.runAsync(
        `UPDATE accounts SET isDefault = 0 WHERE paymentMethod = ?`,
        [input.paymentMethod]
      );
    }

    await db.runAsync(
      `
      INSERT INTO accounts
      (name, paymentMethod, provider, lastFour, icon, isDefault)
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        input.name.trim(),
        input.paymentMethod,
        input.provider?.trim() ?? "",
        input.lastFour?.trim() ?? "",
        input.icon?.trim() || "💳",
        input.isDefault ? 1 : 0,
      ]
    );
  });
}

export async function updateAccount(
  id: number,
  input: SaveAccountInput
): Promise<void> {
  const db = await dbPromise;

  await db.withTransactionAsync(async () => {
    if (input.isDefault) {
      await db.runAsync(
        `UPDATE accounts SET isDefault = 0 WHERE paymentMethod = ?`,
        [input.paymentMethod]
      );
    }

    await db.runAsync(
      `
      UPDATE accounts
      SET name = ?,
          paymentMethod = ?,
          provider = ?,
          lastFour = ?,
          icon = ?,
          isDefault = ?
      WHERE id = ?
      `,
      [
        input.name.trim(),
        input.paymentMethod,
        input.provider?.trim() ?? "",
        input.lastFour?.trim() ?? "",
        input.icon?.trim() || "💳",
        input.isDefault ? 1 : 0,
        id,
      ]
    );
  });
}

export async function archiveAccount(id: number): Promise<void> {
  const db = await dbPromise;

  await db.runAsync(
    `UPDATE accounts SET isArchived = 1, isDefault = 0 WHERE id = ?`,
    [id]
  );
}
