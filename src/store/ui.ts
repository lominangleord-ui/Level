import { create } from "zustand";
import type { CameraExercise, CameraPurpose, TierNumber } from "../types";
import { getPath, PATH_TIERS } from "../data/monarchPaths";
import { useGame } from "./game";
import { audio, voice } from "../lib/audio";

interface UiState {
  inventoryOpen: boolean;
  settingsOpen: boolean;
  avatarOpen: boolean;
  camExercise: CameraExercise | null;
  camPurpose: CameraPurpose;
  camGateTier: TierNumber | null;
  openInventory: () => void;
  openSettings: () => void;
  openAvatar: () => void;
  closeAll: () => void;
  openCamera: (ex: CameraExercise, penalty?: boolean, purpose?: CameraPurpose) => void;
  openGateCamera: (tier: TierNumber) => void;
  closeCamera: () => void;
}

export const useUi = create<UiState>((set) => ({
  inventoryOpen: false,
  settingsOpen: false,
  avatarOpen: false,
  camExercise: null,
  camPurpose: "daily",
  camGateTier: null,
  openInventory: () => set({ inventoryOpen: true }),
  openSettings: () => set({ settingsOpen: true }),
  openAvatar: () => set({ avatarOpen: true }),
  closeAll: () =>
    set({ inventoryOpen: false, settingsOpen: false, avatarOpen: false }),
  openCamera: (ex, penalty = false, purpose = "daily") => {
    audio.unlock();
    // iOS needs the first utterance inside the actual button gesture, not an effect.
    if (useGame.getState().settings.voiceCounting) voice.say("Camera verification ready");
    if (!penalty && purpose === "daily") useGame.getState().lockDailyTargets();
    set({ camExercise: ex, camPurpose: penalty ? "penalty" : purpose, camGateTier: null });
  },
  openGateCamera: (tier) => {
    const state = useGame.getState();
    const path = getPath(state.monarchPath);
    const band = PATH_TIERS[tier - 1];
    if (!path || !band || state.level < band.min || state.clearedGates.includes(tier) || state.dead || state.inLockdown) return;
    audio.unlock();
    if (state.settings.voiceCounting) voice.say("Gate challenge ready");
    set({ camExercise: path.signatureExercise, camPurpose: "gate", camGateTier: tier });
  },
  closeCamera: () => set({ camExercise: null, camPurpose: "daily", camGateTier: null }),
}));
