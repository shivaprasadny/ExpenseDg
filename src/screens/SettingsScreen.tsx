
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
} from "react-native";

import AppScreen from "../components/AppScreen";
import { COLORS } from "../constants/colors";
import React, { useEffect, useState } from "react";
import { TextInput } from "react-native";
import {
  getUserProfile,
  saveUserProfile,
} from "../services/profileService";


import { resetDatabase } from "../database/db";

import {
  createBackup,
  restoreBackup,
  exportCsv,
} from "../services/backupService";



/**
 * Settings screen.
 */
export default function SettingsScreen() {


    const [userName, setUserName] = useState("");
const [currencySymbol, setCurrencySymbol] = useState("$");
const [savingsGoal, setSavingsGoal] = useState("");
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

  useEffect(() => {
  loadProfile();
}, []);

async function loadProfile() {
  const profile = await getUserProfile();

  setUserName(profile.userName);
  setCurrencySymbol(profile.currencySymbol);
  setSavingsGoal(String(profile.savingsGoal));
}

async function handleSaveProfile() {
  const goalNumber = Number(savingsGoal);

  await saveUserProfile({
    userName,
    currencySymbol,
    savingsGoal: Number.isNaN(goalNumber) ? 0 : goalNumber,
  });

  Alert.alert("Saved", "Profile updated successfully.");
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
async function handleExportCsv() {
  try {
    await exportCsv();
  } catch (error) {
    Alert.alert("Export Failed", "Unable to export CSV.");
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
  onPress={handleExportCsv}
>
  <Text style={styles.buttonText}>
    Export CSV
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


<Text style={styles.sectionTitle}>Profile</Text>

<Text style={styles.label}>Your Name</Text>
<TextInput
  style={styles.input}
  placeholder="Enter your name"
  value={userName}
  onChangeText={setUserName}
/>

<Text style={styles.label}>Currency Symbol</Text>
<TextInput
  style={styles.input}
  placeholder="$"
  value={currencySymbol}
  onChangeText={setCurrencySymbol}
  maxLength={3}
/>

<Text style={styles.label}>Savings Goal</Text>
<TextInput
  style={styles.input}
  placeholder="1000"
  keyboardType="decimal-pad"
  value={savingsGoal}
  onChangeText={setSavingsGoal}
/>

<TouchableOpacity style={styles.button} onPress={handleSaveProfile}>
  <Text style={styles.buttonText}>Save Profile</Text>
</TouchableOpacity>

<Text style={styles.sectionTitle}>Data</Text>
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
  sectionTitle: {
  fontSize: 20,
  fontWeight: "900",
  color: COLORS.primary,
  marginBottom: 12,
  marginTop: 10,
},

label: {
  marginTop: 12,
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
});