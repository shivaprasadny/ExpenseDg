import AsyncStorage from "@react-native-async-storage/async-storage";
import { dbPromise } from "../database/db";

const PIN_ENABLED_KEY = "EXPENSEDG_PIN_ENABLED";
const PIN_CODE_KEY = "EXPENSEDG_PIN_CODE";

/**
 * Check if app PIN lock is enabled.
 */
export async function isPinEnabled(): Promise<boolean> {
  const value = await AsyncStorage.getItem(PIN_ENABLED_KEY);
  return value === "true";
}

/**
 * Save a 4-digit PIN and enable app lock.
 */
export async function enablePin(pin: string): Promise<void> {
  await AsyncStorage.setItem(PIN_CODE_KEY, pin);
  await AsyncStorage.setItem(PIN_ENABLED_KEY, "true");
}

/**
 * Disable PIN lock and remove saved PIN.
 */
export async function disablePin(): Promise<void> {
  await AsyncStorage.removeItem(PIN_CODE_KEY);
  await AsyncStorage.setItem(PIN_ENABLED_KEY, "false");
}

/**
 * Verify entered PIN.
 */
export async function verifyPin(pin: string): Promise<boolean> {
  const savedPin = await AsyncStorage.getItem(PIN_CODE_KEY);
  return savedPin === pin;
}

/**
 * Change saved PIN.
 */
export async function changePin(newPin: string): Promise<void> {
  await AsyncStorage.setItem(PIN_CODE_KEY, newPin);
}
export async function savePinHint(hint: string) {
  const db = await dbPromise;

  await db.runAsync(
    `UPDATE profile SET pinHint = ? WHERE id = 1`,
    [hint.trim()]
  );
}

export async function getPinHint(): Promise<string> {
  const db = await dbPromise;

  const result: any = await db.getFirstAsync(
    `SELECT pinHint FROM profile WHERE id = 1`
  );

  return result?.pinHint ?? "";
}