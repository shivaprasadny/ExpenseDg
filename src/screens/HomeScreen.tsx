import React, { useCallback, useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import SummaryCard from "../components/SummaryCard";
import { COLORS } from "../constants/colors";
import { RootStackParamList } from "../navigation/AppNavigator";
import {
  getCountByTypeAndPeriod,
  getDateRange,
  getTotalByTypeAndPeriod,
  PeriodFilter,
} from "../services/expenseService";


type Props = NativeStackScreenProps<RootStackParamList, "Home">;

/**
 * Home dashboard screen.
 * Shows income, expenses, balance and budget for selected period only.
 */
export default function HomeScreen({ navigation }: Props) {
  const [period, setPeriod] = useState<PeriodFilter>("MONTH");
  const [anchorDate, setAnchorDate] = useState(new Date());
  const [showPeriodPicker, setShowPeriodPicker] = useState(false);

  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);

  const [expenseCount, setExpenseCount] = useState(0);
  const [incomeCount, setIncomeCount] = useState(0);

  /**
   * Reload home data when screen is focused or filter changes.
   */
  useFocusEffect(
    useCallback(() => {
      loadHomeData();
    }, [period, anchorDate])
  );

  /**
   * Load income/expense totals for selected period.
   */
  async function loadHomeData() {
    const income = await getTotalByTypeAndPeriod("INCOME", period, anchorDate);
    const expense = await getTotalByTypeAndPeriod("EXPENSE", period, anchorDate);

    const expCount = await getCountByTypeAndPeriod(
      "EXPENSE",
      period,
      anchorDate
    );

    const incCount = await getCountByTypeAndPeriod("INCOME", period, anchorDate);



    setTotalIncome(income);
    setTotalExpense(expense);
    setExpenseCount(expCount);
    setIncomeCount(incCount);

  }

  /**
   * Move selected date backward/forward.
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
   * Display label for selected period.
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

  const balance = totalIncome - totalExpense;



  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>ExpenseDG</Text>

      <Text style={styles.subtitle}>
        Track income, expenses and balance
      </Text>

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

      <SummaryCard title="Income" value={`$${totalIncome.toFixed(2)}`} />

      <SummaryCard title="Expenses" value={`$${totalExpense.toFixed(2)}`} />

      <SummaryCard title="Balance" value={`$${balance.toFixed(2)}`} />

      {period === "MONTH" && (
        <>
         

        </>
      )}

      <Text style={styles.smallStats}>
        Expense records: {expenseCount} • Income records: {incomeCount}
      </Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("AddExpense")}
      >
        <Text style={styles.buttonText}>+ Add Income / Expense</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.outlineButton}
        onPress={() => navigation.navigate("Expenses")}
      >
        <Text style={styles.outlineButtonText}>View Records</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.outlineButton}
        onPress={() => navigation.navigate("Categories")}
      >
        <Text style={styles.outlineButtonText}>Manage Categories</Text>
      </TouchableOpacity>

     

      <TouchableOpacity
        style={styles.outlineButton}
        onPress={() => navigation.navigate("Analytics")}
      >
        <Text style={styles.outlineButtonText}>Analytics</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.outlineButton}
        onPress={() => navigation.navigate("Settings")}
      >
        <Text style={styles.outlineButtonText}>Settings / Backup</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 20,
    paddingBottom: 140,
  },
  title: {
    fontSize: 36,
    fontWeight: "900",
    color: COLORS.primary,
    textAlign: "center",
    marginTop: 30,
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 20,
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
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
    marginBottom: 18,
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
    marginBottom: 16,
  },
  doneButtonText: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
  warningText: {
    color: COLORS.danger,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 12,
  },
  smallStats: {
    textAlign: "center",
    color: COLORS.textSecondary,
    fontWeight: "700",
    marginBottom: 20,
  },
  button: {
    backgroundColor: COLORS.accent,
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 14,
  },
  buttonText: {
    color: COLORS.card,
    fontSize: 16,
    fontWeight: "800",
  },
  outlineButton: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 14,
  },
  outlineButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: "700",
  },
});