/**
 * Transaction type.
 * EXPENSE = money going out.
 * INCOME = money coming in.
 */
export type TransactionType = "EXPENSE" | "INCOME";

/**
 * Category model.
 * Categories belong to either EXPENSE or INCOME.
 */
export interface Category {
  id: number;
  name: string;
  icon: string;
  type: TransactionType;
}

/**
 * Transaction model.
 * We still call the table "expenses" in SQLite,
 * but in the app it now stores both income and expenses.
 */
export interface Expense {
  id: number;
  title: string;
  amount: number;
  categoryId: number;
  paymentMethod: string;
  note?: string;
  expenseDate: string;
  type: TransactionType;
}

/**
 * App settings.
 */
export interface Settings {
  monthlyBudget: number;
}

/**
 * User profile.
 */
export interface UserProfile {
  userName: string;
  currencySymbol: string;
  savingsGoal: number;
}