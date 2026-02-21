import React, { useEffect, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { User, Search, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const Topbar: React.FC = () => {
  const { user, logout } = useAuthStore();
  const [time, setTime] = useState(new Date());
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div
      className="h-14 flex items-center justify-between px-6 shrink-0 relative z-30"
      style={{ background: "rgba(8,8,10,0.85)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(212,175,55,0.08)" }}
    >
      {/* Search Bar */}
      <div className="flex-1 max-w-md relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" size={15} />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search movies, series, channels..."
          className="w-full bg-white/5 border border-white/8 rounded-full pl-9 pr-4 py-2 text-white text-sm focus:border-gold/40 focus:ring-1 focus:ring-gold/20 outline-none transition-all placeholder:text-white/20"
        />
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-4">
        {/* Clock */}
        <div className="text-right hidden lg:block">
          <div className="font-serif text-base font-bold text-white/90 leading-none">
            {time.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
          </div>
          <div className="text-[10px] text-text-dim mt-0.5">
            {time.toLocaleDateString("tr-TR", { weekday: "short", day: "numeric", month: "short" })}
          </div>
        </div>

        <div className="w-px h-7 bg-white/8" />

        {/* Notification */}
        <button className="relative p-2 rounded-lg hover:bg-white/5 transition-colors text-text-dim hover:text-gold">
          <Bell size={18} strokeWidth={1.5} />
          <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-gold" />
        </button>

        {/* Profile */}
        <div className="flex items-center gap-3 group relative cursor-pointer">
          <div className="text-right hidden sm:block">
            <div className="text-white font-semibold text-sm leading-none">{user?.username || "Guest"}</div>
            <div className="text-[10px] mt-0.5 font-medium" style={{ color: "#D4AF37" }}>Premium</div>
          </div>
          <div className="w-8 h-8 rounded-full p-[1.5px]" style={{ background: "linear-gradient(135deg,#f6c15a,#D4AF37,#ff9f1a)" }}>
            <div className="w-full h-full rounded-full bg-[#0b0b0c] flex items-center justify-center">
              <User className="text-gold w-4 h-4" />
            </div>
          </div>

          {/* Dropdown */}
          <div className="absolute top-full right-0 mt-2 w-44 rounded-xl overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 translate-y-1 group-hover:translate-y-0 z-50"
            style={{ background: "rgba(8,8,10,0.95)", border: "1px solid rgba(212,175,55,0.15)", boxShadow: "0 20px 40px rgba(0,0,0,0.6)" }}>
            <div className="px-4 py-3 border-b border-white/5">
              <div className="text-white text-sm font-semibold">{user?.username || "Guest"}</div>
              <div className="text-[10px] text-gold">Premium Member</div>
            </div>
            <button onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-text-muted hover:text-white hover:bg-white/5 transition-colors text-sm">
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
