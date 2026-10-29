import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { APP_NAME } from '../config';

/**
 * Local reminders for notes in Now.
 *
 * Local only — nothing leaves the phone, which keeps the app's offline
 * promise intact and means there is no server to trust with your to-do list.
 * The notification's identifier *is* the note's id, so a note can only ever
 * have one reminder and cancelling needs nothing stored alongside it.
 */

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    // A task board should not make noise at you.
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

let channelReady = false;

async function prepareAndroid(): Promise<void> {
  if (Platform.OS !== 'android' || channelReady) return;
  await Notifications.setNotificationChannelAsync('reminders', {
    name: 'Note reminders',
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: null,
    vibrationPattern: [0, 120],
  });
  channelReady = true;
}

/**
 * Asked for the first time someone actually sets a reminder, never at launch.
 * A permission box on first open, before the app has shown it is worth
 * anything, is how you get told no permanently.
 */
export async function ensureAllowed(): Promise<boolean> {
  try {
    await prepareAndroid();
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    if (!current.canAskAgain) return false;
    const asked = await Notifications.requestPermissionsAsync();
    return asked.granted;
  } catch {
    return false;
  }
}

/** Replaces any reminder already on this note. */
export async function schedule(noteId: string, text: string, at: number): Promise<void> {
  await cancel(noteId);
  try {
    await Notifications.scheduleNotificationAsync({
      identifier: noteId,
      content: {
        title: APP_NAME,
        body: text,
        sound: undefined,
        ...(Platform.OS === 'android' ? { channelId: 'reminders' } : null),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(at),
      },
    });
  } catch {
    // The reminder is stored on the note either way; a phone that refuses to
    // schedule it must not take the edit down with it.
  }
}

export async function cancel(noteId: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(noteId);
  } catch {
    // Nothing scheduled under that id, which is the outcome we wanted anyway.
  }
}
