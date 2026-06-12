// src/app/media/layout.tsx

import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

export default function MediaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-background">{children}</main>
      </div>
    </div>
  );
}
