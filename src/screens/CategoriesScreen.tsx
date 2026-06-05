import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import AppScreen from "../components/AppScreen";
import { COLORS } from "../constants/colors";
import { Category, TransactionType } from "../types";
import {
  addCategory,
  deleteCategory,
  getCategoriesByType,
} from "../services/categoryService";

/**
 * Categories screen.
 * User can manage Expense and Income categories in one screen.
 */
export default function CategoriesScreen() {
  const [transactionType, setTransactionType] =
    useState<TransactionType>("EXPENSE");

  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("💰");

  useEffect(() => {
    loadCategories();
  }, [transactionType]);

  /**
   * Load categories based on selected type.
   */
  async function loadCategories() {
    const data = await getCategoriesByType(transactionType);
    setCategories(data);
  }

  /**
   * Add category.
   */
  async function handleAddCategory() {
    if (!name.trim()) {
      Alert.alert("Missing name", "Please enter category name.");
      return;
    }

    try {
      await addCategory(name.trim(), icon.trim() || "💰", transactionType);

      setName("");
      setIcon("💰");

      await loadCategories();
    } catch {
      Alert.alert("Error", "Could not add category.");
    }
  }

  /**
   * Confirm delete category.
   */
  function confirmDelete(category: Category) {
    const protectedNames = ["Other", "Other Income"];

    if (protectedNames.includes(category.name)) {
      Alert.alert("Cannot delete", "This fallback category is required.");
      return;
    }

    Alert.alert(
      "Delete Category",
      "Existing records will move to fallback category.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => handleDelete(category),
        },
      ]
    );
  }

  /**
   * Delete category.
   */
  async function handleDelete(category: Category) {
    await deleteCategory(category);
    await loadCategories();
  }

  return (
    <AppScreen>
      <Text style={styles.title}>Categories</Text>

      <Text style={styles.label}>Category Type</Text>
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

      <Text style={styles.label}>Icon</Text>
      <TextInput
        style={styles.input}
        value={icon}
        onChangeText={setIcon}
        maxLength={2}
      />

      <Text style={styles.label}>Category Name</Text>
      <TextInput
        style={styles.input}
        placeholder={
          transactionType === "EXPENSE" ? "Books, Gym" : "Salary, Bonus"
        }
        value={name}
        onChangeText={setName}
      />

      <TouchableOpacity style={styles.button} onPress={handleAddCategory}>
        <Text style={styles.buttonText}>Add Category</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>
        {transactionType === "EXPENSE" ? "Expense" : "Income"} Categories
      </Text>

      <FlatList
        data={categories}
        keyExtractor={(item) => String(item.id)}
        scrollEnabled={false}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.categoryText}>
              {item.icon} {item.name}
            </Text>

            <TouchableOpacity onPress={() => confirmDelete(item)}>
              <Text style={styles.deleteText}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
      />
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
    marginTop: 14,
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
  button: {
    backgroundColor: COLORS.accent,
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: {
    color: COLORS.card,
    fontSize: 16,
    fontWeight: "800",
  },
  sectionTitle: {
    marginTop: 28,
    marginBottom: 12,
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.primary,
  },
  card: {
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
  deleteText: {
    color: COLORS.danger,
    fontWeight: "700",
  },
});