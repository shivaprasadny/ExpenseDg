import React, { useEffect, useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import AppScreen from "../components/AppScreen";
import {
  AppTheme,
  getUserProfile,
  saveUserProfile,
} from "../services/profileService";
import { useAppTheme } from "../context/ThemeContext";

const currencyOptions = [
  { label: "$ USD", value: "$" },
  { label: "₹ INR", value: "₹" },
  { label: "रु NPR", value: "रु" },
  { label: "€ EUR", value: "€" },
  { label: "£ GBP", value: "£" },
  { label: "¥ JPY", value: "¥" },
  { label: "S$ SGD", value: "S$" },
  { label: "A$ AUD", value: "A$" },
  { label: "C$ CAD", value: "C$" },
];

/**
 * Profile and theme screen.
 */
export default function ProfileThemeScreen() {
  const { colors, isDark, reloadTheme } = useAppTheme();
  const styles = createStyles(colors, isDark);

  const [userName, setUserName] = useState("");
  const [nickname, setNickname] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [currencySymbol, setCurrencySymbol] = useState<string>("$");
  const [theme, setTheme] = useState<AppTheme>("SYSTEM");

  const [showCustomCurrency, setShowCustomCurrency] = useState(false);
  const [showCurrencyList, setShowCurrencyList] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    const profile = await getUserProfile();

    setUserName(profile.userName);
    setNickname(profile.nickname ?? "");
    setDateOfBirth(profile.dateOfBirth ?? "");
    setCurrencySymbol(profile.currencySymbol || "$");
    setTheme(profile.theme);
  }

  async function handleSave() {
    await saveUserProfile({
      userName,
      nickname,
      dateOfBirth,
      currencySymbol,
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
        <TextInput
          style={styles.input}
          placeholder="Enter your name"
          placeholderTextColor={colors.textSecondary}
          value={userName}
          onChangeText={setUserName}
        />

        <Text style={styles.label}>Nickname</Text>
        <TextInput
          style={styles.input}
          placeholder="Example: Shiva"
          placeholderTextColor={colors.textSecondary}
          value={nickname}
          onChangeText={setNickname}
        />

        <Text style={styles.label}>Date of Birth</Text>
        <TextInput
          style={styles.input}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={colors.textSecondary}
          value={dateOfBirth}
          onChangeText={setDateOfBirth}
        />

        
<Text style={styles.label}>Currency</Text>

<TouchableOpacity
  style={styles.selectorButton}
  onPress={() => setShowCurrencyList(!showCurrencyList)}
>
  <Text style={styles.selectorText}>
    {currencySymbol}
  </Text>

  <Text style={styles.selectorArrow}>
    {showCurrencyList ? "▲" : "▼"}
  </Text>
</TouchableOpacity>

{showCurrencyList && (
  <View style={styles.listCard}>
    {currencyOptions.map((item) => (
      <TouchableOpacity
        key={item.value}
        style={styles.listRow}
        onPress={() => {
          setCurrencySymbol(item.value);
          setShowCurrencyList(false);
          setShowCustomCurrency(false);
        }}
      >
        <Text style={styles.listText}>
          {item.label}
        </Text>

        {currencySymbol === item.value && (
          <Text style={styles.checkMark}>✓</Text>
        )}
      </TouchableOpacity>
    ))}

    <TouchableOpacity
      style={styles.listRow}
      onPress={() => {
        setShowCustomCurrency(true);
        setShowCurrencyList(false);
      }}
    >
      <Text style={styles.listText}>
        Custom Currency
      </Text>
    </TouchableOpacity>
  </View>
)}

        <Text style={styles.label}>Theme</Text>
        <View style={styles.themeRow}>
          {(["LIGHT", "DARK", "SYSTEM"] as AppTheme[]).map((item) => (
            <TouchableOpacity
              key={item}
              activeOpacity={0.85}
              style={[
                styles.themeChip,
                theme === item && styles.themeChipSelected,
              ]}
              onPress={() => setTheme(item)}
            >
              <Text
                style={[
                  styles.themeChipText,
                  theme === item && styles.themeChipTextSelected,
                ]}
              >
                {item === "LIGHT"
                  ? "Light"
                  : item === "DARK"
                  ? "Dark"
                  : "System"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.primaryButton}
          onPress={handleSave}
        >
          <Text style={styles.primaryButtonText}>Save Changes</Text>
        </TouchableOpacity>
      </View>
    </AppScreen>
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
      padding: 18,
    },
    label: {
      marginTop: 12,
      marginBottom: 8,
      fontSize: 14,
      fontWeight: "800",
      color: colors.textPrimary,
    },
    input: {
      backgroundColor: isDark ? "#020617" : "#F8FAFC",
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      padding: 14,
      fontSize: 16,
      color: colors.textPrimary,
    },

    currencyGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
      marginBottom: 12,
    },
    currencyChip: {
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: isDark ? "#020617" : "#F8FAFC",
      marginBottom: 10,
    },
    currencyChipSelected: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    currencyChipText: {
      fontWeight: "800",
      color: colors.textPrimary,
    },
    currencyChipTextSelected: {
      color: "#FFFFFF",
    },

    themeRow: {
      flexDirection: "row",
      gap: 10,
      marginTop: 6,
      marginBottom: 18,
    },
    themeChip: {
      flex: 1,
      padding: 13,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      backgroundColor: isDark ? "#020617" : "#F8FAFC",
    },
    themeChipSelected: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    themeChipText: {
      fontWeight: "900",
      color: colors.textPrimary,
      fontSize: 13,
    },
    themeChipTextSelected: {
      color: "#FFFFFF",
    },
    primaryButton: {
      backgroundColor: colors.accent,
      padding: 16,
      borderRadius: 16,
      alignItems: "center",
      marginTop: 4,
    },
    primaryButtonText: {
      color: "#FFFFFF",
      fontWeight: "900",
      fontSize: 16,
    },
    listCard: {
  backgroundColor: colors.card,
  borderWidth: 1,
  borderColor: colors.border,
  borderRadius: 16,
  overflow: "hidden",
},

listRow: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  paddingVertical: 14,
  paddingHorizontal: 16,
  borderBottomWidth: 1,
  borderBottomColor: colors.border,
},

listText: {
  fontSize: 15,
  fontWeight: "700",
  color: colors.textPrimary,
},

checkMark: {
  fontSize: 18,
  fontWeight: "900",
  color: colors.accent,
},
selectorButton: {
  backgroundColor: isDark ? "#020617" : "#F8FAFC",
  borderWidth: 1,
  borderColor: colors.border,
  borderRadius: 14,
  padding: 14,
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
},

selectorText: {
  fontSize: 16,
  fontWeight: "700",
  color: colors.textPrimary,
},

selectorArrow: {
  fontSize: 14,
  fontWeight: "900",
  color: colors.accent,
},


  });
}