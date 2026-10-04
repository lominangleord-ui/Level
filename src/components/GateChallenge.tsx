import { useUi } from "../store/ui";
import { gateTarget } from "../lib/monarch";
import { PATH_TIERS } from "../data/monarchPaths";
import type { ArchetypeId, MonarchPath, TierNumber } from "../types";
import type { GameState } from "../types";

/** All nine paths use the same untimed, single-session camera Gate interaction. */
export function GateChallenge({
  path, tier, level, targetLevel, dayMode, archetype, cleared,
}: {
  path: MonarchPath;
  tier: TierNumber;
  level: number;
  targetLevel: number;
  dayMode: GameState["dayMode"];
  archetype: ArchetypeId;
  cleared: boolean;
}) {
  const openCamera = useUi((state) => state.openGateCamera);
  const band = PATH_TIERS[tier - 1];
  const unlocked = level >= band.min;
  const goal = gateTarget(path, tier, archetype, unlocked ? targetLevel : band.min, unlocked ? dayMode : "classic");
  const exercise = path.signatureExercise === "push" ? "push-ups" : path.signatureExercise === "sit" ? "sit-ups" : "squats";

  return (
    <div className={`path-gate ${cleared ? "cleared" : unlocked ? "available" : "locked"}`}>
      <div className="path-gate-number">{String(tier).padStart(2, "0")}</div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap gap-x-3 items-center">
          <span className="font-sys text-[12px] font-bold tracking-wide text-[color:var(--text-bright)]">{path.tiers[tier - 1].gateName}</span>
          <span className="font-mono text-[9px]" style={{ color: cleared ? "var(--green)" : unlocked ? "var(--path-color)" : "var(--text-dim)" }}>
            {cleared ? "CLEARED" : unlocked ? "READY" : `UNLOCKS LV ${band.min}`}
          </span>
        </div>
        <p className="text-[11px] text-[color:var(--text-mid)] mt-1">
          {band.name} · {goal} {exercise} in one camera session · {band.multiplier}x {unlocked ? "today's target" : "the milestone target"}
        </p>
        {path.tiers[tier - 1].skills.map((skill) =>
          <p key={skill.label} className="text-[10px] mt-1.5" style={{ color: cleared ? "var(--green)" : "var(--text)" }}>{skill.label}</p>,
        )}
        <p className="font-mono text-[9px] text-[color:var(--text-dim)] mt-1">TITLE: {path.tiers[tier - 1].title}</p>
      </div>
      {unlocked && !cleared && <button className="sl-btn path-gate-action" onClick={() => openCamera(tier)}>
        ENTER GATE
      </button>}
    </div>
  );
}