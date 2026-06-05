import React, { useEffect } from "react";
import { StatusBar } from "expo-status-bar";

import { initDatabase } from "./src/database/db";
import AppNavigator from "./src/navigation/AppNavigator";

/**
 * App root file.
 * This runs first when the mobile app starts.
 */
export default function App() {
 useEffect(() => {
  async function startDatabase() {
    await initDatabase();
  }

  startDatabase();
}, []);

  return (
    <>
      <StatusBar style="dark" />
      <AppNavigator />
    </>
  );
}