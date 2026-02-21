import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Home, Tv, Film, Clapperboard, Heart, Clock, Settings, LogOut } from "lucide-react";
import { motion } from "framer-motion";
import { useAuthStore } from "@/store/useAuthStore";
import clsx from "clsx";

const navItems = [
  { icon: Home, label: "Dashboard", path: "/dashboard" },
  { icon: Tv, label: "Live TV", path: "/live-tv" },
  { icon: Film, label: "Movies", path: "/movies" },
  { icon: Clapperboard, label: "Series", path: "/series" },
  { icon: Heart, label: "Favorites", path: "/favorites" },
  { icon: Clock, label: "History", path: "/history" },
];

export const Sidebar: React.FC = () => {
  const logout = useAuthStore(state => state.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <motion.div
      initial={{ x: -80, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="w-20 h-screen flex flex-col items-center py-6 z-50 shrink-0 relative"
      style={{ background: "rgba(8,8,10,0.9)", borderRight: "1px solid rgba(212,175,55,0.08)" }}
    >
      {/* Ambient glow behind sidebar */}
      <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-gold/20 to-transparent pointer-events-none" />

      {/* Logo */}
      <div className="mb-10 flex flex-col items-center gap-0.5">
        <div
          className="text-4xl font-serif font-black tracking-tight leading-none"
          style={{
            background: "linear-gradient(135deg,#f6c15a 0%,#D4AF37 50%,#ff9f1a 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            filter: "drop-shadow(0 0 12px rgba(212,175,55,0.5))",
          }}
        >
          X
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 w-full flex flex-col gap-1 items-center px-2">
        {navItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              clsx(
                "w-full flex flex-col items-center justify-center gap-1 py-3 rounded-xl transition-all duration-200 group relative",
                isActive
                  ? "bg-gold/15 text-gold shadow-gold-glow-sm"
                  : "text-text-dim hover:text-white hover:bg-white/5"
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-8 rounded-full bg-gold shadow-gold-glow" />
                )}
                <item.icon size={20} strokeWidth={isActive ? 2 : 1.5} />
                <span className="text-[9px] font-medium uppercase tracking-wider opacity-70">{item.label.split(" ")[0]}</span>
                {/* Tooltip */}
                <span className="absolute left-[calc(100%+8px)] bg-[#111114] border border-gold/20 px-3 py-1.5 rounded-lg text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none shadow-xl text-white font-medium">
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="flex flex-col gap-1 items-center w-full px-2 pb-2">
        <NavLink to="/settings"
          className={({ isActive }) =>
            clsx("w-full flex flex-col items-center justify-center gap-1 py-3 rounded-xl transition-all",
              isActive ? "bg-gold/15 text-gold" : "text-text-dim hover:text-white hover:bg-white/5"
            )
          }
        >
          <Settings size={18} strokeWidth={1.5} />
          <span className="text-[9px] uppercase tracking-wider opacity-70">Settings</span>
        </NavLink>
        <button
          onClick={handleLogout}
          className="w-full flex flex-col items-center justify-center gap-1 py-3 rounded-xl text-text-dim hover:text-error hover:bg-white/5 transition-all"
        >
          <LogOut size={18} strokeWidth={1.5} />
          <span className="text-[9px] uppercase tracking-wider opacity-70">Exit</span>
        </button>
      </div>
    </motion.div>
  );
};
