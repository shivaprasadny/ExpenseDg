import React, { useEffect, useState } from "react";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

import { useAppTheme } from "../context/ThemeContext";
import { getPinHint, verifyPin } from "../services/securityService";
import {
  authenticateWithBiometrics,
  isBiometricEnabled,
} from "../services/biometricService";

type Props = {
  onUnlocked: () => void;
};

/**
 * Premium lock screen.
 * Supports PIN, optional hidden hint, and biometric unlock.
 */
export default function LockScreen({ onUnlocked }: Props) {
  const { colors, isDark } = useAppTheme();
  const styles = createStyles(colors, isDark);

  const [pin, setPin] = useState("");
  const [pinHint, setPinHint] = useState("");
  const [showHint, setShowHint] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  useEffect(() => {
    prepareLockScreen();
  }, []);

async function prepareLockScreen() {
  const hint = await getPinHint();
  const biometric = await isBiometricEnabled();

  setPinHint(hint);
  setBiometricEnabled(biometric);

  /**
   * Small delay lets LockScreen fully render first.
   * Face ID works more reliably after screen is mounted.
   */
  if (biometric) {
    setTimeout(async () => {
      const success = await authenticateWithBiometrics();

      if (success) {
        onUnlocked();
      }
    }, 1000);
  }
}



  async function handleBiometricUnlock() {
    const success = await authenticateWithBiometrics();

    if (success) {
      onUnlocked();
    }
  }

  async function handleUnlock() {
    Keyboard.dismiss();

    if (pin.length !== 4) {
      Alert.alert("Invalid PIN", "Please enter your 4-digit PIN.");
      return;
    }

    const correct = await verifyPin(pin);

    if (!correct) {
      setPin("");
      Alert.alert("Wrong PIN", "Please try again.");
      return;
    }

    setPin("");
    onUnlocked();
  }



  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 20 : 0}
      >
        <View style={styles.card}>
          <View style={styles.lockCircle}>
            <Text style={styles.lockIcon}>🔒</Text>
          </View>

          <Text style={styles.title}>ExpenseDG Locked</Text>

          <Text style={styles.subtitle}>
            Secure your money data with PIN protection
          </Text>

       

          {biometricEnabled && (
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.biometricButton}
              onPress={handleBiometricUnlock}
            >
              <Text style={styles.biometricButtonText}>
                Unlock with Face ID / Fingerprint
              </Text>
            </TouchableOpacity>
          )}

          {pinHint.trim().length > 0 && (
            <>
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.hintButton}
                onPress={() => setShowHint(!showHint)}
              >
                <Text style={styles.hintButtonText}>
                  {showHint ? "Hide PIN Hint" : "Show PIN Hint"}
                </Text>
              </TouchableOpacity>

              {showHint && (
                <View style={styles.hintBox}>
                  <Text style={styles.hintLabel}>Hint</Text>
                  <Text style={styles.hintText}>{pinHint}</Text>
                </View>
              )}
            </>
          )}

          <TextInput
            style={styles.input}
            value={pin}
            onChangeText={setPin}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={4}
            placeholder="••••"
            placeholderTextColor={colors.textSecondary}
            returnKeyType="done"
            onSubmitEditing={handleUnlock}
            blurOnSubmit
          />

          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.unlockButton}
            onPress={handleUnlock}
          >
            <Text style={styles.unlockButtonText}>Unlock with PIN</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

function createStyles(colors: any, isDark: boolean) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
      padding: 20,
      justifyContent: "center",
    },
    card: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 34,
      padding: 24,
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 14 },
      shadowOpacity: isDark ? 0.35 : 0.12,
      shadowRadius: 24,
      elevation: 8,
    },
    lockCircle: {
      width: 78,
      height: 78,
      borderRadius: 39,
      backgroundColor: isDark ? "#052E22" : "#ECFDF5",
      borderWidth: 1,
      borderColor: isDark ? "#065F46" : "#A7F3D0",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 16,
    },
    lockIcon: {
      fontSize: 38,
    },
    title: {
      fontSize: 28,
      fontWeight: "900",
      color: colors.textPrimary,
      textAlign: "center",
    },
    subtitle: {
      marginTop: 8,
      marginBottom: 20,
      fontSize: 14,
      fontWeight: "700",
      color: colors.textSecondary,
      textAlign: "center",
      lineHeight: 20,
    },

    biometricButton: {
      width: "100%",
      backgroundColor: isDark ? "#052E22" : "#ECFDF5",
      borderWidth: 1,
      borderColor: isDark ? "#065F46" : "#A7F3D0",
      padding: 15,
      borderRadius: 18,
      alignItems: "center",
      marginBottom: 14,
    },
    biometricButtonText: {
      color: colors.accent,
      fontWeight: "900",
      fontSize: 14,
    },

    hintButton: {
      width: "100%",
      backgroundColor: isDark ? "#020617" : "#F8FAFC",
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 16,
      padding: 13,
      alignItems: "center",
      marginBottom: 12,
    },
    hintButtonText: {
      color: colors.accent,
      fontWeight: "900",
      fontSize: 13,
    },
    hintBox: {
      width: "100%",
      backgroundColor: isDark ? "#020617" : "#F8FAFC",
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 16,
      padding: 14,
      marginBottom: 14,
    },
    hintLabel: {
      fontSize: 12,
      fontWeight: "900",
      color: colors.accent,
      marginBottom: 4,
    },
    hintText: {
      fontSize: 14,
      fontWeight: "800",
      color: colors.textPrimary,
    },

    input: {
      width: "100%",
      backgroundColor: isDark ? "#020617" : "#F8FAFC",
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 18,
      padding: 16,
      fontSize: 26,
      fontWeight: "900",
      color: colors.textPrimary,
      textAlign: "center",
      letterSpacing: 10,
      marginBottom: 16,
    },
    unlockButton: {
      width: "100%",
      backgroundColor: colors.accent,
      padding: 16,
      borderRadius: 18,
      alignItems: "center",
    },
    unlockButtonText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "900",
    },
  });
}