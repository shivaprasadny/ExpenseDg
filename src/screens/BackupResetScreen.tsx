import React, { useState } from "react";
import {
  Alert,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import AppScreen from "../components/AppScreen";
import { useAppTheme } from "../context/ThemeContext";
import { createBackup, exportCsv, restoreBackup } from "../services/backupService";
import { clearRecordsOnly, resetDatabase } from "../database/db";

/**
 * BackupResetScreen
 *
 * User can:
 * - Create JSON backup
 * - Restore backup
 * - Export CSV
 * - Clear records only
 * - Factory reset with RESET confirmation
 */
export default function BackupResetScreen() {
  const { colors, isDark } = useAppTheme();
  const styles = createStyles(colors, isDark);

  const [showResetModal, setShowResetModal] = useState(false);
  const [resetText, setResetText] = useState("");

  /**
   * Create JSON backup file.
   */
  async function handleBackup() {
    try {
      await createBackup();
    } catch {
      Alert.alert("Backup Failed", "Unable to create backup.");
    }
  }

  /**
   * Restore JSON backup file.
   */
  async function handleRestore() {
    try {
      await restoreBackup();
      Alert.alert("Success", "Backup restored successfully.");
    } catch {
      Alert.alert("Restore Failed", "Please select a valid ExpenseDG backup file.");
    }
  }

  /**
   * Export records as CSV.
   */
  async function handleExportCsv() {
    try {
      await exportCsv();
    } catch {
      Alert.alert("Export Failed", "Unable to export CSV.");
    }
  }

  /**
   * Clear only income and expense records.
   * Keeps profile, theme, currency, and categories.
   */
  function handleClearRecordsOnly() {
    Alert.alert(
      "Clear Records Only",
      "This will delete all income and expense records, but keep your profile, theme, currency, and categories.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Clear Records",
          style: "destructive",
          onPress: async () => {
            await clearRecordsOnly();
            Alert.alert("Done", "All records were cleared.");
          },
        },
      ]
    );
  }

  /**
   * Open factory reset modal.
   * User must type RESET before deleting everything.
   */
  function openFactoryResetModal() {
    setResetText("");
    setShowResetModal(true);
  }

  /**
   * Factory reset all local app data.
   */
  async function handleFactoryReset() {
    if (resetText.trim() !== "RESET") {
      Alert.alert("Incorrect Confirmation", 'Please type "RESET" to continue.');
      return;
    }

    await resetDatabase();

    setShowResetModal(false);
    setResetText("");

    Alert.alert("Success", "Factory reset completed.");
  }

  return (
    <AppScreen>
      <Text style={styles.title}>Backup & Reset</Text>
      <Text style={styles.subtitle}>Manage your local ExpenseDG data</Text>

      {/* BACKUP TOOLS */}
      <View style={styles.card}>
        <ActionButton
          styles={styles}
          icon="📦"
          title="Create JSON Backup"
          subtitle="Save all app data to a backup file"
          onPress={handleBackup}
        />

        <ActionButton
          styles={styles}
          icon="♻️"
          title="Restore Backup"
          subtitle="Import data from a backup file"
          onPress={handleRestore}
        />

        <ActionButton
          styles={styles}
          icon="📄"
          title="Export CSV"
          subtitle="Export records for spreadsheets"
          onPress={handleExportCsv}
        />
      </View>

      {/* RESET TOOLS */}
      <View style={styles.dangerCard}>
        <Text style={styles.dangerTitle}>Reset Options</Text>
        <Text style={styles.dangerText}>
          Create a backup before using reset options. Factory reset cannot be undone.
        </Text>

        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.warningButton}
          onPress={handleClearRecordsOnly}
        >
          <Text style={styles.warningButtonText}>Clear Records Only</Text>
          <Text style={styles.warningSubText}>Keeps profile, theme, and categories</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.dangerButton}
          onPress={openFactoryResetModal}
        >
          <Text style={styles.dangerButtonText}>Factory Reset</Text>
          <Text style={styles.dangerButtonSubText}>Deletes everything on this device</Text>
        </TouchableOpacity>
      </View>

      {/* FACTORY RESET CONFIRMATION MODAL */}
      <Modal visible={showResetModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Factory Reset</Text>

            <Text style={styles.modalWarning}>
              This will delete all records, categories, profile, theme, and settings.
            </Text>

            <Text style={styles.modalInstruction}>
              Type RESET below to confirm.
            </Text>

            <TextInput
              style={styles.input}
              placeholder="RESET"
              placeholderTextColor={colors.textSecondary}
              value={resetText}
              onChangeText={setResetText}
              autoCapitalize="characters"
            />

            <TouchableOpacity
              activeOpacity={0.85}
              style={[
                styles.modalResetButton,
                resetText.trim() !== "RESET" && styles.modalResetButtonDisabled,
              ]}
              onPress={handleFactoryReset}
            >
              <Text style={styles.modalResetButtonText}>Delete Everything</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.modalCancelButton}
              onPress={() => {
                setShowResetModal(false);
                setResetText("");
              }}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </AppScreen>
  );
}

/**
 * Reusable action row.
 */
function ActionButton({
  icon,
  title,
  subtitle,
  onPress,
  styles,
}: {
  icon: string;
  title: string;
  subtitle: string;
  onPress: () => void;
  styles: any;
}) {
  return (
    <TouchableOpacity activeOpacity={0.85} style={styles.actionButton} onPress={onPress}>
      <Text style={styles.icon}>{icon}</Text>

      <View style={styles.actionTextBox}>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionSubtitle}>{subtitle}</Text>
      </View>

      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
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
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 24,
      padding: 10,
      marginBottom: 18,
    },

    actionButton: {
      flexDirection: "row",
      alignItems: "center",
      padding: 14,
      borderRadius: 18,
    },
    icon: {
      fontSize: 24,
      marginRight: 12,
    },
    actionTextBox: {
      flex: 1,
    },
    actionTitle: {
      fontSize: 16,
      fontWeight: "900",
      color: colors.textPrimary,
    },
    actionSubtitle: {
      marginTop: 3,
      fontSize: 12,
      fontWeight: "700",
      color: colors.textSecondary,
    },
    chevron: {
      fontSize: 28,
      fontWeight: "800",
      color: colors.textSecondary,
    },

    dangerCard: {
      backgroundColor: isDark ? "#450A0A" : "#FEF2F2",
      borderWidth: 1,
      borderColor: isDark ? "#7F1D1D" : "#FECACA",
      borderRadius: 24,
      padding: 18,
    },
    dangerTitle: {
      fontSize: 20,
      fontWeight: "900",
      color: isDark ? "#FCA5A5" : "#991B1B",
    },
    dangerText: {
      marginTop: 6,
      marginBottom: 14,
      color: isDark ? "#FECACA" : "#B91C1C",
      fontWeight: "700",
      fontSize: 13,
      lineHeight: 19,
    },

    warningButton: {
      backgroundColor: "#F59E0B",
      padding: 16,
      borderRadius: 16,
      alignItems: "center",
      marginBottom: 12,
    },
    warningButtonText: {
      color: "#FFFFFF",
      fontWeight: "900",
      fontSize: 16,
    },
    warningSubText: {
      marginTop: 4,
      color: "#FFF7ED",
      fontWeight: "700",
      fontSize: 12,
    },

    dangerButton: {
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
    dangerButtonSubText: {
      marginTop: 4,
      color: "#FEE2E2",
      fontWeight: "700",
      fontSize: 12,
    },

    modalOverlay: {
      flex: 1,
      justifyContent: "flex-end",
      backgroundColor: "rgba(0,0,0,0.5)",
    },
    modalCard: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    modalTitle: {
      fontSize: 24,
      fontWeight: "900",
      color: colors.textPrimary,
    },
    modalWarning: {
      marginTop: 10,
      color: "#DC2626",
      fontWeight: "800",
      fontSize: 14,
      lineHeight: 21,
    },
    modalInstruction: {
      marginTop: 14,
      marginBottom: 8,
      color: colors.textPrimary,
      fontWeight: "800",
      fontSize: 14,
    },
    input: {
      backgroundColor: isDark ? "#020617" : "#F8FAFC",
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      padding: 14,
      fontSize: 16,
      color: colors.textPrimary,
      fontWeight: "800",
    },
    modalResetButton: {
      backgroundColor: "#DC2626",
      padding: 16,
      borderRadius: 16,
      alignItems: "center",
      marginTop: 16,
    },
    modalResetButtonDisabled: {
      opacity: 0.45,
    },
    modalResetButtonText: {
      color: "#FFFFFF",
      fontWeight: "900",
      fontSize: 16,
    },
    modalCancelButton: {
      backgroundColor: isDark ? "#020617" : "#F1F5F9",
      padding: 15,
      borderRadius: 16,
      alignItems: "center",
      marginTop: 12,
    },
    modalCancelText: {
      color: colors.textPrimary,
      fontWeight: "900",
      fontSize: 15,
    },
  });
}