import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";

import AppScreen from "../components/AppScreen";
import { useAppTheme } from "../context/ThemeContext";
import { Account, Category, TransactionType } from "../types";
import { getCategoriesByType } from "../services/categoryService";
import {
  getAccountById,
  getActiveAccounts,
} from "../services/accountService";
import {
  getExpenseById,
  updateAllRecurringRecords,
  updateExpense,
  updateFutureRecurringRecords,
} from "../services/expenseService";
import { RootStackParamList } from "../navigation/AppNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "EditExpense">;

const paymentMethods = [
  "Credit Card",
  "Debit Card",
  "Cash",
  "UPI",
  "Online Payment",
  "Venmo",
  "Zelle",
  "PayPal",
  "Bank Transfer",
  "Check",
  "Other",
];

/**
 * EditExpenseScreen
 *
 * Edits one income/expense record.
 * If the record is recurring, user can choose:
 * - Update this record only
 * - Update this and future records
 * - Update all records in the recurring series
 */
export default function EditExpenseScreen({ route, navigation }: Props) {
  const { colors, isDark } = useAppTheme();
  const styles = createStyles(colors, isDark);

const { expenseId, updateScope } = route.params;
  const preserveLoadedAccountRef = useRef<{
    paymentMethod: string;
    accountId: number | null;
  } | null>(null);
  const [transactionType, setTransactionType] =
    useState<TransactionType>("EXPENSE");

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("Credit Card");
  const [accountId, setAccountId] = useState<number | null>(null);
  const [note, setNote] = useState("");

  const [expenseDate, setExpenseDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountsLoaded, setAccountsLoaded] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);

  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringGroupId, setRecurringGroupId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadCategories(transactionType);
  }, [transactionType]);

  useFocusEffect(
    useCallback(() => {
      if (!accountsLoaded) return;

      async function refreshAccounts() {
        const activeAccounts = await getActiveAccounts();
        const selectedIsActive = activeAccounts.some(
          (account) => account.id === accountId
        );
        const selectedArchivedAccount =
          accountId && !selectedIsActive
            ? await getAccountById(accountId)
            : null;

        setAccounts(
          selectedArchivedAccount
            ? [...activeAccounts, selectedArchivedAccount]
            : activeAccounts
        );
      }

      refreshAccounts();
    }, [accountsLoaded, accountId])
  );

  useEffect(() => {
    if (!accountsLoaded) return;

    const preservedSelection = preserveLoadedAccountRef.current;
    if (
      preservedSelection?.paymentMethod === paymentMethod &&
      preservedSelection.accountId === accountId
    ) {
      preserveLoadedAccountRef.current = null;
      return;
    }
    preserveLoadedAccountRef.current = null;

    const selectedAccount = accounts.find((item) => item.id === accountId);
    if (selectedAccount?.paymentMethod === paymentMethod) return;

    const defaultAccount = accounts.find(
      (item) => item.paymentMethod === paymentMethod && item.isDefault === 1
    );
    setAccountId(defaultAccount?.id ?? null);
  }, [paymentMethod, accounts, accountsLoaded]);

  /**
   * Load categories for selected transaction type.
   */
  async function loadCategories(type: TransactionType) {
    const data = await getCategoriesByType(type);
    setCategories(data);

    if (data.length > 0 && !categoryId) {
      setCategoryId(data[0].id);
    }
  }

  /**
   * Load existing record data.
   */
  async function loadData() {
    const [record, activeAccountData]: [any, Account[]] = await Promise.all([
      getExpenseById(expenseId),
      getActiveAccounts(),
    ]);

    if (!record) {
      Alert.alert("Not found", "Record not found.");
      navigation.goBack();
      return;
    }

    const type: TransactionType = record.type ?? "EXPENSE";
    preserveLoadedAccountRef.current = {
      paymentMethod: record.paymentMethod || "Credit Card",
      accountId: record.accountId ?? null,
    };
    const archivedAccount =
      record.accountId &&
      !activeAccountData.some((account) => account.id === record.accountId)
        ? await getAccountById(record.accountId)
        : null;
    const accountData = archivedAccount
      ? [...activeAccountData, archivedAccount]
      : activeAccountData;

    setTransactionType(type);
    setTitle(record.title);
    setAmount(String(record.amount));
    setCategoryId(record.categoryId);
    setPaymentMethod(record.paymentMethod || "Credit Card");
    setAccountId(record.accountId ?? null);
    setNote(record.note ?? "");
    setExpenseDate(new Date(record.expenseDate));

    setIsRecurring(record.isRecurring === 1);
    setRecurringGroupId(record.recurringGroupId ?? null);

    const categoryData = await getCategoriesByType(type);
    setCategories(categoryData);
    setAccounts(accountData);
    setAccountsLoaded(true);
  }

  /**
   * Validate form and return amount as number.
   */
  function validateForm() {
    const amountNumber = Number(amount);

    if (!title.trim()) {
      Alert.alert("Missing name", "Please enter name.");
      return null;
    }

    if (!amount.trim() || Number.isNaN(amountNumber) || amountNumber <= 0) {
      Alert.alert("Invalid amount", "Please enter valid amount.");
      return null;
    }

    if (!categoryId) {
      Alert.alert("Missing category", "Please select category.");
      return null;
    }

    return amountNumber;
  }

  /**
   * Save only this selected record.
   */
  async function updateThisRecordOnly() {
    const amountNumber = validateForm();
    if (amountNumber === null || !categoryId) return;

    await updateExpense(
      expenseId,
      title.trim(),
      amountNumber,
      categoryId,
      paymentMethod,
      accountId,
      note.trim(),
      expenseDate.toISOString(),
      transactionType
    );

    Alert.alert("Updated", "Record updated successfully.");
    navigation.goBack();
  }

  /**
   * Save recurring changes from this record forward.
   * Date is not changed for the full series because each occurrence has its own date.
   */
  async function updateThisAndFutureRecords() {
    const amountNumber = validateForm();
    if (amountNumber === null || !categoryId || !recurringGroupId) return;

    await updateFutureRecurringRecords(
      recurringGroupId,
      expenseDate.toISOString(),
      title.trim(),
      amountNumber,
      categoryId,
      paymentMethod,
      accountId,
      note.trim(),
      transactionType
    );

    Alert.alert("Updated", "This and future recurring records updated.");
    navigation.goBack();
  }

  /**
   * Save recurring changes to all records in the series.
   * Date is not changed for the full series because each occurrence has its own date.
   */
  async function updateFullRecurringSeries() {
    const amountNumber = validateForm();
    if (amountNumber === null || !categoryId || !recurringGroupId) return;

    await updateAllRecurringRecords(
      recurringGroupId,
      title.trim(),
      amountNumber,
      categoryId,
      paymentMethod,
      accountId,
      note.trim(),
      transactionType
    );

    Alert.alert("Updated", "All recurring records updated.");
    navigation.goBack();
  }

  /**
   * Main update button.
   * Recurring records show update options.
   */
  function handleUpdate() {
  if (isRecurring && recurringGroupId) {
    if (updateScope === "THIS_ONLY") {
      updateThisRecordOnly();
      return;
    }

    if (updateScope === "THIS_AND_FUTURE") {
      updateThisAndFutureRecords();
      return;
    }

    if (updateScope === "ALL_SERIES") {
      updateFullRecurringSeries();
      return;
    }

    Alert.alert("Update Recurring Record", "What would you like to update?", [
      {
        text: "This Record Only",
        onPress: updateThisRecordOnly,
      },
      {
        text: "This And Future Records",
        onPress: updateThisAndFutureRecords,
      },
      {
        text: "All Records In Series",
        onPress: updateFullRecurringSeries,
      },
      {
        text: "Cancel",
        style: "cancel",
      },
    ]);

    return;
  }

  updateThisRecordOnly();
}

  const selectedCategory = categories.find((item) => item.id === categoryId);
  const selectedAccount = accounts.find((item) => item.id === accountId);
  const paymentAccounts = accounts.filter(
    (item) => item.paymentMethod === paymentMethod
  );

  return (
    <AppScreen>
      <Text style={styles.title}>Edit Record</Text>
      <Text style={styles.subtitle}>
        Update your income or expense details
      </Text>

      {isRecurring && (
        <View style={styles.recurringNotice}>
          <Text style={styles.recurringTitle}>🔁 Recurring Record</Text>
          <Text style={styles.recurringText}>
            When saving, you can update only this record, this and future
            records, or the full recurring series.
          </Text>
        </View>
      )}

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Record Type</Text>

        <View style={styles.row}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={[
              styles.chip,
              transactionType === "EXPENSE" && styles.chipSelected,
            ]}
            onPress={() => {
              setTransactionType("EXPENSE");
              setCategoryId(null);
              setPaymentMethod("Credit Card");
              setAccountId(null);
            }}
          >
            <Text
              style={
                transactionType === "EXPENSE"
                  ? styles.chipTextSelected
                  : styles.chipText
              }
            >
              Expense
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            style={[
              styles.chip,
              transactionType === "INCOME" && styles.chipSelected,
            ]}
            onPress={() => {
              setTransactionType("INCOME");
              setCategoryId(null);
              setPaymentMethod("Bank Transfer");
              setAccountId(null);
            }}
          >
            <Text
              style={
                transactionType === "INCOME"
                  ? styles.chipTextSelected
                  : styles.chipText
              }
            >
              Income
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Details</Text>

        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Name"
          placeholderTextColor={colors.textSecondary}
          value={title}
          onChangeText={setTitle}
        />

        <Text style={styles.label}>Amount</Text>
        <TextInput
          style={styles.input}
          placeholder="25"
          placeholderTextColor={colors.textSecondary}
          keyboardType="decimal-pad"
          value={amount}
          onChangeText={setAmount}
        />

        <Text style={styles.label}>Category</Text>
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.selectorButton}
          onPress={() => setShowCategoryModal(true)}
        >
          <Text style={styles.selectorText}>
            {selectedCategory
              ? `${selectedCategory.icon} ${selectedCategory.name}`
              : "Select Category"}
          </Text>
          <Text style={styles.selectorArrow}>▼</Text>
        </TouchableOpacity>

        <Text style={styles.label}>Payment Method</Text>
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.selectorButton}
          onPress={() => setShowPaymentModal(true)}
        >
          <Text style={styles.selectorText}>{paymentMethod}</Text>
          <Text style={styles.selectorArrow}>▼</Text>
        </TouchableOpacity>

        <Text style={styles.label}>
          {transactionType === "INCOME" ? "Deposit To" : "Account"}
        </Text>
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.selectorButton}
          onPress={() => {
            if (paymentAccounts.length === 0) {
              navigation.navigate("Accounts");
              return;
            }
            setShowAccountModal(true);
          }}
        >
          <Text style={styles.selectorText}>
            {selectedAccount
              ? `${selectedAccount.icon} ${selectedAccount.name}${
                  selectedAccount.lastFour
                    ? ` •••• ${selectedAccount.lastFour}`
                    : ""
                }`
              : paymentAccounts.length === 0
              ? `Add a ${paymentMethod} account`
              : "Select Account (optional)"}
          </Text>
          <Text style={styles.selectorArrow}>
            {paymentAccounts.length === 0 ? "+" : "▼"}
          </Text>
        </TouchableOpacity>

        <Text style={styles.label}>Date</Text>
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.input}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.inputText}>
            {expenseDate.toLocaleDateString()}
          </Text>
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={expenseDate}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={(event, selectedDate) => {
              if (Platform.OS === "android") {
                setShowDatePicker(false);
              }

              if (selectedDate) {
                setExpenseDate(selectedDate);
              }
            }}
          />
        )}

        {Platform.OS === "ios" && showDatePicker && (
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.doneButton}
            onPress={() => setShowDatePicker(false)}
          >
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Note</Text>

        <TextInput
          style={[styles.input, styles.noteInput]}
          placeholder="Optional note"
          placeholderTextColor={colors.textSecondary}
          value={note}
          onChangeText={setNote}
          multiline
        />
      </View>

      <TouchableOpacity
        activeOpacity={0.85}
        style={styles.button}
        onPress={handleUpdate}
      >
        <Text style={styles.buttonText}>
          {isRecurring ? "Update Recurring Record" : "Update Record"}
        </Text>
      </TouchableOpacity>

      <Modal visible={showCategoryModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Select Category</Text>

            <FlatList
              data={categories}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.modalItem}
                  onPress={() => {
                    setCategoryId(item.id);
                    setShowCategoryModal(false);
                  }}
                >
                  <Text style={styles.modalItemText}>
                    {item.icon} {item.name}
                  </Text>
                </TouchableOpacity>
              )}
            />

            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setShowCategoryModal(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showPaymentModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Payment Method</Text>

            {paymentMethods.map((method) => (
              <TouchableOpacity
                key={method}
                activeOpacity={0.85}
                style={styles.modalItem}
                onPress={() => {
                  setPaymentMethod(method);
                  setShowPaymentModal(false);
                }}
              >
                <Text style={styles.modalItemText}>{method}</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setShowPaymentModal(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showAccountModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Select Account</Text>

            <TouchableOpacity
              style={styles.modalItem}
              onPress={() => {
                setAccountId(null);
                setShowAccountModal(false);
              }}
            >
              <Text style={styles.modalItemText}>No specific account</Text>
            </TouchableOpacity>

            {paymentAccounts.map((account) => (
              <TouchableOpacity
                key={account.id}
                style={styles.modalItem}
                onPress={() => {
                  setAccountId(account.id);
                  setShowAccountModal(false);
                }}
              >
                <Text style={styles.modalItemText}>
                  {account.icon} {account.name}
                  {account.lastFour ? ` •••• ${account.lastFour}` : ""}
                  {account.isDefault === 1 ? " • Default" : ""}
                </Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={styles.modalItem}
              onPress={() => {
                setShowAccountModal(false);
                navigation.navigate("Accounts");
              }}
            >
              <Text style={[styles.modalItemText, { color: colors.accent }]}>
                + Manage Accounts
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setShowAccountModal(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </AppScreen>
  );
}

function createStyles(colors: any, isDark: boolean) {
  return StyleSheet.create({
    title: {
      fontSize: 30,
      fontWeight: "900",
      color: colors.textPrimary,
    },
    subtitle: {
      marginTop: 4,
      marginBottom: 20,
      fontSize: 14,
      fontWeight: "700",
      color: colors.textSecondary,
    },

    recurringNotice: {
      backgroundColor: isDark ? "#052E22" : "#ECFDF5",
      borderWidth: 1,
      borderColor: isDark ? "#065F46" : "#A7F3D0",
      borderRadius: 20,
      padding: 16,
      marginBottom: 18,
    },
    recurringTitle: {
      fontSize: 15,
      fontWeight: "900",
      color: colors.accent,
      marginBottom: 5,
    },
    recurringText: {
      color: isDark ? "#A7F3D0" : "#065F46",
      fontSize: 13,
      fontWeight: "700",
      lineHeight: 19,
    },

    sectionCard: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 24,
      padding: 18,
      marginBottom: 18,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "900",
      color: colors.textPrimary,
      marginBottom: 10,
    },
    label: {
      marginTop: 16,
      marginBottom: 8,
      fontSize: 14,
      fontWeight: "800",
      color: colors.textPrimary,
    },
    row: {
      flexDirection: "row",
      gap: 10,
      alignItems: "center",
    },
    chip: {
      flex: 1,
      padding: 14,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: isDark ? "#020617" : "#F8FAFC",
      alignItems: "center",
    },
    chipSelected: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    chipText: {
      color: colors.textPrimary,
      fontWeight: "800",
    },
    chipTextSelected: {
      color: "#FFFFFF",
      fontWeight: "900",
    },
    input: {
      backgroundColor: isDark ? "#020617" : "#F8FAFC",
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      padding: 14,
      fontSize: 16,
      color: colors.textPrimary,
    },
    inputText: {
      fontSize: 16,
      color: colors.textPrimary,
    },
    noteInput: {
      minHeight: 90,
      textAlignVertical: "top",
    },
    selectorButton: {
      backgroundColor: isDark ? "#020617" : "#F8FAFC",
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      padding: 16,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    selectorText: {
      flex: 1,
      fontSize: 16,
      fontWeight: "800",
      color: colors.textPrimary,
    },
    selectorArrow: {
      fontSize: 12,
      fontWeight: "900",
      color: colors.accent,
      marginLeft: 10,
    },
    doneButton: {
      backgroundColor: colors.accent,
      padding: 12,
      borderRadius: 12,
      alignItems: "center",
      marginTop: 10,
    },
    doneButtonText: {
      color: "#FFFFFF",
      fontWeight: "900",
    },
    button: {
      backgroundColor: colors.accent,
      padding: 16,
      borderRadius: 16,
      alignItems: "center",
      marginTop: 4,
      marginBottom: 40,
    },
    buttonText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "900",
    },
    modalOverlay: {
      flex: 1,
      justifyContent: "flex-end",
      backgroundColor: "rgba(0,0,0,0.45)",
    },
    modalCard: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      padding: 20,
      maxHeight: "75%",
      borderWidth: 1,
      borderColor: colors.border,
    },
    modalTitle: {
      fontSize: 22,
      fontWeight: "900",
      color: colors.textPrimary,
      marginBottom: 16,
    },
    modalItem: {
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalItemText: {
      fontSize: 16,
      fontWeight: "800",
      color: colors.textPrimary,
    },
    modalCancelButton: {
      marginTop: 14,
      padding: 15,
      borderRadius: 16,
      backgroundColor: isDark ? "#020617" : "#F1F5F9",
      alignItems: "center",
    },
    modalCancelText: {
      color: colors.textPrimary,
      fontWeight: "900",
      fontSize: 15,
    },
  });
}
