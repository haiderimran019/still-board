/**
 * The board, kept in the app's own private folder in your Google Drive.
 *
 * `appDataFolder` is a hidden space Drive gives each app. It does not appear
 * in your Drive, it does not count the app as having access to your files,
 * and no other app — or person — can read it. One file, always the same name,
 * overwritten each time: a backup, not a history.
 */

const FILES = 'https://www.googleapis.com/drive/v3/files';
const UPLOAD = 'https://www.googleapis.com/upload/drive/v3/files';
const NAME = 'board-backup.json';

export type DriveResult<T> = { ok: true; value: T } | { ok: false; reason: string };

function headers(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}

async function failure(r: Response, fallback: string): Promise<string> {
  try {
    const body = (await r.json()) as { error?: { message?: string } };
    return body.error?.message ?? fallback;
  } catch {
    return fallback;
  }
}

/** The id of the existing backup, or null if this is the first one. */
async function findExisting(token: string): Promise<DriveResult<string | null>> {
  try {
    const url = `${FILES}?spaces=appDataFolder&fields=files(id)&q=${encodeURIComponent(
      `name='${NAME}'`
    )}`;
    const r = await fetch(url, { headers: headers(token) });
    if (!r.ok) return { ok: false, reason: await failure(r, 'Drive would not answer.') };
    const body = (await r.json()) as { files?: { id: string }[] };
    return { ok: true, value: body.files?.[0]?.id ?? null };
  } catch {
    return { ok: false, reason: 'No connection to Drive.' };
  }
}

export async function upload(token: string, json: string): Promise<DriveResult<'saved'>> {
  const existing = await findExisting(token);
  if (!existing.ok) return existing;

  const id = existing.value;
  const metadata = id
    ? {}
    : { name: NAME, parents: ['appDataFolder'], mimeType: 'application/json' };

  // Drive's multipart upload: the metadata part, then the file itself.
  const boundary = 'still-boundary-7f3a9c';
  const body =
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\nContent-Type: application/json\r\n\r\n` +
    `${json}\r\n--${boundary}--`;

  try {
    const r = await fetch(`${UPLOAD}${id ? `/${id}` : ''}?uploadType=multipart`, {
      method: id ? 'PATCH' : 'POST',
      headers: {
        ...headers(token),
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body,
    });
    if (!r.ok) return { ok: false, reason: await failure(r, 'Drive refused the upload.') };
    return { ok: true, value: 'saved' };
  } catch {
    return { ok: false, reason: 'No connection to Drive.' };
  }
}

/** The backup's contents, or null when there has never been one. */
export async function download(token: string): Promise<DriveResult<string | null>> {
  const existing = await findExisting(token);
  if (!existing.ok) return existing;
  if (existing.value === null) return { ok: true, value: null };

  try {
    const r = await fetch(`${FILES}/${existing.value}?alt=media`, { headers: headers(token) });
    if (!r.ok) return { ok: false, reason: await failure(r, 'Drive would not hand it back.') };
    return { ok: true, value: await r.text() };
  } catch {
    return { ok: false, reason: 'No connection to Drive.' };
  }
}
