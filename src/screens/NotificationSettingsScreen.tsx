import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import AppScreen from "../components/AppScreen";
import { useAppTheme } from "../context/ThemeContext";
import {
  cancelAllExpenseDGNotifications,
  requestNotificationPermission,
  scheduleMonthlyBackupReminder,
  scheduleSmartExpenseReminder,
  scheduleWeeklyReviewReminder,
} from "../services/notificationService";

/**
 * Notification settings screen.
 * User can enable or disable reminders.
 */
export default function NotificationSettingsScreen() {
  const { colors, isDark } = useAppTheme();
  const styles = createStyles(colors, isDark);

  const [smartReminder, setSmartReminder] = useState(true);
  const [weeklyReview, setWeeklyReview] = useState(true);
  const [monthlyBackup, setMonthlyBackup] = useState(true);

  /**
   * Save selected notification settings.
   */
  async function handleSave() {
    const allowed = await requestNotificationPermission();

    if (!allowed) {
      Alert.alert(
        "Permission Needed",
        "Please allow notifications to use reminders."
      );
      return;
    }

    await cancelAllExpenseDGNotifications();

    if (smartReminder) {
      await scheduleSmartExpenseReminder();
    }

    if (weeklyReview) {
      await scheduleWeeklyReviewReminder();
    }

    if (monthlyBackup) {
      await scheduleMonthlyBackupReminder();
    }

    Alert.alert("Saved", "Notification reminders updated.");
  }

  return (
    <AppScreen>
      <Text style={styles.title}>Notifications</Text>
      <Text style={styles.subtitle}>
        Choose helpful reminders without annoying alerts
      </Text>

      <View style={styles.card}>
        <ToggleRow
          styles={styles}
          title="Smart Expense Reminder"
          subtitle="Reminds you to log expenses without daily spam"
          value={smartReminder}
          onPress={() => setSmartReminder(!smartReminder)}
        />

        <ToggleRow
          styles={styles}
          title="Weekly Review Reminder"
          subtitle="Sunday evening money review"
          value={weeklyReview}
          onPress={() => setWeeklyReview(!weeklyReview)}
        />

        <ToggleRow
          styles={styles}
          title="Monthly Backup Reminder"
          subtitle="Monthly reminder to back up your data"
          value={monthlyBackup}
          onPress={() => setMonthlyBackup(!monthlyBackup)}
        />
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Save Notification Settings</Text>
      </TouchableOpacity>
    </AppScreen>
  );
}

function ToggleRow({
  title,
  subtitle,
  value,
  onPress,
  styles,
}: {
  title: string;
  subtitle: string;
  value: boolean;
  onPress: () => void;
  styles: any;
}) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress}>
      <View style={styles.textBox}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSubtitle}>{subtitle}</Text>
      </View>

      <View style={[styles.toggle, value && styles.toggleOn]}>
        <Text style={styles.toggleText}>{value ? "ON" : "OFF"}</Text>
      </View>
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
    row: {
      flexDirection: "row",
      alignItems: "center",
      padding: 14,
      borderRadius: 18,
      gap: 12,
    },
    textBox: {
      flex: 1,
    },
    rowTitle: {
      fontSize: 16,
      fontWeight: "900",
      color: colors.textPrimary,
    },
    rowSubtitle: {
      marginTop: 3,
      fontSize: 12,
      fontWeight: "700",
      color: colors.textSecondary,
      lineHeight: 18,
    },
    toggle: {
      minWidth: 58,
      paddingVertical: 8,
      borderRadius: 999,
      backgroundColor: isDark ? "#334155" : "#CBD5E1",
      alignItems: "center",
    },
    toggleOn: {
      backgroundColor: colors.accent,
    },
    toggleText: {
      color: "#FFFFFF",
      fontSize: 12,
      fontWeight: "900",
    },
    saveButton: {
      backgroundColor: colors.accent,
      padding: 16,
      borderRadius: 16,
      alignItems: "center",
    },
    saveButtonText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "900",
    },
  });
}