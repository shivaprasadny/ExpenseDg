import React, { useEffect, useState } from "react";
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
import { useRoute } from "@react-navigation/native";

import AppScreen from "../components/AppScreen";
import { useAppTheme } from "../context/ThemeContext";
import { Category, TransactionType } from "../types";
import { getCategoriesByType } from "../services/categoryService";
import {
  addExpense,
  ExpenseListItem,
  getFavoriteRecords,
  getRecentRecords,
  toggleExpenseFavorite,
} from "../services/expenseService";
import { RootStackParamList } from "../navigation/AppNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "AddExpense">;

type RepeatUnit = "WEEK" | "MONTH" | "YEAR";
type EndType = "NEVER" | "PAYMENTS" | "DURATION";
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
 * AddExpenseScreen
 *
 * Used for:
 * - Add new expense/income
 * - Duplicate old record
 * - Quick add from favorites/recent records
 * - Create recurring records
 */
export default function AddExpenseScreen({ navigation }: Props) {
  const { colors, isDark } = useAppTheme();
  const styles = createStyles(colors, isDark);

  const route = useRoute<any>();
  const duplicateRecord = route.params?.duplicateRecord;

  const [transactionType, setTransactionType] =
    useState<TransactionType>("EXPENSE");

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("Credit Card");
  const [note, setNote] = useState("");

  const [expenseDate, setExpenseDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [recentRecords, setRecentRecords] = useState<ExpenseListItem[]>([]);
  const [favoriteRecords, setFavoriteRecords] = useState<ExpenseListItem[]>([]);

  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const [isRecurring, setIsRecurring] = useState(false);
  const [repeatInterval, setRepeatInterval] = useState("1");
  const [repeatUnit, setRepeatUnit] = useState<RepeatUnit>("MONTH");
  const [endType, setEndType] = useState<EndType>("NEVER");
  const [paymentCount, setPaymentCount] = useState("6");
  const [durationCount, setDurationCount] = useState("6");
  const [durationUnit, setDurationUnit] = useState<RepeatUnit>("MONTH");

  /**
   * Load categories when user switches Expense / Income.
   */
  useEffect(() => {
    loadCategories();
  }, [transactionType]);

  /**
   * Load quick add records when type changes.
   */
  useEffect(() => {
    loadRecentRecords();
    loadFavoriteRecords();
  }, [transactionType]);

  /**
   * Prefill form when user duplicates a record from Records screen.
   */
  useEffect(() => {
    if (duplicateRecord) {
      setTransactionType(duplicateRecord.type);
      setTitle(duplicateRecord.title);
      setAmount(String(duplicateRecord.amount));
      setCategoryId(duplicateRecord.categoryId);
      setPaymentMethod(duplicateRecord.paymentMethod);
      setNote(duplicateRecord.note || "");
      setExpenseDate(new Date());
      setIsRecurring(false);
    }
  }, [duplicateRecord]);

  /**
   * Load categories for selected type.
   */
  async function loadCategories() {
    const data = await getCategoriesByType(transactionType);
    setCategories(data);

    if (data.length > 0) {
      setCategoryId(data[0].id);
    } else {
      setCategoryId(null);
    }
  }

  /**
   * Load favorite records for selected type.
   */
  async function loadFavoriteRecords() {
    const data = await getFavoriteRecords(transactionType);
    setFavoriteRecords(data);
  }

  /**
   * Load recent records for selected type.
   */
  async function loadRecentRecords() {
    const data = await getRecentRecords(10);
    setRecentRecords(data.filter((record) => record.type === transactionType));
  }

  /**
   * Fill form from favorite/recent record.
   * New record date becomes today.
   */
  function prefillFromRecord(record: ExpenseListItem) {
    setTransactionType(record.type);
    setTitle(record.title);
    setAmount(String(record.amount));
    setCategoryId(record.categoryId);
    setPaymentMethod(record.paymentMethod);
    setNote(record.note || "");
    setExpenseDate(new Date());
    setIsRecurring(false);
  }

  /**
   * Add time for recurring records.
   */
  function addTimeToDate(baseDate: Date, amount: number, unit: RepeatUnit) {
    const newDate = new Date(baseDate);

    if (unit === "WEEK") newDate.setDate(newDate.getDate() + amount * 7);
    if (unit === "MONTH") newDate.setMonth(newDate.getMonth() + amount);
    if (unit === "YEAR") newDate.setFullYear(newDate.getFullYear() + amount);

    return newDate;
  }

  /**
   * Build dates for one-time or recurring record.
   */
  function buildTransactionDates(startDate: Date): Date[] {
    if (!isRecurring) return [startDate];

    const dates: Date[] = [];
    const interval = Number(repeatInterval);

    if (Number.isNaN(interval) || interval <= 0) return [];

    if (endType === "NEVER") {
      const maxFutureRecords = 60;

      for (let i = 0; i < maxFutureRecords; i++) {
        dates.push(addTimeToDate(startDate, i * interval, repeatUnit));
      }

      return dates;
    }

    if (endType === "PAYMENTS") {
      const count = Number(paymentCount);

      if (Number.isNaN(count) || count <= 0) return [];

      for (let i = 0; i < count; i++) {
        dates.push(addTimeToDate(startDate, i * interval, repeatUnit));
      }

      return dates;
    }

    const duration = Number(durationCount);

    if (Number.isNaN(duration) || duration <= 0) return [];

    const endDate = addTimeToDate(startDate, duration, durationUnit);
    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      dates.push(new Date(currentDate));
      currentDate = addTimeToDate(currentDate, interval, repeatUnit);
    }

    return dates;
  }

  /**
   * Validate and save record.
   */
  async function handleSave() {
    const amountNumber = Number(amount);

    if (!title.trim()) {
      Alert.alert("Missing title", "Please enter name.");
      return;
    }

    if (!amount.trim() || Number.isNaN(amountNumber) || amountNumber <= 0) {
      Alert.alert("Invalid amount", "Please enter valid amount.");
      return;
    }

    if (!categoryId) {
      Alert.alert("Missing category", "Please select category.");
      return;
    }

    const dates = buildTransactionDates(expenseDate);

    if (dates.length === 0) {
      Alert.alert("Invalid recurring setup", "Please check recurring fields.");
      return;
    }

    const recurringGroupId = isRecurring ? Date.now().toString() : undefined;

    for (const date of dates) {
      await addExpense({
        title: title.trim(),
        amount: amountNumber,
        categoryId,
        paymentMethod,
        note: note.trim(),
        expenseDate: date.toISOString(),
        type: transactionType,
        recurringGroupId,
        isRecurring: isRecurring ? 1 : 0,
      });
    }

    Alert.alert(
      "Saved",
      isRecurring
        ? `${dates.length} ${transactionType.toLowerCase()} records added.`
        : `${transactionType === "EXPENSE" ? "Expense" : "Income"} added.`
    );

    navigation.goBack();
  }

  const selectedCategory = categories.find((item) => item.id === categoryId);

  return (
    <AppScreen>
      {/* RECORD TYPE */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Record Type</Text>

        <View style={styles.row}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={[
              styles.chip,
              transactionType === "EXPENSE" && styles.chipSelected,
            ]}
            onPress={() => setTransactionType("EXPENSE")}
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
            onPress={() => setTransactionType("INCOME")}
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

      {/* QUICK ADD */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Quick Add</Text>

        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.selectorButton}
          onPress={() => setShowQuickAdd(!showQuickAdd)}
        >
          <Text style={styles.selectorText}>
            Favorites & recent{" "}
            {transactionType === "EXPENSE" ? "expenses" : "income"}
          </Text>

          <Text style={styles.selectorArrow}>{showQuickAdd ? "▲" : "▼"}</Text>
        </TouchableOpacity>

        {showQuickAdd && (
          <View style={styles.quickAddList}>
            <Text style={styles.quickSectionTitle}>⭐ Favorites</Text>
            <Text style={styles.quickHint}>Long press to remove favorite</Text>

            {favoriteRecords.length === 0 ? (
              <Text style={styles.emptyQuickText}>
                No favorites yet. Mark a record as favorite from Records.
              </Text>
            ) : (
              favoriteRecords.map((record) => (
                <TouchableOpacity
                  key={`fav-${record.id}`}
                  activeOpacity={0.85}
                  style={styles.quickItem}
                  onPress={() => {
                    prefillFromRecord(record);
                    setShowQuickAdd(false);
                  }}
                  onLongPress={() => {
                    Alert.alert(
                      "Remove Favorite",
                      `Remove "${record.title}" from favorites?`,
                      [
                        { text: "Cancel", style: "cancel" },
                        {
                          text: "Remove",
                          style: "destructive",
                          onPress: async () => {
                            await toggleExpenseFavorite(record.id, 0);
                            await loadFavoriteRecords();
                          },
                        },
                      ]
                    );
                  }}
                >
                  <View style={styles.quickItemLeft}>
                    <Text style={styles.quickTitle}>⭐ {record.title}</Text>
                    <Text style={styles.quickMeta}>
                      {record.categoryName} • {record.paymentMethod}
                    </Text>
                  </View>

                  <Text style={styles.quickAmount}>
                    ${Number(record.amount).toFixed(2)}
                  </Text>
                </TouchableOpacity>
              ))
            )}

            <Text style={styles.quickSectionTitle}>🕒 Recent</Text>

            {recentRecords.length === 0 ? (
              <Text style={styles.emptyQuickText}>
                Add your first record to see recent items here.
              </Text>
            ) : (
              recentRecords.map((record) => (
                <TouchableOpacity
                  key={`recent-${record.id}`}
                  activeOpacity={0.85}
                  style={styles.quickItem}
                  onPress={() => {
                    prefillFromRecord(record);
                    setShowQuickAdd(false);
                  }}
                >
                  <View style={styles.quickItemLeft}>
                    <Text style={styles.quickTitle}>
                      {record.categoryIcon} {record.title}
                    </Text>
                    <Text style={styles.quickMeta}>
                      {record.categoryName} • {record.paymentMethod}
                    </Text>
                  </View>

                  <Text style={styles.quickAmount}>
                    ${Number(record.amount).toFixed(2)}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}
      </View>

      {/* DETAILS */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Details</Text>

        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          placeholder={transactionType === "EXPENSE" ? "Lunch, Rent" : "Salary"}
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

        <Text style={styles.label}>Date</Text>
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.input}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.inputText}>{expenseDate.toLocaleDateString()}</Text>
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={expenseDate}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={(event, selectedDate) => {
              if (Platform.OS === "android") setShowDatePicker(false);
              if (selectedDate) setExpenseDate(selectedDate);
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

      {/* RECURRING */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Recurring</Text>

        <View style={styles.row}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.chip, !isRecurring && styles.chipSelected]}
            onPress={() => setIsRecurring(false)}
          >
            <Text style={!isRecurring ? styles.chipTextSelected : styles.chipText}>
              No
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.chip, isRecurring && styles.chipSelected]}
            onPress={() => setIsRecurring(true)}
          >
            <Text style={isRecurring ? styles.chipTextSelected : styles.chipText}>
              Yes
            </Text>
          </TouchableOpacity>
        </View>

        {isRecurring && (
          <>
            <Text style={styles.label}>Repeat Every</Text>

            <View style={styles.row}>
              <TextInput
                style={[styles.input, styles.smallInput]}
                placeholder="1"
                placeholderTextColor={colors.textSecondary}
                keyboardType="number-pad"
                value={repeatInterval}
                onChangeText={setRepeatInterval}
              />

              <View style={styles.repeatUnitRow}>
                {(["WEEK", "MONTH", "YEAR"] as RepeatUnit[]).map((item) => (
                  <TouchableOpacity
                    key={item}
                    activeOpacity={0.85}
                    style={[
                      styles.smallChip,
                      repeatUnit === item && styles.chipSelected,
                    ]}
                    onPress={() => setRepeatUnit(item)}
                  >
                    <Text
                      style={
                        repeatUnit === item
                          ? styles.chipTextSelected
                          : styles.chipText
                      }
                    >
                      {item === "WEEK"
                        ? "Week"
                        : item === "MONTH"
                        ? "Month"
                        : "Year"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <Text style={styles.label}>End Recurring</Text>

            <View style={styles.endTypeBox}>
              {(["NEVER", "PAYMENTS", "DURATION"] as EndType[]).map((item) => (
                <TouchableOpacity
                  key={item}
                  activeOpacity={0.85}
                  style={[
                    styles.endTypeChip,
                    endType === item && styles.chipSelected,
                  ]}
                  onPress={() => setEndType(item)}
                >
                  <Text
                    style={
                      endType === item ? styles.chipTextSelected : styles.chipText
                    }
                  >
                    {item === "NEVER"
                      ? "Never"
                      : item === "PAYMENTS"
                      ? "Payments"
                      : "Duration"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {endType === "PAYMENTS" && (
              <>
                <Text style={styles.label}>Number of Payments</Text>
                <TextInput
                  style={styles.input}
                  placeholder="6"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="number-pad"
                  value={paymentCount}
                  onChangeText={setPaymentCount}
                />
              </>
            )}

            {endType === "DURATION" && (
              <>
                <Text style={styles.label}>Duration</Text>

                <View style={styles.row}>
                  <TextInput
                    style={[styles.input, styles.smallInput]}
                    placeholder="6"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="number-pad"
                    value={durationCount}
                    onChangeText={setDurationCount}
                  />

                  <View style={styles.repeatUnitRow}>
                    {(["WEEK", "MONTH", "YEAR"] as RepeatUnit[]).map((item) => (
                      <TouchableOpacity
                        key={item}
                        activeOpacity={0.85}
                        style={[
                          styles.smallChip,
                          durationUnit === item && styles.chipSelected,
                        ]}
                        onPress={() => setDurationUnit(item)}
                      >
                        <Text
                          style={
                            durationUnit === item
                              ? styles.chipTextSelected
                              : styles.chipText
                          }
                        >
                          {item === "WEEK"
                            ? "Week"
                            : item === "MONTH"
                            ? "Month"
                            : "Year"}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </>
            )}
          </>
        )}
      </View>

      {/* NOTE */}
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
        onPress={handleSave}
      >
        <Text style={styles.buttonText}>
          {duplicateRecord ? "Save Duplicated Record" : "Save Record"}
        </Text>
      </TouchableOpacity>

      {/* CATEGORY SELECTOR MODAL */}
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

      {/* PAYMENT SELECTOR MODAL */}
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
    </AppScreen>
  );
}

/**
 * Theme-aware styles.
 */
function createStyles(colors: any, isDark: boolean) {
  return StyleSheet.create({
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
    smallChip: {
      flex: 1,
      padding: 13,
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
    smallInput: {
      width: 86,
    },
    repeatUnitRow: {
      flex: 1,
      flexDirection: "row",
      gap: 8,
    },
    endTypeBox: {
      gap: 8,
    },
    endTypeChip: {
      padding: 14,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: isDark ? "#020617" : "#F8FAFC",
      alignItems: "center",
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
    quickAddList: {
      marginTop: 12,
      backgroundColor: isDark ? "#020617" : "#F8FAFC",
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 12,
    },
    quickSectionTitle: {
      fontSize: 14,
      fontWeight: "900",
      marginBottom: 6,
      marginTop: 8,
      color: colors.textPrimary,
    },
    quickHint: {
      fontSize: 11,
      color: colors.textSecondary,
      marginBottom: 8,
      fontWeight: "700",
    },
    quickItem: {
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 12,
    },
    quickItemLeft: {
      flex: 1,
    },
    quickTitle: {
      fontSize: 15,
      fontWeight: "900",
      color: colors.textPrimary,
    },
    quickMeta: {
      marginTop: 3,
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: "700",
    },
    quickAmount: {
      fontSize: 14,
      fontWeight: "900",
      color: colors.accent,
    },
    emptyQuickText: {
      fontSize: 13,
      color: colors.textSecondary,
      marginBottom: 10,
      fontWeight: "700",
      lineHeight: 19,
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