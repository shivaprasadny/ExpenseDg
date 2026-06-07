import { dbPromise } from "../database/db";

export type AppTheme = "LIGHT" | "DARK" | "SYSTEM";

export interface UserProfile {
  userName: string;
  nickname: string;
  dateOfBirth: string;
  currencySymbol: string;
  theme: AppTheme;
}

/**
 * Get saved user profile from SQLite.
 */
export async function getUserProfile(): Promise<UserProfile> {
  const db = await dbPromise;

  const result = await db.getFirstAsync<any>(
    `
    SELECT
      userName,
      nickname,
      dateOfBirth,
      currencySymbol,
      theme
    FROM profile
    WHERE id = 1
    `
  );

  return {
    userName: result?.userName ?? "",
    nickname: result?.nickname ?? "",
    dateOfBirth: result?.dateOfBirth ?? "",
    currencySymbol: result?.currencySymbol ?? "$",
    theme: result?.theme ?? "SYSTEM",
  };
}

/**
 * Save user profile into SQLite.
 */
export async function saveUserProfile(
  profile: UserProfile
): Promise<void> {
  const db = await dbPromise;

  await db.runAsync(
    `
    INSERT OR REPLACE INTO profile
    (
      id,
      userName,
      nickname,
      dateOfBirth,
      currencySymbol,
      theme
    )
    VALUES
    (
      1,
      ?,
      ?,
      ?,
      ?,
      ?
    )
    `,
    [
      profile.userName.trim(),
      profile.nickname.trim(),
      profile.dateOfBirth,
      profile.currencySymbol.trim() || "$",
      profile.theme,
    ]
  );
}