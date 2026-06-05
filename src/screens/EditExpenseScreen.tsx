import React, { useEffect, useState } from "react";
import {
  Alert,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import AppScreen from "../components/AppScreen";
import { COLORS } from "../constants/colors";
import { Category, TransactionType } from "../types";
import { getCategoriesByType } from "../services/categoryService";
import {
  getExpenseById,
  updateExpense,
} from "../services/expenseService";
import { RootStackParamList } from "../navigation/AppNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "EditExpense">;

/**
 * Edit screen.
 * Edits one existing income or expense record.
 */
export default function EditExpenseScreen({ route, navigation }: Props) {
  const { expenseId } = route.params;

  const [transactionType, setTransactionType] =
    useState<TransactionType>("EXPENSE");

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [note, setNote] = useState("");

  const [expenseDate, setExpenseDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);

  /**
   * Load selected record.
   */
  useEffect(() => {
    loadData();
  }, []);

  /**
   * Reload categories when transaction type changes.
   */
  useEffect(() => {
    loadCategories(transactionType);
  }, [transactionType]);

  /**
   * Load categories for selected type.
   */
  async function loadCategories(type: TransactionType) {
    const data = await getCategoriesByType(type);
    setCategories(data);

    if (data.length > 0 && !categoryId) {
      setCategoryId(data[0].id);
    }
  }

  /**
   * Load existing transaction and categories.
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
    setPaymentMethod(record.paymentMethod);
    setNote(record.note ?? "");
    setExpenseDate(new Date(record.expenseDate));

    const categoryData = await getCategoriesByType(type);
    setCategories(categoryData);
  }

  /**
   * Validate and update transaction.
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

  return (
    <AppScreen>
      <Text style={styles.title}>Edit Record</Text>

      <Text style={styles.label}>Transaction Type</Text>
      <View style={styles.row}>
        <TouchableOpacity
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

      <Text style={styles.label}>Name</Text>
      <TextInput
        style={styles.input}
        placeholder="Name"
        value={title}
        onChangeText={setTitle}
      />

      <Text style={styles.label}>Amount</Text>
      <TextInput
        style={styles.input}
        placeholder="25"
        keyboardType="decimal-pad"
        value={amount}
        onChangeText={setAmount}
      />

      <Text style={styles.label}>Category</Text>
      <View style={styles.pickerBox}>
        <Picker selectedValue={categoryId} onValueChange={setCategoryId}>
          {categories.map((category) => (
            <Picker.Item
              key={category.id}
              label={`${category.icon} ${category.name}`}
              value={category.id}
            />
          ))}
        </Picker>
      </View>

      <Text style={styles.label}>Payment Method</Text>
      <View style={styles.pickerBox}>
        <Picker selectedValue={paymentMethod} onValueChange={setPaymentMethod}>
          <Picker.Item label="Cash" value="Cash" />
          <Picker.Item label="Credit Card" value="Credit Card" />
          <Picker.Item label="Debit Card" value="Debit Card" />
          <Picker.Item label="Zelle" value="Zelle" />
          <Picker.Item label="Bank Transfer" value="Bank Transfer" />
          <Picker.Item label="Other" value="Other" />
        </Picker>
      </View>

      <Text style={styles.label}>Date</Text>
      <TouchableOpacity
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
          style={styles.doneButton}
          onPress={() => setShowDatePicker(false)}
        >
          <Text style={styles.doneButtonText}>Done</Text>
        </TouchableOpacity>
      )}

      <Text style={styles.label}>Note</Text>
      <TextInput
        style={[styles.input, styles.noteInput]}
        placeholder="Optional note"
        value={note}
        onChangeText={setNote}
        multiline
      />

      <TouchableOpacity style={styles.button} onPress={handleUpdate}>
        <Text style={styles.buttonText}>Update</Text>
      </TouchableOpacity>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 30,
    fontWeight: "900",
    color: COLORS.primary,
    marginBottom: 20,
  },
  label: {
    marginTop: 16,
    marginBottom: 8,
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  row: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  chip: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    alignItems: "center",
  },
  chipSelected: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  chipText: {
    color: COLORS.textPrimary,
    fontWeight: "700",
  },
  chipTextSelected: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
  input: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
  },
  inputText: {
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  noteInput: {
    minHeight: 90,
    textAlignVertical: "top",
  },
  pickerBox: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    overflow: "hidden",
  },
  doneButton: {
    backgroundColor: COLORS.accent,
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  doneButtonText: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
  button: {
    backgroundColor: COLORS.accent,
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 28,
  },
  buttonText: {
    color: COLORS.card,
    fontSize: 16,
    fontWeight: "800",
  },
});