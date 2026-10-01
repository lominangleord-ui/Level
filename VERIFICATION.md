# Verification and deployment

This is a static Vite/React app. Deploy the normal Vite output (`dist`) on Vercel; no database, accounts, API routes, paid services or scheduled server jobs are required. MoveNet and fonts download from public CDNs in the browser. Camera video never leaves the device.

## Available checks

The coding environment can run the production build and returns TypeScript diagnostics on file edits, but it has no shell or browser/device runner. Builds were checked after each implementation stage. The commands and physical-device checks below still need to be run locally; they have not been reported as executed.

```sh
npx tsc --noEmit
npx tsx --test tests/regression.test.ts
npm run build
```

The regression suite covers cosmetic-only migration, shared loot, earned XP, recovery use, onboarding preservation, target ramps, frozen daily targets, penalty catch-up, death idempotency, persisted hardcore recovery, invalid imports, same-side geometry, EMA, imperfect-rep cycles and reminder suppression.

## Manual checks

1. Export an existing save before testing. Import it into the updated app. In Inventory, confirm only Recovery Potion, Stamina Draft and owned HUD themes remain. A previously selected cosmetic theme should stay selected. Applying System Blue must always work. Gear, XP boosts and remote settings must not return after reload.
2. Create a fresh Balanced hunter. Confirm the boot sequence completes and retains the chosen name, class and portrait. Confirm 50 push-ups, 50 sit-ups, 50 squats and 1 km. Split each total across several logs; gold and fatigue must advance only for newly credited progress.
3. On Vite's development server, obtain the store with `const { useGame } = await import('/src/store/game.ts')` in DevTools. Test levels with `useGame.setState({ level: 20, dailyTargetLevel: null, push: 0, sit: 0, squat: 0, run: 0, dailyCompleted: false })`. Targets should be 75/75/75/5.5 km. At level 40 and later, they should be 100/100/100/10 km. Starting a set freezes that day's level; level edits will not deliberately move a started day's goalposts.
4. Test the specialized classes on a disposable save. Assassin starts core/squats at 60 and caps at 115; Monarch starts push-ups at 60 and caps at 120; Vanguard starts runs at 1.5 km and caps at 12 km. Balanced receives no XP multiplier. The class +10% is tied to its harder training. There are no gear, potion, theme or Igris XP multipliers.
5. At level 1, force `useGame.setState({ penalty: true, inLockdown: true, penaltyTargets: null, penaltyEnd: Date.now() + 21600000 })`. Confirm 100 push-ups, 100 sit-ups and 2 km in both the screen and submission checks. At the Balanced cap, the penalty is 200/200/20 km. Clear the penalty and confirm the original cosmetic theme returns.
6. Force a timer death with `useGame.setState({ penalty: true, inLockdown: true, penaltyEnd: Date.now() - 1, hp: 15 })`. After one tick, death should clear both penalty flags. Leave it open for 10 seconds: the sound, pact breach and death transition must not repeat. There is no Graveyard.
7. Tap CAM after scrolling far down the page. Test a phone portrait viewport, phone landscape viewport and desktop. It must open at the viewport immediately, above queued notifications, not at the document bottom. The positioning guide must be exercise-specific. Deny permission, close, then retry: no hidden camera stream should remain active.
8. Time first camera startup and a second startup. The first model download still needs internet; later sessions share a warmed model. Hold a stable pose briefly, then move through the relaxed angle ranges. Try natural imperfect reps, stationary movement, an obscured joint, and squats with ankles cropped. Only a stable down-and-return cycle should count. Closing with reps saves them once; reopening must start at zero. Compare counted reps with a real human count on each device.
9. Record the idle dashboard in the browser Performance panel, scroll and switch tabs. The background is capped at about 30 fps with 67-73 sprite-based motes, depending on rank; there should be no per-particle canvas shadow rendering or per-panel backdrop blur. Opening a modal freezes ambient drawing. Backgrounding the tab cancels its loop. The roll-open, gate, count-up, scan and reward effects should still be visible.
10. For a reopen reminder, set today's quest dates, clear death/penalty flags, and set `lastReminderCheck: Date.now() - 7 * 3600000` with `dailyCompleted: false`. Reload: one in-app reminder should appear. The timestamp must advance so returning again does not duplicate it. Completing all dailies suppresses reminders.
11. Enable Reminders in Settings using the button gesture and grant permission. Click Send Test Notification, then background the open tab. Set an overdue reminder timestamp in a second test and allow the 15-minute poll to run. Confirm a system notification, where supported. Permission denial and unsupported browsers must fall back to in-app behavior without crashes. A closed app has no six-hour scheduler. Sleeping tabs can delay delivery, and iOS requires supported Home Screen installation.
12. Enable Hardcore, resurrect, reload before entering the new name, then awaken. The pending debuff should still apply once: STR/AGI/VIT are each reduced by 1 and the recovery counter is 3. After three earned levels, the reduction is restored. Invalid imported JSON must not overwrite the current save.

## Reminder limitations

`public/reminder-worker.js` only displays notifications requested by an open page and handles notification clicks. It does not use Web Push, background sync, server cron, or a fetch cache. It cannot wake a closed app on a six-hour schedule and does not cache stale TensorFlow/model files. The web manifest supplies optional Home Screen metadata; installation and notification support remain browser-dependent.

## Local commitments

Blood Pact remains optional, voluntary and local. Its ledger records promises but contacts nobody, charges nobody and cannot enforce real-world forfeits or prevent a user restoring their own backup. Removing the remote integration does not silently promise otherwise.