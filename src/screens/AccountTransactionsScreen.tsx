import React, { useCallback, useState } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import AppScreen from "../components/AppScreen";
import { useAppTheme } from "../context/ThemeContext";
import { RootStackParamList } from "../navigation/AppNavigator";
import { getAccountById } from "../services/accountService";
import {
  ExpenseListItem,
  getAccountRecordsByPeriod,
  getDateRange,
  PeriodFilter,
} from "../services/expenseService";
import { getUserProfile } from "../services/profileService";
import { Account } from "../types";

type Props = NativeStackScreenProps<
  RootStackParamList,
  "AccountTransactions"
>;

export default function AccountTransactionsScreen({
  route,
  navigation,
}: Props) {
  const { colors, isDark } = useAppTheme();
  const styles = createStyles(colors, isDark);
  const accountId = route.params?.accountId ?? null;

  const [account, setAccount] = useState<Account | null>(null);
  const [records, setRecords] = useState<ExpenseListItem[]>([]);
  const [currencySymbol, setCurrencySymbol] = useState("$");
  const [period, setPeriod] = useState<PeriodFilter>("MONTH");
  const [anchorDate, setAnchorDate] = useState(new Date());
  const [showPeriodPicker, setShowPeriodPicker] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [accountId, period, anchorDate])
  );

  async function loadData() {
    const [accountData, recordData, profile] = await Promise.all([
      accountId ? getAccountById(accountId) : Promise.resolve(null),
      getAccountRecordsByPeriod(accountId, period, anchorDate),
      getUserProfile(),
    ]);

    setAccount(accountData);
    setRecords(recordData);
    setCurrencySymbol(profile.currencySymbol || "$");
  }

  function movePeriod(direction: "PREV" | "NEXT") {
    const nextDate = new Date(anchorDate);
    const amount = direction === "NEXT" ? 1 : -1;

    if (period === "DAY") nextDate.setDate(nextDate.getDate() + amount);
    if (period === "WEEK") nextDate.setDate(nextDate.getDate() + amount * 7);
    if (period === "MONTH") nextDate.setMonth(nextDate.getMonth() + amount);
    if (period === "YEAR") nextDate.setFullYear(nextDate.getFullYear() + amount);

    setAnchorDate(nextDate);
  }

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

  const totalIncome = records
    .filter((record) => record.type === "INCOME")
    .reduce((sum, record) => sum + Number(record.amount), 0);
  const totalExpense = records
    .filter((record) => record.type === "EXPENSE")
    .reduce((sum, record) => sum + Number(record.amount), 0);
  const netChange = totalIncome - totalExpense;
  const accountSummaries = Array.from(
    records.reduce(
      (
        summaries: Map<
          number,
          {
            id: number;
            name: string;
            icon: string;
            lastFour: string;
            income: number;
            expense: number;
            count: number;
          }
        >,
        record
      ) => {
        if (!record.accountId) return summaries;

        const current = summaries.get(record.accountId) ?? {
          id: record.accountId,
          name: record.accountName ?? "Account",
          icon: record.accountIcon ?? "💳",
          lastFour: record.accountLastFour ?? "",
          income: 0,
          expense: 0,
          count: 0,
        };

        current.count += 1;
        if (record.type === "INCOME") {
          current.income += Number(record.amount);
        } else {
          current.expense += Number(record.amount);
        }

        summaries.set(record.accountId, current);
        return summaries;
      },
      new Map()
    ).values()
  ).sort((a, b) => b.income + b.expense - (a.income + a.expense));

  return (
    <AppScreen>
      <View style={styles.accountHeader}>
        <Text style={styles.accountIcon}>{account?.icon ?? "🏦"}</Text>
        <View style={styles.accountHeaderText}>
          <Text style={styles.title}>{account?.name ?? "All Accounts"}</Text>
          <Text style={styles.subtitle}>
            {account
              ? `${account.paymentMethod}${
                  account.lastFour ? ` •••• ${account.lastFour}` : ""
                }${account.isArchived === 1 ? " • Archived" : ""}`
              : "Combined activity from every payment source"}
          </Text>
        </View>
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
              if (Platform.OS === "android") setShowPeriodPicker(false);
              if (selectedDate) setAnchorDate(selectedDate);
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
        <Text style={styles.summaryLabel}>Net Change</Text>
        <Text
          style={[
            styles.summaryAmount,
            netChange < 0 ? styles.expenseText : styles.incomeText,
          ]}
        >
          {netChange < 0 ? "-" : "+"}
          {currencySymbol}
          {Math.abs(netChange).toFixed(2)}
        </Text>

        <View style={styles.summaryRow}>
          <View>
            <Text style={styles.summarySmallLabel}>Income</Text>
            <Text style={styles.incomeText}>
              +{currencySymbol}
              {totalIncome.toFixed(2)}
            </Text>
          </View>
          <View>
            <Text style={styles.summarySmallLabel}>Expenses</Text>
            <Text style={styles.expenseText}>
              -{currencySymbol}
              {totalExpense.toFixed(2)}
            </Text>
          </View>
          <View>
            <Text style={styles.summarySmallLabel}>Records</Text>
            <Text style={styles.recordCount}>{records.length}</Text>
          </View>
        </View>
      </View>

      {!account && accountSummaries.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Account Breakdown</Text>
          <View style={styles.breakdownList}>
            {accountSummaries.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.breakdownCard}
                onPress={() =>
                  navigation.push("AccountTransactions", {
                    accountId: item.id,
                  })
                }
              >
                <Text style={styles.breakdownIcon}>{item.icon}</Text>
                <View style={styles.breakdownInfo}>
                  <Text style={styles.breakdownName}>
                    {item.name}
                    {item.lastFour ? ` •••• ${item.lastFour}` : ""}
                  </Text>
                  <Text style={styles.breakdownMeta}>
                    {item.count} record{item.count === 1 ? "" : "s"} • Net{" "}
                    {item.income - item.expense < 0 ? "-" : "+"}
                    {currencySymbol}
                    {Math.abs(item.income - item.expense).toFixed(2)}
                  </Text>
                </View>
                <Text style={styles.breakdownArrow}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      <Text style={styles.sectionTitle}>Transactions</Text>

      {records.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No transactions</Text>
          <Text style={styles.emptyText}>
            No records used this account during the selected period.
          </Text>
        </View>
      ) : (
        records.map((record) => (
          <TouchableOpacity
            key={record.id}
            activeOpacity={0.85}
            style={styles.recordCard}
            onPress={() =>
              navigation.navigate("EditExpense", { expenseId: record.id })
            }
          >
            <Text style={styles.categoryIcon}>{record.categoryIcon}</Text>
            <View style={styles.recordInfo}>
              <Text style={styles.recordTitle}>
                {record.isRecurring === 1 ? "🔁 " : ""}
                {record.title}
              </Text>
              <Text style={styles.recordMeta}>
                {record.categoryName} •{" "}
                {new Date(record.expenseDate).toLocaleDateString()}
                {!account && record.accountName
                  ? ` • ${record.accountName}`
                  : ""}
              </Text>
            </View>
            <Text
              style={[
                styles.recordAmount,
                record.type === "INCOME"
                  ? styles.incomeText
                  : styles.expenseText,
              ]}
            >
              {record.type === "INCOME" ? "+" : "-"}
              {currencySymbol}
              {Number(record.amount).toFixed(2)}
            </Text>
          </TouchableOpacity>
        ))
      )}
    </AppScreen>
  );
}

function createStyles(colors: any, isDark: boolean) {
  return StyleSheet.create({
    accountHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginBottom: 20,
    },
    accountIcon: { fontSize: 38 },
    accountHeaderText: { flex: 1 },
    title: { color: colors.textPrimary, fontSize: 28, fontWeight: "900" },
    subtitle: {
      marginTop: 4,
      color: colors.textSecondary,
      fontWeight: "700",
    },
    filterRow: { flexDirection: "row", gap: 8, marginBottom: 14 },
    filterChip: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      alignItems: "center",
    },
    filterChipSelected: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    filterText: {
      color: colors.textSecondary,
      fontWeight: "900",
      fontSize: 12,
    },
    filterTextSelected: { color: "#FFFFFF" },
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
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      alignItems: "center",
      justifyContent: "center",
    },
    navButtonText: {
      color: colors.accent,
      fontSize: 28,
      fontWeight: "900",
    },
    periodLabel: {
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: "900",
    },
    doneButton: {
      padding: 12,
      borderRadius: 12,
      marginBottom: 16,
      backgroundColor: colors.accent,
      alignItems: "center",
    },
    doneButtonText: { color: "#FFFFFF", fontWeight: "900" },
    summaryCard: {
      padding: 18,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      marginBottom: 22,
    },
    summaryLabel: { color: colors.textSecondary, fontWeight: "800" },
    summaryAmount: { marginTop: 4, fontSize: 30, fontWeight: "900" },
    summaryRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 18,
    },
    summarySmallLabel: {
      color: colors.textSecondary,
      fontSize: 12,
      fontWeight: "700",
      marginBottom: 3,
    },
    recordCount: { color: colors.textPrimary, fontWeight: "900" },
    sectionTitle: {
      color: colors.textPrimary,
      fontSize: 20,
      fontWeight: "900",
      marginBottom: 12,
    },
    breakdownList: { marginBottom: 20 },
    breakdownCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      padding: 14,
      borderRadius: 17,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      marginBottom: 8,
    },
    breakdownIcon: { fontSize: 25 },
    breakdownInfo: { flex: 1 },
    breakdownName: {
      color: colors.textPrimary,
      fontWeight: "900",
      fontSize: 15,
    },
    breakdownMeta: {
      marginTop: 3,
      color: colors.textSecondary,
      fontWeight: "700",
      fontSize: 12,
    },
    breakdownArrow: {
      color: colors.accent,
      fontWeight: "900",
      fontSize: 26,
    },
    recordCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      padding: 15,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      marginBottom: 10,
    },
    categoryIcon: { fontSize: 26 },
    recordInfo: { flex: 1 },
    recordTitle: { color: colors.textPrimary, fontWeight: "900", fontSize: 15 },
    recordMeta: {
      marginTop: 4,
      color: colors.textSecondary,
      fontWeight: "700",
      fontSize: 12,
    },
    recordAmount: { fontWeight: "900", fontSize: 15 },
    incomeText: { color: colors.success, fontWeight: "900" },
    expenseText: { color: colors.danger, fontWeight: "900" },
    emptyCard: {
      padding: 18,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: isDark ? "#102A3A" : "#FFFFFF",
    },
    emptyTitle: { color: colors.textPrimary, fontWeight: "900", fontSize: 16 },
    emptyText: {
      marginTop: 4,
      color: colors.textSecondary,
      fontWeight: "700",
      lineHeight: 19,
    },
  });
}
