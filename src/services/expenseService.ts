import { dbPromise } from "../database/db";
import { TransactionType } from "../types";

export type PeriodFilter = "DAY" | "WEEK" | "MONTH" | "YEAR";

export interface CreateExpenseInput {
  title: string;
  amount: number;
  categoryId: number;
  paymentMethod: string;
  note?: string;
  expenseDate: string;
  type: TransactionType;
}

export interface ExpenseListItem {
  id: number;
  title: string;
  amount: number;
  paymentMethod: string;
  note?: string;
  expenseDate: string;
  type: TransactionType;
  categoryName: string;
  categoryIcon: string;
}

/**
 * Returns start/end dates for selected filter.
 * This uses expenseDate, not createdAt.
 */
export function getDateRange(period: PeriodFilter, anchorDate: Date) {
  let start = new Date(anchorDate);
  let end = new Date(anchorDate);

  if (period === "DAY") {
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
  }

  if (period === "WEEK") {
    const day = anchorDate.getDay();
    start = new Date(anchorDate);
    start.setDate(anchorDate.getDate() - day);
    start.setHours(0, 0, 0, 0);

    end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
  }

  if (period === "MONTH") {
    start = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 1);
    end = new Date(anchorDate.getFullYear(), anchorDate.getMonth() + 1, 0);
    end.setHours(23, 59, 59, 999);
  }

  if (period === "YEAR") {
    start = new Date(anchorDate.getFullYear(), 0, 1);
    end = new Date(anchorDate.getFullYear(), 11, 31);
    end.setHours(23, 59, 59, 999);
  }

  return {
    startDate: start.toISOString(),
    endDate: end.toISOString(),
  };
}

/**
 * Add one income/expense record.
 */
export async function addExpense(input: CreateExpenseInput): Promise<void> {
  const db = await dbPromise;

  await db.runAsync(
    `
    INSERT INTO expenses
    (title, amount, categoryId, paymentMethod, note, expenseDate, type)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [
      input.title,
      input.amount,
      input.categoryId,
      input.paymentMethod,
      input.note ?? "",
      input.expenseDate,
      input.type,
    ]
  );
}

/**
 * Get records by selected period and type.
 */
export async function getExpensesByPeriod(
  period: PeriodFilter,
  anchorDate: Date,
  type: TransactionType
): Promise<ExpenseListItem[]> {
  const db = await dbPromise;
  const { startDate, endDate } = getDateRange(period, anchorDate);

  return await db.getAllAsync<ExpenseListItem>(
    `
    SELECT
      e.id,
      e.title,
      e.amount,
      e.paymentMethod,
      e.note,
      e.expenseDate,
      e.type,
      c.name as categoryName,
      c.icon as categoryIcon
    FROM expenses e
    LEFT JOIN categories c ON c.id = e.categoryId
    WHERE datetime(e.expenseDate) BETWEEN datetime(?) AND datetime(?)
      AND e.type = ?
    ORDER BY datetime(e.expenseDate) DESC
    `,
    [startDate, endDate, type]
  );
}

/**
 * Get total amount by selected period and type.
 */
export async function getTotalByTypeAndPeriod(
  type: TransactionType,
  period: PeriodFilter,
  anchorDate: Date
): Promise<number> {
  const db = await dbPromise;
  const { startDate, endDate } = getDateRange(period, anchorDate);

  const result = await db.getFirstAsync<{ total: number }>(
    `
    SELECT COALESCE(SUM(amount), 0) as total
    FROM expenses
    WHERE type = ?
      AND datetime(expenseDate) BETWEEN datetime(?) AND datetime(?)
    `,
    [type, startDate, endDate]
  );

  return result?.total ?? 0;
}

/**
 * Count records by selected period and type.
 */
export async function getCountByTypeAndPeriod(
  type: TransactionType,
  period: PeriodFilter,
  anchorDate: Date
): Promise<number> {
  const db = await dbPromise;
  const { startDate, endDate } = getDateRange(period, anchorDate);

  const result = await db.getFirstAsync<{ count: number }>(
    `
    SELECT COUNT(*) as count
    FROM expenses
    WHERE type = ?
      AND datetime(expenseDate) BETWEEN datetime(?) AND datetime(?)
    `,
    [type, startDate, endDate]
  );

  return result?.count ?? 0;
}

/**
 * Delete one record.
 */
export async function deleteExpense(id: number): Promise<void> {
  const db = await dbPromise;

  await db.runAsync(`DELETE FROM expenses WHERE id = ?`, [id]);
}

/**
 * Get one record by id.
 */
export async function getExpenseById(id: number): Promise<any> {
  const db = await dbPromise;

  return await db.getFirstAsync(
    `
    SELECT *
    FROM expenses
    WHERE id = ?
    `,
    [id]
  );
}

/**
 * Update one record.
 */
export async function updateExpense(
  id: number,
  title: string,
  amount: number,
  categoryId: number,
  paymentMethod: string,
  note: string,
  expenseDate: string,
  type: TransactionType
): Promise<void> {
  const db = await dbPromise;

  await db.runAsync(
    `
    UPDATE expenses
    SET title = ?,
        amount = ?,
        categoryId = ?,
        paymentMethod = ?,
        note = ?,
        expenseDate = ?,
        type = ?
    WHERE id = ?
    `,
    [title, amount, categoryId, paymentMethod, note, expenseDate, type, id]
  );
}

/**
 * Analytics by selected period and type.
 */
export async function getCategoryAnalyticsByPeriod(
  period: PeriodFilter,
  anchorDate: Date,
  type: TransactionType
) {
  const db = await dbPromise;
  const { startDate, endDate } = getDateRange(period, anchorDate);

  return await db.getAllAsync(
    `
    SELECT
      c.name,
      c.icon,
      COALESCE(SUM(e.amount), 0) as total
    FROM categories c
    LEFT JOIN expenses e
      ON c.id = e.categoryId
      AND datetime(e.expenseDate) BETWEEN datetime(?) AND datetime(?)
      AND e.type = ?
    WHERE c.type = ?
    GROUP BY c.id
    HAVING total > 0
    ORDER BY total DESC
    `,
    [startDate, endDate, type, type]
  );
}
/**
 * Get all income and expense records for selected period.
 */
export async function getAllRecordsByPeriod(
  period: PeriodFilter,
  anchorDate: Date
): Promise<ExpenseListItem[]> {
  const db = await dbPromise;
  const { startDate, endDate } = getDateRange(period, anchorDate);

  return await db.getAllAsync<ExpenseListItem>(
    `
    SELECT
      e.id,
      e.title,
      e.amount,
      e.paymentMethod,
      e.note,
      e.expenseDate,
      e.type,
      c.name as categoryName,
      c.icon as categoryIcon
    FROM expenses e
    LEFT JOIN categories c ON c.id = e.categoryId
    WHERE datetime(e.expenseDate) BETWEEN datetime(?) AND datetime(?)
    ORDER BY datetime(e.expenseDate) DESC
    `,
    [startDate, endDate]
  );
}
/**
 * Category analytics for ALL records.
 */
export async function getAllCategoryAnalyticsByPeriod(
  period: PeriodFilter,
  anchorDate: Date
) {
  const db = await dbPromise;
  const { startDate, endDate } = getDateRange(period, anchorDate);

  return await db.getAllAsync(
    `
    SELECT
      c.name,
      c.icon,
      c.type,
      COALESCE(SUM(e.amount), 0) as total
    FROM categories c
    LEFT JOIN expenses e
      ON c.id = e.categoryId
      AND datetime(e.expenseDate) BETWEEN datetime(?) AND datetime(?)
    GROUP BY c.id
    HAVING total > 0
    ORDER BY total DESC
    `,
    [startDate, endDate]
  );
}

/**
 * Last 6 months income/expense trend.
 */
export async function getSixMonthTrend(anchorDate: Date) {
  const months = [];

  for (let i = 5; i >= 0; i--) {
    const date = new Date(anchorDate);
    date.setMonth(anchorDate.getMonth() - i);

    const income = await getTotalByTypeAndPeriod("INCOME", "MONTH", date);
    const expense = await getTotalByTypeAndPeriod("EXPENSE", "MONTH", date);

    months.push({
      label: date.toLocaleString("default", { month: "short" }),
      income,
      expense,
      balance: income - expense,
    });
  }

  return months;
}
/**
 * Calculate current daily logging streak.
 * Counts how many consecutive days have at least one record.
 */
export async function getExpenseStreak(): Promise<number> {
  const db = await dbPromise;

  const rows = await db.getAllAsync<{ expenseDate: string }>(
    `
    SELECT DISTINCT date(expenseDate) as expenseDate
    FROM expenses
    ORDER BY date(expenseDate) DESC
    `
  );

  const loggedDates = new Set(
    rows.map((row) => row.expenseDate)
  );

  let streak = 0;
  const currentDate = new Date();

  while (true) {
    const dateKey = currentDate.toISOString().split("T")[0];

    if (loggedDates.has(dateKey)) {
      streak += 1;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}