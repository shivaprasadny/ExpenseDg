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
  getExpenseStreakStats,
  getTotalByTypeAndPeriod,
  PeriodFilter,
} from "../services/expenseService";
import { getUserProfile } from "../services/profileService";
import { getSmartInsights } from "../services/insightService";
import {
  getFinancialJourney,
  JourneyMilestone,
} from "../services/journeyService";
import { useAppTheme } from "../context/ThemeContext";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

/**
 * HomeScreen
 *
 * Main dashboard screen.
 * Shows:
 * - Greeting
 * - Period filter
 * - Net balance
 * - Income and expense cards
 * - Expense streak
 * - Smart insights
 * - Financial journey
 * - Quick actions
 */
export default function HomeScreen({ navigation }: Props) {
  const { colors, isDark } = useAppTheme();
  const styles = createStyles(colors, isDark);

  const [period, setPeriod] = useState<PeriodFilter>("MONTH");
  const [anchorDate, setAnchorDate] = useState(new Date());
  const [showPeriodPicker, setShowPeriodPicker] = useState(false);

  const [userName, setUserName] = useState("");
  const [currencySymbol, setCurrencySymbol] = useState("$");

  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [incomeCount, setIncomeCount] = useState(0);
  const [expenseCount, setExpenseCount] = useState(0);

  const [currentStreak, setCurrentStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);

  const [insights, setInsights] = useState<string[]>([]);
  const [journey, setJourney] = useState<JourneyMilestone[]>([]);

  /**
   * Reload dashboard data whenever:
   * - screen comes into focus
   * - period changes
   * - selected date changes
   */
  useFocusEffect(
    useCallback(() => {
      loadHomeData();
    }, [period, anchorDate])
  );

  /**
   * Load all dashboard values from SQLite/services.
   */
  async function loadHomeData() {
    const profile = await getUserProfile();

    const income = await getTotalByTypeAndPeriod("INCOME", period, anchorDate);
    const expense = await getTotalByTypeAndPeriod(
      "EXPENSE",
      period,
      anchorDate
    );

    const incCount = await getCountByTypeAndPeriod(
      "INCOME",
      period,
      anchorDate
    );

    const expCount = await getCountByTypeAndPeriod(
      "EXPENSE",
      period,
      anchorDate
    );

    const streakStats = await getExpenseStreakStats();
    const smartInsights = await getSmartInsights();
    const journeyData = await getFinancialJourney();

    setUserName(profile.userName);
    setCurrencySymbol(profile.currencySymbol || "$");

    setTotalIncome(income);
    setTotalExpense(expense);
    setIncomeCount(incCount);
    setExpenseCount(expCount);

    setCurrentStreak(streakStats.currentStreak);
    setBestStreak(streakStats.bestStreak);

    setInsights(smartInsights);
    setJourney(journeyData);
  }

  /**
   * Move selected period backward or forward.
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
   * Human-readable selected period label.
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
   * Greeting based on current time.
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
      {/* ===== HEADER ===== */}
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

        <View style={styles.headerActions}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.addTopButton}
            onPress={() => navigation.navigate("AddExpense")}
          >
            <Text style={styles.addTopButtonText}>＋</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.menuButton}
            onPress={() => navigation.navigate("Settings")}
          >
            <Text style={styles.menuText}>☰</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ===== PERIOD FILTER ===== */}
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

      {/* ===== PERIOD NAVIGATION ===== */}
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

      {/* ===== DATE PICKER ===== */}
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

      {/* ===== NET BALANCE CARD ===== */}
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

      {/* ===== INCOME / EXPENSE CARDS ===== */}
      <View style={styles.moneyRow}>
        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.moneyCard, styles.incomeCard]}
          onPress={() =>
            navigation.navigate("Expenses", {
              defaultType: "INCOME",
            })
          }
        >
          <Text style={styles.moneyIcon}>↗</Text>
          <Text style={styles.moneyLabel}>Income</Text>

          <Text style={styles.incomeAmount}>
            {currencySymbol}
            {totalIncome.toFixed(2)}
          </Text>

          <Text style={styles.recordText}>
            {incomeCount} records
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.moneyCard, styles.expenseCard]}
          onPress={() =>
            navigation.navigate("Expenses", {
              defaultType: "EXPENSE",
            })
          }
        >
          <Text style={styles.moneyIcon}>↘</Text>
          <Text style={styles.moneyLabel}>Expenses</Text>

          <Text style={styles.expenseAmount}>
            {currencySymbol}
            {totalExpense.toFixed(2)}
          </Text>

          <Text style={styles.recordText}>
            {expenseCount} records
          </Text>
        </TouchableOpacity>
      </View>

      {/* ===== EXPENSE STREAK ===== */}
      <View style={styles.streakCard}>
        <Text style={styles.streakLabel}>Expense Streak</Text>

        <View style={styles.streakRow}>
          <View>
            <Text style={styles.streakText}>
              🔥 {currentStreak} day{currentStreak === 1 ? "" : "s"}
            </Text>
            <Text style={styles.streakSubText}>Current streak</Text>
          </View>

          <View>
            <Text style={styles.bestStreakText}>
              🏆 {bestStreak} day{bestStreak === 1 ? "" : "s"}
            </Text>
            <Text style={styles.streakSubText}>Best streak</Text>
          </View>
        </View>
      </View>

      {/* ===== SMART INSIGHTS ===== */}
      <View style={styles.insightCard}>
        <Text style={styles.insightTitle}>💡 Smart Insights</Text>

        {insights.length === 0 ? (
          <Text style={styles.insightText}>
            Add more records to unlock insights.
          </Text>
        ) : (
          insights.map((item, index) => (
            <Text key={index} style={styles.insightText}>
              • {item}
            </Text>
          ))
        )}
      </View>

      {/* ===== QUOTE ===== */}
      <View style={styles.quoteCard}>
        <Text style={styles.quoteText}>
          “Track today. Understand tomorrow. Control your money.”
        </Text>
      </View>

      {/* ===== FINANCIAL JOURNEY ===== */}
      <View style={styles.journeyCard}>
        <Text style={styles.journeyTitle}>🏆 Financial Journey</Text>

        {journey.slice(0, 3).map((item) => (
          <View key={item.title} style={styles.journeyRow}>
            <Text style={styles.journeyIcon}>{item.icon}</Text>

            <View style={styles.journeyTextBox}>
              <Text style={styles.journeyItemTitle}>{item.title}</Text>
              <Text style={styles.journeyDescription}>
                {item.description}
              </Text>
            </View>

            <Text style={styles.journeyStatus}>
              {item.completed ? "✅" : "🔒"}
            </Text>
          </View>
        ))}
      </View>

      {/* ===== QUICK ACTIONS ===== */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>

      <View style={styles.actionsGrid}>
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.actionCard}
          onPress={() => navigation.navigate("AddExpense")}
        >
          <Text style={styles.actionIcon}>＋</Text>
          <Text style={styles.actionText}>Add Record</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.actionCard}
          onPress={() => navigation.navigate("Expenses")}
        >
          <Text style={styles.actionIcon}>▣</Text>
          <Text style={styles.actionText}>Records</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.actionCard}
          onPress={() => navigation.navigate("Analytics")}
        >
          <Text style={styles.actionIcon}>◒</Text>
          <Text style={styles.actionText}>Analytics</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
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

/**
 * Theme-aware styles.
 * Screens should use colors from ThemeContext instead of hardcoded white/black.
 */
function createStyles(colors: any, isDark: boolean) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
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
      color: colors.textPrimary,
    },
    helloText: {
      marginTop: 4,
      fontSize: 16,
      color: colors.accent,
      fontWeight: "900",
    },
    headerSubtitle: {
      marginTop: 4,
      fontSize: 14,
      fontWeight: "700",
      color: colors.textSecondary,
    },
    headerActions: {
      flexDirection: "row",
      gap: 10,
    },
    addTopButton: {
      width: 46,
      height: 46,
      borderRadius: 23,
      backgroundColor: colors.accent,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: colors.accent,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.25,
      shadowRadius: 12,
      elevation: 6,
    },
    addTopButtonText: {
      color: "#FFFFFF",
      fontSize: 28,
      fontWeight: "900",
      marginTop: -2,
    },
    menuButton: {
      width: 46,
      height: 46,
      borderRadius: 23,
      backgroundColor: colors.card,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    menuText: {
      fontSize: 24,
      fontWeight: "900",
      color: colors.textPrimary,
    },

    filterRow: {
      flexDirection: "row",
      gap: 8,
      marginBottom: 14,
    },
    filterChip: {
      flex: 1,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 18,
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
      marginBottom: 18,
    },
    navButton: {
      width: 42,
      height: 42,
      borderRadius: 21,
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
      marginBottom: 16,
    },
    doneButtonText: {
      color: "#FFFFFF",
      fontWeight: "900",
    },

    balanceCard: {
      backgroundColor: isDark ? "#020617" : "#071826",
      borderRadius: 30,
      padding: 24,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: isDark ? "#334155" : "#123344",
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
      backgroundColor: isDark ? "#064E3B" : "#0F3A36",
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
      backgroundColor: isDark ? "#1E293B" : "#263B4A",
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
      backgroundColor: isDark ? "#052E22" : "#ECFDF5",
      borderColor: isDark ? "#065F46" : "#A7F3D0",
    },
    expenseCard: {
      backgroundColor: isDark ? "#450A0A" : "#FEF2F2",
      borderColor: isDark ? "#7F1D1D" : "#FECACA",
    },
    moneyIcon: {
      fontSize: 28,
      marginBottom: 8,
      color: colors.textPrimary,
    },
    moneyLabel: {
      color: colors.textSecondary,
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
      color: colors.textSecondary,
      fontSize: 12,
      fontWeight: "800",
    },

    streakCard: {
      backgroundColor: isDark ? "#431407" : "#FFF7ED",
      borderWidth: 1,
      borderColor: isDark ? "#9A3412" : "#FED7AA",
      borderRadius: 22,
      padding: 18,
      marginBottom: 16,
    },
    streakLabel: {
      fontSize: 13,
      fontWeight: "900",
      color: isDark ? "#FDBA74" : "#9A3412",
    },
    streakRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 12,
      marginTop: 8,
    },
    streakText: {
      marginTop: 6,
      fontSize: 24,
      fontWeight: "900",
      color: isDark ? "#FB923C" : "#EA580C",
    },
    bestStreakText: {
      fontSize: 20,
      fontWeight: "900",
      color: isDark ? "#FCD34D" : "#92400E",
    },
    streakSubText: {
      marginTop: 6,
      fontSize: 13,
      fontWeight: "700",
      color: isDark ? "#FED7AA" : "#C2410C",
    },

    insightCard: {
      backgroundColor: isDark ? "#172554" : "#EFF6FF",
      borderWidth: 1,
      borderColor: isDark ? "#1D4ED8" : "#BFDBFE",
      borderRadius: 22,
      padding: 18,
      marginBottom: 16,
    },
    insightTitle: {
      fontSize: 16,
      fontWeight: "900",
      color: isDark ? "#BFDBFE" : "#1E3A8A",
      marginBottom: 10,
    },
    insightText: {
      fontSize: 14,
      fontWeight: "700",
      color: isDark ? "#DBEAFE" : "#1E40AF",
      lineHeight: 22,
      marginBottom: 6,
    },

    quoteCard: {
      backgroundColor: isDark ? "#0F172A" : "#E0F2FE",
      borderRadius: 20,
      padding: 16,
      marginBottom: 22,
      borderWidth: 1,
      borderColor: isDark ? "#334155" : "#BAE6FD",
    },
    quoteText: {
      color: isDark ? "#BAE6FD" : "#075985",
      fontSize: 14,
      fontWeight: "900",
      lineHeight: 21,
    },

    journeyCard: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 22,
      padding: 18,
      marginBottom: 16,
    },
    journeyTitle: {
      fontSize: 16,
      fontWeight: "900",
      color: colors.textPrimary,
      marginBottom: 12,
    },
    journeyRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 12,
    },
    journeyIcon: {
      fontSize: 24,
      marginRight: 12,
    },
    journeyTextBox: {
      flex: 1,
    },
    journeyItemTitle: {
      fontSize: 14,
      fontWeight: "900",
      color: colors.textPrimary,
    },
    journeyDescription: {
      marginTop: 2,
      fontSize: 12,
      fontWeight: "700",
      color: colors.textSecondary,
    },
    journeyStatus: {
      fontSize: 18,
    },

    sectionTitle: {
      fontSize: 20,
      fontWeight: "900",
      color: colors.textPrimary,
      marginBottom: 12,
    },
    actionsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
    },
    actionCard: {
      width: "48%",
      backgroundColor: colors.card,
      borderRadius: 22,
      padding: 18,
      borderWidth: 1,
      borderColor: colors.border,
      minHeight: 108,
      justifyContent: "center",
    },
    actionIcon: {
      fontSize: 30,
      marginBottom: 10,
      color: colors.accent,
    },
    actionText: {
      fontSize: 15,
      fontWeight: "900",
      color: colors.textPrimary,
    },
  });
}