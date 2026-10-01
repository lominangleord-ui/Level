import { create } from "zustand";
import type { CameraExercise, CameraPurpose } from "../types";
import { useGame } from "./game";
import { audio, voice } from "../lib/audio";

interface UiState {
  inventoryOpen: boolean;
  settingsOpen: boolean;
  avatarOpen: boolean;
  camExercise: CameraExercise | null;
  camPurpose: CameraPurpose;
  openInventory: () => void;
  openSettings: () => void;
  openAvatar: () => void;
  closeAll: () => void;
  openCamera: (ex: CameraExercise, penalty?: boolean, purpose?: CameraPurpose) => void;
  closeCamera: () => void;
}

export const useUi = create<UiState>((set) => ({
  inventoryOpen: false,
  settingsOpen: false,
  avatarOpen: false,
  camExercise: null,
  camPurpose: "daily",
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
    set({ camExercise: ex, camPurpose: penalty ? "penalty" : purpose });
  },
  closeCamera: () => set({ camExercise: null, camPurpose: "daily" }),
}));
