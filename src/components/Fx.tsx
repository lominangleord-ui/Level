import { useEffect } from "react";
import { useGame } from "../store/game";
import { rankFromLevel } from "../data";
import { RunicText } from "./common";
import { SystemWindow } from "./SystemWindow";
import { audio } from "../lib/audio";

export function LevelUpFx() {
  const show = useGame((s) => s.levelUpFx);
  const level = useGame((s) => s.level);
  const clear = useGame((s) => s.clearLevelUpFx);

  useEffect(() => {
    if (show) {
      audio.levelUp();
      const id = setTimeout(clear, 2000);
      return () => clearTimeout(id);
    }
  }, [show, clear]);

  if (!show) return null;
  const particles = Array.from({ length: 44 }, (_, i) => {
    const a = (i / 44) * Math.PI * 2;
    const d = 160 + Math.random() * 200;
    return { dx: Math.cos(a) * d, dy: Math.sin(a) * d };
  });

  return (
    <div className="fixed inset-0 z-[75] grid place-items-center pointer-events-none">
      <div className="relative">
        {particles.map((p, i) => (
          <span key={i} className="lp-particle" style={{ ["--dx" as any]: `${p.dx}px`, ["--dy" as any]: `${p.dy}px` }} />
        ))}
        <div className="w-[280px]">
          <SystemWindow title="NOTIFICATION" titleSize="sm" icon="!" headAlign="left">
            <div className="text-center py-1">
              <div className="font-head text-[30px] font-black tracking-[0.2em] text-[color:var(--cyan-bright)] glow-text">
                <RunicText text="LEVEL UP!" duration={520} />
              </div>
              <div className="font-mono text-[15px] text-[color:var(--text-bright)] mt-1">LV {level}</div>
            </div>
          </SystemWindow>
        </div>
      </div>
    </div>
  );
}

export function RankUpFx() {
  const rank = useGame((s) => s.rankUpFx);
  const level = useGame((s) => s.level);
  const clear = useGame((s) => s.clearRankUpFx);

  useEffect(() => {
    if (rank) {
      audio.rankUp();
      const id = setTimeout(clear, 3200);
      return () => clearTimeout(id);
    }
  }, [rank, clear]);

  if (!rank) return null;
  const { color } = rankFromLevel(level);

  return (
    <div className="fixed inset-0 z-[76] grid place-items-center pointer-events-none">
      <div className="text-center space-y-4" style={{ animation: "fadeIn 400ms ease both" }}>
        <div className="rank-badge w-[132px] h-[132px] text-[80px] mx-auto" style={{ color }}>
          {rank}
        </div>
        <div className="font-head text-[30px] sm:text-[38px] font-black tracking-[0.36em]" style={{ color, textShadow: `0 0 40px ${color}` }}>
          <RunicText text={`RANK ${rank}`} duration={700} />
        </div>
        <div className="font-sys text-[10px] tracking-[0.4em] text-[color:var(--text-dim)]">ATTAINED</div>
      </div>
    </div>
  );
}

export function ShadowFx() {
  const shadow = useGame((s) => s.shadowFx);
  const clear = useGame((s) => s.clearShadowFx);

  useEffect(() => {
    if (shadow) {
      audio.death();
      const id = setTimeout(clear, 3800);
      return () => clearTimeout(id);
    }
  }, [shadow, clear]);

  if (!shadow) return null;

  return (
    <div className="fixed inset-0 z-[77] grid place-items-center sys-backdrop" onClick={clear}>
      <div className="absolute inset-0 grid place-items-center pointer-events-none">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="absolute rounded-full border shadow-vortex"
            style={{
              width: `${i * 96}px`,
              height: `${i * 96}px`,
              borderColor: "var(--purple)",
              opacity: 0.16,
              animationDuration: `${2.4 + i * 0.7}s`,
              animationDirection: i % 2 ? "normal" : "reverse",
            }}
          />
        ))}
      </div>

      <div className="text-center space-y-3 relative z-[1]">
        <div className="font-kr text-[76px] leading-none font-black text-[color:var(--purple)]"
             style={{ textShadow: "0 0 50px var(--purple)" }}>
          <RunicText text="추출" duration={800} />
        </div>
        <div className="text-[76px] leading-none">{shadow.icon}</div>
        <div className="font-head text-[40px] font-black tracking-[0.28em] text-[color:var(--purple)]"
             style={{ textShadow: "0 0 34px var(--purple)" }}>
          {shadow.name}
        </div>
        <div className="font-sys text-[12px] tracking-[0.12em] text-[color:var(--text-mid)] max-w-[300px] mx-auto">
          {shadow.effect}
        </div>
        <div className="font-sys text-[9px] tracking-[0.4em] text-[color:var(--text-dim)] pt-3">
          ARISE — TAP TO DISMISS
        </div>
      </div>
    </div>
  );
}
