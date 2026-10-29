# 14 — The first run, and the accessibility pass

The last two things on the original plan. One adds a screen; the other mostly
removes ways the board could fail someone.

---

## The welcome

`src/screens/Welcome.tsx`, shown once, remembered under the pref `welcomed`.

One screen, not a carousel. Four panes with dots underneath would be four
chances to tap Skip, and what has to be said here takes twenty seconds to
read: there are four places to put a thought, and today holds seven. The
sections are drawn as the notes they will become, with the same tilt the real
ones have, because the board teaches itself faster than a sentence about it.

It sits **over** a board that has already loaded, so dismissing it reveals
something settled rather than a spinner. `useWelcome()` returns `null` while
the answer is still coming off disk — showing the welcome for one frame to
someone on their hundredth launch would be worse than never showing it — and
a read that fails is treated as "already seen", because a welcome screen that
reappears every launch is the kind of bug people uninstall over.

---

## Accessibility

### The thing that was actually broken

Every gesture on this board — drag to reorder, swipe right to edit, swipe
left to delete — is **unavailable** with a screen reader on. TalkBack and
VoiceOver take the touch gestures over for their own navigation, so a note
that can only be moved by dragging cannot be moved at all. The same is true
for a hand that cannot hold a press steady for 450ms.

`src/board/noteActions.ts` gives every gesture a twin, offered through the
platform's actions menu: finish, move up, move down, move to each of the
other three sections, drop. Not a lesser path bolted on — for some people it
is the only path, so it covers the whole set. Tapping already opens the note,
which is why there is no "edit" action.

Each one says what it did afterwards. A screen reader gives no feedback of
its own for a custom action, so without `actionSaid()` the note would simply
move and the person would be told nothing.

### The second thing that was broken

The circle you tap to finish a note had `accessibilityRole="checkbox"` and a
label, and **could never be focused**. The note around it is marked
`accessible`, which collapses the whole card into one element, so nothing
nested inside it is reachable. The label was promising something that was not
there. It is now explicitly hidden, and finishing is one of the actions
above.

### Reduced motion

`src/feel/motion.ts`. iOS calls it Reduce Motion, Android calls it Remove
animations, and until now the board ignored both.

Honoured by: notes rising into place, the finishing sequence, the swipe-away,
and every sheet's slide. **Not** honoured by the drag, which follows your
finger and is the thing itself rather than a flourish on top of it.

One subscription for the whole app rather than one per note — a board of
twenty would otherwise hold twenty listeners for a value that is the same for
all of them. `ms(260, calm)` returns 0 rather than skipping the animation, so
Animated still runs the sequence and still fires its callback, and nothing
downstream has to know the difference.

### The rest

| What | Where |
| --- | --- |
| Finished / dropped is now spoken, not only shown | `accessibilityLiveRegion` on the notice in `BoardScreen` |
| Screen reader no longer wanders onto the board behind an open sheet | `accessibilityViewIsModal` on the three transparent sheets |
| Everything you tap clears 48dp, even where it is drawn shorter | `TAP_SLOP` in `theme/tokens.ts`, on 8 controls |
| Urgency, theme and section choices announce as grouped choices | `accessibilityRole="radiogroup"` |
| Large text no longer pushes the menu button off the header | `maxFontSizeMultiplier` on the wordmark and filter chips only — body and note text still scale all the way |

### What was already right

Worth recording so it does not get undone: every text colour clears 4.5:1 in
both themes (measured in `docs/07-design-tokens.md`); urgency carries a word
in every place it carries a colour, so red-green colour blindness costs you
nothing; the Now gauge says its state three ways at once; and section names
are real headers.

---

## Verified

- 109 assertions across 11 test files, including 7 new ones covering the
  action list, the round trip through the platform's action names, and the
  refusal to throw on an action we do not recognise
- `tsc --noEmit` clean
- `expo-doctor` 20/20
- Both platform bundles export

## Not verified

None of this has been run with TalkBack or VoiceOver actually switched on,
because nothing here has been run on a physical phone at all. The actions are
wired and tested as logic; whether the menu reads well out loud is a
judgement only a real device can make, and it is the first thing to check
after `eas build -p android --profile preview`.
