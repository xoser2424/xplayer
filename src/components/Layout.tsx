import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export const Layout: React.FC = () => {
  return (
    <div className="flex h-screen w-screen bg-background text-text-main overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col h-full relative">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-[#1a1a24] opacity-50 pointer-events-none" />
        <Topbar />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-6 relative z-10 scroll-smooth">
          <Outlet />
        </main>
      </div>
    </div>
  );
};