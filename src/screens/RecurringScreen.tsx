
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback , useState} from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import AppScreen from "../components/AppScreen";
import { useAppTheme } from "../context/ThemeContext";
import { RootStackParamList } from "../navigation/AppNavigator";
import {
  deleteRecurringSeries,
  getRecurringGroups,
  pauseRecurringSeries,
  startRecurringSeries,
  stopRecurringKeepOldRecords,
} from "../services/expenseService";

type Props = NativeStackScreenProps<RootStackParamList, "Recurring">;

/**
 * RecurringScreen
 *
 * Compact recurring transaction manager.
 * User taps a card to expand actions.
 */
export default function RecurringScreen({ navigation }: Props) {
  const { colors, isDark } = useAppTheme();
  const styles = createStyles(colors, isDark);

  const [records, setRecords] = useState<any[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

useFocusEffect(
  useCallback(() => {
    loadData();
  }, [])
);
  /**
   * Load recurring transaction groups.
   */
  async function loadData() {
    const data = await getRecurringGroups();
    setRecords(data);
  }

  /**
   * For now, old recurring records do not store exact frequency.
   * Later we can save repeatUnit/repeatInterval in DB.
   */
  function getFrequencyLabel(item: any) {
    if (
      !item.firstDate ||
      !item.lastDate ||
      !item.totalRecords ||
      item.totalRecords < 2
    ) {
      return "Recurring";
    }

    const first = new Date(item.firstDate);
    const last = new Date(item.lastDate);
    const diffMs = last.getTime() - first.getTime();

    if (Number.isNaN(diffMs)) return "Recurring";

    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    const averageGap = Math.round(diffDays / (item.totalRecords - 1));

    if (averageGap >= 27 && averageGap <= 32) return "Monthly";
    if (averageGap >= 13 && averageGap <= 15) return "Biweekly";
    if (averageGap >= 6 && averageGap <= 8) return "Weekly";
    if (averageGap >= 360) return "Yearly";

    return "Recurring";
  }

  /**
   * Edit only the next generated record.
   * Full series edit can be added later.
   */
 /**
 * Let user choose how much of the recurring series to edit.
 */
function handleEditRecurring(item: any) {
  Alert.alert("Edit Recurring Record", "What would you like to edit?", [
    {
      text: "This Record Only",
      onPress: () =>
        navigation.navigate("EditExpense", {
          expenseId: item.id,
          updateScope: "THIS_ONLY",
        }),
    },
    {
      text: "This And Future Records",
      onPress: () =>
        navigation.navigate("EditExpense", {
          expenseId: item.id,
          updateScope: "THIS_AND_FUTURE",
        }),
    },
    {
      text: "All Records In Series",
      onPress: () =>
        navigation.navigate("EditExpense", {
          expenseId: item.id,
          updateScope: "ALL_SERIES",
        }),
    },
    {
      text: "Cancel",
      style: "cancel",
    },
  ]);
}

  /**
   * Duplicate recurring transaction as a new normal record.
   */
  function handleDuplicate(item: any) {
   navigation.navigate("AddExpense", {
  duplicateRecord: {
    title: item.title,
    amount: Number(item.amount),
    categoryId: Number(item.categoryId),
    paymentMethod: item.paymentMethod,
    note: item.note ?? "",
    type: item.type,
    isRecurring: true,
  },
});
  }

  

  /**
   * Delete all records in this recurring series.
   */
/**
 * Let user choose how much of the recurring series to delete.
 */



async function handleTogglePause(item: any) {
  if (!item.recurringGroupId) return;

  if (item.recurringStatus === "PAUSED") {
    await startRecurringSeries(item.recurringGroupId);
    Alert.alert("Started", "Recurring series is active again.");
  } else {
    await pauseRecurringSeries(item.recurringGroupId);
    Alert.alert("Paused", "Recurring series paused.");
  }

  await loadData();
}


function handleDeleteRecurring(item: any) {
  Alert.alert("Delete Recurring Transaction", "What do you want to do?", [
    {
      text: "Keep Old Records",
      onPress: async () => {
        if (!item.recurringGroupId) return;

        await stopRecurringKeepOldRecords(
          item.recurringGroupId,
          new Date().toISOString()
        );

        await loadData();

        Alert.alert(
          "Stopped",
          "Future recurring records removed. Old records are kept."
        );
      },
    },
    {
      text: "Delete Everything",
      style: "destructive",
      onPress: async () => {
        if (!item.recurringGroupId) return;

        await deleteRecurringSeries(item.recurringGroupId);
        await loadData();

        Alert.alert("Deleted", "Entire recurring series deleted.");
      },
    },
    {
      text: "Cancel",
      style: "cancel",
    },
  ]);
}
  return (
    <AppScreen>
      <Text style={styles.title}>Recurring Transactions</Text>

      <Text style={styles.subtitle}>
        Tap a record to manage the recurring series
      </Text>

      {records.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>🔁</Text>
          <Text style={styles.emptyTitle}>No recurring records yet</Text>
          <Text style={styles.emptyText}>
            Recurring income and expenses will appear here.
          </Text>
        </View>
      ) : (
        records.map((item) => {
          const id = String(item.recurringGroupId);
          const expanded = expandedId === id;

          return (
            <TouchableOpacity
              key={id}
              activeOpacity={0.9}
              style={styles.card}
              onPress={() => setExpandedId(expanded ? null : id)}
            >
              {/* Compact top row */}
              <View style={styles.compactRow}>
                <Text style={styles.categoryIcon}>{item.categoryIcon}</Text>

                <View style={styles.mainInfo}>
                  <Text style={styles.name} numberOfLines={1}>
                    {item.title}
                  </Text>

                  <Text style={styles.meta} numberOfLines={1}>
                   {item.recurringStatus === "PAUSED"
  ? "Paused"
  : getFrequencyLabel(item)}
 • {item.categoryName}
                  </Text>
                </View>

                <View style={styles.rightBox}>
                  <Text
                    style={[
                      styles.amount,
                      item.type === "INCOME"
                        ? styles.incomeText
                        : styles.expenseText,
                    ]}
                  >
                    {item.type === "INCOME" ? "+" : "-"}$
                    {Number(item.amount).toFixed(2)}
                  </Text>

                  <Text style={styles.expandText}>
                    {expanded ? "▲" : "▼"}
                  </Text>
                </View>
              </View>

              {/* Expanded details */}
              {expanded && (
                <View style={styles.expandedBox}>
                  <View style={styles.infoRow}>
                    <View style={styles.infoBox}>
                      <Text style={styles.infoLabel}>Next Date</Text>
                      <Text style={styles.infoValue}>
                        {new Date(item.expenseDate).toLocaleDateString()}
                      </Text>
                    </View>

                    <View style={styles.infoBox}>
                      <Text style={styles.infoLabel}>Records</Text>
                      <Text style={styles.infoValue}>
                        {item.totalRecords ?? 1}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.detailText}>
                    Payment: {item.paymentMethod}
                  </Text>

                  {!!item.note && (
                    <Text style={styles.detailText} numberOfLines={2}>
                      Note: {item.note}
                    </Text>
                  )}

                  <View style={styles.actionGrid}>
                    <TouchableOpacity
                      activeOpacity={0.85}
                      style={styles.secondaryButton}
                      onPress={() => handleEditRecurring(item)}
                    >
                      <Text style={styles.secondaryButtonText}>
                        Edit series
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.85}
                      style={styles.secondaryButton}
                      onPress={() => handleDuplicate(item)}
                    >
                      <Text style={styles.secondaryButtonText}>
                        Duplicate
                      </Text>
                    </TouchableOpacity>

                 <TouchableOpacity
  activeOpacity={0.85}
  style={[
    styles.warningButton,
    item.recurringStatus === "PAUSED" && styles.startButton,
  ]}
  onPress={() => handleTogglePause(item)}
>
  <Text style={styles.warningButtonText}>
    {item.recurringStatus === "PAUSED" ? "Start" : "Pause"}
  </Text>
</TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.85}
                      style={styles.deleteButton}
onPress={() => handleDeleteRecurring(item)}
                    >
                      <Text style={styles.deleteButtonText}>
                        Delete
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </TouchableOpacity>
          );
        })
      )}
    </AppScreen>
  );
}

/**
 * Theme-aware styles.
 */
function createStyles(colors: any, isDark: boolean) {
  return StyleSheet.create({
    title: {
      fontSize: 30,
      fontWeight: "900",
      color: colors.textPrimary,
      marginBottom: 4,
    },
    subtitle: {
      marginBottom: 18,
      color: colors.textSecondary,
      fontWeight: "700",
      fontSize: 14,
    },

    emptyCard: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 24,
      padding: 24,
      alignItems: "center",
    },
    emptyIcon: {
      fontSize: 42,
      marginBottom: 10,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: "900",
      color: colors.textPrimary,
    },
    emptyText: {
      marginTop: 6,
      textAlign: "center",
      color: colors.textSecondary,
      fontWeight: "700",
      lineHeight: 20,
    },

    card: {
      backgroundColor: colors.card,
      padding: 14,
      borderRadius: 20,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    compactRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    categoryIcon: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: isDark ? "#020617" : "#F8FAFC",
      borderWidth: 1,
      borderColor: colors.border,
      textAlign: "center",
      textAlignVertical: "center",
      fontSize: 22,
    },
    mainInfo: {
      flex: 1,
    },
    name: {
      fontSize: 16,
      fontWeight: "900",
      color: colors.textPrimary,
    },
    meta: {
      marginTop: 3,
      color: colors.textSecondary,
      fontWeight: "700",
      fontSize: 12,
    },
    rightBox: {
      alignItems: "flex-end",
    },
    amount: {
      fontSize: 15,
      fontWeight: "900",
    },
    incomeText: {
      color: "#059669",
    },
    expenseText: {
      color: "#DC2626",
    },
    expandText: {
      marginTop: 4,
      color: colors.textSecondary,
      fontSize: 11,
      fontWeight: "900",
    },

    expandedBox: {
      marginTop: 14,
      paddingTop: 14,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    infoRow: {
      flexDirection: "row",
      gap: 10,
      marginBottom: 10,
    },
    infoBox: {
      flex: 1,
      backgroundColor: isDark ? "#020617" : "#F8FAFC",
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      padding: 10,
    },
    infoLabel: {
      fontSize: 11,
      fontWeight: "900",
      color: colors.textSecondary,
      marginBottom: 3,
    },
    infoValue: {
      fontSize: 13,
      fontWeight: "900",
      color: colors.textPrimary,
    },
    detailText: {
      marginTop: 6,
      color: colors.textSecondary,
      fontWeight: "700",
      fontSize: 12,
    },

    actionGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
      marginTop: 14,
    },
    secondaryButton: {
      width: "48%",
      backgroundColor: isDark ? "#020617" : "#F8FAFC",
      borderWidth: 1,
      borderColor: colors.border,
      padding: 11,
      borderRadius: 13,
      alignItems: "center",
    },
    secondaryButtonText: {
      color: colors.accent,
      fontWeight: "900",
      fontSize: 13,
    },
    warningButton: {
      width: "48%",
      backgroundColor: "#F59E0B",
      padding: 11,
      borderRadius: 13,
      alignItems: "center",
    },
    warningButtonText: {
      color: "#FFFFFF",
      fontWeight: "900",
      fontSize: 13,
    },
    deleteButton: {
      width: "48%",
      backgroundColor: "#DC2626",
      padding: 11,
      borderRadius: 13,
      alignItems: "center",
    },
    deleteButtonText: {
      color: "#FFFFFF",
      fontWeight: "900",
      fontSize: 13,
    },
    startButton: {
  backgroundColor: "#059669",
},
  });
}