import { useShallow } from "zustand/react/shallow";
import { useGame } from "../store/game";
import { useUi } from "../store/ui";
import { ITEMS, SHOP_ITEMS } from "../data";
import { SystemWindow } from "./SystemWindow";

export function InventoryModal() {
  const open = useUi((s) => s.inventoryOpen);
  const closeAll = useUi((s) => s.closeAll);
  const s = useGame(useShallow((state) => ({
    gold: state.gold,
    inventory: state.inventory,
    hudTheme: state.hudTheme,
    potions: state.potions,
    staminaDrafts: state.staminaDrafts,
    hp: state.hp,
    hpMax: state.hpMax,
    mp: state.mp,
    mpMax: state.mpMax,
    fatigueLevel: state.fatigueLevel,
    blocked: state.inLockdown || state.dead,
    buyItem: state.buyItem,
    equipItem: state.equipItem,
    consumePotion: state.consumePotion,
    consumeStamina: state.consumeStamina,
  })));

  if (!open) return null;
  const owned = ITEMS.filter((item) => s.inventory.includes(item.id));

  return (
    <div className="fixed inset-0 z-[65] sys-backdrop flex items-center justify-center p-3 sm:p-6" role="dialog" aria-modal="true" aria-label="Inventory">
      <div className="w-full max-w-[520px] max-h-[88dvh] overflow-y-auto">
        <SystemWindow title="INVENTORY">
          <div className="flex items-center justify-between mb-3">
            <span className="font-mono text-[15px] text-[color:var(--gold)]">{s.gold.toLocaleString()} GOLD</span>
            <button onClick={closeAll} className="sl-btn px-3 py-1 text-[10px]">CLOSE</button>
          </div>

          <p className="text-[12px] text-[color:var(--text-mid)] mb-3">
            Recovery, not shortcuts. No gear slots, passive XP bonuses or permanent boosts.
          </p>
          <div className="space-y-2 mb-4">
            {SHOP_ITEMS.map((item) => {
              const recovery = item.kind === "recovery";
              const count = recovery ? s.potions : s.staminaDrafts;
              const canUse = count > 0 && !s.blocked && (recovery
                ? s.hp < s.hpMax || s.mp < s.mpMax
                : s.fatigueLevel > 0);
              return (
                <div key={item.id} className="p-3 border border-[#ffffff12] bg-[#04101d66]">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-sys text-[13px] font-semibold text-[color:var(--text-bright)]">{item.name}</div>
                      <div className="text-[11px] text-[color:var(--text)] mt-1">{item.desc}</div>
                    </div>
                    <span className="font-mono text-[12px] text-[color:var(--green)] shrink-0">HELD {count}</span>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button className="sl-btn flex-1 text-[10px]" disabled={s.blocked || s.gold < item.cost} onClick={() => s.buyItem(item.id)}>
                      BUY / {item.cost} GOLD
                    </button>
                    <button className="sl-btn sl-btn-gold flex-1 text-[10px]" disabled={!canUse} onClick={recovery ? s.consumePotion : s.consumeStamina}>
                      USE
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="font-sys text-[9px] tracking-[0.3em] text-[color:var(--text-dim)] uppercase mb-2">Cosmetic HUD Themes</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {owned.map((item) => {
              const selected = s.hudTheme === item.theme;
              return (
                <button key={item.id} onClick={() => s.equipItem(item.id)} aria-pressed={selected} className="p-3 border text-left transition-all" style={{
                  borderColor: selected ? "var(--cyan)" : "#ffffff12",
                  background: selected ? "var(--cyan-glow)" : "#04101d66",
                }}>
                  <div className="font-sys text-[11px] font-semibold text-[color:var(--text-bright)]">{item.name}</div>
                  <div className="font-mono text-[9px] mt-2 text-[color:var(--cyan-bright)]">{selected ? "ACTIVE" : "APPLY THEME"}</div>
                </button>
              );
            })}
          </div>
          <p className="text-[10.5px] text-[color:var(--text)] mt-3">Unlock Shadow Purple and Monarch Gold through Loot Boxes or Gate clears. System Blue is always available.</p>
        </SystemWindow>
      </div>
    </div>
  );
}