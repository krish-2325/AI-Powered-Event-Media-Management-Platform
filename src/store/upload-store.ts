// src/store/upload-store.ts

import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { UploadProgress } from "@/lib/types/media";

interface UploadStore {
  uploads: Record<string, UploadProgress>;
  isUploadPanelOpen: boolean;

  addUpload: (id: string, file: File) => void;
  updateUpload: (id: string, partial: Partial<UploadProgress>) => void;
  removeUpload: (id: string) => void;
  clearCompleted: () => void;
  openUploadPanel: () => void;
  closeUploadPanel: () => void;

  get activeCount(): number;
  get completedCount(): number;
  get errorCount(): number;
}

export const useUploadStore = create<UploadStore>()(
  immer((set, get) => ({
    uploads: {},
    isUploadPanelOpen: false,

    get activeCount() {
      return Object.values(get().uploads).filter(
        (u) => u.status === "uploading" || u.status === "processing"
      ).length;
    },

    get completedCount() {
      return Object.values(get().uploads).filter(
        (u) => u.status === "done"
      ).length;
    },

    get errorCount() {
      return Object.values(get().uploads).filter(
        (u) => u.status === "error"
      ).length;
    },

    addUpload: (id, file) => {
      set((state) => {
        state.uploads[id] = {
          file,
          progress: 0,
          status: "pending",
        };
        state.isUploadPanelOpen = true;
      });
    },

    updateUpload: (id, partial) => {
      set((state) => {
        if (state.uploads[id]) {
          Object.assign(state.uploads[id], partial);
        }
      });
    },

    removeUpload: (id) => {
      set((state) => {
        delete state.uploads[id];
      });
    },

    clearCompleted: () => {
      set((state) => {
        const uploads = Object.entries(state.uploads).filter(
          ([, u]) => u.status !== "done"
        );
        state.uploads = Object.fromEntries(uploads);
      });
    },

    openUploadPanel: () => set({ isUploadPanelOpen: true }),
    closeUploadPanel: () => set({ isUploadPanelOpen: false }),
  }))
);
