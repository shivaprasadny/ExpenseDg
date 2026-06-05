import React, { useEffect, useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import AppScreen from "../components/AppScreen";
import { COLORS } from "../constants/colors";
import { RootStackParamList } from "../navigation/AppNavigator";
import {
  getMonthlyBudget,
  updateMonthlyBudget,
} from "../services/settingsService";

/**
 * Navigation props for Budget screen.
 */
type Props = NativeStackScreenProps<RootStackParamList, "Budget">;

/**
 * Budget screen.
 * User can set monthly spending budget.
 */
export default function BudgetScreen({ navigation }: Props) {
  const [budget, setBudget] = useState("");

  /**
   * Load saved budget when screen opens.
   */
  useEffect(() => {
    loadBudget();
  }, []);

  /**
   * Get current budget from SQLite.
   */
  async function loadBudget() {
    const amount = await getMonthlyBudget();

    if (amount > 0) {
      setBudget(String(amount));
    }
  }

  /**
   * Validate and save budget.
   */
  async function handleSaveBudget() {
    const amount = Number(budget);

    if (!budget.trim() || Number.isNaN(amount) || amount < 0) {
      Alert.alert("Invalid budget", "Please enter a valid budget amount.");
      return;
    }

    await updateMonthlyBudget(amount);

    Alert.alert("Saved", "Monthly budget updated successfully.");

    navigation.goBack();
  }

  return (
    <AppScreen>
      <Text style={styles.title}>Monthly Budget</Text>

      <Text style={styles.label}>Budget Amount</Text>

      <TextInput
        style={styles.input}
        placeholder="Example: 2000"
        keyboardType="decimal-pad"
        value={budget}
        onChangeText={setBudget}
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleSaveBudget}
      >
        <Text style={styles.buttonText}>Save Budget</Text>
      </TouchableOpacity>
    </AppScreen>
  );
}

/**
 * Screen styles.
 */
const styles = StyleSheet.create({
  title: {
    fontSize: 30,
    fontWeight: "900",
    color: COLORS.primary,
    marginBottom: 24,
  },
  label: {
    marginBottom: 8,
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  input: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
  },
  button: {
    backgroundColor: COLORS.accent,
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 24,
  },
  buttonText: {
    color: COLORS.card,
    fontSize: 16,
    fontWeight: "800",
  },
});