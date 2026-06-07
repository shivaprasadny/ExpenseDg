import React from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import AppScreen from "../components/AppScreen";

/**
 * Feedback screen.
 * Later we will connect this with expo-mail-composer.
 */
export default function FeedbackScreen() {
  return (
    <AppScreen>
      <Text style={styles.title}>Feedback</Text>
      <Text style={styles.subtitle}>Help improve ExpenseDG</Text>

      <View style={styles.card}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => Alert.alert("Coming Soon", "Email feedback will be added soon.")}
        >
          <Text style={styles.icon}>💬</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.menuTitle}>Send Feedback</Text>
            <Text style={styles.menuSubtitle}>Share bugs, ideas, or suggestions</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => Alert.alert("Coming Soon", "Support email will be added soon.")}
        >
          <Text style={styles.icon}>📧</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.menuTitle}>Contact Support</Text>
            <Text style={styles.menuSubtitle}>Get help with ExpenseDG</Text>
          </View>
        </TouchableOpacity>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 32, fontWeight: "900", color: "#071826" },
  subtitle: { marginTop: 4, marginBottom: 20, fontSize: 14, fontWeight: "700", color: "#64748B" },
  card: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#DDE7E2", borderRadius: 24, padding: 10 },
  menuButton: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 18 },
  icon: { fontSize: 24, marginRight: 12 },
  menuTitle: { fontSize: 16, fontWeight: "900", color: "#071826" },
  menuSubtitle: { marginTop: 3, fontSize: 12, fontWeight: "700", color: "#64748B" },
});