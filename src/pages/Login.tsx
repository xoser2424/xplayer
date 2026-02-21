import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/store/useAuthStore";
import { useNavigate } from "react-router-dom";
import { Loader2, ChevronDown, User, Globe, Tv, Link2, Upload, Play, Star } from "lucide-react";
import clsx from "clsx";

const LANGUAGES = [
  { code: "tr", label: "Turkce" },
  { code: "en", label: "English" },
  { code: "de", label: "Deutsch" },
  { code: "fr", label: "Francais" },
  { code: "ar", label: "Arabic" },
];

const AVATARS = ["A","B","C","D","E","F","G","H"];

const MOVIE_POSTERS = [
  "https://image.tmdb.org/t/p/w500/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg",
  "https://image.tmdb.org/t/p/w500/qNBAXBIQlnOThrVvA6mA2B5ggV6.jpg",
  "https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsLe1rhdCZi2.jpg",
  "https://image.tmdb.org/t/p/w500/sRLC052ieEafQN95VcKFfIKjkO2.jpg",
];

export const Login: React.FC = () => {
  const [sourceMethod, setSourceMethod] = useState<"xtream" | "m3u" | "file" | null>(null);
  const [lang, setLang] = useState("tr");
  const [showLangDrop, setShowLangDrop] = useState(false);
  const [avatar, setAvatar] = useState("X");
  const [profileName, setProfileName] = useState("");
  const [url, setUrl] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [m3uUrl, setM3uUrl] = useState("");

  const navigate = useNavigate();
  const { loginXtream, loginM3U, isLoading, error } = useAuthStore();

  useEffect(() => {
    if (useAuthStore.getState().isAuthenticated) {
      navigate("/dashboard");
    }
  }, [navigate]);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sourceMethod === "xtream") {
      await loginXtream(url, username, password);
    } else if (sourceMethod === "m3u" || sourceMethod === "file") {
      await loginM3U(m3uUrl);
    }
  };

  const selectedLang = LANGUAGES.find(l => l.code === lang);

  return (
    <div className="h-screen w-screen cinema-bg relative flex overflow-hidden">
      {/* Ambient particles */}
      {[...Array(12)].map((_, i) => (
        <div
          key={i}
          className="particle"
          style={{
            left: `${Math.random() * 100}%`,
            width: `${2 + Math.random() * 3}px`,
            height: `${2 + Math.random() * 3}px`,
            animationDuration: `${6 + Math.random() * 10}s`,
            animationDelay: `${Math.random() * 8}s`,
            opacity: 0.4 + Math.random() * 0.4,
          }}
        />
      ))}

      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 rounded-full bg-gold/5 blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-gold-warm/5 blur-[80px]" />
      </div>

      {/* LEFT PANEL */}
      <div className="relative z-10 w-[420px] shrink-0 flex flex-col justify-center px-10 py-8 overflow-y-auto">
        {/* Logo */}
        <div className="mb-8">
          <h1 className="font-serif text-5xl font-bold text-shadow-gold" style={{background:"linear-gradient(135deg,#f6c15a,#D4AF37,#ff9f1a)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent"}}>
            XPlayer
          </h1>
          <p className="text-text-dim text-xs tracking-[0.25em] uppercase mt-1">Premium Streaming Platform</p>
        </div>

        {/* Language Selector */}
        <div className="mb-6 relative">
          <div className="flex items-center gap-2 mb-2 text-xs text-text-dim uppercase tracking-wider">
            <Globe size={12} /> Language
          </div>
          <button
            onClick={() => setShowLangDrop(!showLangDrop)}
            className="w-full glass-dark rounded-xl px-4 py-3 flex items-center justify-between text-white hover:border-gold/30 transition-all"
          >
            <span className="text-sm font-medium">{selectedLang?.label}</span>
            <ChevronDown size={16} className={clsx("text-gold transition-transform", showLangDrop && "rotate-180")} />
          </button>
          <AnimatePresence>
            {showLangDrop && (
              <motion.div
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="absolute top-full left-0 right-0 mt-1 glass-dark rounded-xl overflow-hidden z-50 border border-gold/10"
              >
                {LANGUAGES.map(l => (
                  <button key={l.code} onClick={() => { setLang(l.code); setShowLangDrop(false); }}
                    className={clsx("w-full text-left px-4 py-2.5 text-sm transition-colors",
                      lang === l.code ? "text-gold bg-gold/10" : "text-text-muted hover:bg-white/5 hover:text-white"
                    )}>
                    {l.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Profile Card */}
        <div className="glass-panel rounded-2xl p-5 mb-6">
          <div className="text-xs text-text-dim uppercase tracking-wider mb-4 flex items-center gap-2">
            <User size={12} /> Profile
          </div>
          {/* Avatar Row */}
          <div className="flex gap-2 mb-4 flex-wrap">
            {AVATARS.map(a => (
              <button key={a} onClick={() => setAvatar(a)}
                className={clsx("w-9 h-9 rounded-full font-serif font-bold text-sm flex items-center justify-center transition-all",
                  avatar === a
                    ? "text-black shadow-gold-glow" : "bg-white/5 text-text-muted hover:bg-white/10 hover:text-white"
                )}
                style={avatar === a ? {background:"linear-gradient(135deg,#f6c15a,#D4AF37,#ff9f1a)"} : {}}
              >
                {a}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="Your name..."
            value={profileName}
            onChange={e => setProfileName(e.target.value)}
            className="w-full bg-black/30 border border-white/8 rounded-xl px-4 py-2.5 text-white text-sm focus:border-gold/50 focus:ring-1 focus:ring-gold/30 outline-none transition-all placeholder:text-white/20"
          />
        </div>

        {/* Playlist Source */}
        <div className="mb-4">
          <div className="text-xs text-text-dim uppercase tracking-wider mb-3 flex items-center gap-2 after:flex-1 after:h-px after:bg-white/8">
            Add Playlist Source
          </div>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              { id: "xtream", icon: Tv, label: "Xtream API" },
              { id: "m3u", icon: Link2, label: "M3U Link" },
              { id: "file", icon: Upload, label: "M3U File" },
            ].map(m => (
              <button
                key={m.id}
                onClick={() => setSourceMethod(sourceMethod === m.id as any ? null : m.id as any)}
                className={clsx(
                  "flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl text-xs font-medium transition-all border",
                  sourceMethod === m.id
                    ? "border-gold/60 bg-gold/10 text-gold shadow-gold-glow-sm"
                    : "border-white/8 bg-black/20 text-text-muted hover:border-gold/30 hover:text-white"
                )}
              >
                <m.icon size={18} />
                {m.label}
              </button>
            ))}
          </div>

          <AnimatePresence>
            {sourceMethod && (
              <motion.form
                key={sourceMethod}
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
                onSubmit={handleConnect}
              >
                <div className="space-y-2 pb-1">
                  {sourceMethod === "xtream" ? (
                    <>
                      <input type="text" value={url} onChange={e => setUrl(e.target.value)} placeholder="http://server.com:8080"
                        className="w-full bg-black/30 border border-white/8 rounded-xl px-3 py-2.5 text-white text-xs focus:border-gold/50 outline-none transition-all placeholder:text-white/20" required />
                      <div className="grid grid-cols-2 gap-2">
                        <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="Username"
                          className="bg-black/30 border border-white/8 rounded-xl px-3 py-2.5 text-white text-xs focus:border-gold/50 outline-none transition-all placeholder:text-white/20" required />
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password"
                          className="bg-black/30 border border-white/8 rounded-xl px-3 py-2.5 text-white text-xs focus:border-gold/50 outline-none transition-all placeholder:text-white/20" required />
                      </div>
                    </>
                  ) : (
                    <input type="text" value={m3uUrl} onChange={e => setM3uUrl(e.target.value)}
                      placeholder={sourceMethod === "file" ? "File path or URL" : "http://example.com/playlist.m3u"}
                      className="w-full bg-black/30 border border-white/8 rounded-xl px-3 py-2.5 text-white text-xs focus:border-gold/50 outline-none transition-all placeholder:text-white/20" required />
                  )}

                  {error && (
                    <div className="p-2.5 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs text-center">{error}</div>
                  )}

                  <button type="submit" disabled={isLoading}
                    className="gold-btn w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2">
                    {isLoading ? <Loader2 className="animate-spin" size={18} /> : <><Play size={16} fill="black" /> Connect</>}
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* DIVIDER */}
      <div className="w-px bg-gradient-to-b from-transparent via-gold/20 to-transparent my-12" />

      {/* RIGHT PANEL - TV Mockup */}
      <div className="flex-1 relative flex items-center justify-center p-8 overflow-hidden">
        <div className="relative w-full max-w-3xl">
          {/* TV Frame */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3, duration: 0.6 }}
            className="relative rounded-2xl overflow-hidden"
            style={{ boxShadow: "0 0 80px rgba(212,175,55,0.15), 0 30px 80px rgba(0,0,0,0.8), inset 0 0 0 3px rgba(212,175,55,0.15)" }}
          >
            {/* Screen Bezel */}
            <div className="absolute inset-0 rounded-2xl border-2 border-gold/20 z-20 pointer-events-none" />
            {/* Screen glare */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent z-10 pointer-events-none rounded-2xl" />

            {/* Screen Content - Mini Dashboard Preview */}
            <div className="relative bg-[#0b0b0c] aspect-video overflow-hidden">
              {/* Hero Background */}
              <img src="https://image.tmdb.org/t/p/original/sRLC052ieEafQN95VcKFfIKjkO2.jpg"
                className="absolute inset-0 w-full h-full object-cover opacity-60"
                alt="hero" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/20 to-transparent" />

              {/* Mini topbar */}
              <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-3 z-10">
                <span className="font-serif text-xl font-bold" style={{background:"linear-gradient(135deg,#f6c15a,#D4AF37)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent"}}>XPlayer</span>
                <div className="flex items-center gap-4 text-white/50 text-xs">
                  {["Live TV","Movies","Series"].map(n => (
                    <span key={n} className={n==="Movies" ? "text-gold" : ""}>{n}</span>
                  ))}
                  <div className="w-6 h-6 rounded-full bg-gold/20 flex items-center justify-center">
                    <User size={12} className="text-gold" />
                  </div>
                </div>
              </div>

              {/* Hero content */}
              <div className="absolute bottom-20 left-6 z-10">
                <h2 className="font-serif text-2xl font-bold text-white mb-1">Dune: Part One</h2>
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-gold text-black text-[9px] px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5">
                    <Star size={7} fill="black" /> 8.0
                  </span>
                  <span className="text-white/40 text-[10px]">Sci-Fi • 2h 35m</span>
                </div>
                <button className="text-[10px] gold-btn px-3 py-1.5 rounded-full flex items-center gap-1">
                  <Play size={10} fill="black" /> Play Now
                </button>
              </div>

              {/* Content row preview */}
              <div className="absolute bottom-0 left-0 right-0 px-6 py-3 z-10">
                <div className="text-[9px] text-gold font-semibold mb-2 uppercase tracking-wider">Recommended</div>
                <div className="flex gap-2">
                  {MOVIE_POSTERS.map((p, i) => (
                    <div key={i} className="w-14 h-20 rounded-lg overflow-hidden flex-shrink-0 border border-white/10">
                      <img src={p} className="w-full h-full object-cover opacity-80" alt="" />
                    </div>
                  ))}
                  <div className="w-14 h-20 rounded-lg bg-white/5 flex-shrink-0 flex items-center justify-center border border-white/8">
                    <span className="text-white/30 text-[8px]">+more</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* TV Stand */}
          <div className="flex justify-center mt-0">
            <div className="w-32 h-4 bg-gradient-to-b from-[#1a1a1a] to-[#111] rounded-b-lg" />
          </div>
          <div className="flex justify-center">
            <div className="w-48 h-2 bg-gradient-to-r from-transparent via-gold/20 to-transparent rounded-full blur-sm" />
          </div>

          {/* Reflection */}
          <div className="absolute -bottom-8 left-4 right-4 h-24 rounded-2xl opacity-20 blur-xl"
            style={{ background: "linear-gradient(to bottom, rgba(212,175,55,0.15), transparent)", transform: "scaleY(-0.5) translateY(-100%)" }} />
        </div>

        {/* Floating decorative posters */}
        <motion.div animate={{ y: [-8, 8, -8] }} transition={{ duration: 5, repeat: Infinity }}
          className="absolute right-8 top-16 w-20 rounded-xl overflow-hidden shadow-2xl opacity-40 border border-white/10">
          <img src={MOVIE_POSTERS[0]} className="w-full h-auto" alt="" />
        </motion.div>
        <motion.div animate={{ y: [8, -8, 8] }} transition={{ duration: 6, repeat: Infinity, delay: 1 }}
          className="absolute right-32 bottom-16 w-16 rounded-xl overflow-hidden shadow-2xl opacity-30 border border-white/10">
          <img src={MOVIE_POSTERS[1]} className="w-full h-auto" alt="" />
        </motion.div>
      </div>
    </div>
  );
};
