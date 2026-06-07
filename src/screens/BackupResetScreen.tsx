import React from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import AppScreen from "../components/AppScreen";
import { resetDatabase } from "../database/db";
import { createBackup, exportCsv, restoreBackup } from "../services/backupService";

/**
 * Backup, restore, export, and reset screen.
 */
export default function BackupResetScreen() {
  async function handleBackup() {
    try {
      await createBackup();
    } catch {
      Alert.alert("Backup Failed", "Unable to create backup.");
    }
  }

  async function handleRestore() {
    try {
      await restoreBackup();
      Alert.alert("Success", "Backup restored successfully.");
    } catch {
      Alert.alert("Restore Failed", "Please select a valid ExpenseDG backup file.");
    }
  }

  async function handleExportCsv() {
    try {
      await exportCsv();
    } catch {
      Alert.alert("Export Failed", "Unable to export CSV.");
    }
  }

  function handleReset() {
    Alert.alert("Reset Database", "This will delete all local data from this device.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reset",
        style: "destructive",
        onPress: async () => {
          await resetDatabase();
          Alert.alert("Success", "Database reset completed.");
        },
      },
    ]);
  }

  return (
    <AppScreen>
      <Text style={styles.title}>Backup & Reset</Text>
      <Text style={styles.subtitle}>Manage your local ExpenseDG data</Text>

      <View style={styles.card}>
        <ActionButton icon="📦" title="Create JSON Backup" subtitle="Save all app data to a backup file" onPress={handleBackup} />
        <ActionButton icon="♻️" title="Restore Backup" subtitle="Import data from a backup file" onPress={handleRestore} />
        <ActionButton icon="📄" title="Export CSV" subtitle="Export records for spreadsheets" onPress={handleExportCsv} />
      </View>

      <View style={styles.dangerCard}>
        <Text style={styles.dangerTitle}>Danger Zone</Text>
        <Text style={styles.dangerText}>Resetting will delete records, categories, settings, and profile data.</Text>

        <TouchableOpacity style={styles.dangerButton} onPress={handleReset}>
          <Text style={styles.dangerButtonText}>Reset Database</Text>
        </TouchableOpacity>
      </View>
    </AppScreen>
  );
}

function ActionButton({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: string;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.actionButton} onPress={onPress}>
      <Text style={styles.icon}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionSubtitle}>{subtitle}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 32, fontWeight: "900", color: "#071826" },
  subtitle: { marginTop: 4, marginBottom: 20, fontSize: 14, fontWeight: "700", color: "#64748B" },
  card: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#DDE7E2", borderRadius: 24, padding: 10, marginBottom: 18 },
  actionButton: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 18 },
  icon: { fontSize: 24, marginRight: 12 },
  actionTitle: { fontSize: 16, fontWeight: "900", color: "#071826" },
  actionSubtitle: { marginTop: 3, fontSize: 12, fontWeight: "700", color: "#64748B" },
  dangerCard: { backgroundColor: "#FEF2F2", borderWidth: 1, borderColor: "#FECACA", borderRadius: 24, padding: 18 },
  dangerTitle: { fontSize: 20, fontWeight: "900", color: "#991B1B" },
  dangerText: { marginTop: 6, marginBottom: 14, color: "#B91C1C", fontWeight: "700", fontSize: 13 },
  dangerButton: { backgroundColor: "#DC2626", padding: 16, borderRadius: 16, alignItems: "center" },
  dangerButtonText: { color: "#FFFFFF", fontWeight: "900", fontSize: 16 },
});