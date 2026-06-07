import React, { useState } from "react";
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
import { createBackup, exportCsv, restoreBackup } from "../services/backupService";
import { clearRecordsOnly, resetDatabase } from "../database/db";
import { isPinEnabled, verifyPin } from "../services/securityService";

/**
 * BackupResetScreen
 *
 * Safe reset rules:
 * - If PIN is enabled, Clear Records requires PIN.
 * - If PIN is enabled, Factory Reset requires PIN + RESET text.
 * - If PIN is disabled, Factory Reset still requires RESET text.
 */
export default function BackupResetScreen() {
  const { colors, isDark } = useAppTheme();
  const styles = createStyles(colors, isDark);

  const [showResetModal, setShowResetModal] = useState(false);
  const [showClearRecordsModal, setShowClearRecordsModal] = useState(false);

  const [resetText, setResetText] = useState("");
  const [pinText, setPinText] = useState("");
  const [pinRequired, setPinRequired] = useState(false);

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

  /**
   * Open Clear Records modal.
   */
  async function openClearRecordsModal() {
    const enabled = await isPinEnabled();

    setPinRequired(enabled);
    setPinText("");
    setShowClearRecordsModal(true);
  }

  /**
   * Clear only records.
   */
  async function handleClearRecordsOnly() {
    if (pinRequired) {
      const correct = await verifyPin(pinText);

      if (!correct) {
        Alert.alert("Wrong PIN", "Please enter the correct PIN.");
        return;
      }
    }

    await clearRecordsOnly();

    setShowClearRecordsModal(false);
    setPinText("");

    Alert.alert("Done", "All records were cleared.");
  }

  /**
   * Open Factory Reset modal.
   */
  async function openFactoryResetModal() {
    const enabled = await isPinEnabled();

    setPinRequired(enabled);
    setPinText("");
    setResetText("");
    setShowResetModal(true);
  }

  /**
   * Factory reset all local data.
   */
  async function handleFactoryReset() {
    if (pinRequired) {
      const correct = await verifyPin(pinText);

      if (!correct) {
        Alert.alert("Wrong PIN", "Please enter the correct PIN.");
        return;
      }
    }

    if (resetText.trim() !== "RESET") {
      Alert.alert("Incorrect Confirmation", 'Please type "RESET" to continue.');
      return;
    }

    await resetDatabase();

    setShowResetModal(false);
    setPinText("");
    setResetText("");

    Alert.alert("Success", "Factory reset completed.");
  }

  return (
    <AppScreen>
      <Text style={styles.title}>Backup & Reset</Text>
      <Text style={styles.subtitle}>Manage your local ExpenseDG data</Text>

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

      <View style={styles.dangerCard}>
        <Text style={styles.dangerTitle}>Reset Options</Text>
        <Text style={styles.dangerText}>
          Create a backup before using reset options. Factory reset cannot be undone.
        </Text>

        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.warningButton}
          onPress={openClearRecordsModal}
        >
          <Text style={styles.warningButtonText}>Clear Records Only</Text>
          <Text style={styles.warningSubText}>
            Keeps profile, theme, and categories
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.dangerButton}
          onPress={openFactoryResetModal}
        >
          <Text style={styles.dangerButtonText}>Factory Reset</Text>
          <Text style={styles.dangerButtonSubText}>
            Deletes everything on this device
          </Text>
        </TouchableOpacity>
      </View>

      {/* CLEAR RECORDS MODAL */}
     {/* CLEAR RECORDS MODAL */}
<Modal visible={showClearRecordsModal} animationType="slide" transparent>
  <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
    <KeyboardAvoidingView
      style={styles.modalOverlay}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 20 : 0}
    >
      <View style={styles.modalCard}>
        <Text style={styles.modalTitle}>Clear Records Only</Text>

        <Text style={styles.modalWarning}>
          This will delete all income and expense records. Your profile, theme,
          currency, and categories will stay.
        </Text>

        {pinRequired && (
          <>
            <Text style={styles.modalInstruction}>Enter PIN to continue.</Text>

            <TextInput
              style={styles.input}
              placeholder="••••"
              placeholderTextColor={colors.textSecondary}
              value={pinText}
              onChangeText={setPinText}
              keyboardType="number-pad"
              secureTextEntry
              maxLength={4}
              returnKeyType="done"
              onSubmitEditing={Keyboard.dismiss}
              blurOnSubmit
            />
          </>
        )}

        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.warningModalButton}
          onPress={() => {
            Keyboard.dismiss();
            handleClearRecordsOnly();
          }}
        >
          <Text style={styles.modalResetButtonText}>Clear Records</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.modalCancelButton}
          onPress={() => {
            Keyboard.dismiss();
            setShowClearRecordsModal(false);
            setPinText("");
          }}
        >
          <Text style={styles.modalCancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  </TouchableWithoutFeedback>
</Modal>

      {/* FACTORY RESET MODAL */}
      <Modal visible={showResetModal} animationType="slide" transparent>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
  <KeyboardAvoidingView
    style={styles.modalOverlay}
    behavior={Platform.OS === "ios" ? "padding" : "height"}
  >
    <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Factory Reset</Text>

            <Text style={styles.modalWarning}>
              This will delete all records, categories, profile, theme, and settings.
            </Text>

            {pinRequired && (
              <>
                <Text style={styles.modalInstruction}>Enter PIN.</Text>

                <TextInput
  style={styles.input}
  placeholder="••••"
  placeholderTextColor={colors.textSecondary}
  value={pinText}
  onChangeText={setPinText}
  keyboardType="number-pad"
  secureTextEntry
  maxLength={4}
  returnKeyType="done"
  onSubmitEditing={Keyboard.dismiss}
  blurOnSubmit
/>
              </>
            )}

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
                setPinText("");
                setResetText("");
              }}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            </View>
  </KeyboardAvoidingView>
</TouchableWithoutFeedback>
      </Modal>
    </AppScreen>
  );
}

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
      fontSize: 18,
      color: colors.textPrimary,
      fontWeight: "900",
      textAlign: "center",
      letterSpacing: 4,
    },
    modalResetButton: {
      backgroundColor: "#DC2626",
      padding: 16,
      borderRadius: 16,
      alignItems: "center",
      marginTop: 16,
    },
    warningModalButton: {
      backgroundColor: "#F59E0B",
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