import React from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableWithoutFeedback,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { COLORS } from "../constants/colors";

/**
 * Reusable screen wrapper.
 * Handles:
 * - Android/iOS safe top space
 * - keyboard avoiding
 * - scroll when keyboard opens
 * - tap outside to close keyboard
 * - extra bottom padding for Android navigation bar
 */
export default function AppScreen({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.container,
            {
              // Extra top space for Android status bar/header area
              paddingTop: Math.max(insets.top + 16, 28),

              // Extra bottom space so keyboard/nav bar does not hide button
              paddingBottom: Math.max(insets.bottom + 220, 260),
            },
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

/**
 * Wrapper styles.
 */
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    paddingHorizontal: 20,
  },
});