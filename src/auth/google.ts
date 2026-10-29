import { Platform } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useEffect, useState } from 'react';

import { GOOGLE } from '../config';

/**
 * Signing in to Google, for backup and nothing else.
 *
 * Scope is deliberately the narrowest one that does the job:
 * `drive.appdata` gives access to a private folder belonging to this app
 * alone. It cannot see, list or touch anything else in your Drive — not one
 * other file — and no other app can see what it writes.
 *
 * The access token is held in memory for the session and never written down.
 * Keeping someone signed in permanently needs a refresh token, which needs a
 * server to hold the client secret, which is a backend this app does not
 * have and does not want. Backing up is a thing you choose to do, so signing
 * in at that moment is not a hardship.
 */

WebBrowser.maybeCompleteAuthSession();

/** The app's own private folder in Drive. Nothing else is readable. */
const DRIVE_APPDATA = 'https://www.googleapis.com/auth/drive.appdata';

export type Account = { email: string; name: string | null };

export function useGoogleAccount() {
  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: GOOGLE.androidClientId || undefined,
    iosClientId: GOOGLE.iosClientId || undefined,
    webClientId: GOOGLE.webClientId || undefined,
    scopes: ['openid', 'email', 'profile', DRIVE_APPDATA],
  });

  const [token, setToken] = useState<string | null>(null);
  const [account, setAccount] = useState<Account | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!response) return;
    if (response.type === 'error') {
      setError('Google turned the sign-in down.');
      setBusy(false);
      return;
    }
    if (response.type !== 'success') {
      setBusy(false);
      return;
    }

    const access = response.authentication?.accessToken ?? null;
    setToken(access);
    if (!access) {
      setError('Signed in, but no access was granted.');
      setBusy(false);
      return;
    }

    (async () => {
      try {
        const r = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${access}` },
        });
        const who = (await r.json()) as { email?: string; name?: string };
        setAccount({ email: who.email ?? 'your Google account', name: who.name ?? null });
      } catch {
        // Signed in and able to back up; we just can't put a name to it.
        setAccount({ email: 'your Google account', name: null });
      } finally {
        setBusy(false);
      }
    })();
  }, [response]);

  const signIn = useCallback(async () => {
    setError(null);
    setBusy(true);
    const result = await promptAsync();
    if (result.type !== 'success') setBusy(false);
  }, [promptAsync]);

  const signOut = useCallback(() => {
    setToken(null);
    setAccount(null);
    setError(null);
  }, []);

  return { ready: !!request, busy, token, account, error, signIn, signOut };
}

/**
 * Whether Google sign-in can run *on this phone*.
 *
 * Per-platform on purpose. `useAuthRequest` throws outright when the running
 * platform has no client ID, so asking "is any ID set?" would let an Android
 * phone mount a hook that cannot work. The question that matters is always
 * about the device in your hand.
 */
export function googleConfigured(): boolean {
  if (Platform.OS === 'android') return GOOGLE.androidClientId !== '';
  if (Platform.OS === 'ios') return GOOGLE.iosClientId !== '';
  return GOOGLE.webClientId !== '';
}
