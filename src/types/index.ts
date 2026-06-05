/**
 * Category Model
 */
export interface Category {
  id: number;
  name: string;
  icon: string;
}

/**
 * Expense Model
 */
export interface Expense {
  id: number;
  title: string;
  amount: number;
  categoryId: number;
  paymentMethod: string;
  note?: string;
  expenseDate: string;
}

/**
 * App Settings
 */
export interface Settings {
  monthlyBudget: number;
}

export type TransactionType = "EXPENSE" | "INCOME";

export interface Category {
  id: number;
  name: string;
  icon: string;
  type: TransactionType;
}