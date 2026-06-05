import React from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
} from "react-native";

import AppScreen from "../components/AppScreen";
import { COLORS } from "../constants/colors";


import { resetDatabase } from "../database/db";
import { createBackup, restoreBackup } from "../services/backupService";

/**
 * Settings screen.
 */
export default function SettingsScreen() {
  /**
   * Create backup file.
   */
  async function handleBackup() {
    try {
      await createBackup();
    } catch (error) {
      Alert.alert(
        "Backup Failed",
        "Unable to create backup."
      );
    }
  }

  /**
   * Reset all data.
   */
  function handleReset() {
    Alert.alert(
      "Reset Database",
      "This will delete all expenses and categories.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            await resetDatabase();

            Alert.alert(
              "Success",
              "Database reset completed."
            );
          },
        },
      ]
    );
  }

  /**
 * Restore backup file.
 */
async function handleRestore() {
  try {
    await restoreBackup();

    Alert.alert("Success", "Backup restored successfully.");
  } catch (error) {
    Alert.alert(
      "Restore Failed",
      "Please select a valid ExpenseDG backup file."
    );
  }
}

  return (
    <AppScreen>
      <Text style={styles.title}>
        Settings
      </Text>

      <TouchableOpacity
        style={styles.button}
        onPress={handleBackup}
      >
        <Text style={styles.buttonText}>
          Create Backup
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.dangerButton}
        onPress={handleReset}
      >
        <Text style={styles.buttonText}>
          Reset Database
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
  style={styles.button}
  onPress={handleRestore}
>
  <Text style={styles.buttonText}>
    Restore Backup
  </Text>
</TouchableOpacity>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 30,
    fontWeight: "900",
    color: COLORS.primary,
    marginBottom: 24,
  },

  button: {
    backgroundColor: COLORS.accent,
    padding: 16,
    borderRadius: 14,
    marginBottom: 16,
    alignItems: "center",
  },

  dangerButton: {
    backgroundColor: COLORS.danger,
    padding: 16,
    borderRadius: 14,
    marginBottom: 16,
    alignItems: "center",
  },

  buttonText: {
    color: "#FFF",
    fontWeight: "800",
    fontSize: 16,
  },
});