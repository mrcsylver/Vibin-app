import { Linking, Platform } from 'react-native';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';

export type PermissionState = {
  /** Device-level location services (the OS toggle, not the app grant). */
  servicesEnabled: boolean;
  locationForeground: boolean;
  locationBackground: boolean;
  notifications: boolean;
  /** The user denied location and iOS/Android will no longer show a prompt. */
  locationBlocked: boolean;
  /** Same for notifications — the only way back is the Settings app. */
  notificationsBlocked: boolean;
};

export const UNKNOWN_PERMISSIONS: PermissionState = {
  servicesEnabled: true,
  locationForeground: false,
  locationBackground: false,
  notifications: false,
  locationBlocked: false,
  notificationsBlocked: false,
};

async function ensureAndroidChannels(): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }
  await Notifications.setNotificationChannelAsync('likes', {
    name: 'Track likes',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

type NotificationState = { granted: boolean; blocked: boolean };

function readNotificationGrant(response: Notifications.NotificationPermissionsStatus): boolean {
  return (
    response.granted ||
    response.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  );
}

async function ensureNotifications(): Promise<NotificationState> {
  try {
    await ensureAndroidChannels();

    const current = await Notifications.getPermissionsAsync();
    if (readNotificationGrant(current)) {
      return { granted: true, blocked: false };
    }
    if (!current.canAskAgain) {
      return { granted: false, blocked: true };
    }

    const asked = await Notifications.requestPermissionsAsync();
    return { granted: readNotificationGrant(asked), blocked: !asked.canAskAgain };
  } catch {
    return { granted: false, blocked: false };
  }
}

/**
 * Ask for everything the radar needs, in the order the platforms expect:
 * foreground location first, then the "Always" upgrade, then notifications.
 *
 * Safe to call repeatedly — an already-granted permission short-circuits, and a
 * permanently denied one is reported rather than re-prompted.
 */
export async function ensurePermissions(): Promise<PermissionState> {
  const servicesEnabled = await Location.hasServicesEnabledAsync().catch(() => true);

  let foreground = await Location.getForegroundPermissionsAsync();
  if (!foreground.granted && foreground.canAskAgain) {
    foreground = await Location.requestForegroundPermissionsAsync();
  }

  if (!foreground.granted) {
    const notifications = await ensureNotifications();
    return {
      servicesEnabled,
      locationForeground: false,
      locationBackground: false,
      locationBlocked: !foreground.canAskAgain,
      notifications: notifications.granted,
      notificationsBlocked: notifications.blocked,
    };
  }

  // Only meaningful once foreground is granted; both platforms require that
  // order, and a failure here must never block the app.
  let background = false;
  try {
    let current = await Location.getBackgroundPermissionsAsync();
    if (!current.granted && current.canAskAgain) {
      current = await Location.requestBackgroundPermissionsAsync();
    }
    background = current.granted;
  } catch {
    background = false;
  }

  const notifications = await ensureNotifications();

  return {
    servicesEnabled,
    locationForeground: true,
    locationBackground: background,
    locationBlocked: false,
    notifications: notifications.granted,
    notificationsBlocked: notifications.blocked,
  };
}

/** Read current grants without ever showing a prompt. */
export async function readPermissions(): Promise<PermissionState> {
  const [servicesEnabled, foreground, notifications] = await Promise.all([
    Location.hasServicesEnabledAsync().catch(() => true),
    Location.getForegroundPermissionsAsync(),
    Notifications.getPermissionsAsync().catch(() => null),
  ]);

  let background = false;
  if (foreground.granted) {
    background = await Location.getBackgroundPermissionsAsync()
      .then((result) => result.granted)
      .catch(() => false);
  }

  return {
    servicesEnabled,
    locationForeground: foreground.granted,
    locationBackground: background,
    locationBlocked: !foreground.granted && !foreground.canAskAgain,
    notifications: notifications ? readNotificationGrant(notifications) : false,
    notificationsBlocked: notifications ? !notifications.granted && !notifications.canAskAgain : false,
  };
}

export async function openAppSettings(): Promise<void> {
  await Linking.openSettings().catch(() => undefined);
}
