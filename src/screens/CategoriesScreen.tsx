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
import { Category, TransactionType } from "../types";
import {
  addCategory,
  deleteCategory,
  getCategoriesByType,
  updateCategory,
} from "../services/categoryService";
import { useAppTheme } from "../context/ThemeContext";

/**
 * Categories screen.
 * User can add, edit, and delete Expense/Income categories.
 * This screen supports light/dark/system theme.
 */
export default function CategoriesScreen() {
  const { colors, isDark } = useAppTheme();
  const styles = createStyles(colors, isDark);

  const [transactionType, setTransactionType] =
    useState<TransactionType>("EXPENSE");

  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("💰");
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

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
   * Start edit mode.
   */
  function handleStartEdit(category: Category) {
    setEditingCategory(category);
    setName(category.name);
    setIcon(category.icon);
    setTransactionType(category.type);
  }

  /**
   * Cancel edit mode.
   */
  function handleCancelEdit() {
    setEditingCategory(null);
    setName("");
    setIcon("💰");
  }

  /**
   * Add or update category.
   */
  async function handleSaveCategory() {
    if (!name.trim()) {
      Alert.alert("Missing name", "Please enter category name.");
      return;
    }

    try {
      if (editingCategory) {
        await updateCategory(
          editingCategory.id,
          name.trim(),
          icon.trim() || "💰",
          transactionType
        );

        Alert.alert("Updated", "Category updated successfully.");
      } else {
        await addCategory(name.trim(), icon.trim() || "💰", transactionType);

        Alert.alert("Added", "Category added successfully.");
      }

      setName("");
      setIcon("💰");
      setEditingCategory(null);

      await loadCategories();
    } catch {
      Alert.alert("Error", "Could not save category.");
    }
  }

  /**
   * Confirm category delete.
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
   * Delete category and reload list.
   */
  async function handleDelete(category: Category) {
    await deleteCategory(category);

    if (editingCategory?.id === category.id) {
      handleCancelEdit();
    }

    await loadCategories();
  }

  return (
    <AppScreen>
      <Text style={styles.title}>Categories</Text>
      <Text style={styles.subtitle}>
        Manage your expense and income categories
      </Text>

      {/* CATEGORY TYPE */}
      <Text style={styles.label}>Category Type</Text>

      <View style={styles.row}>
        <TouchableOpacity
          activeOpacity={0.85}
          style={[
            styles.chip,
            transactionType === "EXPENSE" && styles.chipSelected,
          ]}
          onPress={() => {
            setTransactionType("EXPENSE");
            handleCancelEdit();
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
            handleCancelEdit();
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

      {/* FORM */}
      <View style={styles.formCard}>
        <Text style={styles.formTitle}>
          {editingCategory ? "Edit Category" : "Add Category"}
        </Text>

        <Text style={styles.label}>Icon</Text>
        <TextInput
          style={styles.input}
          value={icon}
          onChangeText={setIcon}
          maxLength={2}
          placeholder="💰"
          placeholderTextColor={colors.textSecondary}
        />

        <Text style={styles.label}>Category Name</Text>
        <TextInput
          style={styles.input}
          placeholder={
            transactionType === "EXPENSE" ? "Books, Gym" : "Salary, Bonus"
          }
          placeholderTextColor={colors.textSecondary}
          value={name}
          onChangeText={setName}
        />

        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.button}
          onPress={handleSaveCategory}
        >
          <Text style={styles.buttonText}>
            {editingCategory ? "Update Category" : "Add Category"}
          </Text>
        </TouchableOpacity>

        {editingCategory && (
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.cancelButton}
            onPress={handleCancelEdit}
          >
            <Text style={styles.cancelButtonText}>Cancel Edit</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* LIST */}
      <Text style={styles.sectionTitle}>
        {transactionType === "EXPENSE" ? "Expense" : "Income"} Categories
      </Text>

      <FlatList
        data={categories}
        keyExtractor={(item) => String(item.id)}
        scrollEnabled={false}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.categoryInfo}
              onPress={() => handleStartEdit(item)}
            >
              <Text style={styles.categoryText}>
                {item.icon} {item.name}
              </Text>

              <Text style={styles.tapText}>Tap to edit</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => confirmDelete(item)}>
              <Text style={styles.deleteText}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
      />
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
    formTitle: {
      fontSize: 20,
      fontWeight: "900",
      color: colors.textPrimary,
      marginBottom: 4,
    },
    label: {
      marginTop: 14,
      marginBottom: 8,
      fontSize: 14,
      fontWeight: "800",
      color: colors.textPrimary,
    },
    row: {
      flexDirection: "row",
      gap: 10,
      alignItems: "center",
      marginBottom: 18,
    },
    chip: {
      flex: 1,
      padding: 14,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
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
    formCard: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 24,
      padding: 18,
      marginBottom: 22,
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
    button: {
      backgroundColor: colors.accent,
      padding: 16,
      borderRadius: 16,
      alignItems: "center",
      marginTop: 20,
    },
    buttonText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "900",
    },
    cancelButton: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 14,
      borderRadius: 14,
      alignItems: "center",
      marginTop: 12,
    },
    cancelButtonText: {
      color: colors.textPrimary,
      fontSize: 15,
      fontWeight: "800",
    },
    sectionTitle: {
      marginBottom: 12,
      fontSize: 20,
      fontWeight: "900",
      color: colors.textPrimary,
    },
    card: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 18,
      padding: 16,
      marginBottom: 10,
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 12,
    },
    categoryInfo: {
      flex: 1,
    },
    categoryText: {
      fontSize: 16,
      fontWeight: "900",
      color: colors.textPrimary,
    },
    tapText: {
      marginTop: 4,
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: "700",
    },
    deleteText: {
      color: "#DC2626",
      fontWeight: "800",
    },
  });
}