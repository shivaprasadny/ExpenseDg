import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { COLORS } from "../constants/colors";
import {
  deleteExpense,
  ExpenseListItem,
  getDateRange,
  getExpensesByPeriod,
  PeriodFilter,
} from "../services/expenseService";
import { RootStackParamList } from "../navigation/AppNavigator";
import { TransactionType } from "../types";

type Props = NativeStackScreenProps<RootStackParamList, "Expenses">;

/**
 * Expenses screen.
 * Shows either expense or income records with date filters.
 */
export default function ExpensesScreen({ navigation }: Props) {
  const [items, setItems] = useState<ExpenseListItem[]>([]);
  const [transactionType, setTransactionType] =
    useState<TransactionType>("EXPENSE");

  const [period, setPeriod] = useState<PeriodFilter>("MONTH");
  const [anchorDate, setAnchorDate] = useState(new Date());
  const [showPeriodPicker, setShowPeriodPicker] = useState(false);

  useEffect(() => {
    loadItems();
  }, [transactionType, period, anchorDate]);

  /**
   * Load records for selected type and selected date period.
   */
  async function loadItems() {
    const data = await getExpensesByPeriod(
      period,
      anchorDate,
      transactionType
    );

    setItems(data);
  }

  /**
   * Delete confirmation.
   */
  function confirmDelete(id: number) {
    Alert.alert("Delete", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => handleDelete(id),
      },
    ]);
  }

  /**
   * Delete record and reload.
   */
  async function handleDelete(id: number) {
    await deleteExpense(id);
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
   * Text label for selected period.
   */
  function getPeriodLabel() {
    if (period === "DAY") return anchorDate.toLocaleDateString();

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

  const total = items.reduce((sum, item) => sum + Number(item.amount), 0);

  return (
    <View style={styles.screen}>
      <View style={styles.typeRow}>
        <TouchableOpacity
          style={[
            styles.typeChip,
            transactionType === "EXPENSE" && styles.typeChipSelected,
          ]}
          onPress={() => setTransactionType("EXPENSE")}
        >
          <Text
            style={[
              styles.typeText,
              transactionType === "EXPENSE" && styles.typeTextSelected,
            ]}
          >
            Expense
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.typeChip,
            transactionType === "INCOME" && styles.typeChipSelected,
          ]}
          onPress={() => setTransactionType("INCOME")}
        >
          <Text
            style={[
              styles.typeText,
              transactionType === "INCOME" && styles.typeTextSelected,
            ]}
          >
            Income
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filterRow}>
        {(["DAY", "WEEK", "MONTH", "YEAR"] as PeriodFilter[]).map((item) => (
          <TouchableOpacity
            key={item}
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

      <View style={styles.periodNav}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => movePeriod("PREV")}
        >
          <Text style={styles.navButtonText}>‹</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setShowPeriodPicker(true)}>
          <Text style={styles.periodLabel}>{getPeriodLabel()} ▼</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navButton}
          onPress={() => movePeriod("NEXT")}
        >
          <Text style={styles.navButtonText}>›</Text>
        </TouchableOpacity>
      </View>

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
              style={styles.doneButton}
              onPress={() => setShowPeriodPicker(false)}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          )}
        </>
      )}

      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>
          Total {transactionType === "EXPENSE" ? "Spent" : "Income"}
        </Text>
        <Text style={styles.summaryValue}>${total.toFixed(2)}</Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No records for this period.</Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() =>
              navigation.navigate("EditExpense", {
                expenseId: item.id,
              })
            }
          >
            <View style={styles.leftSide}>
              <Text style={styles.title}>{item.title}</Text>

              <Text style={styles.meta}>
                {item.categoryIcon} {item.categoryName} • {item.paymentMethod}
              </Text>

              <Text style={styles.date}>
                {new Date(item.expenseDate).toLocaleDateString()}
              </Text>

              {!!item.note && <Text style={styles.note}>{item.note}</Text>}
            </View>

            <View style={styles.rightSide}>
              <Text
                style={[
                  styles.amount,
                  item.type === "INCOME" && styles.incomeAmount,
                ]}
              >
                {item.type === "INCOME" ? "+" : "-"}$
                {Number(item.amount).toFixed(2)}
              </Text>

              <TouchableOpacity onPress={() => confirmDelete(item.id)}>
                <Text style={styles.deleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  typeRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  typeChip: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
  },
  typeChipSelected: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  typeText: {
    color: COLORS.textPrimary,
    fontWeight: "700",
  },
  typeTextSelected: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  filterChip: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
  filterChipSelected: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  filterText: {
    fontWeight: "700",
    color: COLORS.textPrimary,
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
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  navButtonText: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.primary,
  },
  periodLabel: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.primary,
  },
  doneButton: {
    backgroundColor: COLORS.accent,
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    marginHorizontal: 20,
    marginBottom: 12,
  },
  doneButtonText: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
  summaryCard: {
    marginHorizontal: 20,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
  },
  summaryLabel: {
    color: COLORS.textSecondary,
    fontWeight: "700",
  },
  summaryValue: {
    color: COLORS.primary,
    fontSize: 26,
    fontWeight: "900",
    marginTop: 4,
  },
  listContent: {
    padding: 20,
    paddingBottom: 120,
  },
  card: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  leftSide: {
    flex: 1,
  },
  rightSide: {
    alignItems: "flex-end",
  },
  title: {
    fontSize: 17,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },
  meta: {
    marginTop: 6,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  date: {
    marginTop: 4,
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  note: {
    marginTop: 8,
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  amount: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.danger,
  },
  incomeAmount: {
    color: COLORS.success,
  },
  deleteText: {
    marginTop: 12,
    color: COLORS.danger,
    fontWeight: "700",
  },
  emptyText: {
    textAlign: "center",
    marginTop: 60,
    color: COLORS.textSecondary,
  },
});