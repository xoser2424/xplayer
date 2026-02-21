import React, { useRef, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Maximize, Minimize, Heart } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useContentStore } from "@/store/useContentStore";
import { VideoPlayer } from "@/components/VideoPlayer";
import clsx from "clsx";

const Player: React.FC = () => {
  const navigate = useNavigate();
  const { type, id } = useParams();
  const { credentials } = useAuthStore();
  const { movies, series, liveChannels, addToHistory, addToFavorites, removeFromFavorites, favorites } = useContentStore();

  const containerRef = useRef<HTMLDivElement>(null);
  let controlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentItem, setCurrentItem] = useState<any>(null);
  const [fade, setFade] = useState(true);

  const isFavorite = currentItem && favorites.some(f => f.stream_id === currentItem.stream_id || f.series_id === currentItem.series_id);

  useEffect(() => {
    const onFsChange = () => {
      const fs = !!document.fullscreenElement;
      setIsFullscreen(fs);
    };
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  const openInMpv = async () => {
    const w: any = window as any;
    const payload = { url, title, fs: true };
    try {
      if (w?.ipcRenderer?.invoke) {
        await w.ipcRenderer.invoke('mpv:play', payload);
        return;
      }
      const ipcr = w?.require?.('electron')?.ipcRenderer;
      if (ipcr?.invoke) {
        await ipcr.invoke('mpv:play', payload);
        return;
      }
    } catch {}
  };

  useEffect(() => {
    if (!credentials.serverUrl) return;
    const numId = Number(id);
    let streamUrl = "", contentTitle = "", itemData: any = null;

    if (type === "movie") {
      const movie = movies.find(m => m.stream_id === numId);
      if (movie) {
        contentTitle = movie.name;
        streamUrl = `${credentials.serverUrl}/movie/${credentials.username}/${credentials.password}/${id}.${movie.container_extension || "mp4"}`;
        itemData = movie;
      }
    } else if (type === "series") {
      const s = series.find(s => s.series_id === numId);
      if (s) {
        contentTitle = s.name;
        streamUrl = `${credentials.serverUrl}/series/${credentials.username}/${credentials.password}/${id}.mp4`;
        itemData = s;
      }
    } else if (type === "episode") {
      streamUrl = `${credentials.serverUrl}/series/${credentials.username}/${credentials.password}/${id}.mp4`;
      contentTitle = `Episode ${id}`;
    } else if (type === "live") {
      const ch = liveChannels.find(c => c.stream_id === numId);
      if (ch) {
        contentTitle = ch.name;
        streamUrl = `${credentials.serverUrl}/live/${credentials.username}/${credentials.password}/${id}.m3u8`;
        itemData = ch;
      }
    }

    setTitle(contentTitle);
    setUrl(streamUrl);
    setCurrentItem(itemData);
    if (itemData) addToHistory(itemData);
  }, [type, id, credentials, movies, series, liveChannels]);

  // Always open VOD (movie/series/episode) in MPV
  useEffect(() => {
    if (!url || !title) return;
    if (type === "live") return;
    const w: any = window as any;
    (async () => {
      try {
        if (w?.ipcRenderer?.invoke) {
          await w.ipcRenderer.invoke('mpv:stop');
          await w.ipcRenderer.invoke('mpv:playVod', { url, title });
        }
      } catch {}
    })();
    return () => {
      try { w?.ipcRenderer?.invoke && w.ipcRenderer.invoke('mpv:stop'); } catch {}
    };
  }, [url, title, type]);

  useEffect(() => {
    if (!url || type !== "live") return;
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen().catch(() => {});
    }
    setFade(true);
    const t = setTimeout(() => setFade(false), 200);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
        const w: any = window as any;
        try { w?.ipcRenderer?.invoke && w.ipcRenderer.invoke('mpv:stop'); } catch {}
        navigate(-1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("keydown", onKey); clearTimeout(t); };
  }, [url, navigate, type]);

  const showCtrls = () => {
    setShowControls(true);
    if (controlsTimer.current) clearTimeout(controlsTimer.current);
    controlsTimer.current = setTimeout(() => setShowControls(false), 3500);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const toggleFavorite = () => {
    if (!currentItem) return;
    if (isFavorite) removeFromFavorites(currentItem.stream_id || currentItem.series_id);
    else addToFavorites(currentItem);
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-black z-50 flex items-center justify-center overflow-hidden"
      onMouseMove={showCtrls}
      onMouseLeave={() => setShowControls(false)}
    >
      <div className="absolute inset-0" style={{ opacity: fade ? 1 : 0, transition: "opacity 200ms", background: "black" }} />
      {type === "live" ? (
        <VideoPlayer url={url} title={title} type="live" prefKey={`${type}:${id}`} />
      ) : (
        <div className="text-white/80 text-sm z-10">
          MPV’de oynatılıyor…
        </div>
      )}

      {/* Overlay top controls */}
      <div className={clsx(
        "absolute inset-0 flex flex-col justify-between transition-opacity duration-400 pointer-events-none",
        showControls ? "opacity-100" : "opacity-0"
      )}>
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/80 to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between px-8 pt-6 pointer-events-auto">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all backdrop-blur-sm">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-white font-serif text-xl font-bold drop-shadow-lg">{title}</h1>
              {type === "live" && (
                <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                  LIVE
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {type === "live" && (
              <button onClick={openInMpv}
                className="px-3 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all">
                MPV
              </button>
            )}
            <button onClick={toggleFavorite}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all">
              <Heart size={20} className={clsx(isFavorite ? "fill-gold text-gold" : "text-white")} />
            </button>
          </div>
        </div>

        <div className="relative z-10 px-8 pb-6 flex justify-end pointer-events-auto">
          <button onClick={toggleFullscreen} className="text-white/70 hover:text-gold transition-colors">
            {isFullscreen ? <Minimize size={22} /> : <Maximize size={22} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Player;
