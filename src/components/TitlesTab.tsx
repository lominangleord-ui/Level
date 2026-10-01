import { useShallow } from "zustand/react/shallow";
import { useGame } from "../store/game";
import { TITLES, SHADOWS } from "../data";
import { SystemWindow } from "./SystemWindow";

export function TitlesTab() {
  const s = useGame(useShallow((state) => ({
    level: state.level, streak: state.streak,
    notifiedTitles: state.notifiedTitles, equippedTitle: state.equippedTitle,
    shadows: state.shadows,
  })));
  const unlockedIds = s.notifiedTitles;
  const equipTitle = useGame((st) => st.equipTitle);

  return (
    <div className="space-y-4">
      <SystemWindow title="TITLES">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {TITLES.map((t) => {
            // LIVE eligibility — mirrors the store's equipTitle() guard, so
            // a streak title whose streak has reset shows as EXPIRED here.
            const currentlyValid =
              (t.level == null || s.level >= t.level) &&
              (t.streak == null || s.streak >= t.streak);
            const everUnlocked = unlockedIds.includes(t.id);
            const expired = everUnlocked && !currentlyValid;
            const equipped = s.equippedTitle === t.id;
            return (
              <button
                key={t.id}
                disabled={!currentlyValid}
                onClick={() => equipTitle(t.id)}
                className="text-left p-2.5 border flex items-center gap-2.5 transition-all"
                style={{
                  borderColor: equipped
                    ? "var(--gold)"
                    : expired
                      ? "var(--red-dim)"
                      : "#ffffff12",
                  background: equipped ? "#ffc53d0d" : expired ? "#ff3b5206" : "#04101d66",
                  opacity: currentlyValid ? 1 : expired ? 0.55 : 0.38,
                  boxShadow: equipped ? "0 0 18px #ffc53d22" : "none",
                  cursor: currentlyValid ? "pointer" : "default",
                }}
              >
                <span className="text-2xl leading-none shrink-0">
                  {currentlyValid || expired ? t.icon : "🔒"}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-sys text-[12px] font-600 tracking-[0.1em] text-[color:var(--text-bright)]">
                    {t.name}
                  </div>
                  <div className="text-[10px] text-[color:var(--text)] mt-0.5">{t.desc}</div>
                </div>
                {equipped && (
                  <span className="font-sys text-[8px] tracking-[0.2em] text-[color:var(--gold)] shrink-0">
                    ACTIVE
                  </span>
                )}
                {expired && (
                  <span className="font-sys text-[8px] tracking-[0.2em] text-[color:var(--red)] shrink-0">
                    EXPIRED
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </SystemWindow>

      <SystemWindow title="SHADOW ARMY" accent="#a855ff">
        {s.shadows.length === 0 ? (
          <p className="font-sys text-[11px] tracking-[0.1em] text-[color:var(--text-dim)] text-center py-5 leading-relaxed">
            NO SHADOWS EXTRACTED
            <br />
            <span className="text-[10px]">Clear Urgent Gates for a chance at extraction.</span>
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {SHADOWS.filter((sh) => s.shadows.includes(sh.id)).map((sh) => (
              <div
                key={sh.id}
                className="p-2.5 border flex items-center gap-2.5"
                style={{ borderColor: "var(--purple-dim)", background: "#a855ff0a" }}
              >
                <span className="text-2xl leading-none">{sh.icon}</span>
                <div>
                  <div className="font-sys text-[12px] font-600 tracking-[0.1em] text-[color:var(--text-bright)]">
                    {sh.name}
                  </div>
                  <div className="text-[10px] text-[color:var(--purple)]">{sh.effect}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </SystemWindow>
    </div>
  );
}
