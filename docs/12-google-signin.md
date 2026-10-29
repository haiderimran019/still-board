# Google sign-in — what it needs, and whether it's worth it

Asked for during sprint 3. Not built. This is why, and what it would take.

## The part only you can do

Google sign-in needs an **OAuth client ID** per platform, created in your own
Google Cloud project. I can't create those — they're tied to your identity and
your billing account — and entering credentials on your behalf isn't something
I should be doing either. You'd need:

1. A project at <https://console.cloud.google.com>
2. The OAuth consent screen filled in (app name, support email, scopes)
3. Three client IDs: **Web**, **iOS** (needs the bundle ID), **Android**
   (needs the package name *and* the SHA-1 of your signing key)
4. For the Android one, a release keystore — which also has to exist before
   you can ship to the Play Store anyway

That's an afternoon of form-filling, and it's yours to do. Once you paste the
three IDs into a config file, the code side is roughly half a day.

## The part worth arguing about first

**Sign-in on its own does nothing for the user.** Right now every note lives
in SQLite on the phone. Signing in wouldn't back anything up, wouldn't move a
board to a new phone, and wouldn't let anyone share one. It would add a screen
between a student and their board, in exchange for nothing they can feel.

What people actually mean by "Google sign-up" is usually one of:

| What they want | What it actually needs |
|---|---|
| "Don't lose my notes if I lose my phone" | A backend, or a file export |
| "Same board on my phone and my laptop" | Sign-in **plus** sync, plus conflict handling |
| "Don't make me type a password" | Sign-in — but only once there's something to sign in *to* |

Your own brief puts accounts, cloud sync and sharing **out of scope** for the
MVP, and it was right to: sync is not a feature, it's a second product. Two
devices editing one board offline is a genuinely hard problem — the fractional
positions in `db/positions.ts` would need to survive two people reordering the
same section on two phones with no network.

## What I'd suggest instead, in order

1. **Export and import a board as a file** — half a day, no accounts, no
   server, no privacy questions. Covers "don't lose my notes" for most people
   and works offline, which matters on a patchy campus connection.
2. **Ship the MVP to your classmates and find out if anyone asks for sync.**
   They may not. A calm single-device board is a coherent product.
3. **Then** accounts and sync together, as their own sprint, with sign-in as
   the first step of it rather than a door to an empty room.

## If you want it anyway

Say so and I'll build it — it's your app and "users expect a Google button" is
a real answer. I'd need the three client IDs from step 3 above. The shape
would be `expo-auth-session/providers/Google`, the IDs in `src/config.ts`
beside `APP_NAME`, and a sign-in row that is skippable, so the board still
opens for someone who taps past it.
