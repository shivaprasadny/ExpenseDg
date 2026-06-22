import React, { useEffect, useState,useCallback} from "react";
import {
  Alert,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";

import DateTimePicker from "@react-native-community/datetimepicker";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { RootStackParamList } from "../navigation/AppNavigator";
import { useAppTheme } from "../context/ThemeContext";
import {
  deleteAllRecurringRecords,
  deleteExpense,
  deleteFutureRecurringRecords,
  ExpenseListItem,
  getAllRecordsByPeriod,
  getDateRange,
  getExpensesByPeriod,
  PeriodFilter,
  toggleExpenseFavorite,
} from "../services/expenseService";

type Props = NativeStackScreenProps<RootStackParamList, "Expenses">;
type RecordFilterType = "ALL" | "EXPENSE" | "INCOME";

/**
 * ExpensesScreen
 *
 * Shows all records with:
 * - All / Expense / Income filter
 * - Day / Week / Month / Year filter
 * - Period navigation
 * - Summary card
 * - Tap card action menu
 * - Recurring delete options
 */
export default function ExpensesScreen({ navigation, route }: Props) {
  const { colors, isDark } = useAppTheme();
  const styles = createStyles(colors, isDark);

  const defaultType: RecordFilterType = route.params?.defaultType ?? "ALL";

  const [transactionType, setTransactionType] =
    useState<RecordFilterType>(defaultType);

  const [items, setItems] = useState<ExpenseListItem[]>([]);
  const [period, setPeriod] = useState<PeriodFilter>("MONTH");
  const [anchorDate, setAnchorDate] = useState(new Date());
  const [showPeriodPicker, setShowPeriodPicker] = useState(false);

  /**
   * Reload records when filter or date changes.
   */
  useEffect(() => {
    loadItems();
  }, [transactionType, period, anchorDate]);



  /**
 * Reload records whenever screen becomes active.
 * Fixes stale data after Add/Edit/Delete.
 */
useFocusEffect(
  useCallback(() => {
    loadItems();
  }, [transactionType, period, anchorDate])
);
  /**
   * Load records from SQLite.
   */
  async function loadItems() {
    const data =
      transactionType === "ALL"
        ? await getAllRecordsByPeriod(period, anchorDate)
        : await getExpensesByPeriod(period, anchorDate, transactionType);

    setItems(data);
  }

  /**
   * Confirm before deleting one record.
   */
  function confirmDelete(id: number) {
    Alert.alert("Delete Record", "Are you sure?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => handleDelete(id),
      },
    ]);
  }

  /**
   * Delete one record.
   */
  async function handleDelete(id: number) {
    await deleteExpense(id);
    await loadItems();
  }

  /**
   * Toggle favorite on/off.
   */
  async function handleToggleFavorite(item: ExpenseListItem) {
    const newValue = item.isFavorite === 1 ? 0 : 1;

    await toggleExpenseFavorite(item.id, newValue);
    await loadItems();
  }

  /**
   * Move selected period backward or forward.
   */
  function movePeriod(direction: "PREV" | "NEXT") {
    const newDate = new Date(anchorDate);
    const amount = direction === "NEXT" ? 1 : -1;

    if (period === "DAY") newDate.setDate(newDate.getDate() + amount);
    if (period === "WEEK") newDate.setDate(newDate.getDate() + amount * 7);
    if (period === "MONTH") newDate.setMonth(newDate.getMonth() + amount);
    if (period === "YEAR") newDate.setFullYear(newDate.getFullYear() + amount);

    setAnchorDate(newDate);
  }

  /**
   * Display readable selected period.
   */
  function getPeriodLabel() {
    if (period === "DAY") {
      return anchorDate.toLocaleDateString();
    }

    if (period === "WEEK") {
      const { startDate, endDate } = getDateRange(period, anchorDate);

      return `${new Date(startDate).toLocaleDateString()} - ${new Date(
        endDate
      ).toLocaleDateString()}`;
    }

    if (period === "MONTH") {
      return anchorDate.toLocaleString("default", {
        month: "long",
        year: "numeric",
      });
    }

    return String(anchorDate.getFullYear());
  }

  /**
   * Open action menu when user taps a record.
   */
  function openRecordActions(item: ExpenseListItem) {
    Alert.alert(item.title, "Choose an action", [
      {
        text: "Edit",
        onPress: () =>
          navigation.navigate("EditExpense", {
            expenseId: item.id,
          }),
      },
      {
        text: "Duplicate",
        onPress: () => handleDuplicate(item),
      },
      {
        text: item.isFavorite === 1 ? "Remove Favorite" : "Add Favorite",
        onPress: () => handleToggleFavorite(item),
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => openDeleteOptions(item),
      },
      {
        text: "Cancel",
        style: "cancel",
      },
    ]);
  }

  /**
   * Duplicate record into AddExpense screen.
   * AddExpenseScreen uses today's date for duplicated record.
   */
  function handleDuplicate(item: ExpenseListItem) {
    if (item.categoryId == null) {
      Alert.alert("Missing category", "This record has no category.");
      return;
    }

    navigation.navigate("AddExpense", {
      duplicateRecord: {
        title: item.title,
        amount: Number(item.amount),
        categoryId: Number(item.categoryId),
        paymentMethod: item.paymentMethod,
        accountId: item.accountId ?? null,
        note: item.note ?? "",
        type: item.type,
      },
    });
  }

  /**
   * Delete selected recurring record and all future records.
   */
  async function handleDeleteFutureRecurring(item: ExpenseListItem) {
    if (!item.recurringGroupId) return;

    await deleteFutureRecurringRecords(item.recurringGroupId, item.expenseDate);
    await loadItems();
  }

  /**
   * Delete all records in same recurring group.
   */
  async function handleDeleteAllRecurring(item: ExpenseListItem) {
    if (!item.recurringGroupId) return;

    await deleteAllRecurringRecords(item.recurringGroupId);
    await loadItems();
  }

  /**
   * Recurring records get extra delete options.
   */
  function openDeleteOptions(item: ExpenseListItem) {
    if (item.isRecurring === 1 && item.recurringGroupId) {
      Alert.alert("Delete Recurring Record", "What would you like to delete?", [
        {
          text: "This Record Only",
          onPress: () => confirmDelete(item.id),
        },
        {
          text: "This And Future Records",
          style: "destructive",
          onPress: () => handleDeleteFutureRecurring(item),
        },
        {
          text: "All Recurring Records",
          style: "destructive",
          onPress: () => handleDeleteAllRecurring(item),
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ]);

      return;
    }

    confirmDelete(item.id);
  }

  /**
   * Summary totals.
   */
  const totalIncome = items
    .filter((item) => item.type === "INCOME")
    .reduce((sum, item) => sum + Number(item.amount), 0);

  const totalExpense = items
    .filter((item) => item.type === "EXPENSE")
    .reduce((sum, item) => sum + Number(item.amount), 0);

  const netTotal = totalIncome - totalExpense;

  const summaryTitle =
    transactionType === "ALL"
      ? "Net Balance"
      : transactionType === "INCOME"
      ? "Total Income"
      : "Total Expenses";

  const summaryAmount =
    transactionType === "ALL"
      ? netTotal
      : transactionType === "INCOME"
      ? totalIncome
      : totalExpense;

  return (
    <View style={styles.screen}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Records</Text>
        <Text style={styles.headerSubtitle}>
          Tap any record to edit, duplicate, favorite, or delete
        </Text>
      </View>

      {/* ALL / EXPENSE / INCOME */}
      <View style={styles.segmentCard}>
        {(["ALL", "EXPENSE", "INCOME"] as RecordFilterType[]).map((item) => (
          <TouchableOpacity
            key={item}
            activeOpacity={0.85}
            style={[
              styles.segmentButton,
              transactionType === item && styles.segmentButtonSelected,
            ]}
            onPress={() => setTransactionType(item)}
          >
            <Text
              style={[
                styles.segmentText,
                transactionType === item && styles.segmentTextSelected,
              ]}
            >
              {item === "ALL"
                ? "All"
                : item === "EXPENSE"
                ? "Expense"
                : "Income"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* DAY / WEEK / MONTH / YEAR */}
      <View style={styles.filterRow}>
        {(["DAY", "WEEK", "MONTH", "YEAR"] as PeriodFilter[]).map((item) => (
          <TouchableOpacity
            key={item}
            activeOpacity={0.85}
            style={[
              styles.filterChip,
              period === item && styles.filterChipSelected,
            ]}
            onPress={() => {
              setPeriod(item);
              setAnchorDate(new Date());
            }}
          >
            <Text
              style={[
                styles.filterText,
                period === item && styles.filterTextSelected,
              ]}
            >
              {item}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* PERIOD NAVIGATION */}
      <View style={styles.periodNav}>
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.navButton}
          onPress={() => movePeriod("PREV")}
        >
          <Text style={styles.navButtonText}>‹</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => setShowPeriodPicker(true)}
        >
          <Text style={styles.periodLabel}>{getPeriodLabel()} ▼</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.navButton}
          onPress={() => movePeriod("NEXT")}
        >
          <Text style={styles.navButtonText}>›</Text>
        </TouchableOpacity>
      </View>

      {/* DATE PICKER */}
      {showPeriodPicker && (
        <>
          <DateTimePicker
            value={anchorDate}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={(event, selectedDate) => {
              if (Platform.OS === "android") {
                setShowPeriodPicker(false);
              }

              if (selectedDate) {
                setAnchorDate(selectedDate);
              }
            }}
          />

          {Platform.OS === "ios" && (
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.doneButton}
              onPress={() => setShowPeriodPicker(false)}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          )}
        </>
      )}

      {/* SUMMARY */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>{summaryTitle}</Text>

        <Text
          style={[
            styles.summaryValue,
            transactionType === "EXPENSE" && styles.expenseText,
            transactionType === "INCOME" && styles.incomeText,
            transactionType === "ALL" && netTotal < 0 && styles.expenseText,
          ]}
        >
          ${summaryAmount.toFixed(2)}
        </Text>

        <Text style={styles.summaryMeta}>
          {items.length} record{items.length === 1 ? "" : "s"} in this period
        </Text>
      </View>

      {/* RECORD LIST */}
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No records for this period.</Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.card}
            onPress={() => openRecordActions(item)}
          >
            <View
              style={[
                styles.typeBar,
                item.type === "INCOME" ? styles.incomeBar : styles.expenseBar,
              ]}
            />

            <View style={styles.leftSide}>
              <View style={styles.titleRow}>
                <Text style={styles.categoryCircle}>{item.categoryIcon}</Text>

                <View style={styles.titleBox}>
                  <Text style={styles.title} numberOfLines={1}>
                    {item.isFavorite === 1 ? "⭐ " : ""}
                    {item.isRecurring === 1 ? "🔁 " : ""}
                    {item.title}
                  </Text>

                  <Text style={styles.meta} numberOfLines={1}>
                    {item.categoryName} • {item.paymentMethod}
                    {item.accountName
                      ? ` • ${item.accountName}${
                          item.accountLastFour
                            ? ` •••• ${item.accountLastFour}`
                            : ""
                        }`
                      : ""}
                  </Text>
                </View>
              </View>

              <Text style={styles.date}>
                {new Date(item.expenseDate).toLocaleDateString()}
              </Text>

              {!!item.note && (
                <Text style={styles.note} numberOfLines={2}>
                  {item.note}
                </Text>
              )}
            </View>

            <View style={styles.rightSide}>
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

              <Text style={styles.tapHint}>Tap</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

/**
 * Theme-aware styles.
 */
function createStyles(colors: any, isDark: boolean) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },

    header: {
      paddingHorizontal: 20,
      paddingTop: 22,
      paddingBottom: 12,
    },
    headerTitle: {
      fontSize: 30,
      fontWeight: "900",
      color: colors.textPrimary,
    },
    headerSubtitle: {
      marginTop: 4,
      fontSize: 14,
      fontWeight: "700",
      color: colors.textSecondary,
    },

    segmentCard: {
      marginHorizontal: 20,
      backgroundColor: colors.card,
      borderRadius: 18,
      padding: 6,
      flexDirection: "row",
      borderWidth: 1,
      borderColor: colors.border,
    },
    segmentButton: {
      flex: 1,
      paddingVertical: 11,
      borderRadius: 14,
      alignItems: "center",
    },
    segmentButtonSelected: {
      backgroundColor: colors.accent,
    },
    segmentText: {
      fontSize: 13,
      fontWeight: "900",
      color: colors.textSecondary,
    },
    segmentTextSelected: {
      color: "#FFFFFF",
    },

    filterRow: {
      flexDirection: "row",
      gap: 8,
      paddingHorizontal: 20,
      paddingTop: 12,
    },
    filterChip: {
      flex: 1,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingVertical: 10,
      alignItems: "center",
    },
    filterChipSelected: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    filterText: {
      fontWeight: "900",
      color: colors.textSecondary,
      fontSize: 12,
    },
    filterTextSelected: {
      color: "#FFFFFF",
    },

    periodNav: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      marginTop: 12,
      marginBottom: 12,
    },
    navButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    navButtonText: {
      fontSize: 28,
      fontWeight: "900",
      color: colors.accent,
    },
    periodLabel: {
      fontSize: 16,
      fontWeight: "900",
      color: colors.textPrimary,
    },

    doneButton: {
      backgroundColor: colors.accent,
      padding: 12,
      borderRadius: 12,
      alignItems: "center",
      marginHorizontal: 20,
      marginBottom: 12,
    },
    doneButtonText: {
      color: "#FFFFFF",
      fontWeight: "900",
    },

    summaryCard: {
      marginHorizontal: 20,
      backgroundColor: isDark ? "#020617" : "#071826",
      borderRadius: 24,
      padding: 20,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: isDark ? "#334155" : "#123344",
    },
    summaryLabel: {
      color: "#A7F3D0",
      fontWeight: "900",
      fontSize: 14,
    },
    summaryValue: {
      color: "#FFFFFF",
      fontSize: 34,
      fontWeight: "900",
      marginTop: 8,
    },
    summaryMeta: {
      marginTop: 6,
      color: "#CBD5E1",
      fontSize: 13,
      fontWeight: "700",
    },

    listContent: {
      padding: 20,
      paddingBottom: 120,
    },
    card: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 20,
      padding: 16,
      marginBottom: 12,
      flexDirection: "row",
      gap: 12,
      overflow: "hidden",
    },
    typeBar: {
      width: 5,
      borderRadius: 999,
    },
    incomeBar: {
      backgroundColor: "#10B981",
    },
    expenseBar: {
      backgroundColor: "#EF4444",
    },

    leftSide: {
      flex: 1,
    },
    rightSide: {
      alignItems: "flex-end",
      justifyContent: "space-between",
    },
    titleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    categoryCircle: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: isDark ? "#020617" : "#EEF6F2",
      textAlign: "center",
      textAlignVertical: "center",
      fontSize: 22,
    },
    titleBox: {
      flex: 1,
    },
    title: {
      fontSize: 17,
      fontWeight: "900",
      color: colors.textPrimary,
    },
    meta: {
      marginTop: 4,
      fontSize: 13,
      color: colors.textSecondary,
      fontWeight: "700",
    },
    date: {
      marginTop: 10,
      fontSize: 13,
      color: colors.textSecondary,
      fontWeight: "700",
    },
    note: {
      marginTop: 8,
      fontSize: 13,
      color: colors.textPrimary,
    },
    amount: {
      fontSize: 17,
      fontWeight: "900",
    },
    tapHint: {
      marginTop: 12,
      fontSize: 11,
      fontWeight: "800",
      color: colors.textSecondary,
    },

    incomeText: {
      color: "#059669",
    },
    expenseText: {
      color: "#DC2626",
    },

    emptyText: {
      textAlign: "center",
      marginTop: 60,
      color: colors.textSecondary,
      fontWeight: "700",
    },
  });
}
