import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { useColorScheme } from "react-native";

import { getUserProfile } from "../services/profileService";
import {
  AppThemeMode,
  darkColors,
  lightColors,
} from "../theme/appTheme";

type ThemeContextValue = {
  mode: AppThemeMode;
  isDark: boolean;
  colors: typeof lightColors;
  reloadTheme: () => Promise<void>;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemTheme = useColorScheme();

  const [mode, setMode] = useState<AppThemeMode>("SYSTEM");

  useEffect(() => {
    reloadTheme();
  }, []);

  async function reloadTheme() {
    const profile = await getUserProfile();
    setMode(profile.theme);
  }

  const isDark =
    mode === "DARK" || (mode === "SYSTEM" && systemTheme === "dark");

  const colors = isDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider
      value={{
        mode,
        isDark,
        colors,
        reloadTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useAppTheme must be used inside ThemeProvider");
  }

  return context;
}