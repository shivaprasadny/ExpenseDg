import React from "react";
import { StyleSheet, Text, View } from "react-native";

import AppScreen from "../components/AppScreen";

/**
 * Security screen.
 * Future features:
 * - PIN lock
 * - Change PIN
 * - Security question
 * - Biometric unlock
 */
export default function SecurityScreen() {
  return (
    <AppScreen>
      <Text style={styles.title}>Security</Text>
      <Text style={styles.subtitle}>PIN and security options</Text>

      <View style={styles.card}>
        <Text style={styles.icon}>🔐</Text>
        <Text style={styles.cardTitle}>Coming Soon</Text>
        <Text style={styles.cardText}>
          Later we will add PIN lock, change PIN, security question, and optional biometric unlock.
        </Text>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 32, fontWeight: "900", color: "#071826" },
  subtitle: { marginTop: 4, marginBottom: 20, fontSize: 14, fontWeight: "700", color: "#64748B" },
  card: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#DDE7E2", borderRadius: 24, padding: 24, alignItems: "center" },
  icon: { fontSize: 42 },
  cardTitle: { marginTop: 14, fontSize: 22, fontWeight: "900", color: "#071826" },
  cardText: { marginTop: 8, textAlign: "center", fontSize: 14, fontWeight: "700", color: "#64748B", lineHeight: 22 },
});