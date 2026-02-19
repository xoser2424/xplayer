import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Tv, Film, Clapperboard, Heart, Clock, Settings, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/useAuthStore';
import clsx from 'clsx';

const navItems = [
  { icon: Home, label: 'Dashboard', path: '/dashboard' },
  { icon: Tv, label: 'Live TV', path: '/live-tv' },
  { icon: Film, label: 'Movies', path: '/movies' },
  { icon: Clapperboard, label: 'Series', path: '/series' },
  { icon: Heart, label: 'Favorites', path: '/favorites' },
  { icon: Clock, label: 'History', path: '/history' },
];

export const Sidebar: React.FC = () => {
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
     logout();
     navigate('/login');
  };

  return (
    <motion.div 
      initial={{ x: -100 }}
      animate={{ x: 0 }}
      className="w-24 h-screen bg-panel border-r border-white/5 flex flex-col items-center py-8 z-50 relative shrink-0"
    >
      <div className="mb-10">
        <div className="text-3xl font-serif text-gold font-bold tracking-widest drop-shadow-[0_0_10px_rgba(212,175,55,0.5)]">
          X
        </div>
      </div>

      <nav className="flex-1 w-full flex flex-col gap-6 items-center">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => clsx(
              "p-3 rounded-xl transition-all duration-300 group relative flex items-center justify-center",
              isActive 
                ? "text-gold bg-gold/10 shadow-gold-glow" 
                : "text-text-muted hover:text-white hover:bg-white/5"
            )}
          >
            <item.icon size={24} strokeWidth={1.5} />
            <span className="absolute left-16 bg-panel border border-white/10 px-3 py-1 rounded-md text-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none shadow-xl text-white">
              {item.label}
            </span>
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto flex flex-col gap-6 items-center w-full pb-4">
        <NavLink 
          to="/settings"
          className={({ isActive }) => clsx(
            "p-2 rounded-xl transition-colors",
            isActive ? "text-gold" : "text-text-muted hover:text-white hover:bg-white/5"
          )}
        >
          <Settings size={24} strokeWidth={1.5} />
        </NavLink>
        
        <button 
          onClick={handleLogout}
          className="text-text-muted hover:text-error transition-colors p-2 rounded-xl hover:bg-white/5"
        >
          <LogOut size={24} strokeWidth={1.5} />
        </button>
      </div>
    </motion.div>
  );
};
