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

import {
  deleteExpense,
  ExpenseListItem,
  getAllRecordsByPeriod,
  getDateRange,
  getExpensesByPeriod,
  PeriodFilter,
} from "../services/expenseService";
import { RootStackParamList } from "../navigation/AppNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "Expenses">;
type RecordFilterType = "ALL" | "EXPENSE" | "INCOME";

/**
 * Records screen.
 * Shows all, expense, or income records with date filters.
 */
export default function ExpensesScreen({ navigation, route }: Props) {
  const defaultType: RecordFilterType = route.params?.defaultType ?? "ALL";

  const [transactionType, setTransactionType] =
    useState<RecordFilterType>(defaultType);

  const [items, setItems] = useState<ExpenseListItem[]>([]);
  const [period, setPeriod] = useState<PeriodFilter>("MONTH");
  const [anchorDate, setAnchorDate] = useState(new Date());
  const [showPeriodPicker, setShowPeriodPicker] = useState(false);

  useEffect(() => {
    loadItems();
  }, [transactionType, period, anchorDate]);

  /**
   * Load records by selected type and selected period.
   */
  async function loadItems() {
    const data =
      transactionType === "ALL"
        ? await getAllRecordsByPeriod(period, anchorDate)
        : await getExpensesByPeriod(period, anchorDate, transactionType);

    setItems(data);
  }

  /**
   * Ask before deleting a record.
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
   * Delete record and refresh list.
   */
  async function handleDelete(id: number) {
    await deleteExpense(id);
    await loadItems();
  }

  /**
   * Move date period backward or forward.
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
   * Display readable date label.
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
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Records</Text>
        <Text style={styles.headerSubtitle}>
          View your income and expense activity
        </Text>
      </View>

      {/* All / Expense / Income filter */}
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

      {/* Date filter */}
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

      {/* Period navigation */}
      <View style={styles.periodNav}>
        <TouchableOpacity
          style={styles.navButton}
          activeOpacity={0.85}
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
          style={styles.navButton}
          activeOpacity={0.85}
          onPress={() => movePeriod("NEXT")}
        >
          <Text style={styles.navButtonText}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Date picker */}
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

      {/* Summary card */}
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

      {/* Record list */}
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
            onPress={() =>
              navigation.navigate("EditExpense", {
                expenseId: item.id,
              })
            }
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
                  <Text style={styles.title}>{item.title}</Text>
                  <Text style={styles.meta}>
                    {item.categoryName} • {item.paymentMethod}
                  </Text>
                </View>
              </View>

              <Text style={styles.date}>
                {new Date(item.expenseDate).toLocaleDateString()}
              </Text>

              {!!item.note && <Text style={styles.note}>{item.note}</Text>}
            </View>

            <View style={styles.rightSide}>
              <Text
                style={[
                  styles.amount,
                  item.type === "INCOME" ? styles.incomeText : styles.expenseText,
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
    backgroundColor: "#F4F8F6",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: "900",
    color: "#071826",
  },
  headerSubtitle: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: "700",
    color: "#64748B",
  },

  segmentCard: {
    marginHorizontal: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 6,
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#CFE2DA",
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 14,
    alignItems: "center",
  },
  segmentButtonSelected: {
    backgroundColor: "#0F766E",
  },
  segmentText: {
    fontSize: 13,
    fontWeight: "900",
    color: "#334155",
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
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CFE2DA",
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
  filterChipSelected: {
    backgroundColor: "#0F766E",
    borderColor: "#0F766E",
  },
  filterText: {
    fontWeight: "900",
    color: "#334155",
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
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CFE2DA",
    alignItems: "center",
    justifyContent: "center",
  },
  navButtonText: {
    fontSize: 28,
    fontWeight: "900",
    color: "#0F766E",
  },
  periodLabel: {
    fontSize: 16,
    fontWeight: "900",
    color: "#071826",
  },

  doneButton: {
    backgroundColor: "#0F766E",
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
    backgroundColor: "#071826",
    borderRadius: 24,
    padding: 20,
    marginBottom: 12,
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
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDE7E2",
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
    backgroundColor: "#EEF6F2",
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
    color: "#071826",
  },
  meta: {
    marginTop: 4,
    fontSize: 13,
    color: "#64748B",
    fontWeight: "700",
  },
  date: {
    marginTop: 10,
    fontSize: 13,
    color: "#64748B",
    fontWeight: "700",
  },
  note: {
    marginTop: 8,
    fontSize: 13,
    color: "#334155",
  },
  amount: {
    fontSize: 17,
    fontWeight: "900",
  },
  incomeText: {
    color: "#059669",
  },
  expenseText: {
    color: "#DC2626",
  },
  deleteText: {
    marginTop: 12,
    color: "#DC2626",
    fontWeight: "800",
    fontSize: 12,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 60,
    color: "#64748B",
    fontWeight: "700",
  },
});