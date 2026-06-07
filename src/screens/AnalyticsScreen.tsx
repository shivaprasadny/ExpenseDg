import React, { useEffect, useState } from "react";
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { BarChart, LineChart, PieChart } from "react-native-chart-kit";

import AppScreen from "../components/AppScreen";
import { useAppTheme } from "../context/ThemeContext";
import {
  getAllCategoryAnalyticsByPeriod,
  getCategoryAnalyticsByPeriod,
  getDateRange,
  getSixMonthTrend,
  getTotalByTypeAndPeriod,
  PeriodFilter,
} from "../services/expenseService";

type AnalyticsFilterType = "ALL" | "EXPENSE" | "INCOME";

interface CategoryAnalytics {
  name: string;
  icon: string;
  total: number;
  type?: "EXPENSE" | "INCOME";
}

interface TrendItem {
  label: string;
  income: number;
  expense: number;
  balance: number;
}

const screenWidth = Dimensions.get("window").width;
const CARD_WIDTH = screenWidth - 40;
const CHART_WIDTH = CARD_WIDTH - 36;
const CHART_PAGE_SIZE = CARD_WIDTH + 12;

/**
 * AnalyticsScreen
 *
 * Shows:
 * - All / Expense / Income analytics
 * - Date period filters
 * - Swipeable chart cards
 * - Visible page dots
 * - Detailed category breakdown
 */
export default function AnalyticsScreen() {
  const { colors, isDark } = useAppTheme();
  const styles = createStyles(colors, isDark);
  const chartConfig = createChartConfig(colors, isDark);

  const [transactionType, setTransactionType] =
    useState<AnalyticsFilterType>("ALL");

  const [categories, setCategories] = useState<CategoryAnalytics[]>([]);
  const [trend, setTrend] = useState<TrendItem[]>([]);

  const [period, setPeriod] = useState<PeriodFilter>("MONTH");
  const [anchorDate, setAnchorDate] = useState(new Date());
  const [showPeriodPicker, setShowPeriodPicker] = useState(false);

  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [currentChartPage, setCurrentChartPage] = useState(0);

  useEffect(() => {
    loadAnalytics();
  }, [transactionType, period, anchorDate]);

  /**
   * Load analytics values from SQLite.
   */
  async function loadAnalytics() {
    const income = await getTotalByTypeAndPeriod("INCOME", period, anchorDate);
    const expense = await getTotalByTypeAndPeriod("EXPENSE", period, anchorDate);

    setTotalIncome(Number(income) || 0);
    setTotalExpense(Number(expense) || 0);

    if (transactionType === "ALL") {
      const data = await getAllCategoryAnalyticsByPeriod(period, anchorDate);
      setCategories(data as CategoryAnalytics[]);
    } else {
      const data = await getCategoryAnalyticsByPeriod(
        period,
        anchorDate,
        transactionType
      );

      setCategories(data as CategoryAnalytics[]);
    }

    const trendData = await getSixMonthTrend(anchorDate);
    setTrend(trendData as TrendItem[]);
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
   * Readable period label.
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
   * Update chart page dots after swipe.
   */
  function handleChartScrollEnd(
    event: NativeSyntheticEvent<NativeScrollEvent>
  ) {
    const page = Math.round(
      event.nativeEvent.contentOffset.x / CHART_PAGE_SIZE
    );

    setCurrentChartPage(page);
  }

  const netBalance = totalIncome - totalExpense;

  const selectedTotal =
    transactionType === "ALL"
      ? netBalance
      : transactionType === "INCOME"
      ? totalIncome
      : totalExpense;

  const pieData = categories
    .slice(0, 6)
    .map((item, index) => ({
      name: `${item.icon} ${item.name}`,
      amount: Number(item.total) || 0,
      color: chartColors[index % chartColors.length],
      legendFontColor: colors.textPrimary,
      legendFontSize: 12,
    }))
    .filter((item) => item.amount > 0);

  const topCategories = categories
    .slice(0, 5)
    .map((item) => ({
      label: item.name.slice(0, 5),
      value: Number(item.total) || 0,
    }))
    .filter((item) => item.value > 0);

  const topCategoryLabels = topCategories.map((item) => item.label);
  const topCategoryValues = topCategories.map((item) => item.value);

  const trendLabels =
    trend.length > 0 ? trend.map((item) => item.label) : ["", "", "", "", "", ""];

  const incomeTrend = trend.map((item) => Number(item.income) || 0);
  const expenseTrend = trend.map((item) => Number(item.expense) || 0);

  const safeIncomeTrend = incomeTrend.some((value) => value > 0)
    ? incomeTrend
    : [0, 1, 0, 1, 0, 1];

  const safeExpenseTrend = expenseTrend.some((value) => value > 0)
    ? expenseTrend
    : [0, 1, 0, 1, 0, 1];

  const selectedTrendData =
    transactionType === "INCOME" ? safeIncomeTrend : safeExpenseTrend;

  const selectedTrendLabel =
    transactionType === "INCOME" ? "Income" : "Expenses";

  return (
    <AppScreen>
      <Text style={styles.title}>Analytics</Text>
      <Text style={styles.subtitle}>Understand where your money goes</Text>

      {/* MAIN FILTER */}
      <View style={styles.segmentCard}>
        {(["ALL", "EXPENSE", "INCOME"] as AnalyticsFilterType[]).map((item) => (
          <TouchableOpacity
            key={item}
            activeOpacity={0.85}
            style={[
              styles.segmentButton,
              transactionType === item && styles.segmentButtonSelected,
            ]}
            onPress={() => {
              setTransactionType(item);
              setCurrentChartPage(0);
            }}
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

      {/* PERIOD FILTER */}
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
              setCurrentChartPage(0);
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
              style={styles.doneButton}
              onPress={() => setShowPeriodPicker(false)}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          )}
        </>
      )}

      {/* CHARTS */}
      <View style={styles.chartOuterBox}>
        <ScrollView
          horizontal
          pagingEnabled
          snapToInterval={CHART_PAGE_SIZE}
          decelerationRate="fast"
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chartSliderContent}
          onMomentumScrollEnd={handleChartScrollEnd}
        >
          {/* PIE */}
          <View style={styles.analyticsCard}>
            <Text style={styles.cardTitle}>Category Breakdown</Text>

            {pieData.length === 0 ? (
              <Text style={styles.emptyChartText}>No chart data found.</Text>
            ) : (
              <PieChart
                data={pieData}
                width={CHART_WIDTH}
                height={220}
                chartConfig={chartConfig}
                accessor="amount"
                backgroundColor="transparent"
                paddingLeft="6"
                absolute
              />
            )}
          </View>

          {/* SUMMARY */}
          <View style={styles.analyticsCard}>
            <Text style={styles.cardLabel}>
              {transactionType === "ALL"
                ? "Net Balance"
                : transactionType === "INCOME"
                ? "Total Income"
                : "Total Expenses"}
            </Text>

            <Text
              style={[
                styles.mainAmount,
                transactionType === "EXPENSE" && styles.expenseText,
                transactionType === "INCOME" && styles.incomeText,
                transactionType === "ALL" &&
                  netBalance < 0 &&
                  styles.expenseText,
              ]}
            >
              ${selectedTotal.toFixed(2)}
            </Text>

            <View style={styles.miniRow}>
              <View style={styles.miniBox}>
                <Text style={styles.miniLabel}>Income</Text>
                <Text style={styles.incomeText}>${totalIncome.toFixed(2)}</Text>
              </View>

              <View style={styles.miniBox}>
                <Text style={styles.miniLabel}>Expense</Text>
                <Text style={styles.expenseText}>
                  ${totalExpense.toFixed(2)}
                </Text>
              </View>
            </View>

            <Text style={styles.swipeHint}>Swipe for more analytics →</Text>
          </View>

          {/* BAR */}
          <View style={styles.analyticsCard}>
            <Text style={styles.cardTitle}>Top Categories</Text>

            {topCategoryValues.length === 0 ? (
              <Text style={styles.emptyChartText}>No category data found.</Text>
            ) : (
              <BarChart
                data={{
                  labels: topCategoryLabels,
                  datasets: [{ data: topCategoryValues }],
                }}
                width={CHART_WIDTH}
                height={220}
                yAxisLabel="$"
                yAxisSuffix=""
                chartConfig={chartConfig}
                fromZero
                showValuesOnTopOfBars
              />
            )}
          </View>

          {/* LINE */}
          <View style={styles.analyticsCard}>
            <Text style={styles.cardTitle}>
              6 Month {selectedTrendLabel} Trend
            </Text>

            <LineChart
              data={{
                labels: trendLabels,
                datasets: [{ data: selectedTrendData }],
              }}
              width={CHART_WIDTH}
              height={220}
              yAxisLabel="$"
              chartConfig={chartConfig}
              bezier
            />

            <Text style={styles.chartNote}>
              {transactionType === "INCOME"
                ? "Showing income trend"
                : "Showing expense trend"}
            </Text>
          </View>
        </ScrollView>

        {/* DOTS */}
        <View style={styles.dotsContainer}>
          {[0, 1, 2, 3].map((page) => (
            <View
              key={page}
              style={[
                styles.dot,
                currentChartPage === page && styles.dotActive,
              ]}
            />
          ))}
        </View>
      </View>

      {/* DETAILS */}
      <Text style={styles.sectionTitle}>Detailed Breakdown</Text>

      {categories.length === 0 ? (
        <Text style={styles.emptyText}>No records found.</Text>
      ) : (
        categories.map((item) => (
          <View key={`${item.name}-${item.type}`} style={styles.row}>
            <View style={styles.categoryBox}>
              <Text style={styles.categoryText}>
                {item.icon} {item.name}
              </Text>

              {transactionType === "ALL" && (
                <Text style={styles.categoryType}>{item.type}</Text>
              )}
            </View>

            <Text
              style={[
                styles.amountText,
                item.type === "INCOME" && styles.incomeText,
                item.type === "EXPENSE" && styles.expenseText,
              ]}
            >
              ${Number(item.total).toFixed(2)}
            </Text>
          </View>
        ))
      )}
    </AppScreen>
  );
}

const chartColors = [
  "#0F766E",
  "#14B8A6",
  "#22C55E",
  "#3B82F6",
  "#F59E0B",
  "#EF4444",
];

/**
 * Chart-kit config.
 */
function createChartConfig(colors: any, isDark: boolean) {
  return {
    backgroundGradientFrom: colors.card,
    backgroundGradientTo: colors.card,
    decimalPlaces: 0,
    color: () => colors.accent,
    labelColor: () => colors.textSecondary,
    propsForDots: {
      r: "4",
      strokeWidth: "2",
      stroke: colors.accent,
    },
    propsForLabels: {
      fontWeight: "700",
    },
  };
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
    },
    subtitle: {
      marginTop: 4,
      marginBottom: 18,
      fontSize: 14,
      fontWeight: "700",
      color: colors.textSecondary,
    },

    segmentCard: {
      backgroundColor: colors.card,
      borderRadius: 18,
      padding: 6,
      flexDirection: "row",
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 12,
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
      marginBottom: 12,
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
      marginBottom: 14,
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
      marginBottom: 16,
    },
    doneButtonText: {
      color: "#FFFFFF",
      fontWeight: "900",
    },

    chartOuterBox: {
      marginBottom: 22,
    },
    chartSliderContent: {
      paddingRight: 20,
      gap: 12,
    },
    analyticsCard: {
      width: CARD_WIDTH,
      backgroundColor: colors.card,
      borderRadius: 26,
      padding: 18,
      borderWidth: 1,
      borderColor: colors.border,
      minHeight: 318,
      overflow: "hidden",
    },
    cardLabel: {
      fontSize: 14,
      fontWeight: "900",
      color: colors.accent,
    },
    mainAmount: {
      marginTop: 10,
      fontSize: 40,
      fontWeight: "900",
      color: colors.textPrimary,
    },
    miniRow: {
      flexDirection: "row",
      gap: 12,
      marginTop: 22,
    },
    miniBox: {
      flex: 1,
      backgroundColor: isDark ? "#020617" : "#F4F8F6",
      borderRadius: 16,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.border,
    },
    miniLabel: {
      fontSize: 12,
      fontWeight: "900",
      color: colors.textSecondary,
      marginBottom: 6,
    },
    swipeHint: {
      marginTop: 24,
      color: colors.textSecondary,
      fontWeight: "800",
    },
    cardTitle: {
      fontSize: 18,
      fontWeight: "900",
      color: colors.textPrimary,
      marginBottom: 14,
    },
    chartNote: {
      textAlign: "center",
      color: colors.textSecondary,
      fontWeight: "700",
      marginTop: 6,
    },

    dotsContainer: {
      marginTop: 12,
      paddingVertical: 10,
      borderRadius: 999,
      backgroundColor: isDark ? "#020617" : "#FFFFFF",
      borderWidth: 1,
      borderColor: colors.border,
      alignSelf: "center",
      paddingHorizontal: 16,
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: 8,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: isDark ? "#475569" : "#CBD5E1",
    },
    dotActive: {
      width: 24,
      backgroundColor: colors.accent,
    },

    sectionTitle: {
      fontSize: 20,
      fontWeight: "900",
      color: colors.textPrimary,
      marginBottom: 12,
    },
    row: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 18,
      padding: 16,
      marginBottom: 10,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 12,
    },
    categoryBox: {
      flex: 1,
    },
    categoryText: {
      fontSize: 16,
      fontWeight: "900",
      color: colors.textPrimary,
    },
    categoryType: {
      marginTop: 4,
      fontSize: 12,
      fontWeight: "800",
      color: colors.textSecondary,
    },
    amountText: {
      fontSize: 16,
      fontWeight: "900",
      color: colors.textPrimary,
    },
    incomeText: {
      color: "#059669",
      fontWeight: "900",
    },
    expenseText: {
      color: "#DC2626",
      fontWeight: "900",
    },
    emptyText: {
      marginTop: 20,
      textAlign: "center",
      color: colors.textSecondary,
      fontSize: 15,
      fontWeight: "700",
    },
    emptyChartText: {
      marginTop: 70,
      textAlign: "center",
      color: colors.textSecondary,
      fontSize: 15,
      fontWeight: "700",
    },
  });
}