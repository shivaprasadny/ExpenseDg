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

type Props = {
  onUnlocked: () => void;
};

/**
 * LockScreen
 *
 * Shows before the app opens when PIN lock is enabled.
 * User enters PIN to unlock the app.
 * PIN hint is hidden until user taps "Show Hint".
 */
export default function LockScreen({ onUnlocked }: Props) {
  const { colors, isDark } = useAppTheme();
  const styles = createStyles(colors, isDark);

  const [pin, setPin] = useState("");
  const [pinHint, setPinHint] = useState("");
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    loadHint();
  }, []);

  /**
   * Load saved PIN hint from SQLite.
   */
  async function loadHint() {
    const hint = await getPinHint();
    setPinHint(hint);
  }

  /**
   * Verify entered PIN.
   */
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
          <Text style={styles.icon}>🔒</Text>

          <Text style={styles.title}>ExpenseDG Locked</Text>

          <Text style={styles.subtitle}>
            Enter your 4-digit PIN to continue
          </Text>

          {/* Hint is hidden until user taps Show Hint */}
          {pinHint.trim().length > 0 && (
            <>
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.hintButton}
                onPress={() => setShowHint(!showHint)}
              >
                <Text style={styles.hintButtonText}>
                  {showHint ? "Hide Hint" : "Show Hint"}
                </Text>
              </TouchableOpacity>

              {showHint && (
                <View style={styles.hintBox}>
                  <Text style={styles.hintLabel}>PIN Hint</Text>
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
            style={styles.button}
            onPress={handleUnlock}
          >
            <Text style={styles.buttonText}>Unlock</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

/**
 * Theme-aware styles.
 */
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
      borderRadius: 28,
      padding: 24,
      alignItems: "center",
    },
    icon: {
      fontSize: 46,
      marginBottom: 12,
    },
    title: {
      fontSize: 28,
      fontWeight: "900",
      color: colors.textPrimary,
      textAlign: "center",
    },
    subtitle: {
      marginTop: 6,
      marginBottom: 14,
      fontSize: 14,
      fontWeight: "700",
      color: colors.textSecondary,
      textAlign: "center",
    },

    hintButton: {
      backgroundColor: isDark ? "#020617" : "#F8FAFC",
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      paddingVertical: 10,
      paddingHorizontal: 14,
      marginBottom: 14,
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
      marginBottom: 18,
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
      borderRadius: 16,
      padding: 16,
      fontSize: 24,
      fontWeight: "900",
      color: colors.textPrimary,
      textAlign: "center",
      letterSpacing: 8,
      marginBottom: 18,
    },
    button: {
      width: "100%",
      backgroundColor: colors.accent,
      padding: 16,
      borderRadius: 16,
      alignItems: "center",
    },
    buttonText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "900",
    },
  });
}