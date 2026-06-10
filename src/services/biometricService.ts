import AsyncStorage from "@react-native-async-storage/async-storage";
import * as LocalAuthentication from "expo-local-authentication";

const BIOMETRIC_ENABLED_KEY = "EXPENSEDG_BIOMETRIC_ENABLED_DEBUG";

/**
 * Check if phone supports biometric and user has Face ID / Fingerprint set up.
 */
export async function isBiometricAvailable(): Promise<boolean> {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const isEnrolled = await LocalAuthentication.isEnrolledAsync();

  console.log("Biometric hardware:", hasHardware);
  console.log("Biometric enrolled:", isEnrolled);

  return hasHardware && isEnrolled;
}

/**
 * Read saved biometric setting.
 */
export async function isBiometricEnabled(): Promise<boolean> {
  const value = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);

  console.log("READ biometric raw value:", value);

  return value === "true";
}

/**
 * Save biometric setting.
 */
export async function setBiometricEnabled(enabled: boolean): Promise<void> {
  console.log("SAVING biometric value:", enabled);

  await AsyncStorage.setItem(
    BIOMETRIC_ENABLED_KEY,
    enabled ? "true" : "false"
  );

  const saved = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);
  console.log("SAVED biometric raw value:", saved);
}

/**
 * Show Face ID / Fingerprint prompt.
 */
export async function authenticateWithBiometrics(): Promise<boolean> {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: "Unlock ExpenseDG",
    fallbackLabel: "Use PIN",
    cancelLabel: "Cancel",
    disableDeviceFallback: false,
  });

  console.log("Biometric auth result:", result);

  return result.success;
}