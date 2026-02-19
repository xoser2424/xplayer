import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { User, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Topbar: React.FC = () => {
  const { user, logout } = useAuthStore();
  const [time, setTime] = useState(new Date());
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="h-16 bg-[#121218]/90 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-6 fixed top-0 right-0 left-64 z-50">
      <div className="text-white/50 text-sm font-medium">
        {time.toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
      </div>

      <div className="flex items-center gap-6">
        <div className="text-right">
          <div className="text-white text-lg font-bold font-playfair leading-none">
            {time.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>

        <div className="h-8 w-[1px] bg-white/10"></div>

        <div className="flex items-center gap-3 group relative cursor-pointer">
          <div className="text-right hidden sm:block">
            <div className="text-white font-medium text-sm">{user?.username || 'Guest'}</div>
            <div className="text-gold text-xs">Premium</div>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold to-yellow-600 p-[2px]">
            <div className="w-full h-full rounded-full bg-[#121218] flex items-center justify-center">
               <User className="text-gold w-5 h-5" />
            </div>
          </div>
          
          <div className="absolute top-full right-0 mt-2 w-48 bg-[#121218] border border-white/10 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-2 group-hover:translate-y-0">
             <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-white/70 hover:text-white hover:bg-white/5 transition-colors"
             >
                <LogOut size={16} />
                <span>Çıkış Yap</span>
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};
