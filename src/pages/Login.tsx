import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { Loader2 } from 'lucide-react';

export const Login: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'xtream' | 'm3u'>('xtream');
  const navigate = useNavigate();
  const { loginXtream, loginM3U, isLoading, error } = useAuthStore();

  // Form States
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [url, setUrl] = useState('');
  const [m3uUrl, setM3uUrl] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (activeTab === 'xtream') {
      await loginXtream(url, username, password);
    } else {
      await loginM3U(m3uUrl);
    }
  };
  
  // Navigate when authenticated (using useEffect in a real component or checking store state)
  React.useEffect(() => {
     if (useAuthStore.getState().isAuthenticated) {
        navigate('/dashboard');
     }
  }, [useAuthStore.getState().isAuthenticated, navigate]);

  return (
    <div className="h-screen w-screen bg-background relative flex items-center justify-center overflow-hidden">
      {/* Cinematic Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1574375927938-d5a98e8efe30?q=80&w=2069&auto=format&fit=crop')] bg-cover bg-center opacity-20 blur-sm scale-110" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="z-10 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <h1 className="font-serif text-5xl font-bold text-gold drop-shadow-[0_0_15px_rgba(212,175,55,0.5)] mb-2">XPLAYER</h1>
          <p className="text-text-muted text-sm tracking-widest uppercase">Cinematic Media Experience</p>
        </div>

        <div className="glass-panel rounded-2xl p-8 shadow-2xl backdrop-blur-xl bg-black/40 border border-white/5">
          {/* Tabs */}
          <div className="flex p-1 bg-black/40 rounded-lg mb-8">
            <button
              onClick={() => setActiveTab('xtream')}
              className={clsx(
                "flex-1 py-2 text-sm font-medium rounded-md transition-all duration-300",
                activeTab === 'xtream' ? "bg-gold text-black shadow-lg" : "text-text-muted hover:text-white"
              )}
            >
              Xtream Codes
            </button>
            <button
              onClick={() => setActiveTab('m3u')}
              className={clsx(
                "flex-1 py-2 text-sm font-medium rounded-md transition-all duration-300",
                activeTab === 'm3u' ? "bg-gold text-black shadow-lg" : "text-text-muted hover:text-white"
              )}
            >
              M3U Playlist
            </button>
          </div>

          {error && (
             <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm text-center">
                {error}
             </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {activeTab === 'xtream' ? (
              <>
                <div className="space-y-1">
                  <label className="text-xs text-text-dim uppercase tracking-wider font-semibold">Server URL</label>
                  <input 
                    type="text" 
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="http://example.com:8080"
                    className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-text-main focus:border-gold/50 focus:ring-1 focus:ring-gold/50 outline-none transition-all placeholder:text-white/10"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-text-dim uppercase tracking-wider font-semibold">Username</label>
                  <input 
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter username"
                    className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-text-main focus:border-gold/50 focus:ring-1 focus:ring-gold/50 outline-none transition-all placeholder:text-white/10"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-text-dim uppercase tracking-wider font-semibold">Password</label>
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-text-main focus:border-gold/50 focus:ring-1 focus:ring-gold/50 outline-none transition-all placeholder:text-white/10"
                    required
                  />
                </div>
              </>
            ) : (
              <div className="space-y-1">
                <label className="text-xs text-text-dim uppercase tracking-wider font-semibold">Playlist URL / File Path</label>
                <input 
                  type="text" 
                  value={m3uUrl}
                  onChange={(e) => setM3uUrl(e.target.value)}
                  placeholder="http://example.com/playlist.m3u"
                  className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-text-main focus:border-gold/50 focus:ring-1 focus:ring-gold/50 outline-none transition-all placeholder:text-white/10"
                  required
                />
              </div>
            )}

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-gold hover:bg-gold-highlight text-black font-bold py-3.5 rounded-lg shadow-gold-glow hover:shadow-gold-glow-hover transition-all duration-300 mt-6 flex items-center justify-center gap-2"
            >
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'CONNECT'}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};
