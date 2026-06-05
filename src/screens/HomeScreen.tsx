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

import { RootStackParamList } from "../navigation/AppNavigator";
import {
  getCountByTypeAndPeriod,
  getDateRange,
  getTotalByTypeAndPeriod,
  PeriodFilter,
} from "../services/expenseService";
import { getUserProfile } from "../services/profileService";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

/**
 * Modern Home dashboard.
 * Shows period-based income, expenses, balance, and quick actions.
 */
export default function HomeScreen({ navigation }: Props) {
  const [period, setPeriod] = useState<PeriodFilter>("MONTH");
  const [anchorDate, setAnchorDate] = useState(new Date());
  const [showPeriodPicker, setShowPeriodPicker] = useState(false);

  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [expenseCount, setExpenseCount] = useState(0);
  const [incomeCount, setIncomeCount] = useState(0);

  const [userName, setUserName] = useState("");
  const [currencySymbol, setCurrencySymbol] = useState("$");

  useFocusEffect(
    useCallback(() => {
      loadHomeData();
    }, [period, anchorDate])
  );

  /**
   * Load dashboard data for selected period.
   */
  async function loadHomeData() {
    const profile = await getUserProfile();

    const income = await getTotalByTypeAndPeriod("INCOME", period, anchorDate);
    const expense = await getTotalByTypeAndPeriod("EXPENSE", period, anchorDate);

    const incCount = await getCountByTypeAndPeriod("INCOME", period, anchorDate);
    const expCount = await getCountByTypeAndPeriod(
      "EXPENSE",
      period,
      anchorDate
    );

    setUserName(profile.userName);
    setCurrencySymbol(profile.currencySymbol || "$");

    setTotalIncome(income);
    setTotalExpense(expense);
    setIncomeCount(incCount);
    setExpenseCount(expCount);
  }

  /**
   * Move selected period back or forward.
   */
  function movePeriod(direction: "PREV" | "NEXT") {
    const nextDate = new Date(anchorDate);
    const amount = direction === "NEXT" ? 1 : -1;

    if (period === "DAY") nextDate.setDate(nextDate.getDate() + amount);
    if (period === "WEEK") nextDate.setDate(nextDate.getDate() + amount * 7);
    if (period === "MONTH") nextDate.setMonth(nextDate.getMonth() + amount);
    if (period === "YEAR") nextDate.setFullYear(nextDate.getFullYear() + amount);

    setAnchorDate(nextDate);
  }

  /**
   * Display readable selected period.
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

  /**
   * Dynamic greeting based on current time.
   */
  function getGreeting() {
    const hour = new Date().getHours();

    if (hour < 12) return "Good Morning ☀️";
    if (hour < 17) return "Good Afternoon 🌤️";
    return "Good Evening 🌙";
  }

  const balance = totalIncome - totalExpense;

  const savingsRate =
    totalIncome > 0 ? Math.max((balance / totalIncome) * 100, 0) : 0;

  const totalActivity = incomeCount + expenseCount;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerTextBox}>
          <Text style={styles.greeting}>{getGreeting()}</Text>

          <Text style={styles.helloText}>
            {userName ? `Hello ${userName} 👋` : "Welcome back 👋"}
          </Text>

          <Text style={styles.headerSubtitle}>
            Your smart money dashboard
          </Text>
        </View>

        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => navigation.navigate("Settings")}
        >
          <Text style={styles.menuText}>☰</Text>
        </TouchableOpacity>
      </View>

      {/* Period Filter */}
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

      {/* Date Navigation */}
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

      {/* Date Picker */}
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

      {/* Main Balance Card */}
      <View style={styles.balanceCard}>
        <View style={styles.balanceTopRow}>
          <Text style={styles.balanceLabel}>Net Balance</Text>
          <Text style={styles.activityBadge}>{totalActivity} records</Text>
        </View>

        <Text
          style={[
            styles.balanceAmount,
            balance < 0 && styles.negativeBalance,
          ]}
        >
          {currencySymbol}
          {balance.toFixed(2)}
        </Text>

        <Text style={styles.balanceSubText}>
          Income minus expenses for selected period
        </Text>

        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.min(savingsRate, 100)}%`,
              },
            ]}
          />
        </View>

        <Text style={styles.savingsText}>
          Savings rate: {savingsRate.toFixed(0)}%
        </Text>
      </View>

      {/* Income / Expense Cards */}
      <View style={styles.moneyRow}>
        <View style={[styles.moneyCard, styles.incomeCard]}>
          <Text style={styles.moneyIcon}>↗</Text>
          <Text style={styles.moneyLabel}>Income</Text>
          <Text style={styles.incomeAmount}>
            {currencySymbol}
            {totalIncome.toFixed(2)}
          </Text>
          <Text style={styles.recordText}>{incomeCount} records</Text>
        </View>

        <View style={[styles.moneyCard, styles.expenseCard]}>
          <Text style={styles.moneyIcon}>↘</Text>
          <Text style={styles.moneyLabel}>Expenses</Text>
          <Text style={styles.expenseAmount}>
            {currencySymbol}
            {totalExpense.toFixed(2)}
          </Text>
          <Text style={styles.recordText}>{expenseCount} records</Text>
        </View>
      </View>

      {/* Quote */}
      <View style={styles.quoteCard}>
        <Text style={styles.quoteText}>
          “Track today. Understand tomorrow. Control your money.”
        </Text>
      </View>

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>

      <View style={styles.actionsGrid}>
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate("AddExpense")}
        >
          <Text style={styles.actionIcon}>＋</Text>
          <Text style={styles.actionText}>Add Record</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate("Expenses")}
        >
          <Text style={styles.actionIcon}>▣</Text>
          <Text style={styles.actionText}>Records</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate("Analytics")}
        >
          <Text style={styles.actionIcon}>◒</Text>
          <Text style={styles.actionText}>Analytics</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate("Categories")}
        >
          <Text style={styles.actionIcon}>⌁</Text>
          <Text style={styles.actionText}>Categories</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#EEF6F2",
  },
  content: {
    padding: 20,
    paddingBottom: 140,
  },

  headerRow: {
    marginTop: 28,
    marginBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerTextBox: {
    flex: 1,
    paddingRight: 12,
  },
  greeting: {
    fontSize: 28,
    fontWeight: "900",
    color: "#071826",
  },
  helloText: {
    marginTop: 4,
    fontSize: 16,
    color: "#0F766E",
    fontWeight: "900",
  },
  headerSubtitle: {
    marginTop: 4,
    fontSize: 14,
    color: "#64748B",
    fontWeight: "700",
  },
  menuButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#CFE2DA",
  },
  menuText: {
    fontSize: 24,
    fontWeight: "900",
    color: "#071826",
  },

  filterRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
  },
  filterChip: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CFE2DA",
    borderRadius: 18,
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
    marginBottom: 18,
  },
  navButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
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
    marginBottom: 16,
  },
  doneButtonText: {
    color: "#FFFFFF",
    fontWeight: "900",
  },

  balanceCard: {
    backgroundColor: "#071826",
    borderRadius: 30,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#123344",
  },
  balanceTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  balanceLabel: {
    color: "#A7F3D0",
    fontSize: 14,
    fontWeight: "900",
  },
  activityBadge: {
    color: "#D1FAE5",
    backgroundColor: "#0F3A36",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: "900",
  },
  balanceAmount: {
    marginTop: 12,
    color: "#FFFFFF",
    fontSize: 44,
    fontWeight: "900",
  },
  negativeBalance: {
    color: "#FCA5A5",
  },
  balanceSubText: {
    marginTop: 6,
    color: "#CBD5E1",
    fontSize: 13,
    fontWeight: "700",
  },
  progressTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: "#263B4A",
    marginTop: 22,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#14B8A6",
  },
  savingsText: {
    marginTop: 10,
    color: "#E2E8F0",
    fontSize: 13,
    fontWeight: "800",
  },

  moneyRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  moneyCard: {
    flex: 1,
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
  },
  incomeCard: {
    backgroundColor: "#ECFDF5",
    borderColor: "#A7F3D0",
  },
  expenseCard: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
  },
  moneyIcon: {
    fontSize: 28,
    marginBottom: 8,
    color: "#071826",
  },
  moneyLabel: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "900",
  },
  incomeAmount: {
    marginTop: 6,
    color: "#059669",
    fontSize: 20,
    fontWeight: "900",
  },
  expenseAmount: {
    marginTop: 6,
    color: "#DC2626",
    fontSize: 20,
    fontWeight: "900",
  },
  recordText: {
    marginTop: 5,
    color: "#64748B",
    fontSize: 12,
    fontWeight: "800",
  },

  quoteCard: {
    backgroundColor: "#E0F2FE",
    borderRadius: 20,
    padding: 16,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: "#BAE6FD",
  },
  quoteText: {
    color: "#075985",
    fontSize: 14,
    fontWeight: "900",
    lineHeight: 21,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#071826",
    marginBottom: 12,
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  actionCard: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: "#CFE2DA",
    minHeight: 108,
    justifyContent: "center",
  },
  actionIcon: {
    fontSize: 30,
    marginBottom: 10,
    color: "#0F766E",
  },
  actionText: {
    fontSize: 15,
    fontWeight: "900",
    color: "#071826",
  },
});