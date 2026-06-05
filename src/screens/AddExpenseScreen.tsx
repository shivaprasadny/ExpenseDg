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
import { addExpense } from "../services/expenseService";
import { RootStackParamList } from "../navigation/AppNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "AddExpense">;

type RepeatUnit = "WEEK" | "MONTH" | "YEAR";
type EndType = "NEVER" | "PAYMENTS" | "DURATION";

export default function AddExpenseScreen({ navigation }: Props) {
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

  const [isRecurring, setIsRecurring] = useState(false);
  const [repeatInterval, setRepeatInterval] = useState("1");
  const [repeatUnit, setRepeatUnit] = useState<RepeatUnit>("MONTH");

  const [endType, setEndType] = useState<EndType>("NEVER");
  const [paymentCount, setPaymentCount] = useState("6");

  const [durationCount, setDurationCount] = useState("6");
  const [durationUnit, setDurationUnit] = useState<RepeatUnit>("MONTH");

  useEffect(() => {
    loadCategories();
  }, [transactionType]);

  /**
   * Load categories based on Expense or Income.
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
   * Add time to date for recurring transactions.
   */
  function addTimeToDate(baseDate: Date, amount: number, unit: RepeatUnit) {
    const newDate = new Date(baseDate);

    if (unit === "WEEK") newDate.setDate(newDate.getDate() + amount * 7);
    if (unit === "MONTH") newDate.setMonth(newDate.getMonth() + amount);
    if (unit === "YEAR") newDate.setFullYear(newDate.getFullYear() + amount);

    return newDate;
  }

  /**
   * Build all dates for one-time or recurring transaction.
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
   * Validate and save.
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

    for (const date of dates) {
      await addExpense({
        title: title.trim(),
        amount: amountNumber,
        categoryId,
        paymentMethod,
        note: note.trim(),
        expenseDate: date.toISOString(),
        type: transactionType,
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

  return (
    <AppScreen>
      <Text style={styles.label}>Transaction Type</Text>
      <View style={styles.row}>
        <TouchableOpacity
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

      <Text style={styles.label}>Name</Text>
      <TextInput
        style={styles.input}
        placeholder={transactionType === "EXPENSE" ? "Lunch, Rent" : "Salary"}
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
            if (Platform.OS === "android") setShowDatePicker(false);
            if (selectedDate) setExpenseDate(selectedDate);
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

      <Text style={styles.label}>Recurring?</Text>
      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.chip, !isRecurring && styles.chipSelected]}
          onPress={() => setIsRecurring(false)}
        >
          <Text style={!isRecurring ? styles.chipTextSelected : styles.chipText}>
            No
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
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
              keyboardType="number-pad"
              value={repeatInterval}
              onChangeText={setRepeatInterval}
            />

            <View style={[styles.pickerBox, styles.flexOne]}>
              <Picker selectedValue={repeatUnit} onValueChange={setRepeatUnit}>
                <Picker.Item label="Week(s)" value="WEEK" />
                <Picker.Item label="Month(s)" value="MONTH" />
                <Picker.Item label="Year(s)" value="YEAR" />
              </Picker>
            </View>
          </View>

          <Text style={styles.label}>End Recurring</Text>
          <View style={styles.pickerBox}>
            <Picker selectedValue={endType} onValueChange={setEndType}>
              <Picker.Item label="Never" value="NEVER" />
              <Picker.Item label="After number of payments" value="PAYMENTS" />
              <Picker.Item label="After duration" value="DURATION" />
            </Picker>
          </View>

          {endType === "PAYMENTS" && (
            <>
              <Text style={styles.label}>Number of Payments</Text>
              <TextInput
                style={styles.input}
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
                  keyboardType="number-pad"
                  value={durationCount}
                  onChangeText={setDurationCount}
                />

                <View style={[styles.pickerBox, styles.flexOne]}>
                  <Picker
                    selectedValue={durationUnit}
                    onValueChange={setDurationUnit}
                  >
                    <Picker.Item label="Week(s)" value="WEEK" />
                    <Picker.Item label="Month(s)" value="MONTH" />
                    <Picker.Item label="Year(s)" value="YEAR" />
                  </Picker>
                </View>
              </View>
            </>
          )}
        </>
      )}

      <Text style={styles.label}>Note</Text>
      <TextInput
        style={[styles.input, styles.noteInput]}
        placeholder="Optional note"
        value={note}
        onChangeText={setNote}
        multiline
      />

      <TouchableOpacity style={styles.button} onPress={handleSave}>
        <Text style={styles.buttonText}>Save</Text>
      </TouchableOpacity>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  label: {
    marginTop: 16,
    marginBottom: 8,
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textPrimary,
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
  smallInput: {
    width: 90,
  },
  flexOne: {
    flex: 1,
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