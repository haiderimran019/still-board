import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

/**
 * A board as a file you hold yourself.
 *
 * No account, no network, no server to trust — the whole board goes into a
 * JSON file and wherever you choose to put it. On a patchy connection, and
 * for anyone who would rather not sign in to anything, this is the backup
 * that actually gets used.
 */

export type SaveResult = { ok: true } | { ok: false; reason: string };

export async function saveToFile(json: string, filename: string): Promise<SaveResult> {
  try {
    const file = new File(Paths.cache, filename);
    // A previous export of the same day would otherwise be in the way.
    if (file.exists) file.delete();
    file.create();
    file.write(json);

    if (!(await Sharing.isAvailableAsync())) {
      return { ok: false, reason: 'This device has nowhere to send the file to.' };
    }
    await Sharing.shareAsync(file.uri, {
      mimeType: 'application/json',
      dialogTitle: 'Save a copy of your board',
      UTI: 'public.json',
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: e instanceof Error ? e.message : 'The file could not be written.' };
  }
}

/** Returns the file's contents, or null if the picker was dismissed. */
export async function readFromFile(): Promise<string | null> {
  const picked = await DocumentPicker.getDocumentAsync({
    type: ['application/json', 'text/plain', '*/*'],
    copyToCacheDirectory: true,
  });
  if (picked.canceled || picked.assets.length === 0) return null;
  return new File(picked.assets[0].uri).text();
}
