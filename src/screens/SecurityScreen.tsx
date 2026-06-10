import React, { useEffect, useState } from "react";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

import AppScreen from "../components/AppScreen";
import { useAppTheme } from "../context/ThemeContext";
import {
  changePin,
  disablePin,
  enablePin,
  isPinEnabled,
  verifyPin,
  savePinHint,
  getPinHint,
} from "../services/securityService";
import {
  authenticateWithBiometrics,
  isBiometricAvailable,
  isBiometricEnabled,
  setBiometricEnabled,
} from "../services/biometricService";

/**
 * SecurityScreen
 *
 * User can:
 * - Enable 4-digit PIN
 * - Confirm PIN before saving
 * - Change PIN by entering old PIN first
 * - Disable PIN
 */
export default function SecurityScreen() {
  const { colors, isDark } = useAppTheme();
  const styles = createStyles(colors, isDark);

  const [pinEnabled, setPinEnabled] = useState(false);
const [savedHint, setSavedHint] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [oldPin, setOldPin] = useState("");
  const [pinHint, setPinHint] = useState("");
  const [biometricAvailable, setBiometricAvailable] = useState(false);
const [biometricEnabled, setBiometricEnabled] = useState(false);

  useEffect(() => {
    loadStatus();
  }, []);

  /**
   * Check if PIN is already enabled.
   */
async function loadStatus() {
  const enabled = await isPinEnabled();
  const hint = await getPinHint();

  const available = await isBiometricAvailable();
  const biometric = await isBiometricEnabled();

  setPinEnabled(enabled);
  setPinHint(hint);
  setSavedHint(hint);

  setBiometricAvailable(available);
  setBiometricEnabled(biometric);
}
  /**
   * Validate PIN format.
   */
  function isValidPin(value: string) {
    return /^\d{4}$/.test(value);
  }

  /**
   * Clear all input fields.
   */
  function clearFields() {
    setPin("");
    setConfirmPin("");
    setOldPin("");
  }

  /**
   * Enable PIN lock.
   */
  async function handleEnablePin() {
  if (!isValidPin(pin)) {
    Alert.alert("Invalid PIN", "PIN must be exactly 4 digits.");
    return;
  }

  if (pin !== confirmPin) {
    Alert.alert("PIN mismatch", "PIN and confirm PIN do not match.");
    return;
  }

  await enablePin(pin);
  await savePinHint(pinHint);

  clearFields();
  setPinEnabled(true);

  Alert.alert("Success", "PIN lock enabled.");
}
  /**
   * Change existing PIN.
   * User must enter old PIN first.
   */
  async function handleChangePin() {
    if (!isValidPin(oldPin)) {
      Alert.alert("Invalid Old PIN", "Please enter your current 4-digit PIN.");
      return;
    }

    const oldPinCorrect = await verifyPin(oldPin);

    if (!oldPinCorrect) {
      Alert.alert("Wrong PIN", "Your current PIN is incorrect.");
      return;
    }

    if (!isValidPin(pin)) {
      Alert.alert("Invalid New PIN", "New PIN must be exactly 4 digits.");
      return;
    }

    if (pin !== confirmPin) {
      Alert.alert("PIN mismatch", "New PIN and confirm PIN do not match.");
      return;
    }

    await changePin(pin);

    clearFields();

    Alert.alert("Success", "PIN changed successfully.");
  }

  /**
   * Disable PIN lock.
   */
  async function handleDisablePin() {
    Alert.alert("Disable PIN", "Are you sure you want to disable PIN lock?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Disable",
        style: "destructive",
        onPress: async () => {
  if (!oldPin || oldPin.length !== 4) {
    Alert.alert("PIN Required", "Please enter your current PIN before disabling.");
    return;
  }

  const correct = await verifyPin(oldPin);

  if (!correct) {
    Alert.alert("Wrong PIN", "Your current PIN is incorrect.");
    return;
  }

  await disablePin();
  clearFields();
  setPinEnabled(false);

  Alert.alert("Success", "PIN disabled.");
},
      },
    ]);
  }

  async function handleUpdateHint() {
  await savePinHint(pinHint);

  setSavedHint(pinHint);

  Alert.alert("Saved", "PIN hint updated.");
}



async function handleToggleBiometric() {
  const newValue = !biometricEnabled;

  await setBiometricEnabled(newValue);


const test = await isBiometricEnabled();
console.log("After save:", test);


  setBiometricEnabled(newValue);

  Alert.alert(
    "Biometric Unlock",
    newValue ? "Biometric is now ON." : "Biometric is now OFF."
  );
}


  return (
    <AppScreen>
      <Text style={styles.title}>Security</Text>

      <Text style={styles.subtitle}>
        Protect ExpenseDG with a 4-digit PIN
      </Text>

      <View style={styles.card}>
        <View style={styles.statusBox}>
          <Text style={styles.statusTitle}>PIN Lock</Text>
          <Text style={pinEnabled ? styles.statusOn : styles.statusOff}>
            {pinEnabled ? "Enabled" : "Disabled"}
          </Text>
        </View>

        {pinEnabled && (
          <>
            <Text style={styles.label}>Current PIN</Text>
            <TextInput
              style={styles.input}
              value={oldPin}
              onChangeText={setOldPin}
              keyboardType="number-pad"
              secureTextEntry
              maxLength={4}
              placeholder="••••"
              placeholderTextColor={colors.textSecondary}
            />
          </>
        )}

        <Text style={styles.label}>
          {pinEnabled ? "New PIN" : "Create PIN"}
        </Text>
        <TextInput
          style={styles.input}
          value={pin}
          onChangeText={setPin}
          keyboardType="number-pad"
          secureTextEntry
          maxLength={4}
          placeholder="••••"
          placeholderTextColor={colors.textSecondary}
        />

        <Text style={styles.label}>Confirm PIN</Text>
        <TextInput
          style={styles.input}
          value={confirmPin}
          onChangeText={setConfirmPin}
          keyboardType="number-pad"
          secureTextEntry
          maxLength={4}
          placeholder="••••"
          placeholderTextColor={colors.textSecondary}
        />

        <Text style={styles.label}>PIN Hint (Optional)</Text>

<TextInput
  style={styles.input}
  placeholder="My lucky number"
  value={pinHint}
  onChangeText={setPinHint}
/>

{pinEnabled && (
  <TouchableOpacity
    activeOpacity={0.85}
    style={styles.secondaryButton}
    onPress={handleUpdateHint}
  >
    <Text style={styles.secondaryButtonText}>Update PIN Hint</Text>
  </TouchableOpacity>
)}


{pinEnabled && (
  <View style={styles.biometricCard}>
    <Text style={styles.biometricTitle}>Biometric Unlock</Text>

    <Text style={styles.biometricSubtitle}>
      Use Face ID, Touch ID, or Fingerprint instead of entering your PIN.
    </Text>

    {!biometricAvailable ? (
      <Text style={styles.biometricUnavailableText}>
        Biometric unlock is not available in this environment. It should work on
        a real device build if Face ID / Touch ID is set up.
      </Text>
    ) : (
      <TouchableOpacity
        activeOpacity={0.85}
        style={[
          styles.biometricButton,
          biometricEnabled && styles.biometricButtonEnabled,
        ]}
        onPress={handleToggleBiometric}
      >
      <Text style={styles.biometricButtonText}>
  {biometricEnabled ? "Disable Biometric" : "Enable Biometric"}
</Text>
      </TouchableOpacity>
    )}
  </View>
)}



        {!pinEnabled ? (
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.primaryButton}
            onPress={handleEnablePin}
          >
            <Text style={styles.primaryButtonText}>Enable PIN Lock</Text>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.primaryButton}
              onPress={handleChangePin}
            >
              <Text style={styles.primaryButtonText}>Change PIN</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.dangerButton}
              onPress={handleDisablePin}
            >
              <Text style={styles.dangerButtonText}>Disable PIN</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Important</Text>
        <Text style={styles.infoText}>
          If you forget your PIN, you may need to reset local app data. Later we
          can add security questions or Face ID.
        </Text>

        <Text style={styles.debugText}>
  Biometric available: {biometricAvailable ? "Yes" : "No"}
</Text>
      </View>
    </AppScreen>
  );
}

/**
 * Theme-aware styles.
 */
function createStyles(colors: any, isDark: boolean) {
  return StyleSheet.create({
    title: {
      fontSize: 32,
      fontWeight: "900",
      color: colors.textPrimary,
    },
    subtitle: {
      marginTop: 4,
      marginBottom: 20,
      fontSize: 14,
      fontWeight: "700",
      color: colors.textSecondary,
    },

    card: {
      backgroundColor: colors.card,
      borderRadius: 24,
      padding: 18,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 18,
    },

    statusBox: {
      backgroundColor: isDark ? "#020617" : "#F8FAFC",
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 16,
      padding: 14,
      marginBottom: 16,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    statusTitle: {
      fontSize: 15,
      fontWeight: "900",
      color: colors.textPrimary,
    },
    statusOn: {
      fontSize: 13,
      fontWeight: "900",
      color: "#059669",
    },
    statusOff: {
      fontSize: 13,
      fontWeight: "900",
      color: colors.textSecondary,
    },

    label: {
      marginBottom: 8,
      fontSize: 14,
      fontWeight: "800",
      color: colors.textPrimary,
    },

    input: {
      backgroundColor: isDark ? "#020617" : "#F8FAFC",
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      padding: 14,
      fontSize: 20,
      fontWeight: "900",
      color: colors.textPrimary,
      marginBottom: 16,
      textAlign: "center",
      letterSpacing: 6,
    },

    primaryButton: {
      backgroundColor: colors.accent,
      padding: 16,
      borderRadius: 16,
      alignItems: "center",
    },
    primaryButtonText: {
      color: "#FFFFFF",
      fontWeight: "900",
      fontSize: 16,
    },

    dangerButton: {
      marginTop: 12,
      backgroundColor: "#DC2626",
      padding: 16,
      borderRadius: 16,
      alignItems: "center",
    },
    dangerButtonText: {
      color: "#FFFFFF",
      fontWeight: "900",
      fontSize: 16,
    },

    infoCard: {
      backgroundColor: isDark ? "#172554" : "#EFF6FF",
      borderWidth: 1,
      borderColor: isDark ? "#1D4ED8" : "#BFDBFE",
      borderRadius: 22,
      padding: 16,
    },
    infoTitle: {
      fontSize: 16,
      fontWeight: "900",
      color: isDark ? "#BFDBFE" : "#1E3A8A",
      marginBottom: 6,
    },
    infoText: {
      fontSize: 13,
      fontWeight: "700",
      lineHeight: 20,
      color: isDark ? "#DBEAFE" : "#1E40AF",
    },
    secondaryButton: {
  backgroundColor: isDark ? "#020617" : "#F8FAFC",
  borderWidth: 1,
  borderColor: colors.border,
  padding: 14,
  borderRadius: 14,
  alignItems: "center",
  marginBottom: 16,
},

secondaryButtonText: {
  color: colors.accent,
  fontWeight: "900",
  fontSize: 15,
},

biometricCard: {
  marginBottom: 16,
  backgroundColor: isDark
    ? "#020617"
    : "#F8FAFC",
  borderWidth: 1,
  borderColor: colors.border,
  borderRadius: 16,
  padding: 14,
},

biometricTitle: {
  fontSize: 16,
  fontWeight: "900",
  color: colors.textPrimary,
},

biometricSubtitle: {
  marginTop: 4,
  marginBottom: 12,
  color: colors.textSecondary,
  fontSize: 13,
  fontWeight: "700",
},

biometricButton: {
  backgroundColor: colors.accent,
  padding: 12,
  borderRadius: 12,
  alignItems: "center",
},

biometricButtonEnabled: {
  backgroundColor: "#059669",
},

biometricButtonText: {
  color: "#FFFFFF",
  fontWeight: "900",
},
debugText: {
  marginBottom: 12,
  color: colors.textSecondary,
  fontWeight: "700",
},
biometricUnavailableText: {
  color: colors.textSecondary,
  fontSize: 13,
  fontWeight: "700",
  lineHeight: 19,
},
  });
}