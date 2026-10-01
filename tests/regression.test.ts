import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { ARCHETYPES, ITEMS, SHOP_ITEMS, computeTargets, computePenaltyTargets, rollLoot, POSE_THRESHOLDS, SQUAT_FALLBACK } from "../src/data.ts";
import { awardXP } from "../src/lib/progression.ts";
import { resolveLoot } from "../src/lib/loot.ts";
import { Smoother, type KP } from "../src/lib/pose.ts";
import { calibrationStatus, measurePose, RepTracker, type Measurement } from "../src/lib/repTracking.ts";
import { isReminderDue, REMINDER_INTERVAL_MS } from "../src/lib/reminderPolicy.ts";
import { PENALTY_MS, SAVE_KEY, todayISO } from "../src/lib/utils.ts";
import type { ArchetypeId, GameState } from "../src/types.ts";

const saved = new Map<string, string>();
Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  value: {
    getItem: (key: string) => saved.get(key) ?? null,
    setItem: (key: string, value: string) => saved.set(key, value),
    removeItem: (key: string) => saved.delete(key),
  },
});
const { useGame, normalizeSave, isSaveFile } = await import("../src/store/game.ts");

function fresh(overrides: Partial<GameState> = {}) {
  return normalizeSave({ name: "Test Hunter", ...overrides });
}
function reset(overrides: Partial<GameState> = {}) {
  const data = fresh(overrides);
  data.settings = { ...data.settings, screenShake: false, floatingNumbers: false };
  useGame.setState({ ...data, dead: false, levelUpFx: false, rankUpFx: null, shadowFx: null, deathCause: "", deathConfirm: false });
}
beforeEach(() => reset());

test("Balanced starts at 50/50/50/1 and reaches its exact cap at level 40", () => {
  assert.deepEqual(computeTargets("balanced", "classic", 1), { push: 50, sit: 50, squat: 50, run: 1 });
  assert.deepEqual(computeTargets("balanced", "classic", 20), { push: 75, sit: 75, squat: 75, run: 5.5 });
  for (const level of [40, 49, 50, 100]) {
    assert.deepEqual(computeTargets("balanced", "classic", level), { push: 100, sit: 100, squat: 100, run: 10 });
  }
});

test("All class ramps are monotonic and specialized classes pay their trade-off early", () => {
  for (const archetype of Object.keys(ARCHETYPES) as ArchetypeId[]) {
    let previous = computeTargets(archetype, "classic", 1);
    for (let level = 2; level <= 60; level++) {
      const targets = computeTargets(archetype, "classic", level);
      for (const key of ["push", "sit", "squat", "run"] as const) {
        assert.ok(targets[key] >= previous[key]);
        assert.equal(targets[key] % (key === "run" ? 0.5 : 5), 0);
      }
      previous = targets;
    }
  }
  assert.equal(computeTargets("assassin", "classic", 1).sit, 60);
  assert.equal(computeTargets("assassin", "classic", 40).sit, 115);
  assert.equal(computeTargets("monarch", "classic", 1).push, 60);
  assert.equal(computeTargets("monarch", "classic", 40).push, 120);
  assert.equal(computeTargets("vanguard", "classic", 1).run, 1.5);
  assert.equal(computeTargets("vanguard", "classic", 40).run, 12);
});

test("Recovery stays positive and penalties remain exactly twice the daily", () => {
  for (const mode of ["classic", "recovery", "overdrive"] as const) {
    const targets = computeTargets("balanced", mode, 1);
    assert.ok(targets.run > 0);
    assert.deepEqual(computePenaltyTargets(targets), { push: targets.push * 2, sit: targets.sit * 2, run: targets.run * 2 });
  }
});

test("Inventory is cosmetic only, shop is recovery only, and legacy equipment disappears", () => {
  assert.deepEqual(ITEMS.map((item) => item.id).sort((a, b) => a - b), [13, 14, 100]);
  assert.deepEqual(SHOP_ITEMS.map((item) => item.kind), ["recovery", "stamina"]);
  const state = normalizeSave({ name: "Legacy", inventory: [100, 1, 2, 10, 20, 13], equippedItemId: 10, xpBoostEnd: Date.now() + 900000, xpBoostMultiplier: 5 });
  assert.deepEqual(state.inventory, [100, 13]);
  assert.equal("equippedItemId" in state, false);
  assert.equal("xpBoostEnd" in state, false);
  assert.equal("graveyard" in state, false);
  assert.equal("webhookUrl" in state.settings, false);
});

test("Both themes are reachable from shared loot without duplicate theme rolls", () => {
  assert.deepEqual(rollLoot([100], () => 0.99), { kind: "theme", themeId: 13 });
  assert.deepEqual(rollLoot([100, 13], () => 0.99), { kind: "theme", themeId: 14 });
  assert.deepEqual(rollLoot([100, 13, 14], () => 0.99), { kind: "gold", amount: 60 });
  const state = fresh();
  const reward = resolveLoot(state, { kind: "potions", amount: 2 });
  assert.equal(reward.patch.potions, 2);
  assert.match(reward.message, /Recovery Potions/);
});

test("XP has no item, potion, theme or Igris multiplier", () => {
  const state = fresh({ inventory: [100, 13, 14], shadows: ["igris"], potions: 999 });
  assert.equal(awardXP(state, 100).effXP, 100);
  const specialized = fresh({ archetype: "monarch" });
  assert.equal(awardXP(specialized, 100).effXP, 110);
});

test("Recovery Potion restores HP and MP; Stamina Draft subtracts 40 without touching XP", () => {
  reset({ hp: 60, mp: 10, fatigueLevel: 65, gold: 100 });
  useGame.getState().buyPotion();
  useGame.getState().consumePotion();
  assert.equal(useGame.getState().hp, useGame.getState().hpMax);
  assert.equal(useGame.getState().mp, useGame.getState().mpMax);
  useGame.getState().buyItem(30);
  useGame.getState().consumeStamina();
  assert.equal(useGame.getState().fatigueLevel, 25);
  assert.equal(useGame.getState().xp, 0);
  assert.equal(useGame.getState().gold, 30);
});

test("Finishing onboarding preserves the hunter instead of importing an empty save", () => {
  useGame.getState().awaken("New Hunter", "assassin", "/avatars/hunter-2.jpg");
  useGame.getState().finishAwakening();
  assert.equal(useGame.getState().screen, "main");
  assert.equal(useGame.getState().name, "New Hunter");
  assert.equal(useGame.getState().archetype, "assassin");
  assert.equal(useGame.getState().avatar, "/avatars/hunter-2.jpg");
});

test("A level-up does not move the daily target; completion is paid only once", () => {
  for (const key of ["push", "sit", "squat", "run"] as const) useGame.getState().toggleCheck(key);
  const state = useGame.getState();
  assert.equal(state.level, 2);
  assert.equal(state.dailyTargetLevel, 1);
  assert.equal(state.getTargets().push, 50);
  assert.equal(state.dailyCompleted, true);
  assert.equal(state.history.length, 1);
  assert.match(state.history[0].items[0], /^50 /);
  useGame.getState().toggleCheck("push");
  useGame.getState().logExercise("push", 50);
  assert.equal(useGame.getState().pts, 8);
  assert.equal(useGame.getState().history.length, 1);
});

test("Death is a single transition and unresolved timers are not extended at midnight", () => {
  const now = Date.now();
  reset({ hp: 80, penalty: true, inLockdown: true, penaltyEnd: now - PENALTY_MS - 1000, questDate: "2000-01-01" });
  useGame.getState().tick();
  assert.equal(useGame.getState().hp, 40);
  assert.equal(useGame.getState().penaltyEnd, now + PENALTY_MS - 1000);
  reset({ hp: 15, penalty: true, inLockdown: true, penaltyEnd: now - 1, questDate: todayISO() });
  useGame.getState().tick();
  assert.equal(useGame.getState().dead, true);
  assert.equal(useGame.getState().penalty, false);
  assert.equal(useGame.getState().inLockdown, false);
  const state = useGame.getState();
  for (let tick = 0; tick < 10; tick++) state.tick();
  assert.equal(useGame.getState(), state);
});

test("Hardcore pending debuff survives persisted rehydration and recovers after three levels", async () => {
  useGame.setState({ settings: { ...useGame.getState().settings, hardcoreMode: true } });
  useGame.getState().resurrect();
  const serialized = saved.get(SAVE_KEY)!;
  assert.equal(useGame.getState().pendingHardcoreDebuff, true);
  useGame.setState({ pendingHardcoreDebuff: false });
  saved.set(SAVE_KEY, serialized);
  await useGame.persist.rehydrate();
  useGame.getState().awaken("Reborn", "balanced", "/avatars/hunter-1.jpg");
  useGame.getState().finishAwakening();
  const state = { ...useGame.getState() };
  assert.equal(state.str, 9);
  assert.equal(state.resurrectDebuff, 3);
  assert.equal(state.pendingHardcoreDebuff, false);
  awardXP(state, 500 + 650 + 845);
  assert.equal(state.level, 4);
  assert.equal(state.resurrectDebuff, 0);
  assert.equal(state.str, 13);
});

test("Invalid imports are rejected and expired titles cannot return via a save", () => {
  assert.equal(isSaveFile({ name: "Oops", level: 1 }), false);
  assert.throws(() => useGame.getState().importState({ screen: "main" }));
  assert.equal(normalizeSave({ name: "Hunter", level: 30, streak: 0, equippedTitle: 5 }).equippedTitle, null);
  assert.equal(normalizeSave({ name: "Hunter", level: 30, streak: 0, equippedTitle: 2 }).equippedTitle, 2);
  reset({ level: 30, streak: 0, notifiedTitles: [2, 5], equippedTitle: 2 });
  useGame.getState().equipTitle(5);
  assert.equal(useGame.getState().equippedTitle, 2);
});

const point = (name: string, x: number, y: number, score = 0.8): KP => ({ name, x, y, score });
test("Geometry selects a complete same-side chain, not whichever joint scores highest", () => {
  const points = [point("left_shoulder", 0, 0), point("left_elbow", 100, 0), point("left_wrist", 200, 0),
    point("right_shoulder", 5, 5, 0.99), point("right_elbow", 50, 50, 0.05), point("right_wrist", 205, 5, 0.99)];
  const result = measurePose(points, "push");
  assert.equal(result?.side, "left");
  assert.equal(result?.angle, 180);
  assert.equal(calibrationStatus(points, "push").good, true);
});

test("Squat fallback can calibrate and track without ankles", () => {
  const points = [point("left_hip", 100, 0), point("left_knee", 100, 100)];
  const result = measurePose(points, "squat");
  assert.equal(result?.fallback, true);
  assert.equal(result?.angle, 180);
  assert.equal(calibrationStatus(points, "squat").good, true);
});

test("EMA initializes from the first position and never smooths confidence", () => {
  const smoother = new Smoother();
  assert.equal(smoother.smooth([point("left_knee", 100, 80)])[0].x, 100);
  const next = smoother.smooth([point("left_knee", 200, 80, 0.4)])[0];
  assert.equal(next.x, 130);
  assert.equal(next.score, 0.4);
});

test("Forgiving imperfect reps count, while stationary jitter and lost tracking do not", () => {
  for (const exercise of ["push", "sit", "squat"] as const) {
    const config = POSE_THRESHOLDS[exercise];
    const tracker = new RepTracker();
    const sample = (angle: number): Measurement => ({ ...config, angle, side: "left", fallback: false });
    [config.up + 3, config.up + 3, config.down - 3, config.down - 3, config.up + 3, config.up + 3]
      .forEach((angle, index) => tracker.update(sample(angle), index * 100));
    assert.equal(tracker.count, 1);
    for (let index = 0; index < 20; index++) tracker.update(sample(config.up + 3), 1000 + index * 50);
    assert.equal(tracker.count, 1);
  }
  const tracker = new RepTracker();
  const sample = (angle: number): Measurement => ({ ...SQUAT_FALLBACK, angle, side: "left", fallback: true });
  [160, 160, 135, 135].forEach((angle, index) => tracker.update(sample(angle), index * 100));
  tracker.update(null, 2000);
  tracker.update(sample(160), 2100);
  tracker.update(sample(160), 2200);
  assert.equal(tracker.count, 0);
});

test("Six-hour reminders suppress completed, dead, penalized and locked hunters", () => {
  const now = Date.now();
  const state = { name: "Hunter", lastReminderCheck: now - REMINDER_INTERVAL_MS, dailyCompleted: false, dead: false, inLockdown: false, penalty: false };
  assert.equal(isReminderDue(state, now), true);
  assert.equal(isReminderDue({ ...state, lastReminderCheck: now - REMINDER_INTERVAL_MS + 1 }, now), false);
  for (const flag of ["dailyCompleted", "dead", "inLockdown", "penalty"] as const) assert.equal(isReminderDue({ ...state, [flag]: true }, now), false);
});