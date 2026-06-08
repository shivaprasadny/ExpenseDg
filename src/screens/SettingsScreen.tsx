import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import AppScreen from "../components/AppScreen";
import { RootStackParamList } from "../navigation/AppNavigator";
import * as Notifications from "expo-notifications";
import { Alert } from "react-native";


type Props = NativeStackScreenProps<RootStackParamList, "Settings">;

/**
 * Settings menu screen.
 * This screen only shows navigation options.
 */
export default function SettingsScreen({ navigation }: Props) {
  return (
    <AppScreen>
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.subtitle}>Manage your app, data, and preferences</Text>
  <View style={styles.card}>
        <MenuItem icon="📋" title="Records" subtitle="View all income and expenses" onPress={() => navigation.navigate("Expenses")} />
        <MenuItem icon="🏷️" title="Categories" subtitle="Manage income and expense categories" onPress={() => navigation.navigate("Categories")} />
     <MenuItem
  icon="🔁"
  title="Recurring Transactions"
  subtitle="Manage recurring income and expenses"
  onPress={() => navigation.navigate("Recurring")}
/>
      </View>



      <View style={styles.card}>
        <MenuItem icon="👤" title="Profile & Theme" subtitle="Name, currency, savings goal, theme" onPress={() => navigation.navigate("ProfileTheme")} />
        <MenuItem icon="📦" title="Backup & Reset" subtitle="Backup, restore, export CSV, reset data" onPress={() => navigation.navigate("BackupReset")} />
        <MenuItem icon="💬" title="Feedback" subtitle="Send feedback or contact support" onPress={() => navigation.navigate("Feedback")} />
        <MenuItem icon="ℹ️" title="About ExpenseDG" subtitle="App info and version" onPress={() => navigation.navigate("About")} />
        <MenuItem icon="🔐" title="Security" subtitle="PIN and security questions coming soon" onPress={() => navigation.navigate("Security")} />
      
      <MenuItem
  icon="🔔"
  title="Notifications"
  subtitle="Smart reminders, weekly review, and backup alerts"
  onPress={() => navigation.navigate("Notifications")}
/>
      </View>

    
    </AppScreen>
  );
}

/**
 * Reusable settings menu row.
 */
function MenuItem({
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
    <TouchableOpacity activeOpacity={0.85} style={styles.menuItem} onPress={onPress}>
      <Text style={styles.icon}>{icon}</Text>

      <View style={styles.menuTextBox}>
        <Text style={styles.menuTitle}>{title}</Text>
        <Text style={styles.menuSubtitle}>{subtitle}</Text>
      </View>

      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 32, fontWeight: "900", color: "#071826" },
  subtitle: { marginTop: 4, marginBottom: 20, fontSize: 14, fontWeight: "700", color: "#64748B" },

  card: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDE7E2",
    borderRadius: 24,
    padding: 10,
    marginBottom: 18,
  },

  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 18,
  },
  icon: { fontSize: 24, marginRight: 12 },
  menuTextBox: { flex: 1 },
  menuTitle: { fontSize: 16, fontWeight: "900", color: "#071826" },
  menuSubtitle: { marginTop: 3, fontSize: 12, fontWeight: "700", color: "#64748B" },
  chevron: { fontSize: 28, fontWeight: "700", color: "#94A3B8" },
});