import React from "react";
import { StyleSheet, Text, View } from "react-native";

import AppScreen from "../components/AppScreen";

/**
 * About screen.
 */
export default function AboutScreen() {
  return (
    <AppScreen>
      <Text style={styles.title}>About ExpenseDG</Text>
      <Text style={styles.subtitle}>Simple offline-first money tracking</Text>

      <View style={styles.card}>
        <Text style={styles.appName}>ExpenseDG</Text>
        <Text style={styles.aboutText}>
          ExpenseDG is a personal expense tracker built to help you track income,
          expenses, categories, savings goals, recurring records, and local backups.
        </Text>

        <Text style={styles.version}>Version 1.0.0</Text>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 32, fontWeight: "900", color: "#071826" },
  subtitle: { marginTop: 4, marginBottom: 20, fontSize: 14, fontWeight: "700", color: "#64748B" },
  card: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#DDE7E2", borderRadius: 24, padding: 20 },
  appName: { fontSize: 26, fontWeight: "900", color: "#0F766E" },
  aboutText: { marginTop: 12, fontSize: 14, fontWeight: "700", color: "#334155", lineHeight: 22 },
  version: { marginTop: 20, fontSize: 12, fontWeight: "800", color: "#94A3B8" },
});