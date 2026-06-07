import AsyncStorage from "@react-native-async-storage/async-storage";
import * as LocalAuthentication from "expo-local-authentication";

const BIOMETRIC_ENABLED_KEY = "EXPENSEDG_BIOMETRIC_ENABLED";

/**
 * Check if device supports biometric authentication.
 */
export async function isBiometricAvailable(): Promise<boolean> {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const isEnrolled = await LocalAuthentication.isEnrolledAsync();

  return hasHardware && isEnrolled;
}

/**
 * Check if biometric unlock is enabled in ExpenseDG.
 */
export async function isBiometricEnabled(): Promise<boolean> {
  const value = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);
  return value === "true";
}

/**
 * Enable or disable biometric unlock.
 */
export async function setBiometricEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, String(enabled));
}

/**
 * Ask Face ID / Touch ID / Fingerprint to unlock.
 */
export async function authenticateWithBiometrics(): Promise<boolean> {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: "Unlock ExpenseDG",
    fallbackLabel: "Use PIN",
    cancelLabel: "Cancel",
    disableDeviceFallback: false,
  });

  return result.success;
}