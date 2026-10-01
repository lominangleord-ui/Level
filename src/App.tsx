import { useEffect } from "react";
import { useShallow } from "zustand/react/shallow";
import { useGame } from "./store/game";
import { CountUp } from "./components/common";
import { useUi } from "./store/ui";
import { startDrone, stopDrone, audio } from "./lib/audio";
import { Starfield } from "./components/Starfield";
import { Intro, Awaken } from "./components/Onboarding";
import { StatusPanel, ProfileWindow } from "./components/StatusPanel";
import { DailyQuest } from "./components/DailyQuest";
import { SpecialQuestBanner, UrgentQuestBanner } from "./components/QuestBanners";
import { TitlesTab } from "./components/TitlesTab";
import { BloodPactWindow, PactLedger } from "./components/BloodPact";
import { LogTab } from "./components/LogTab";
import { Lockdown } from "./components/Lockdown";
import { Death } from "./components/Death";
import { RewardModal } from "./components/RewardModal";
import { InventoryModal } from "./components/InventoryModal";
import { SettingsModal } from "./components/SettingsModal";
import { AvatarPicker } from "./components/AvatarPicker";
import { Notifications } from "./components/Notifications";
import { LevelUpFx, RankUpFx, ShadowFx } from "./components/Fx";
import { CameraOverlay } from "./components/CameraOverlay";
import { loadDetector } from "./lib/pose";
import { checkDailyReminder } from "./lib/reminders";
import { REMINDER_POLL_MS } from "./lib/reminderPolicy";

const TABS = [
  { id: "quest", label: "QUEST", icon: "⚔" },
  { id: "titles", label: "TITLES", icon: "♛" },
  { id: "pact", label: "PACT", icon: "🩸" },
  { id: "log", label: "LOG", icon: "▤" },
] as const;

function TopBar() {
  const openSettings = useUi((s) => s.openSettings);
  const openInventory = useUi((s) => s.openInventory);
  const gold = useGame((s) => s.gold);

  return (
    <header className="top-bar">
      <span className="top-mark">⟦ SYSTEM ⟧</span>
      <span className="flex-1" />
      <span
        className="font-mono text-[12.5px] text-[color:var(--gold)] mr-1"
        style={{ textShadow: "0 0 10px var(--gold)" }}
      >
        ◈ <CountUp value={gold} />
      </span>
      <button className="top-btn" onClick={openInventory} title="Inventory" aria-label="Inventory">
        🎒
      </button>
      <button className="top-btn" onClick={openSettings} title="Settings" aria-label="Settings">
        ⚙
      </button>
    </header>
  );
}

function BottomNav() {
  const tab = useGame((s) => s.tab);
  const setTab = useGame((s) => s.setTab);

  return (
    <nav className="bottom-nav">
      <div className="flex items-stretch">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`nav-btn flex-1 py-3 flex flex-col items-center gap-1 ${tab === t.id ? "active" : ""}`}
          >
            <span className="text-[17px] leading-none">{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}

function MainApp() {
  const tab = useGame((s) => s.tab);
  const inLockdown = useGame((s) => s.inLockdown);
  const hpCritical = useGame((s) => !s.dead && s.hpMax > 0 && s.hp / s.hpMax <= 0.3);
  const pactActive = useGame((s) => s.pact.active);

  if (inLockdown) {
    return (
      <>
        <Lockdown />
        <div className="mobile-cage" />
      </>
    );
  }

  return (
    <div className="app-shell mx-auto px-4 pb-28 max-w-[560px] min-[820px]:max-w-[900px] min-[1120px]:max-w-[1180px] min-[1500px]:max-w-[1320px]">
      {hpCritical && <div className="hp-warning" />}
      {pactActive && <div className="pact-active-ring" />}
      <TopBar />

      {/* ─────────── QUEST TAB ───────────
          Mobile  : PROFILE → STATUS → banners → DAILY QUEST  (profile always first)
          Desktop : left rail = PROFILE + STATUS · right rail = banners + QUEST */}
      {tab === "quest" && (
        <div className="hud-grid">
          <div className="flex flex-col gap-4">
            <ProfileWindow />
            <StatusPanel />
          </div>
          <div className="flex flex-col gap-4">
            <UrgentQuestBanner />
            <SpecialQuestBanner />
            <DailyQuest />
          </div>
        </div>
      )}

      {tab === "titles" && (
        <div className="max-w-[760px] mx-auto">
          <TitlesTab />
        </div>
      )}

      {tab === "pact" && (
        <div className="max-w-[560px] mx-auto space-y-4">
          <BloodPactWindow />
          <PactLedger />
        </div>
      )}

      {tab === "log" && (
        <div className="max-w-[640px] mx-auto">
          <LogTab />
        </div>
      )}

      <BottomNav />
    </div>
  );
}

/** Only the topmost task renders, so blurred full-screen backdrops never stack. */
function GlobalOverlays() {
  const s = useGame(useShallow((state) => ({
    screen: state.screen,
    dead: state.dead, shadowFx: state.shadowFx,
    levelUpFx: state.levelUpFx, rankUpFx: state.rankUpFx,
    hasNotification: state.notifications.length > 0,
    hasReward: state.rewardChoicePending && !state.inLockdown,
  })));
  const ui = useUi(useShallow((state) => ({
    camera: state.camExercise !== null,
    avatar: state.avatarOpen, inventory: state.inventoryOpen, settings: state.settingsOpen,
  })));
  const active = s.screen === "main" && (s.dead || !!s.shadowFx || s.levelUpFx || !!s.rankUpFx || s.hasNotification || s.hasReward
    || ui.camera || ui.avatar || ui.inventory || ui.settings);

  useEffect(() => {
    if (!active) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = overflow; };
  }, [active]);

  if (s.screen !== "main") return null;
  if (s.dead) return <Death />;
  if (ui.camera) return <CameraOverlay />;
  if (s.shadowFx) return <ShadowFx />;
  if (s.levelUpFx) return <LevelUpFx />;
  if (s.rankUpFx) return <RankUpFx />;
  if (s.hasNotification) return <Notifications />;
  if (s.hasReward) return <RewardModal />;
  if (ui.avatar) return <AvatarPicker />;
  if (ui.settings) return <SettingsModal />;
  if (ui.inventory) return <InventoryModal />;
  return null;
}

export default function App() {
  const screen = useGame((s) => s.screen);
  const hudTheme = useGame((s) => s.hudTheme);
  const inLockdown = useGame((s) => s.inLockdown);
  const dead = useGame((s) => s.dead);
  const gameOverlay = useGame((s) => s.dead || !!s.shadowFx || s.levelUpFx || !!s.rankUpFx
    || s.notifications.length > 0 || (s.rewardChoicePending && !s.inLockdown));
  const uiOverlay = useUi((s) => s.camExercise !== null || s.inventoryOpen || s.settingsOpen || s.avatarOpen);

  useEffect(() => {
    if (dead || screen === "intro") {
      useUi.getState().closeCamera();
      useUi.getState().closeAll();
    }
  }, [dead, screen]);

  useEffect(() => {
    if (screen !== "main") return;
    const warm = () => { if (!document.hidden) void loadDetector().catch(() => undefined); };
    if ("requestIdleCallback" in window) {
      const idle = window.requestIdleCallback(warm, { timeout: 4000 });
      return () => window.cancelIdleCallback(idle);
    }
    const timer = setTimeout(warm, 1500);
    return () => clearTimeout(timer);
  }, [screen]);

  useEffect(() => {
    const classes = document.documentElement.classList;
    for (const name of [...classes]) {
      if (name.startsWith("theme-")) classes.remove(name);
    }
    classes.add(`theme-${inLockdown ? "penalty-red" : hudTheme}`);
  }, [hudTheme, inLockdown]);

  useEffect(() => {
    if (screen !== "main") return;
    const id = setInterval(() => {
      if (!document.hidden) useGame.getState().tick();
    }, 1000);
    const onVisibility = () => {
      document.documentElement.classList.toggle("app-backgrounded", document.hidden);
      if (!document.hidden) {
        useGame.getState().tick();
        void checkDailyReminder("in-app");
      }
    };
    const poll = setInterval(() => {
      useGame.getState().tick();
      void checkDailyReminder(document.hidden ? "system" : "in-app");
    }, REMINDER_POLL_MS);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pageshow", onVisibility);
    onVisibility();
    return () => {
      clearInterval(id);
      clearInterval(poll);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pageshow", onVisibility);
      document.documentElement.classList.remove("app-backgrounded");
    };
  }, [screen]);

  useEffect(() => {
    if (inLockdown) {
      startDrone();
      const onVis = () => {
        if (document.hidden) stopDrone();
        else if (useGame.getState().inLockdown) startDrone();
      };
      document.addEventListener("visibilitychange", onVis);
      return () => {
        document.removeEventListener("visibilitychange", onVis);
        stopDrone();
      };
    }
    stopDrone();
  }, [inLockdown]);

  useEffect(() => {
    const unlock = () => audio.unlock();
    window.addEventListener("pointerdown", unlock, { once: true });
    return () => window.removeEventListener("pointerdown", unlock);
  }, []);

  return (
    <>
      <Starfield paused={gameOverlay || uiOverlay} />
      {screen === "intro" && <Intro />}
      {screen === "awaken" && <Awaken />}
      {screen === "main" && <MainApp />}

      <GlobalOverlays />
    </>
  );
}
