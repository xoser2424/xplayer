import React from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export const Layout: React.FC = () => {
  return (
    <div className="flex h-screen w-screen bg-background text-text-main overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col h-full relative min-w-0">
        {/* Ambient background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-1/3 w-[600px] h-[400px] rounded-full opacity-30 blur-[120px]"
            style={{ background: "radial-gradient(ellipse, rgba(212,175,55,0.04) 0%, transparent 70%)" }} />
        </div>
        <Topbar />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-5 relative z-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
