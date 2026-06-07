import { dbPromise } from "../database/db";

export interface JourneyMilestone {
  title: string;
  description: string;
  icon: string;
  completed: boolean;
}

/**
 * Build financial journey milestones from local SQLite data.
 */
export async function getFinancialJourney(): Promise<JourneyMilestone[]> {
  const db = await dbPromise;

  const totalRecords = await getCount(
    "SELECT COUNT(*) as count FROM expenses"
  );

  const incomeRecords = await getCount(
    "SELECT COUNT(*) as count FROM expenses WHERE type = 'INCOME'"
  );

  const expenseRecords = await getCount(
    "SELECT COUNT(*) as count FROM expenses WHERE type = 'EXPENSE'"
  );

  const totalIncome = await getTotal(
    "SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE type = 'INCOME'"
  );

  const totalExpense = await getTotal(
    "SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE type = 'EXPENSE'"
  );

  const savedAmount = totalIncome - totalExpense;

  return [
    {
      icon: "🌱",
      title: "First Record Added",
      description: "You started tracking your money.",
      completed: totalRecords >= 1,
    },
    {
      icon: "💼",
      title: "First Income Added",
      description: "You recorded your first income.",
      completed: incomeRecords >= 1,
    },
    {
      icon: "💸",
      title: "First Expense Added",
      description: "You recorded your first expense.",
      completed: expenseRecords >= 1,
    },
    {
      icon: "🔥",
      title: "50 Records Logged",
      description: "You are building a strong tracking habit.",
      completed: totalRecords >= 50,
    },
    {
      icon: "🏆",
      title: "100 Records Logged",
      description: "You reached 100 financial records.",
      completed: totalRecords >= 100,
    },
    {
      icon: "💰",
      title: "Saved $1,000",
      description: "Your income is ahead of your expenses by $1,000.",
      completed: savedAmount >= 1000,
    },
    {
      icon: "🚀",
      title: "Saved $5,000",
      description: "You reached a serious saving milestone.",
      completed: savedAmount >= 5000,
    },
  ];
}

/**
 * Helper for COUNT queries.
 */
async function getCount(query: string): Promise<number> {
  const db = await dbPromise;

  const result = await db.getFirstAsync<{ count: number }>(query);

  return result?.count ?? 0;
}

/**
 * Helper for SUM queries.
 */
async function getTotal(query: string): Promise<number> {
  const db = await dbPromise;

  const result = await db.getFirstAsync<{ total: number }>(query);

  return result?.total ?? 0;
}