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

import ProfileThemeScreen from "../screens/ProfileThemeScreen";
import BackupResetScreen from "../screens/BackupResetScreen";
import FeedbackScreen from "../screens/FeedbackScreen";
import AboutScreen from "../screens/AboutScreen";
import SecurityScreen from "../screens/SecurityScreen";
import NotificationSettingsScreen from "../screens/NotificationSettingsScreen";
import RecurringScreen from "../screens/RecurringScreen";
import AccountsScreen from "../screens/AccountsScreen";
import AccountTransactionsScreen from "../screens/AccountTransactionsScreen";

/**
 * All app screen names and params.
 */
export type RootStackParamList = {
  Home: undefined;

  AddExpense:
    | {
        duplicateRecord?: {
          title: string;
          amount: number;
          categoryId: number;
          paymentMethod: string;
          accountId?: number | null;
          note?: string;
          type: "EXPENSE" | "INCOME";
          isRecurring?: boolean;
        };
      }
    | undefined;

  Expenses:
    | {
        defaultType?: "ALL" | "EXPENSE" | "INCOME";
      }
    | undefined;

    EditExpense: {
  expenseId: number;
  updateScope?: "THIS_ONLY" | "THIS_AND_FUTURE" | "ALL_SERIES";
};

 

  Categories: undefined;
  Accounts: undefined;
  AccountTransactions: { accountId?: number } | undefined;
  Budget: undefined;
  Analytics: undefined;
  Settings: undefined;

  ProfileTheme: undefined;
  BackupReset: undefined;
  Feedback: undefined;
  About: undefined;
  Security: undefined;
  Notifications: undefined;
  Recurring: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * Main app navigation.
 */
export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: "ExpenseDG" }} />
        <Stack.Screen name="AddExpense" component={AddExpenseScreen} options={{ title: "Add Record" }} />
        <Stack.Screen name="EditExpense" component={EditExpenseScreen} options={{ title: "Edit Record" }} />
        <Stack.Screen name="Expenses" component={ExpensesScreen} options={{ title: "Records" }} />
        <Stack.Screen name="Categories" component={CategoriesScreen} options={{ title: "Categories" }} />
        <Stack.Screen name="Accounts" component={AccountsScreen} options={{ title: "Accounts & Payment Sources" }} />
        <Stack.Screen name="AccountTransactions" component={AccountTransactionsScreen} options={{ title: "Account Transactions" }} />
        <Stack.Screen name="Budget" component={BudgetScreen} options={{ title: "Budget" }} />
        <Stack.Screen name="Analytics" component={AnalyticsScreen} options={{ title: "Analytics" }} />
        <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: "Settings" }} />

        <Stack.Screen name="ProfileTheme" component={ProfileThemeScreen} options={{ title: "Profile & Theme" }} />
        <Stack.Screen name="BackupReset" component={BackupResetScreen} options={{ title: "Backup & Reset" }} />
        <Stack.Screen name="Feedback" component={FeedbackScreen} options={{ title: "Feedback" }} />
        <Stack.Screen name="About" component={AboutScreen} options={{ title: "About" }} />
        <Stack.Screen name="Security" component={SecurityScreen} options={{ title: "Security" }} />
        <Stack.Screen name="Notifications"component={NotificationSettingsScreen}options={{ title: "Notifications" }}/>
        <Stack.Screen
  name="Recurring"
  component={RecurringScreen}
/>
      </Stack.Navigator>
    </NavigationContainer>
  );
}
