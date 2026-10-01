import { getItem } from "../data";
import type { GameState, LootRoll } from "../types";

/** A single reward path keeps the granted resource and its notification in sync. */
export function resolveLoot(state: GameState, roll: LootRoll) {
  let patch: Partial<GameState> = {};
  let message = "";

  if (roll.kind === "potions") {
    patch = { potions: state.potions + roll.amount };
    message = `<b>+${roll.amount} Recovery Potions</b><br/>Full HP and MP restoration when used.`;
  } else if (roll.kind === "token") {
    patch = { relapseTokens: state.relapseTokens + roll.amount };
    message = `<b>+${roll.amount} Relapse Token</b><br/>A way out of Lockdown.`;
  } else if (roll.kind === "gold") {
    const amount = Math.round(roll.amount * (state.shadows.includes("iron") ? 1.03 : 1));
    patch = { gold: state.gold + amount };
    message = `<b>+${amount} gold</b><br/>Spend it on recovery, not XP shortcuts.`;
  } else {
    const item = getItem(roll.themeId);
    if (item) {
      patch = {
        inventory: [...new Set([...state.inventory, item.id])],
        hudTheme: item.theme,
      };
      message = `<b>${item.name}</b><br/>Cosmetic theme unlocked and applied. Switch back any time.`;
    }
  }

  return { patch, message };
}