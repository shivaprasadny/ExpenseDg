import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

import AppNavigator from "./src/navigation/AppNavigator";
import LockScreen from "./src/screens/LockScreen";
import { ThemeProvider } from "./src/context/ThemeContext";
import { initDatabase } from "./src/database/db";
import { isPinEnabled } from "./src/services/securityService";

/**
 * Main app entry.
 * Initializes database and shows PIN lock if enabled.
 */
export default function App() {
  const [loading, setLoading] = useState(true);
  const [pinEnabled, setPinEnabled] = useState(false);
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    prepareApp();
  }, []);

  /**
   * Initialize database and check PIN lock status.
   */
  async function prepareApp() {
    await initDatabase();

    const enabled = await isPinEnabled();

    setPinEnabled(enabled);
    setUnlocked(!enabled);
    setLoading(false);
  }

  if (loading) {
    return (
      <ThemeProvider>
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <ActivityIndicator size="large" />
        </View>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      {pinEnabled && !unlocked ? (
        <LockScreen onUnlocked={() => setUnlocked(true)} />
      ) : (
        <AppNavigator />
      )}
    </ThemeProvider>
  );
}