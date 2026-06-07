import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import HomeScreen from "../screens/HomeScreen";
import AddExpenseScreen from "../screens/AddExpenseScreen";
import ExpensesScreen from "../screens/ExpensesScreen";
import CategoriesScreen from "../screens/CategoriesScreen";
import EditExpenseScreen from "../screens/EditExpenseScreen";
import SettingsScreen from "../screens/SettingsScreen";
import BudgetScreen from "../screens/BudgetScreen";
import AnalyticsScreen from "../screens/AnalyticsScreen";

/**
 * This type defines all screens in our app.
 * It helps TypeScript understand navigation screen names.
 */
export type RootStackParamList = {
  Home: undefined;
  AddExpense: undefined;
  Expenses:
  | {
      defaultType?: "EXPENSE" | "INCOME";
    }
  | undefined;
  Categories: undefined;
  Settings: undefined;
  Budget: undefined;
  Analytics: undefined;

  /**
   * Edit existing expense
   */
  EditExpense: {
    expenseId: number;
  };
};




/**
 * Create native stack navigator.
 * Stack means screens open one over another.
 */
const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * Main app navigation.
 * All screen routes are registered here.
 */
export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: "ExpenseDG" }}
        />

        <Stack.Screen
          name="AddExpense"
          component={AddExpenseScreen}
          options={{ title: "Add Expense" }}
        />
<Stack.Screen
  name="EditExpense"
  component={EditExpenseScreen}
  options={{ title: "Edit Expense" }}
/>
        <Stack.Screen
          name="Expenses"
          component={ExpensesScreen}
          options={{ title: "Expenses" }}
        />

        <Stack.Screen
          name="Categories"
          component={CategoriesScreen}
          options={{ title: "Categories" }}
        />
        <Stack.Screen
  name="Settings"
  component={SettingsScreen}
  options={{ title: "Settings" }}
/>

<Stack.Screen
  name="Budget"
  component={BudgetScreen}
  options={{ title: "Budget" }}
/>

<Stack.Screen
  name="Analytics"
  component={AnalyticsScreen}
  options={{ title: "Analytics" }}
/>
      </Stack.Navigator>
    </NavigationContainer>
  );
}