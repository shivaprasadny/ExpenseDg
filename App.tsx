import React, { useEffect } from "react";
import { StatusBar } from "expo-status-bar";

import { initDatabase } from "./src/database/db";
import AppNavigator from "./src/navigation/AppNavigator";
import { ThemeProvider } from "./src/context/ThemeContext";

export default function App() {
  useEffect(() => {
    async function startDatabase() {
      await initDatabase();
    }

    startDatabase();
  }, []);

  return (
    <ThemeProvider>
      <StatusBar style="auto" />
      <AppNavigator />
    </ThemeProvider>
  );
}