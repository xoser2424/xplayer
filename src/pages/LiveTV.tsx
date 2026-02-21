import React, { useState, useMemo, useRef, useEffect } from "react";
import { Play, Search, Tv, Newspaper, Film, Baby, BookOpen, Radio, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useContentStore } from "@/store/useContentStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useEPGStore } from "@/store/useEPGStore";
import clsx from "clsx";
import { useLiveEngine } from "@/store/useLiveEngine";
import { useFavoritesStore } from "@/store/useFavoritesStore";

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  sport: Radio,
  news: Newspaper,
  movie: Film,
  kids: Baby,
  doc: BookOpen,
};

const getCatIcon = (name: string): React.ElementType => {
  const n = name.toLowerCase();
  if (n.includes("sport") || n.includes("spor")) return Radio;
  if (n.includes("news") || n.includes("haber")) return Newspaper;
  if (n.includes("movie") || n.includes("film") || n.includes("sinema")) return Film;
  if (n.includes("kid") || n.includes("cocuk") || n.includes("çocuk")) return Baby;
  if (n.includes("doc") || n.includes("belge")) return BookOpen;
  return Tv;
};

const LiveTV: React.FC = () => {
  const navigate = useNavigate();
  const { liveChannels, liveCategories } = useContentStore();
  const { credentials } = useAuthStore();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeChannel, setActiveChannel] = useState<any>(null);
  const [playing, setPlaying] = useState(false);
  const engine = useLiveEngine();
  const epg = useEPGStore();
  const fav = useFavoritesStore();
  const [toast, setToast] = useState<string>("");

  const filteredChannels = useMemo(() => {
    let base = liveChannels;
    if (selectedCategoryId === "favorites") {
      const ids = new Set(fav.list().map(i => i.channelId));
      base = liveChannels.filter(c => ids.has(c.stream_id));
    }
    let channels = base.map(c => ({ ...c }));
    if (selectedCategoryId !== "all" && selectedCategoryId !== "favorites") {
      channels = channels.filter(c => c.category_id === selectedCategoryId);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      channels = channels.filter(c => c.name.toLowerCase().includes(q));
    }
    // Category-based numbering if not present or to enforce logical sorting
    const catName = (id: string) => liveCategories.find(x => x.category_id === id)?.category_name?.toLowerCase() || "";
    const bucketBase = (name: string) => {
      if (name.includes("news") || name.includes("haber")) return 100;
      if (name.includes("sport") || name.includes("spor")) return 200;
      if (name.includes("movie") || name.includes("film") || name.includes("sinema")) return 300;
      if (name.includes("kid") || name.includes("cocuk") || name.includes("çocuk")) return 400;
      if (name.includes("doc") || name.includes("belge")) return 500;
      return 600;
    };
    const counters: Record<number, number> = {};
    channels.forEach(c => {
      const base = bucketBase(catName(c.category_id));
      counters[base] = (counters[base] || 0) + 1;
      if (!c.num || c.num < base || c.num >= base + 100) {
        c.num = base + counters[base] - 1;
      }
    });
    channels.sort((a, b) => (a.num || 0) - (b.num || 0));
    return channels.slice(0, 150);
  }, [liveChannels, selectedCategoryId, searchQuery]);

  const streamUrl = useMemo(() => {
    if (!activeChannel || !credentials.serverUrl) return "";
    return `${credentials.serverUrl}/live/${credentials.username}/${credentials.password}/${activeChannel.stream_id}.m3u8`;
  }, [activeChannel, credentials]);

  const topCategories = liveCategories.slice(0, 8);

  useEffect(() => {
    if (liveChannels.length > 0) {
      epg.preload(liveChannels);
    }
    const t = setInterval(() => {
      epg.refresh(liveChannels);
    }, 10 * 60 * 1000);
    return () => clearInterval(t);
  }, [liveChannels]);

  useEffect(() => {
    if (fav.list().length > 0) {
      setSelectedCategoryId("favorites");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex h-full gap-4 overflow-hidden">
      {/* LEFT: Category Vertical Menu */}
      <div className="w-44 shrink-0 flex flex-col gap-1 overflow-y-auto scrollbar-hide">
        <div className="text-[10px] text-text-dim uppercase tracking-widest font-semibold px-2 mb-2">Categories</div>
        <button
          onClick={() => setSelectedCategoryId("favorites")}
          className={clsx(
            "flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all w-full",
            selectedCategoryId === "favorites"
              ? "text-black shadow-gold-glow"
              : "text-text-muted hover:bg-white/5 hover:text-white"
          )}
          style={selectedCategoryId === "favorites" ? { background: "linear-gradient(135deg,#f6c15a,#D4AF37,#ff9f1a)" } : {}}
        >
          <span className="text-yellow-400">★</span>
          <span>Favoriler</span>
        </button>
        <button
          onClick={() => setSelectedCategoryId("all")}
          className={clsx(
            "flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all w-full",
            selectedCategoryId === "all"
              ? "text-black shadow-gold-glow"
              : "text-text-muted hover:bg-white/5 hover:text-white"
          )}
          style={selectedCategoryId === "all" ? { background: "linear-gradient(135deg,#f6c15a,#D4AF37,#ff9f1a)" } : {}}
        >
          <Tv size={16} />
          <span>All</span>
        </button>

        {topCategories.map(cat => {
          const Icon = getCatIcon(cat.category_name);
          const isActive = selectedCategoryId === cat.category_id;
          return (
            <button
              key={cat.category_id}
              onClick={() => setSelectedCategoryId(cat.category_id)}
              className={clsx(
                "flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all w-full text-left",
                isActive ? "text-black shadow-gold-glow" : "text-text-muted hover:bg-white/5 hover:text-white"
              )}
              style={isActive ? { background: "linear-gradient(135deg,#f6c15a,#D4AF37,#ff9f1a)" } : {}}
            >
              <Icon size={16} />
              <span className="truncate">{cat.category_name}</span>
            </button>
          );
        })}

        {liveCategories.length > 8 && (
          <div className="mt-1 border-t border-white/5 pt-1 space-y-0.5 max-h-48 overflow-y-auto scrollbar-hide">
            {liveCategories.slice(8).map(cat => {
              const isActive = selectedCategoryId === cat.category_id;
              return (
                <button key={cat.category_id} onClick={() => setSelectedCategoryId(cat.category_id)}
                  className={clsx("w-full text-left px-3 py-2 rounded-lg text-xs transition-all truncate",
                    isActive ? "text-gold bg-gold/10" : "text-text-dim hover:bg-white/5 hover:text-white"
                  )}>
                  {cat.category_name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* CENTER: Channel List */}
      <div className="w-72 shrink-0 flex flex-col gap-3 overflow-hidden">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" size={14} />
          <input
            type="text"
            placeholder="Search channels..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/8 rounded-xl pl-9 pr-3 py-2.5 text-white text-sm focus:border-gold/40 outline-none transition-all placeholder:text-white/20"
          />
        </div>

        {/* Channel List */}
        <div className="flex-1 overflow-y-auto space-y-1 scrollbar-hide pr-1">
          {filteredChannels.map(channel => {
            const isActive = activeChannel?.stream_id === channel.stream_id;
            return (
              <div
                key={channel.stream_id}
                onClick={() => {
                  const list = filteredChannels;
                  const idx = list.findIndex(x => x.stream_id === channel.stream_id);
                  if (idx >= 0) engine.openLive(list as any, idx);
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  fav.toggle(channel);
                  setToast(fav.isFavorite(channel.stream_id) ? "Favorilerden kaldırıldı" : "Favorilere eklendi");
                  setTimeout(() => setToast(""), 1500);
                }}
                className={clsx(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all group",
                  isActive
                    ? "bg-gold/10 border border-gold/30"
                    : "hover:bg-white/5 border border-transparent hover:border-white/8"
                )}
              >
                {/* Logo / Preview */}
                <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-white/5 flex items-center justify-center border border-white/8">
                  {channel.stream_icon ? (
                    <img src={channel.stream_icon} alt="" className="w-full h-full object-contain p-1"
                      onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  ) : (
                    <span className="text-gold font-serif text-sm font-bold">{channel.name.substring(0, 2)}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={clsx("text-sm font-semibold truncate", isActive ? "text-gold" : "text-white")}>
                    {channel.num ? `${channel.num} · ` : ""}{channel.name}
                  </div>
                  <div className="text-[10px] text-text-dim mt-0.5 flex items-center gap-1">
                    <span className={clsx("w-1.5 h-1.5 rounded-full flex-shrink-0", isActive ? "bg-red-500 animate-pulse" : "bg-text-dim")} />
                    Live
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    fav.toggle(channel);
                    setToast(fav.isFavorite(channel.stream_id) ? "Favorilerden kaldırıldı" : "Favorilere eklendi");
                    setTimeout(() => setToast(""), 1500);
                  }}
                  title="Favorilere ekle/kaldır (F veya sağ tık)"
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-yellow-400 hover:bg-white/5"
                >
                  <span className="text-lg">{fav.isFavorite(channel.stream_id) ? "★" : "☆"}</span>
                </button>
                {isActive && <ChevronRight size={14} className="text-gold flex-shrink-0" />}
              </div>
            );
          })}
          {filteredChannels.length === 0 && (
            <div className="text-center text-text-muted py-8 text-sm">No channels found</div>
          )}
        </div>
      </div>

      {/* RIGHT: Player */}
      <div className="flex-1 flex flex-col gap-3 min-w-0 overflow-hidden">
        <div className="flex-1 rounded-2xl flex flex-col items-center justify-center gap-4 glass-panel">
          <div className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{ background: "rgba(212,175,55,0.08)", border: "2px solid rgba(212,175,55,0.2)" }}>
            <Tv size={36} className="text-gold/40" />
          </div>
          <div className="text-center">
            <p className="text-white font-semibold mb-1">Select a Channel</p>
            <p className="text-text-dim text-sm">Click any channel to open persistent fullscreen player</p>
          </div>
        </div>
      </div>
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-20">
          <div className="px-3 py-1.5 rounded-lg bg-black/80 border border-white/15 text-white text-xs">
            {toast}
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveTV;
