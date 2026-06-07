import * as Notifications from "expo-notifications";

/**
 * Show notifications while app is open.
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Ask user permission for local notifications.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();

  if (current.granted) {
    return true;
  }

  const result = await Notifications.requestPermissionsAsync();
  return result.granted;
}

/**
 * Cancel all scheduled ExpenseDG notifications.
 */
export async function cancelAllExpenseDGNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Smart expense reminder.
 * Daily at 8 PM for now.
 * Later we can make it smarter by checking if no record was added in 3 days.
 */
export async function scheduleSmartExpenseReminder(): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "ExpenseDG Reminder 💰",
      body: "Still tracking? Add your latest expenses to keep your money clear.",
      sound: true,
    },
    trigger: {
      hour: 20,
      minute: 0,
      repeats: true,
    } as any,
  });
}

/**
 * Weekly review reminder.
 * Sunday 7 PM.
 *
 * Expo weekday:
 * 1 = Sunday
 * 2 = Monday
 * ...
 * 7 = Saturday
 */
export async function scheduleWeeklyReviewReminder(): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Weekly money check 📊",
      body: "Review your spending from Monday to Sunday and plan the next week.",
      sound: true,
    },
    trigger: {
      weekday: 1,
      hour: 19,
      minute: 0,
      repeats: true,
    } as any,
  });
}

/**
 * Monthly backup reminder.
 * 1st day of every month at 10 AM.
 */
export async function scheduleMonthlyBackupReminder(): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Backup reminder 📦",
      body: "Create a backup of your ExpenseDG data to keep it safe.",
      sound: true,
    },
    trigger: {
      day: 1,
      hour: 10,
      minute: 0,
      repeats: true,
    } as any,
  });
}

/**
 * Enable default reminders.
 */
export async function enableDefaultNotifications(): Promise<boolean> {
  const allowed = await requestNotificationPermission();

  if (!allowed) {
    return false;
  }

  await cancelAllExpenseDGNotifications();

  await scheduleSmartExpenseReminder();
  await scheduleWeeklyReviewReminder();
  await scheduleMonthlyBackupReminder();

  return true;
}