// src/store/ui-store.ts

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UIStore {
  theme: "light" | "dark" | "system";
  sidebarCollapsed: boolean;
  galleryView: "grid" | "masonry" | "list";

  setTheme: (theme: "light" | "dark" | "system") => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setGalleryView: (view: "grid" | "masonry" | "list") => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      theme: "system",
      sidebarCollapsed: false,
      galleryView: "masonry",

      setTheme: (theme) => set({ theme }),
      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
      setGalleryView: (galleryView) => set({ galleryView }),
    }),
    {
      name: "pixvault-ui",
    }
  )
);
