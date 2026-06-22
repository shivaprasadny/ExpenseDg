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
  const [editName, setEditName] = useState("");
  const [editIcon, setEditIcon] = useState("");

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
    setEditName(category.name);
    setEditIcon(category.icon);
  }

  /**
   * Cancel edit mode.
   */
  function handleCancelEdit() {
    setEditingCategory(null);
    setEditName("");
    setEditIcon("");
  }

  /**
   * Add a category.
   */
  async function handleSaveCategory() {
    if (!name.trim()) {
      Alert.alert("Missing name", "Please enter category name.");
      return;
    }

    try {
      await addCategory(name.trim(), icon.trim() || "💰", transactionType);

      setName("");
      setIcon("💰");

      await loadCategories();
      Alert.alert("Added", "Category added successfully.");
    } catch {
      Alert.alert("Error", "Could not save category.");
    }
  }

  /**
   * Save changes from the category's inline editor.
   */
  async function handleSaveEdit(category: Category) {
    if (!editName.trim()) {
      Alert.alert("Missing name", "Please enter category name.");
      return;
    }

    try {
      await updateCategory(
        category.id,
        editName.trim(),
        editIcon.trim() || "💰",
        category.type
      );

      handleCancelEdit();
      await loadCategories();
      Alert.alert("Updated", "Category updated successfully.");
    } catch {
      Alert.alert("Error", "Could not update category.");
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
        <Text style={styles.formTitle}>Add Category</Text>

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
          <Text style={styles.buttonText}>Add Category</Text>
        </TouchableOpacity>
      </View>

      {/* LIST */}
      <Text style={styles.sectionTitle}>
        {transactionType === "EXPENSE" ? "Expense" : "Income"} Categories
      </Text>

      <FlatList
        data={categories}
        keyExtractor={(item) => String(item.id)}
        scrollEnabled={false}
        renderItem={({ item }) => {
          const isEditing = editingCategory?.id === item.id;

          return (
            <View style={[styles.card, isEditing && styles.editingCard]}>
              {isEditing ? (
                <View style={styles.inlineEditor}>
                  <Text style={styles.inlineEditTitle}>Edit Category</Text>

                  <View style={styles.inlineInputRow}>
                    <TextInput
                      style={[styles.input, styles.iconInput]}
                      value={editIcon}
                      onChangeText={setEditIcon}
                      maxLength={2}
                      placeholder="💰"
                      placeholderTextColor={colors.textSecondary}
                    />

                    <TextInput
                      style={[styles.input, styles.nameInput]}
                      value={editName}
                      onChangeText={setEditName}
                      placeholder="Category name"
                      placeholderTextColor={colors.textSecondary}
                      autoFocus
                    />
                  </View>

                  <View style={styles.inlineActions}>
                    <TouchableOpacity
                      activeOpacity={0.85}
                      style={[styles.cancelButton, styles.inlineButton]}
                      onPress={handleCancelEdit}
                    >
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.85}
                      style={[styles.button, styles.inlineButton]}
                      onPress={() => handleSaveEdit(item)}
                    >
                      <Text style={styles.buttonText}>Save</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <>
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
                </>
              )}
            </View>
          );
        }}
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
    editingCard: {
      borderColor: colors.accent,
    },
    inlineEditor: {
      flex: 1,
    },
    inlineEditTitle: {
      marginBottom: 12,
      fontSize: 16,
      fontWeight: "900",
      color: colors.textPrimary,
    },
    inlineInputRow: {
      flexDirection: "row",
      gap: 10,
    },
    iconInput: {
      width: 66,
      textAlign: "center",
    },
    nameInput: {
      flex: 1,
    },
    inlineActions: {
      flexDirection: "row",
      gap: 10,
      marginTop: 12,
    },
    inlineButton: {
      flex: 1,
      marginTop: 0,
      padding: 13,
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
