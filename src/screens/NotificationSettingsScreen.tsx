import React, { useEffect, useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import AppScreen from "../components/AppScreen";
import { useAppTheme } from "../context/ThemeContext";
import {
  applyNotificationSettings,
  getNotificationSettings,
  requestNotificationPermission,
  scheduleTestNotification,
} from "../services/notificationService";

/**
 * NotificationSettingsScreen
 *
 * Premium notification settings screen.
 * User can enable/disable useful reminders.
 */
export default function NotificationSettingsScreen() {
  const { colors, isDark } = useAppTheme();
  const styles = createStyles(colors, isDark);

  const [smartReminder, setSmartReminder] = useState(true);
  const [weeklyReview, setWeeklyReview] = useState(true);
  const [monthlyBackup, setMonthlyBackup] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  /**
   * Load saved notification choices.
   */
  async function loadSettings() {
    const settings = await getNotificationSettings();

    setSmartReminder(settings.smartReminder);
    setWeeklyReview(settings.weeklyReview);
    setMonthlyBackup(settings.monthlyBackup);
  }

  /**
   * Save settings and schedule reminders.
   */
  async function handleSave() {
    const success = await applyNotificationSettings({
      smartReminder,
      weeklyReview,
      monthlyBackup,
    });

    if (!success) {
      Alert.alert(
        "Permission Needed",
        "Please allow notifications to use reminders."
      );
      return;
    }

    Alert.alert("Saved", "Notification reminders updated.");
  }

  /**
   * Schedule a test notification.
   */
  async function handleTestNotification() {
    const allowed = await requestNotificationPermission();

    if (!allowed) {
      Alert.alert(
        "Permission Needed",
        "Please allow notifications first."
      );
      return;
    }

    await scheduleTestNotification();

    Alert.alert(
      "Test Scheduled",
      "Put the app in the background and wait 10 seconds."
    );
  }

  const activeCount =
    Number(smartReminder) + Number(weeklyReview) + Number(monthlyBackup);

  return (
    <AppScreen>
      <Text style={styles.title}>Notifications</Text>
      <Text style={styles.subtitle}>
        Helpful reminders without spam
      </Text>

      <View style={styles.heroCard}>
        <Text style={styles.heroIcon}>🔔</Text>
        <Text style={styles.heroTitle}>Smart Notifications</Text>
        <Text style={styles.heroText}>
          ExpenseDG sends only a few useful reminders. No ads. No tracking.
          Your finance data stays on your device.
        </Text>

        <View style={styles.statusPill}>
          <Text style={styles.statusPillText}>
            {activeCount} reminder{activeCount === 1 ? "" : "s"} active
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <ToggleRow
          styles={styles}
          icon="💰"
          title="Smart Expense Reminder"
          subtitle="Every 3 days. Reminds you to keep your records updated."
          value={smartReminder}
          onPress={() => setSmartReminder(!smartReminder)}
        />

        <View style={styles.divider} />

        <ToggleRow
          styles={styles}
          icon="📊"
          title="Weekly Review"
          subtitle="Every Sunday at 6 PM. Review Monday to Sunday spending."
          value={weeklyReview}
          onPress={() => setWeeklyReview(!weeklyReview)}
        />

        <View style={styles.divider} />

        <ToggleRow
          styles={styles}
          icon="📦"
          title="Monthly Backup"
          subtitle="1st day of every month at 6 PM. Keep your data safe."
          value={monthlyBackup}
          onPress={() => setMonthlyBackup(!monthlyBackup)}
        />
      </View>

      <TouchableOpacity
        activeOpacity={0.85}
        style={styles.saveButton}
        onPress={handleSave}
      >
        <Text style={styles.saveButtonText}>
          Save Notification Settings
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.85}
        style={styles.testButton}
        onPress={handleTestNotification}
      >
        <Text style={styles.testButtonText}>
          Send Test Notification
        </Text>
      </TouchableOpacity>

      <Text style={styles.footerNote}>
        Notifications use your phone local time zone. If you travel, reminders
        follow your device time.
      </Text>
    </AppScreen>
  );
}

/**
 * Reusable premium toggle row.
 */
function ToggleRow({
  icon,
  title,
  subtitle,
  value,
  onPress,
  styles,
}: {
  icon: string;
  title: string;
  subtitle: string;
  value: boolean;
  onPress: () => void;
  styles: any;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={styles.row}
      onPress={onPress}
    >
      <Text style={styles.rowIcon}>{icon}</Text>

      <View style={styles.textBox}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSubtitle}>{subtitle}</Text>
      </View>

      <View style={[styles.toggle, value && styles.toggleOn]}>
        <View
          style={[
            styles.toggleKnob,
            value && styles.toggleKnobOn,
          ]}
        />
      </View>
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

    heroCard: {
      backgroundColor: isDark ? "#052E22" : "#ECFDF5",
      borderWidth: 1,
      borderColor: isDark ? "#065F46" : "#A7F3D0",
      borderRadius: 28,
      padding: 20,
      marginBottom: 18,
    },
    heroIcon: {
      fontSize: 36,
      marginBottom: 10,
    },
    heroTitle: {
      fontSize: 22,
      fontWeight: "900",
      color: colors.textPrimary,
    },
    heroText: {
      marginTop: 8,
      color: colors.textSecondary,
      fontSize: 13,
      fontWeight: "700",
      lineHeight: 20,
    },
    statusPill: {
      alignSelf: "flex-start",
      marginTop: 14,
      backgroundColor: colors.accent,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 999,
    },
    statusPillText: {
      color: "#FFFFFF",
      fontSize: 12,
      fontWeight: "900",
    },

    card: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 24,
      padding: 8,
      marginBottom: 18,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      padding: 14,
      borderRadius: 18,
      gap: 12,
    },
    rowIcon: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: isDark ? "#020617" : "#F8FAFC",
      borderWidth: 1,
      borderColor: colors.border,
      textAlign: "center",
      textAlignVertical: "center",
      fontSize: 20,
    },
    textBox: {
      flex: 1,
    },
    rowTitle: {
      fontSize: 15,
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
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginHorizontal: 14,
    },

    toggle: {
      width: 54,
      height: 30,
      borderRadius: 999,
      padding: 3,
      backgroundColor: isDark ? "#334155" : "#CBD5E1",
      justifyContent: "center",
    },
    toggleOn: {
      backgroundColor: colors.accent,
    },
    toggleKnob: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: "#FFFFFF",
    },
    toggleKnobOn: {
      alignSelf: "flex-end",
    },

    saveButton: {
      backgroundColor: colors.accent,
      padding: 16,
      borderRadius: 16,
      alignItems: "center",
      marginBottom: 12,
    },
    saveButtonText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "900",
    },

    testButton: {
      backgroundColor: isDark ? "#020617" : "#F8FAFC",
      borderWidth: 1,
      borderColor: colors.border,
      padding: 15,
      borderRadius: 16,
      alignItems: "center",
      marginBottom: 16,
    },
    testButtonText: {
      color: colors.accent,
      fontSize: 15,
      fontWeight: "900",
    },

    footerNote: {
      marginBottom: 40,
      textAlign: "center",
      color: colors.textSecondary,
      fontSize: 12,
      fontWeight: "700",
      lineHeight: 18,
    },
  });
}