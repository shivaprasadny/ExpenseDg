import { dbPromise } from "../database/db";

/**
 * Get smart spending insights.
 * These are AI-style messages generated from local SQLite data.
 */
export async function getSmartInsights(): Promise<string[]> {
  const db = await dbPromise;

  const now = new Date();

  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

  const currentExpense = await getExpenseTotalBetween(
    currentMonthStart,
    currentMonthEnd
  );

  const previousExpense = await getExpenseTotalBetween(
    previousMonthStart,
    previousMonthEnd
  );

  const currentIncome = await getIncomeTotalBetween(
    currentMonthStart,
    currentMonthEnd
  );

  const topCategory = await getTopExpenseCategoryBetween(
    currentMonthStart,
    currentMonthEnd
  );

  const biggestExpense = await getBiggestExpenseBetween(
    currentMonthStart,
    currentMonthEnd
  );

  const insights: string[] = [];

  if (previousExpense > 0) {
    const difference = currentExpense - previousExpense;
    const percent = Math.abs((difference / previousExpense) * 100).toFixed(0);

    if (difference > 0) {
      insights.push(`You spent ${percent}% more than last month.`);
    } else if (difference < 0) {
      insights.push(`Nice! You spent ${percent}% less than last month.`);
    }
  }

  if (topCategory) {
    insights.push(
      `Your top spending category is ${topCategory.icon} ${topCategory.name} at $${topCategory.total.toFixed(2)}.`
    );
  }

  if (biggestExpense) {
    insights.push(
      `Your biggest expense this month is ${biggestExpense.title} at $${biggestExpense.amount.toFixed(2)}.`
    );
  }

  if (currentIncome > 0) {
    const savings = currentIncome - currentExpense;

    if (savings > 0) {
      insights.push(`You are ahead by $${savings.toFixed(2)} this month.`);
    } else {
      insights.push(`Your expenses are higher than income this month.`);
    }
  }

  if (insights.length === 0) {
    insights.push("Add more records to unlock smart insights.");
  }

  return insights.slice(0, 3);
}

/**
 * Expense total between two dates.
 */
async function getExpenseTotalBetween(start: Date, end: Date): Promise<number> {
  const db = await dbPromise;

  const result = await db.getFirstAsync<{ total: number }>(
    `
    SELECT COALESCE(SUM(amount), 0) as total
    FROM expenses
    WHERE type = 'EXPENSE'
      AND datetime(expenseDate) BETWEEN datetime(?) AND datetime(?)
    `,
    [start.toISOString(), end.toISOString()]
  );

  return result?.total ?? 0;
}

/**
 * Income total between two dates.
 */
async function getIncomeTotalBetween(start: Date, end: Date): Promise<number> {
  const db = await dbPromise;

  const result = await db.getFirstAsync<{ total: number }>(
    `
    SELECT COALESCE(SUM(amount), 0) as total
    FROM expenses
    WHERE type = 'INCOME'
      AND datetime(expenseDate) BETWEEN datetime(?) AND datetime(?)
    `,
    [start.toISOString(), end.toISOString()]
  );

  return result?.total ?? 0;
}

/**
 * Find top spending category between two dates.
 */
async function getTopExpenseCategoryBetween(start: Date, end: Date) {
  const db = await dbPromise;

  return await db.getFirstAsync<{
    name: string;
    icon: string;
    total: number;
  }>(
    `
    SELECT
      c.name,
      c.icon,
      COALESCE(SUM(e.amount), 0) as total
    FROM expenses e
    LEFT JOIN categories c ON c.id = e.categoryId
    WHERE e.type = 'EXPENSE'
      AND datetime(e.expenseDate) BETWEEN datetime(?) AND datetime(?)
    GROUP BY c.id
    ORDER BY total DESC
    LIMIT 1
    `,
    [start.toISOString(), end.toISOString()]
  );
}

/**
 * Find biggest expense between two dates.
 */
async function getBiggestExpenseBetween(start: Date, end: Date) {
  const db = await dbPromise;

  return await db.getFirstAsync<{
    title: string;
    amount: number;
  }>(
    `
    SELECT title, amount
    FROM expenses
    WHERE type = 'EXPENSE'
      AND datetime(expenseDate) BETWEEN datetime(?) AND datetime(?)
    ORDER BY amount DESC
    LIMIT 1
    `,
    [start.toISOString(), end.toISOString()]
  );
}