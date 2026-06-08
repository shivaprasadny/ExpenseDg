import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";

/**
 * Notification setting storage keys.
 * These keep user choices saved even after closing the app.
 */
const SMART_REMINDER_KEY = "EXPENSEDG_SMART_REMINDER";
const WEEKLY_REVIEW_KEY = "EXPENSEDG_WEEKLY_REVIEW";
const MONTHLY_BACKUP_KEY = "EXPENSEDG_MONTHLY_BACKUP";

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
 * Get saved notification settings.
 */
export async function getNotificationSettings() {
  const smartReminder = await AsyncStorage.getItem(SMART_REMINDER_KEY);
  const weeklyReview = await AsyncStorage.getItem(WEEKLY_REVIEW_KEY);
  const monthlyBackup = await AsyncStorage.getItem(MONTHLY_BACKUP_KEY);

  return {
    smartReminder: smartReminder !== "false",
    weeklyReview: weeklyReview !== "false",
    monthlyBackup: monthlyBackup !== "false",
  };
}

/**
 * Save notification settings.
 */
export async function saveNotificationSettings(settings: {
  smartReminder: boolean;
  weeklyReview: boolean;
  monthlyBackup: boolean;
}): Promise<void> {
  await AsyncStorage.setItem(SMART_REMINDER_KEY, String(settings.smartReminder));
  await AsyncStorage.setItem(WEEKLY_REVIEW_KEY, String(settings.weeklyReview));
  await AsyncStorage.setItem(MONTHLY_BACKUP_KEY, String(settings.monthlyBackup));
}

/**
 * Smart expense reminder.
 * Every 3 days.
 *
 * Note:
 * This repeats every 3 days from the time user saves settings.
 * Later we can make this smarter by checking the last transaction date.
 */
export async function scheduleSmartExpenseReminder(): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "ExpenseDG Reminder 💰",
      body: "You haven't tracked expenses recently. Add your latest income or expenses to stay on top of your money.",
      sound: true,
    },
    trigger: {
      type: "timeInterval",
      seconds: 60 * 60 * 24 * 3,
      repeats: true,
    } as any,
  });
}

/**
 * Weekly review reminder.
 * Sunday 6 PM local device time.
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
      title: "Weekly Money Review 📊",
      body: "Take 2 minutes to review your spending from Monday to Sunday and plan your next week.",
      sound: true,
    },
    trigger: {
      weekday: 1,
      hour: 18,
      minute: 0,
      repeats: true,
    } as any,
  });
}

/**
 * Monthly backup reminder.
 * 1st day of every month at 6 PM local device time.
 */
export async function scheduleMonthlyBackupReminder(): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Backup Reminder 📦",
      body: "Create a backup of your ExpenseDG data to keep it safe.",
      sound: true,
    },
    trigger: {
      day: 1,
      hour: 18,
      minute: 0,
      repeats: true,
    } as any,
  });
}

/**
 * Apply selected notification settings.
 */
export async function applyNotificationSettings(settings: {
  smartReminder: boolean;
  weeklyReview: boolean;
  monthlyBackup: boolean;
}): Promise<boolean> {
  const allowed = await requestNotificationPermission();

  if (!allowed) {
    return false;
  }

  await saveNotificationSettings(settings);
  await cancelAllExpenseDGNotifications();

  if (settings.smartReminder) {
    await scheduleSmartExpenseReminder();
  }

  if (settings.weeklyReview) {
    await scheduleWeeklyReviewReminder();
  }

  if (settings.monthlyBackup) {
    await scheduleMonthlyBackupReminder();
  }

  return true;
}

/**
 * Test notification.
 * Useful after installing build/TestFlight.
 */
export async function scheduleTestNotification(): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "ExpenseDG Test 🔔",
      body: "Local notifications are working.",
      sound: true,
    },
    trigger: {
      type: "timeInterval",
      seconds: 10,
    } as any,
  });
}