import { dbPromise } from "../database/db";

export type AppTheme = "LIGHT" | "DARK" | "SYSTEM";

export interface UserProfile {
  userName: string;
  currencySymbol: string;
  savingsGoal: number;
  theme: AppTheme;
}

/**
 * Get saved user profile from SQLite.
 */
export async function getUserProfile(): Promise<UserProfile> {
  const db = await dbPromise;

  const result = await db.getFirstAsync<UserProfile>(
    `
    SELECT
      userName,
      currencySymbol,
      savingsGoal,
      theme
    FROM profile
    WHERE id = 1
    `
  );

  return {
    userName: result?.userName ?? "",
    currencySymbol: result?.currencySymbol ?? "$",
    savingsGoal: result?.savingsGoal ?? 0,
    theme: result?.theme ?? "SYSTEM",
  };
}

/**
 * Save user profile into SQLite.
 */
export async function saveUserProfile(profile: UserProfile): Promise<void> {
  const db = await dbPromise;

  await db.runAsync(
    `
    INSERT OR REPLACE INTO profile
    (id, userName, currencySymbol, savingsGoal, theme)
    VALUES (1, ?, ?, ?, ?)
    `,
    [
      profile.userName.trim(),
      profile.currencySymbol.trim() || "$",
      profile.savingsGoal,
      profile.theme,
    ]
  );
}