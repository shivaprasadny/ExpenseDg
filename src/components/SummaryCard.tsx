import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS } from "../constants/colors";

/**
 * Reusable dashboard card.
 */
interface Props {
  title: string;
  value: string;
}

export default function SummaryCard({
  title,
  value,
}: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>

      <Text style={styles.value}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.primary,
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  title: {
    color: "#CBD5E1",
    fontSize: 14,
  },
  value: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "900",
    marginTop: 8,
  },
});