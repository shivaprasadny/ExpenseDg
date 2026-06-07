import React from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import * as MailComposer from "expo-mail-composer";

import AppScreen from "../components/AppScreen";
import { useAppTheme } from "../context/ThemeContext";

const SUPPORT_EMAIL = "shiva_prem14@hotmail.com";
const VENMO_USERNAME = "@shivaprasad1991";

/**
 * FeedbackScreen
 *
 * User can:
 * - Send feedback
 * - Report bugs
 * - Suggest features
 * - Contact support
 * - Learn about ExpenseDG
 * - See donation/support info
 */
export default function FeedbackScreen() {
  const { colors, isDark } = useAppTheme();
  const styles = createStyles(colors, isDark);

  /**
   * Open user's email app with prefilled message.
   */
  async function sendEmail(subject: string, body: string) {
    const available = await MailComposer.isAvailableAsync();

    if (!available) {
      Alert.alert(
        "Email Not Available",
        `Please email us directly at ${SUPPORT_EMAIL}`
      );
      return;
    }

    await MailComposer.composeAsync({
      recipients: [SUPPORT_EMAIL],
      subject,
      body,
    });
  }

  /**
   * Show donation info.
   * Keeping this informational avoids forcing payments inside the app.
   */
  function showDonationInfo() {
    Alert.alert(
      "Support ExpenseDG",
      `ExpenseDG is built to help the community manage money better.\n\nIf you would like to support development, you can Venmo:\n\n${VENMO_USERNAME}\n\nFor other ways to support, email ${SUPPORT_EMAIL}`
    );
  }

  return (
    <AppScreen>
      <Text style={styles.title}>Feedback</Text>
      <Text style={styles.subtitle}>
        Help improve ExpenseDG for the community
      </Text>

      {/* FEEDBACK ACTIONS */}
      <View style={styles.card}>
        <ActionButton
          styles={styles}
          icon="💬"
          title="Send Feedback"
          subtitle="Share your thoughts about ExpenseDG"
          onPress={() =>
            sendEmail(
              "ExpenseDG Feedback",
              "Hi Shiva,\n\nI want to share feedback about ExpenseDG:\n\n"
            )
          }
        />

        <ActionButton
          styles={styles}
          icon="🐞"
          title="Report a Bug"
          subtitle="Tell us what is not working"
          onPress={() =>
            sendEmail(
              "ExpenseDG Bug Report",
              "Hi Shiva,\n\nI found a bug in ExpenseDG.\n\nWhat happened:\n\nSteps to reproduce:\n1.\n2.\n3.\n\nDevice:\nApp version:\n\n"
            )
          }
        />

        <ActionButton
          styles={styles}
          icon="💡"
          title="Suggest a Feature"
          subtitle="Request an idea for future updates"
          onPress={() =>
            sendEmail(
              "ExpenseDG Feature Request",
              "Hi Shiva,\n\nI have a feature idea for ExpenseDG:\n\n"
            )
          }
        />

        <ActionButton
          styles={styles}
          icon="📧"
          title="Contact Support"
          subtitle="Get help with the app"
          onPress={() =>
            sendEmail(
              "ExpenseDG Support",
              "Hi Shiva,\n\nI need help with ExpenseDG:\n\n"
            )
          }
        />
      </View>

      {/* APP INFO */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>About ExpenseDG</Text>

        <Text style={styles.infoText}>
          ExpenseDG is an offline-first personal finance tracker built to help
          people record expenses, income, categories, and understand their money
          habits.
        </Text>

        <Text style={styles.infoText}>
          Your data stays on your device. ExpenseDG does not collect your
          personal financial records on a server.
        </Text>
      </View>

      {/* MOTIVATION */}
      <View style={styles.quoteCard}>
        <Text style={styles.quoteText}>
          “Small daily records create big financial clarity.”
        </Text>
      </View>

      {/* DONATION */}
      <View style={styles.supportCard}>
        <Text style={styles.supportTitle}>Support the Project</Text>

        <Text style={styles.supportText}>
          If ExpenseDG helps you, you can support future development.
        </Text>

        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.supportButton}
          onPress={showDonationInfo}
        >
          <Text style={styles.supportButtonText}>Donation Info</Text>
        </TouchableOpacity>
      </View>
    </AppScreen>
  );
}

/**
 * Reusable feedback row.
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
    <TouchableOpacity
      activeOpacity={0.85}
      style={styles.menuButton}
      onPress={onPress}
    >
      <Text style={styles.icon}>{icon}</Text>

      <View style={styles.menuTextBox}>
        <Text style={styles.menuTitle}>{title}</Text>
        <Text style={styles.menuSubtitle}>{subtitle}</Text>
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
    menuButton: {
      flexDirection: "row",
      alignItems: "center",
      padding: 14,
      borderRadius: 18,
    },
    icon: {
      fontSize: 24,
      marginRight: 12,
    },
    menuTextBox: {
      flex: 1,
    },
    menuTitle: {
      fontSize: 16,
      fontWeight: "900",
      color: colors.textPrimary,
    },
    menuSubtitle: {
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

    infoCard: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 24,
      padding: 18,
      marginBottom: 18,
    },
    infoTitle: {
      fontSize: 20,
      fontWeight: "900",
      color: colors.textPrimary,
      marginBottom: 10,
    },
    infoText: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.textSecondary,
      lineHeight: 22,
      marginBottom: 10,
    },

    quoteCard: {
      backgroundColor: isDark ? "#052E22" : "#ECFDF5",
      borderWidth: 1,
      borderColor: isDark ? "#065F46" : "#A7F3D0",
      borderRadius: 22,
      padding: 18,
      marginBottom: 18,
    },
    quoteText: {
      color: isDark ? "#A7F3D0" : "#065F46",
      fontSize: 15,
      fontWeight: "900",
      lineHeight: 22,
    },

    supportCard: {
      backgroundColor: isDark ? "#172554" : "#EFF6FF",
      borderWidth: 1,
      borderColor: isDark ? "#1D4ED8" : "#BFDBFE",
      borderRadius: 24,
      padding: 18,
      marginBottom: 40,
    },
    supportTitle: {
      fontSize: 20,
      fontWeight: "900",
      color: isDark ? "#BFDBFE" : "#1E3A8A",
    },
    supportText: {
      marginTop: 8,
      marginBottom: 14,
      fontSize: 14,
      fontWeight: "700",
      color: isDark ? "#DBEAFE" : "#1E40AF",
      lineHeight: 21,
    },
    supportButton: {
      backgroundColor: colors.accent,
      padding: 15,
      borderRadius: 16,
      alignItems: "center",
    },
    supportButtonText: {
      color: "#FFFFFF",
      fontWeight: "900",
      fontSize: 15,
    },
  });
}