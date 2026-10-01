import { useEffect, useState } from "react";
import { useGame } from "../store/game";
import { useUi } from "../store/ui";
import { SystemWindow } from "./SystemWindow";
import { fmtCountdown } from "../lib/utils";

export function SpecialQuestBanner() {
  const active = useGame((s) => s.specialActive);
  const quest = useGame((s) => s.specialQuest);
  const complete = useGame((s) => s.completeSpecial);
  const dismiss = useGame((s) => s.dismissSpecial);
  if (!active || !quest) return null;

  return (
    <SystemWindow title="SPECIAL QUEST" titleSize="sm" accent="#ffc53d">
      <div className="font-sys text-[14px] font-600 tracking-[0.08em] text-[color:var(--text-bright)]">
        {quest.name}
      </div>
      <div className="text-[12px] text-[color:var(--text)] mt-1 leading-snug">{quest.desc}</div>
      <div className="font-mono text-[10.5px] text-[color:var(--gold)] mt-2">
        REWARD · +{quest.xp} XP
        {quest.stat ? ` · +${quest.statAmt} ${quest.stat.toUpperCase()}` : ""} · TOKEN ALREADY GRANTED
      </div>
      <div className="flex gap-2 mt-3">
        <button className="sl-btn sl-btn-gold flex-1 py-2" onClick={complete}>
          COMPLETE
        </button>
        <button className="sl-btn sl-btn-danger px-4 py-2" onClick={dismiss}>
          DISMISS
        </button>
      </div>
    </SystemWindow>
  );
}

export function UrgentQuestBanner() {
  const active = useGame((s) => s.urgentActive);
  const quest = useGame((s) => s.urgentQuest);
  const end = useGame((s) => s.urgentEnd);
  const dismiss = useGame((s) => s.dismissUrgent);
  const openCamera = useUi((s) => s.openCamera);
  const [ms, setMs] = useState(() => end - Date.now());

  useEffect(() => {
    setMs(end - Date.now());
    if (!active) return;
    const id = setInterval(() => setMs(end - Date.now()), 1000);
    return () => clearInterval(id);
  }, [end, active]);

  if (!active || !quest) return null;
  const left = Math.max(0, ms);
  const critical = left < 15000;

  return (
    <div className="sys-win" style={{ ["--cyan" as any]: "#ff3b52" }}>
      <span className="win-wing l" />
      <span className="win-wing r" />
      <div className="win-frame pulse-border">
        <span className="win-corner tl" />
        <span className="win-corner tr" />
        <span className="win-corner bl" />
        <span className="win-corner br" />
        <div className="win-head left">
          <span className="sys-icon">!</span>
          <span className="win-title sm">URGENT GATE</span>
          <span
            className="ml-auto font-head text-[22px] font-black tracking-wider"
            style={{ color: critical ? "var(--red)" : "var(--gold)", textShadow: "0 0 16px currentColor" }}
          >
            {fmtCountdown(left)}
          </span>
        </div>
        <div className="win-inner">
          <div className="win-body">
            <div className="font-sys text-[14px] font-600 tracking-[0.08em] text-[color:var(--text-bright)]">
              {quest.name}
            </div>
            <div className="text-[12px] text-[color:var(--text)] mt-1 leading-snug">{quest.desc}</div>
            <div className="font-mono text-[10.5px] text-[color:#ff8b9c] mt-2">
              REWARD · +{quest.xp} XP · +{quest.gold} GOLD · RECOVERY / COSMETIC LOOT
            </div>
            <div className="flex gap-2 mt-3">
              <button
                className="sl-btn sl-btn-danger flex-1 py-2"
                onClick={() => {
                  if (quest.exercise !== "run") openCamera(quest.exercise, false, "urgent");
                }}
              >
                VERIFY VIA CAMERA
              </button>
              <button className="sl-btn px-4 py-2" onClick={dismiss}>
                FLEE
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
