# Verification and deployment

This is a static Vite/React app. Deploy the Vite `dist` output on Vercel; no database, accounts, API routes or paid server are required. MoveNet and fonts load from public CDNs on first use. Camera video never leaves the device. Back up your character via Settings > Export before replacing an older deployment.

## Checks

The coding environment can run the production build and returns edit-time TypeScript diagnostics, but has no shell or browser/device runner. Production builds ran after each development phase. Run these locally; they have not been claimed as executed here:

```sh
npx tsc --noEmit
npx tsx --test tests/regression.test.ts
npm run build
```

The regression suite covers rank boundaries, all nine path data sets, Gate targets and one-time clears, no XP from Gates or path skills, migrated saves, cosmetics before/after Job Change, affordable recovery, shields, signatures, the previous core quest/death mechanics, pose geometry and reminders.

## Manual checks

1. Export your existing save. Import it into this build. Former Urgent quests and `shadows[]` should be gone, but existing gold, inventory, workout history, titles and stats should remain. An existing level-40+ hunter with no path should see the Job Change ceremony on reload. Levels below 40 should still show the regular dashboard.
2. On a disposable save at levels 9, 10, 19, 20, 29, 30, 34, 35, 39 and 40, inspect the profile's public rank. B is 30-34, A is 35-39, S-Rank / National-Level begins at 40. S does not cap levels, but the Monarch Tier system becomes the internal progression after Job Change.
3. Cross level 40 through the Daily Quest or a Special Quest: the ceremony should replace an ordinary level-up presentation. Browse all nine class options, select one, cancel from confirmation, then confirm deliberately. Reload to confirm the permanent choice. A save already at 40 without a path should get the same ceremony. The reward-choice modal, if pending, should still be available afterward.
4. Open the PATH tab. At level 40 only Tier 1 is available; at 55/70/90/120 the following tiers become available, and Tier 5 stays available past 120. For Balanced Shadow Monarch in Classic Mode, Tier 1 is 150 squats and Tier 5 is 300. Other paths use their own signature exercise and archetype-specific targets. Adaptive Mode, when enabled, affects the displayed daily target and that day's Gate target consistently; cosmetics, shop items and XP boosts cannot reduce Gate requirements.
5. Tap ENTER GATE and verify it opens in the existing full-screen camera overlay, no countdown. Practice, pause or rest during a session; partial reps must not claim a clear. Once the target is reached in that session, confirm the tier becomes permanently cleared and cannot be rewarded twice. A cleared Gate awards its skill, title and a loot roll but NO XP, stat points, gold multiplier item or stat inflation. If the camera is unavailable, the Gate stays retryable; manual daily logging still works.
6. Check all nine tier lists render with the specified names and perks. Clear Shadow Extraction, then verify Igris appears only on the Shadow Monarch PATH tab, not as a generic level-1 Shadow roster. Titles from cleared Gates can be equipped and appear in the profile. Other Monarch lineages never see Shadow Extraction.
7. Clear a path's fatigue, gold or loot perk and compare before/after gains. Test Baran's Stamina Draft discount (30 to 24 gold), Frost's Recovery Potion clearing an extra 20 fatigue even if HP/MP are full, and Legia's Draft clearing 55 total fatigue. The potion already fully restores HP/MP; this fatigue benefit is the useful interpretation of "heals more." Check the Elixir restores both and clears fatigue. None of these effects increase XP.
8. For a shield path, miss exactly one day and confirm one shield charge is spent, preserving streak and HP; test two missing days with Tarnak's two charges after Tier 5. Reopen after Monday to confirm recharge. For a Tier-5 active Signature Move, use it twice on the same day (one reward only) and once the next day. Tarnak's final skill is a second passive shield charge, not a daily button.
9. Preview a foreign path's Sigil from a pre-40 Loot Box: it should stay cosmetic and inactive. Confirm a path, then buy its 60g Path Sigil or find it in loot. Its flourish should personalize the chosen theme. Apply/remove it freely and switch System Blue, Shadow Purple and Monarch Gold as before. Foreign path Sigils remain collectible teasers, not equippable perks.
10. Check the expanded shop: Recovery Potion, Stamina Draft, 90g Elixir, 150g Relapse Token, and 60g post-Job Sigil. Free Gate retries mean there is no Retry Charm. Loot includes 60g or rarer 120g gold, recovery, rare tokens, HUD themes and nine path Sigils, with no equippable XP-boosting gear.
11. Check a dismissible Special Quest still appears only after the daily clear and has no timer. Completing or dismissing it should not spawn a timed Urgent Gate. It cannot create or complete a Monarch Gate automatically.
12. On real phones and a desktop, test portrait, landscape and camera permission denial. Gate reps must count only one stable down-and-return motion; closing or changing session should release the camera. On an idle dashboard, confirm the background remains smooth, and that the window roll-open and Gate-clear feedback still render.

## Reminder limitations

`public/reminder-worker.js` displays page-requested notifications and registers best-effort Periodic Background Sync in supported installed Chromium PWAs. The browser controls its timing based on installation, engagement, battery, network and permission. Exact six-hour delivery after closing the page would require a push server and is not promised. Reopen reminders and open-tab checks still work without one. No TensorFlow model files are cached by this worker.

## Local commitments

Blood Pact is optional, voluntary and local. Its ledger contacts nobody, charges nobody and cannot prevent a hunter from restoring their own export. Iron Vow resets the Monarch path and items after death and keeps only the local pact ledger.