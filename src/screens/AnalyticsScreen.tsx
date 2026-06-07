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
 * Analytics screen.
 * Shows category breakdown, summary, top categories, and 6-month trend.
 */
export default function AnalyticsScreen() {
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
   * Load all analytics data for selected filter and period.
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

    if (period === "DAY") {
      newDate.setDate(newDate.getDate() + amount);
    }

    if (period === "WEEK") {
      newDate.setDate(newDate.getDate() + amount * 7);
    }

    if (period === "MONTH") {
      newDate.setMonth(newDate.getMonth() + amount);
    }

    if (period === "YEAR") {
      newDate.setFullYear(newDate.getFullYear() + amount);
    }

    setAnchorDate(newDate);
  }

  /**
   * Display selected period as readable text.
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
   * Track which chart card user is viewing.
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

  /**
   * Pie data must never include NaN, Infinity, or zero values.
   */
  const pieData = categories
    .slice(0, 6)
    .map((item, index) => ({
      name: `${item.icon} ${item.name}`,
      amount: Number(item.total) || 0,
      color: chartColors[index % chartColors.length],
      legendFontColor: "#334155",
      legendFontSize: 12,
    }))
    .filter((item) => item.amount > 0);

  /**
   * Top category data for bar chart.
   */
  const topCategories = categories
    .slice(0, 5)
    .map((item) => ({
      label: item.name.slice(0, 5),
      value: Number(item.total) || 0,
    }))
    .filter((item) => item.value > 0);

  const topCategoryLabels = topCategories.map((item) => item.label);
  const topCategoryValues = topCategories.map((item) => item.value);

  /**
   * Trend values must be valid and positive for chart-kit.
   * For ALL view, we show expense trend instead of net balance
   * because net balance can be negative and can crash LineChart.
   */
  const trendLabels =
    trend.length > 0 ? trend.map((item) => item.label) : ["", "", "", "", "", ""];

  const incomeTrend = trend.map((item) => Number(item.income) || 0);
  const expenseTrend = trend.map((item) => Number(item.expense) || 0);

  const safeIncomeTrend =
    incomeTrend.some((value) => value > 0)
      ? incomeTrend
      : [0, 1, 0, 1, 0, 1];

  const safeExpenseTrend =
    expenseTrend.some((value) => value > 0)
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

      {/* All / Expense / Income filter */}
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

      {/* Day / Week / Month / Year filter */}
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

      {/* Native date picker */}
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

      {/* Swipeable analytics cards */}
      <ScrollView
        horizontal
        pagingEnabled
        snapToInterval={CHART_PAGE_SIZE}
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chartSliderContent}
        onMomentumScrollEnd={handleChartScrollEnd}
      >
        {/* Page 1: Pie chart default */}
        <View style={styles.analyticsCard}>
          <Text style={styles.cardTitle}>Category Breakdown</Text>

          {pieData.length === 0 ? (
            <Text style={styles.emptyText}>No chart data found.</Text>
          ) : (
            <PieChart
              data={pieData}
              width={CHART_WIDTH}
              height={220}
              chartConfig={chartConfig}
              accessor="amount"
              backgroundColor="transparent"
              paddingLeft="8"
              absolute
            />
          )}
        </View>

        {/* Page 2: Summary */}
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
              transactionType === "ALL" && netBalance < 0 && styles.expenseText,
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
              <Text style={styles.expenseText}>${totalExpense.toFixed(2)}</Text>
            </View>
          </View>

          <Text style={styles.swipeHint}>Swipe for more analytics →</Text>
        </View>

        {/* Page 3: Bar chart */}
        <View style={styles.analyticsCard}>
          <Text style={styles.cardTitle}>Top Categories</Text>

          {topCategoryValues.length === 0 ? (
            <Text style={styles.emptyText}>No category data found.</Text>
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

        {/* Page 4: Line chart */}
        <View style={styles.analyticsCard}>
          <Text style={styles.cardTitle}>6 Month {selectedTrendLabel} Trend</Text>

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

      {/* Page indicator dots */}
      <View style={styles.dotsRow}>
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

      {/* Detailed list */}
      <Text style={styles.sectionTitle}>Detailed Breakdown</Text>

      {categories.length === 0 ? (
        <Text style={styles.emptyText}>No records found.</Text>
      ) : (
        categories.map((item) => (
          <View key={`${item.name}-${item.type}`} style={styles.row}>
            <View>
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

const chartConfig = {
  backgroundGradientFrom: "#FFFFFF",
  backgroundGradientTo: "#FFFFFF",
  decimalPlaces: 0,
  color: () => "#0F766E",
  labelColor: () => "#334155",
  propsForDots: {
    r: "4",
    strokeWidth: "2",
    stroke: "#0F766E",
  },
};

const styles = StyleSheet.create({
  title: {
    fontSize: 30,
    fontWeight: "900",
    color: "#071826",
  },
  subtitle: {
    marginTop: 4,
    marginBottom: 18,
    fontSize: 14,
    fontWeight: "700",
    color: "#64748B",
  },

  segmentCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 6,
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#CFE2DA",
    marginBottom: 12,
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
    marginBottom: 12,
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
    marginBottom: 14,
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
    marginBottom: 16,
  },
  doneButtonText: {
    color: "#FFFFFF",
    fontWeight: "900",
  },

  chartSliderContent: {
    paddingRight: 20,
    gap: 12,
  },
  analyticsCard: {
    width: CARD_WIDTH,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: "#DDE7E2",
    minHeight: 310,
    overflow: "hidden",
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: "900",
    color: "#0F766E",
  },
  mainAmount: {
    marginTop: 10,
    fontSize: 40,
    fontWeight: "900",
    color: "#071826",
  },
  miniRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 22,
  },
  miniBox: {
    flex: 1,
    backgroundColor: "#F4F8F6",
    borderRadius: 16,
    padding: 14,
  },
  miniLabel: {
    fontSize: 12,
    fontWeight: "900",
    color: "#64748B",
    marginBottom: 6,
  },
  swipeHint: {
    marginTop: 24,
    color: "#94A3B8",
    fontWeight: "800",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#071826",
    marginBottom: 14,
  },
  chartNote: {
    textAlign: "center",
    color: "#64748B",
    fontWeight: "700",
    marginTop: 6,
  },

  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: -6,
    marginBottom: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#CBD5E1",
  },
  dotActive: {
    width: 22,
    backgroundColor: "#0F766E",
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#071826",
    marginBottom: 12,
  },
  row: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDE7E2",
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  categoryText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#071826",
  },
  categoryType: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "800",
    color: "#64748B",
  },
  amountText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#071826",
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
    marginTop: 40,
    textAlign: "center",
    color: "#64748B",
    fontSize: 15,
    fontWeight: "700",
  },
});