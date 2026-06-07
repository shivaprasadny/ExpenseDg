import React, { useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { useAppTheme } from "../context/ThemeContext";
import { verifyPin } from "../services/securityService";

type Props = {
  onUnlocked: () => void;
};

/**
 * Lock screen shown when PIN lock is enabled.
 */
export default function LockScreen({ onUnlocked }: Props) {
  const { colors, isDark } = useAppTheme();
  const styles = createStyles(colors, isDark);

  const [pin, setPin] = useState("");

  async function handleUnlock() {
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
    <View style={styles.screen}>
      <View style={styles.card}>
        <Text style={styles.icon}>🔒</Text>
        <Text style={styles.title}>ExpenseDG Locked</Text>
        <Text style={styles.subtitle}>Enter your 4-digit PIN to continue</Text>

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

        <TouchableOpacity style={styles.button} onPress={handleUnlock}>
          <Text style={styles.buttonText}>Unlock</Text>
        </TouchableOpacity>
      </View>
    </View>
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
      marginBottom: 22,
      fontSize: 14,
      fontWeight: "700",
      color: colors.textSecondary,
      textAlign: "center",
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