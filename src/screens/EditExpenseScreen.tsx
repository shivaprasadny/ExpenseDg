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

import AppScreen from "../components/AppScreen";
import { useAppTheme } from "../context/ThemeContext";
import { Category, TransactionType } from "../types";
import { getCategoriesByType } from "../services/categoryService";
import { getExpenseById, updateExpense } from "../services/expenseService";
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
 * Edits one existing income or expense record.
 * Uses compact selectors and supports dark mode.
 */
export default function EditExpenseScreen({ route, navigation }: Props) {
  const { colors, isDark } = useAppTheme();
  const styles = createStyles(colors, isDark);

  const { expenseId } = route.params;

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
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  /**
   * Load selected record when screen opens.
   */
  useEffect(() => {
    loadData();
  }, []);

  /**
   * Reload categories when type changes.
   */
  useEffect(() => {
    loadCategories(transactionType);
  }, [transactionType]);

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
   * Load current record data.
   */
  async function loadData() {
    const record: any = await getExpenseById(expenseId);

    if (!record) {
      Alert.alert("Not found", "Record not found.");
      navigation.goBack();
      return;
    }

    const type: TransactionType = record.type ?? "EXPENSE";

    setTransactionType(type);
    setTitle(record.title);
    setAmount(String(record.amount));
    setCategoryId(record.categoryId);
    setPaymentMethod(record.paymentMethod || "Credit Card");
    setNote(record.note ?? "");
    setExpenseDate(new Date(record.expenseDate));

    const categoryData = await getCategoriesByType(type);
    setCategories(categoryData);
  }

  /**
   * Validate and update record.
   */
  async function handleUpdate() {
    const amountNumber = Number(amount);

    if (!title.trim()) {
      Alert.alert("Missing name", "Please enter name.");
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

    await updateExpense(
      expenseId,
      title.trim(),
      amountNumber,
      categoryId,
      paymentMethod,
      note.trim(),
      expenseDate.toISOString(),
      transactionType
    );

    Alert.alert("Updated", "Record updated successfully.");
    navigation.goBack();
  }

  const selectedCategory = categories.find((item) => item.id === categoryId);

  return (
    <AppScreen>
      <Text style={styles.title}>Edit Record</Text>
      <Text style={styles.subtitle}>Update your income or expense details</Text>

      {/* TYPE */}
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

      {/* DETAILS */}
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
        onPress={handleUpdate}
      >
        <Text style={styles.buttonText}>Update Record</Text>
      </TouchableOpacity>

      {/* CATEGORY MODAL */}
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

      {/* PAYMENT MODAL */}
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