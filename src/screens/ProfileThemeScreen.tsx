import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

import AppScreen from "../components/AppScreen";
import { AppTheme, getUserProfile, saveUserProfile } from "../services/profileService";
import { useAppTheme } from "../context/ThemeContext";

/**
 * Profile and theme screen.
 */
export default function ProfileThemeScreen() {
  const [userName, setUserName] = useState("");
  const [currencySymbol, setCurrencySymbol] = useState("$");
  const [savingsGoal, setSavingsGoal] = useState("");
  const [theme, setTheme] = useState<AppTheme>("SYSTEM");

  const { reloadTheme } = useAppTheme();

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    const profile = await getUserProfile();

    setUserName(profile.userName);
    setCurrencySymbol(profile.currencySymbol);
    setSavingsGoal(String(profile.savingsGoal));
    setTheme(profile.theme);
  }

  async function handleSave() {
    const goalNumber = Number(savingsGoal);

    await saveUserProfile({
      userName,
      currencySymbol,
      savingsGoal: Number.isNaN(goalNumber) ? 0 : goalNumber,
      theme,
    });

    await reloadTheme();

    Alert.alert("Saved", "Profile and theme updated.");
  }

  return (
    <AppScreen>
      <Text style={styles.title}>Profile & Theme</Text>
      <Text style={styles.subtitle}>Customize your personal app settings</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Your Name</Text>
        <TextInput style={styles.input} placeholder="Enter your name" value={userName} onChangeText={setUserName} />

        <Text style={styles.label}>Currency Symbol</Text>
        <TextInput style={styles.input} placeholder="$" value={currencySymbol} onChangeText={setCurrencySymbol} maxLength={3} />

        <Text style={styles.label}>Savings Goal</Text>
        <TextInput style={styles.input} placeholder="1000" keyboardType="decimal-pad" value={savingsGoal} onChangeText={setSavingsGoal} />

        <Text style={styles.label}>Theme</Text>
        <View style={styles.themeRow}>
          {(["LIGHT", "DARK", "SYSTEM"] as AppTheme[]).map((item) => (
            <TouchableOpacity
              key={item}
              style={[styles.themeChip, theme === item && styles.themeChipSelected]}
              onPress={() => setTheme(item)}
            >
              <Text style={[styles.themeChipText, theme === item && styles.themeChipTextSelected]}>
                {item === "LIGHT" ? "Light" : item === "DARK" ? "Dark" : "System"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.primaryButton} onPress={handleSave}>
          <Text style={styles.primaryButtonText}>Save Changes</Text>
        </TouchableOpacity>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 32, fontWeight: "900", color: "#071826" },
  subtitle: { marginTop: 4, marginBottom: 20, fontSize: 14, fontWeight: "700", color: "#64748B" },
  card: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#DDE7E2", borderRadius: 24, padding: 18 },
  label: { marginTop: 12, marginBottom: 8, fontSize: 14, fontWeight: "800", color: "#334155" },
  input: { backgroundColor: "#F8FAFC", borderWidth: 1, borderColor: "#CBD5E1", borderRadius: 14, padding: 14, fontSize: 16, color: "#071826" },
  themeRow: { flexDirection: "row", gap: 10, marginTop: 6, marginBottom: 18 },
  themeChip: { flex: 1, padding: 13, borderRadius: 14, borderWidth: 1, borderColor: "#CBD5E1", alignItems: "center", backgroundColor: "#F8FAFC" },
  themeChipSelected: { backgroundColor: "#0F766E", borderColor: "#0F766E" },
  themeChipText: { fontWeight: "900", color: "#334155", fontSize: 13 },
  themeChipTextSelected: { color: "#FFFFFF" },
  primaryButton: { backgroundColor: "#0F766E", padding: 16, borderRadius: 16, alignItems: "center" },
  primaryButtonText: { color: "#FFFFFF", fontWeight: "900", fontSize: 16 },
});