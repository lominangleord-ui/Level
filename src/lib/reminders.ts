import { useGame } from "../store/game";
import { isReminderDue, reminderBody } from "./reminderPolicy";

let registrationPromise: Promise<ServiceWorkerRegistration> | null = null;

export function notificationsSupported() {
  return typeof window !== "undefined" && window.isSecureContext && "Notification" in window;
}

async function reminderWorker() {
  if (!navigator.serviceWorker) throw new Error("Service workers are not supported.");
  if (!registrationPromise) {
    registrationPromise = (async () => {
      const registration = await navigator.serviceWorker.register("/reminder-worker.js", { scope: "/" });
      if (registration.active) return registration;
      let timer = 0;
      try {
        return await Promise.race([
          navigator.serviceWorker.ready,
          new Promise<never>((_, reject) => {
            timer = window.setTimeout(() => reject(new Error("Notification worker did not become ready.")), 8000);
          }),
        ]);
      } finally { clearTimeout(timer); }
    })();
    void registrationPromise.catch(() => { registrationPromise = null; });
  }
  return registrationPromise;
}

/** Display-only worker: no push subscription, remote scheduler or model caching. */
export async function showSystemNotification(title: string, body: string, stillRelevant?: () => boolean): Promise<boolean> {
  if (!notificationsSupported() || Notification.permission !== "granted") return false;
  const options: NotificationOptions = { body, tag: "system-daily-reminder", icon: "/system-icon.svg" };
  if ("serviceWorker" in navigator) {
    try {
      const registration = await reminderWorker();
      if (stillRelevant && !stillRelevant()) return false;
      await registration.showNotification(title, options);
      return true;
    } catch { /* Desktop constructor is a fallback; mobile failures stay in-app. */ }
  }
  try {
    if (stillRelevant && !stillRelevant()) return false;
    const notification = new Notification(title, options);
    notification.onclick = () => { window.focus(); notification.close(); };
    return true;
  } catch { return false; }
}

/** Call directly from the toggle's click handler, before any asynchronous work. */
export async function enableRemindersFromGesture() {
  if (!notificationsSupported()) {
    useGame.getState().notify({
      title: "In-App Reminders Available",
      message: "This browser cannot enable system notifications here. Reopen reminders still work. On iPhone or iPad, add the app to your Home Screen where supported.",
      type: "System",
    });
    return;
  }
  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      useGame.getState().setRemindersEnabled(false);
      useGame.getState().notify({ title: "Reminders Not Enabled", message: "System notification permission was not granted. You will still get an in-app reminder when you return after six hours.", type: "System" });
      return;
    }
    useGame.getState().setRemindersEnabled(true);
    if ("serviceWorker" in navigator) void reminderWorker().catch(() => undefined);
  } catch {
    useGame.getState().notify({ title: "Permission Unavailable", message: "This browser could not request permission. Reopen reminders remain available without setup.", type: "System" });
  }
}

export async function checkDailyReminder(channel: "in-app" | "system", now = Date.now()) {
  const state = useGame.getState();
  if (state.screen !== "main" || !isReminderDue(state, now)) return;
  if (channel === "system" && !state.settings.remindersEnabled) return;

  // Commit the timestamp before awaiting browser APIs to prevent duplicate checks.
  useGame.setState({ lastReminderCheck: now });
  const body = reminderBody(now);
  if (channel === "system" && await showSystemNotification("The System / Daily Quest", body, () => {
    const current = useGame.getState();
    return current.questDate === state.questDate && !current.dailyCompleted && !current.dead && !current.inLockdown && !current.penalty;
  })) return;
  const current = useGame.getState();
  if (!current.dead && !current.inLockdown && !current.dailyCompleted) {
    current.notify({ title: "Daily Quest Reminder", message: body, type: "System" });
  }
}

export async function sendReminderTest() {
  const sent = await showSystemNotification("The System / Reminder Test", "Reminders are enabled. The open tab checks incomplete dailies every six hours. Nothing is scheduled after the app is closed.");
  if (!sent) useGame.getState().notify({ title: "Notification Test", message: "The browser could not display a system notification. Check site permission and operating-system settings. In-app reminders still work.", type: "System" });
  return sent;
}