import React, { useEffect, useState } from "react";
import {
  Dimensions,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { PieChart } from "react-native-chart-kit";

import AppScreen from "../components/AppScreen";
import { COLORS } from "../constants/colors";
import { TransactionType } from "../types";
import {
  getCategoryAnalyticsByPeriod,
  getDateRange,
  PeriodFilter,
} from "../services/expenseService";

interface CategoryAnalytics {
  name: string;
  icon: string;
  total: number;
}

const screenWidth = Dimensions.get("window").width;

/**
 * Analytics screen.
 * Shows chart by income or expense category.
 */
export default function AnalyticsScreen() {
  const [transactionType, setTransactionType] =
    useState<TransactionType>("EXPENSE");

  const [categories, setCategories] = useState<CategoryAnalytics[]>([]);
  const [period, setPeriod] = useState<PeriodFilter>("MONTH");
  const [anchorDate, setAnchorDate] = useState(new Date());
  const [showPeriodPicker, setShowPeriodPicker] = useState(false);

  useEffect(() => {
    loadAnalytics();
  }, [transactionType, period, anchorDate]);

  /**
   * Load category totals.
   */
  async function loadAnalytics() {
    const data = await getCategoryAnalyticsByPeriod(
      period,
      anchorDate,
      transactionType
    );

    setCategories(data as CategoryAnalytics[]);
  }

  /**
   * Move period backward/forward.
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
   * Period label.
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

  const total = categories.reduce(
    (sum, item) => sum + Number(item.total),
    0
  );

  const chartData = categories.map((item, index) => ({
    name: `${item.icon} ${item.name}`,
    amount: Number(item.total),
    color: chartColors[index % chartColors.length],
    legendFontColor: COLORS.textPrimary,
    legendFontSize: 13,
  }));

  return (
    <AppScreen>
      <Text style={styles.title}>Analytics</Text>

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

      {chartData.length === 0 ? (
        <Text style={styles.emptyText}>No records found.</Text>
      ) : (
        <>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Category Breakdown</Text>

            <PieChart
              data={chartData}
              width={screenWidth - 40}
              height={220}
              chartConfig={chartConfig}
              accessor="amount"
              backgroundColor="transparent"
              paddingLeft="10"
              absolute
            />
          </View>

          <Text style={styles.sectionTitle}>Top Categories</Text>

          {categories.map((item) => (
            <View key={item.name} style={styles.row}>
              <Text style={styles.categoryText}>
                {item.icon} {item.name}
              </Text>

              <Text style={styles.amountText}>
                ${Number(item.total).toFixed(2)}
              </Text>
            </View>
          ))}
        </>
      )}
    </AppScreen>
  );
}

const chartColors = [
  "#10B981",
  "#3B82F6",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#14B8A6",
];

const chartConfig = {
  color: () => COLORS.primary,
  labelColor: () => COLORS.textPrimary,
};

const styles = StyleSheet.create({
  title: {
    fontSize: 30,
    fontWeight: "900",
    color: COLORS.primary,
    marginBottom: 20,
  },
  typeRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
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
    marginBottom: 14,
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
  summaryCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 16,
    marginBottom: 18,
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
  card: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    paddingVertical: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.primary,
    marginBottom: 14,
  },
  row: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  categoryText: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  amountText: {
    fontSize: 16,
    fontWeight: "900",
    color: COLORS.primary,
  },
  emptyText: {
    marginTop: 40,
    textAlign: "center",
    color: COLORS.textSecondary,
    fontSize: 16,
  },
});