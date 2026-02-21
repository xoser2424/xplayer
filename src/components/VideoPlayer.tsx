import React, { useEffect, useMemo, useRef, useState } from "react";
import Hls from "hls.js";
import mpegts from "mpegts.js";
import { Play, Pause, Volume2, VolumeX, Settings, Subtitles, X, Check } from "lucide-react";
import clsx from "clsx";
import { usePlayerPrefs } from "@/store/usePlayerPrefs";

type PlayerType = "movie" | "series" | "episode" | "live";

interface VideoPlayerProps {
  url: string;
  title?: string;
  type?: PlayerType;
  onClose?: () => void;
  prefKey?: string;
  persistentMode?: boolean;
  onStreamError?: () => void;
}

interface TrackItem {
  id: number;
  label: string;
  lang?: string;
  kind?: string;
  selected?: boolean;
}

const formatTime = (s: number) => {
  if (!Number.isFinite(s)) return "0:00";
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  return h ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}` : `${m}:${String(sec).padStart(2, "0")}`;
};

const getExt = (url: string) => {
  const clean = url.split("?")[0].toLowerCase();
  if (clean.endsWith(".m3u8")) return "m3u8";
  if (clean.endsWith(".ts") || clean.includes("mpegts")) return "mpegts";
  if (clean.endsWith(".mkv")) return "mkv";
  if (clean.endsWith(".mp4")) return "mp4";
  if (clean.endsWith(".mmp")) return "mmp";
  return "";
};

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ url, title, type = "movie", onClose, prefKey, persistentMode, onStreamError }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const tsRef = useRef<mpegts.Player | null>(null);

  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [showSubs, setShowSubs] = useState(false);
  const [showAudio, setShowAudio] = useState(false);
  const [showQuick, setShowQuick] = useState(false);
  const [subtitleTracks, setSubtitleTracks] = useState<TrackItem[]>([]);
  const [audioTracks, setAudioTracks] = useState<TrackItem[]>([]);
  const [externalSub, setExternalSub] = useState("");
  const [mpvTried, setMpvTried] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const extension = useMemo(() => getExt(url), [url]);
  const {
    audioTrackByKey,
    subtitleTrackByKey,
    playbackRateByKey,
    subtitleStyle,
    setAudioTrack,
    setSubtitleTrack,
    setPlaybackRate,
    setSubtitleStyle
  } = usePlayerPrefs();

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !url) return;

    // Persistent HLS switching for Live TV
    if (persistentMode && extension === "m3u8" && Hls.isSupported()) {
      if (hlsRef.current) {
        const hls = hlsRef.current;
        try {
          hls.stopLoad();
          hls.detachMedia();
        } catch {}
        hls.loadSource(url);
        hls.attachMedia(video);
        try { hls.startLoad(-1); } catch {}
        try { video.play().catch(() => {}); } catch {}
        setPlaying(false);
        setCurrent(0);
        setDuration(0);
        setErrorMsg(null);
        return;
      }
    }

    // Cleanup old players (non-persistent or first init)
    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
    if (tsRef.current) { tsRef.current.destroy(); tsRef.current = null; }

    if (extension === "m3u8") {
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: type === "live",
        });
        hls.loadSource(url);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setAudioTracks(
            (hls.audioTracks || []).map((t, i) => ({
              id: i,
              label: t.name || t.lang || `Audio ${i + 1}`,
              lang: t.lang,
              selected: i === hls.audioTrack,
            }))
          );
          setSubtitleTracks(
            (hls.subtitleTracks || []).map((t, i) => ({
              id: i,
              label: t.name || t.lang || `Sub ${i + 1}`,
              lang: t.lang,
              selected: i === hls.subtitleTrack,
            }))
          );
          const key = prefKey || url;
          const savedAudio = audioTrackByKey[key];
          const savedSub = subtitleTrackByKey[key];
          if (typeof savedAudio === "number" && hls.audioTracks?.[savedAudio]) {
            hls.audioTrack = savedAudio;
          }
          if (typeof savedSub === "number") {
            hls.subtitleTrack = savedSub;
          } else if (savedSub === null) {
            hls.subtitleTrack = -1;
          }
          if (videoRef.current) {
            const rate = playbackRateByKey[key] || 1;
            videoRef.current.playbackRate = rate;
            if (type !== "live") {
              try { videoRef.current.play().catch(() => {}); } catch {}
            }
          }
        });
        hlsRef.current = hls;
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = url;
        if (type !== "live") {
          try { video.play().catch(() => {}); } catch {}
        }
      }
    } else if (extension === "mpegts") {
      if (mpegts.getFeatureList().mseLivePlayback) {
        const player = mpegts.createPlayer({ type: "mpegts", url }, { isLive: type === "live" });
        player.attachMediaElement(video);
        player.load();
        tsRef.current = player;
        if (type !== "live") {
          const onCanPlay = () => {
            try { video.play().catch(() => {}); } catch {}
            video.removeEventListener("canplay", onCanPlay);
          };
          video.addEventListener("canplay", onCanPlay);
        }
      } else {
        video.src = url;
        if (type !== "live") {
          const onCanPlay = () => {
            try { video.play().catch(() => {}); } catch {}
            video.removeEventListener("canplay", onCanPlay);
          };
          video.addEventListener("canplay", onCanPlay);
        }
      }
    } else {
      // mp4 / mkv / mmp -> let browser attempt
      video.src = url;
      if (type !== "live") {
        const onCanPlay = () => {
          try { video.play().catch(() => {}); } catch {}
          video.removeEventListener("canplay", onCanPlay);
        };
        video.addEventListener("canplay", onCanPlay);
      }
    }

    setPlaying(false);
    setCurrent(0);
    setDuration(0);
    setErrorMsg(null);
  }, [url, extension, type, persistentMode]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onTime = () => setCurrent(video.currentTime);
    const onDur = () => setDuration(video.duration || 0);
    const onProgress = () => {
      if (video.buffered.length > 0) {
        setBuffered(video.buffered.end(video.buffered.length - 1));
      }
    };
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onError = async () => {
      if (type === "live") {
        try { onStreamError && onStreamError(); } catch {}
        return;
      }
      if (mpvTried) return;
      setMpvTried(true);
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

    video.addEventListener("timeupdate", onTime);
    video.addEventListener("durationchange", onDur);
    video.addEventListener("progress", onProgress);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("error", onError);

    return () => {
      video.removeEventListener("timeupdate", onTime);
      video.removeEventListener("durationchange", onDur);
      video.removeEventListener("progress", onProgress);
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("error", onError);
    };
  }, [type, mpvTried, url, title]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter") setShowControls(true);
      if (type !== "live" && e.key === "ArrowUp") setShowQuick((s) => !s);
      if (type !== "live" && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
        const video = videoRef.current;
        if (!video) return;
        const delta = e.key === "ArrowLeft" ? -10 : 10;
        video.currentTime = Math.max(0, Math.min((video.duration || 0), (video.currentTime || 0) + delta));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [type]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) video.play();
    else video.pause();
  };

  const seekTo = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    video.currentTime = ratio * duration;
  };

  const applySubtitleTrack = (id: number | null) => {
    const hls = hlsRef.current;
    if (hls) {
      hls.subtitleTrack = id === null ? -1 : id;
      setSubtitleTracks((prev) => prev.map(t => ({ ...t, selected: t.id === id })));
      if (prefKey !== undefined) setSubtitleTrack(prefKey, id);
    }
  };

  const applyAudioTrack = (id: number) => {
    const hls = hlsRef.current;
    if (hls) {
      hls.audioTrack = id;
      setAudioTracks((prev) => prev.map(t => ({ ...t, selected: t.id === id })));
      if (prefKey !== undefined) setAudioTrack(prefKey, id);
    }
  };

  const loadExternalSubtitle = () => {
    const video = videoRef.current;
    if (!video || !externalSub) return;
    const track = document.createElement("track");
    track.kind = "subtitles";
    track.src = externalSub;
    track.label = "External";
    track.srclang = "ext";
    track.default = true;
    video.appendChild(track);
    setSubtitleTracks(prev => [...prev, { id: prev.length, label: "External", lang: "ext", selected: true }]);
  };

  const setRate = (rate: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
      if (prefKey !== undefined) setPlaybackRate(prefKey, rate);
    }
  };

  const levels = hlsRef.current?.levels || [];
  const manualQualityRef = useRef(false);
  const [qualityToast, setQualityToast] = useState<string>("");
  const setLevel = (levelIndex: number | 'auto') => {
    if (!hlsRef.current) return;
    hlsRef.current.currentLevel = levelIndex === 'auto' ? -1 : levelIndex;
    manualQualityRef.current = levelIndex !== 'auto';
  };

  const progress = duration ? (current / duration) * 100 : 0;
  const bufferPct = duration ? (buffered / duration) * 100 : 0;

  // Auto Quality Guard
  useEffect(() => {
    const video = videoRef.current;
    const hls = hlsRef.current;
    if (!video || !hls) return;
    let bufferEvents: number[] = [];
    let lastNoBufferOkTs = Date.now();
    let intervalId: any;
    const onWaiting = () => {
      bufferEvents.push(Date.now());
      // keep only last 10s
      bufferEvents = bufferEvents.filter(t => Date.now() - t <= 10000);
    };
    const onStalled = () => onWaiting();
    video.addEventListener('waiting', onWaiting);
    video.addEventListener('stalled', onStalled);
    intervalId = setInterval(() => {
      const now = Date.now();
      // compute buffer length
      let bufLen = 0;
      const b = video.buffered;
      if (b && b.length > 0) {
        for (let i = 0; i < b.length; i++) {
          if (b.start(i) <= video.currentTime && b.end(i) >= video.currentTime) {
            bufLen = b.end(i) - video.currentTime;
            break;
          }
        }
        if (bufLen === 0) {
          // fallback to last range end
          bufLen = b.end(b.length - 1) - video.currentTime;
        }
      }
      const vq = (video as any).getVideoPlaybackQuality?.();
      const dropped = vq?.droppedVideoFrames || 0;
      const total = vq?.totalVideoFrames || 0;
      const dropRatio = total > 0 ? dropped / total : 0;
      const recentBuffCount = bufferEvents.filter(t => now - t <= 8000).length;

      const shouldLower =
        (recentBuffCount >= 3) ||
        (dropRatio > 0.08) ||
        (bufLen > 0 && bufLen < 2);

      if (!manualQualityRef.current && shouldLower) {
        const cur = hls.currentLevel;
        if (cur > 0) {
          hls.currentLevel = cur - 1;
          setQualityToast("Bağlantınıza göre kalite optimize edildi");
          setTimeout(() => setQualityToast(""), 2500);
        } else {
          hls.currentLevel = -1; // auto
        }
        bufferEvents = [];
        lastNoBufferOkTs = now;
        return;
      }
      // attempt step up after 20s of smooth playback
      if (!manualQualityRef.current && now - lastNoBufferOkTs >= 20000) {
        if (recentBuffCount === 0) {
          const cur = hls.currentLevel;
          const max = hls.levels?.length ? hls.levels.length - 1 : -1;
          if (cur >= 0 && max >= 0 && cur < max) {
            hls.currentLevel = cur + 1;
            lastNoBufferOkTs = now;
          }
        } else {
          lastNoBufferOkTs = now;
        }
      }
      if (recentBuffCount === 0) {
        // update smooth playback timestamp
        // but only if we have decent buffer
        if (bufLen >= 2) lastNoBufferOkTs = now;
      }
    }, 1500);
    return () => {
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('stalled', onStalled);
      clearInterval(intervalId);
    };
  }, [url, type, persistentMode]);

  return (
    <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black"
      style={{ border: "1px solid rgba(212,175,55,0.15)", boxShadow: "0 0 40px rgba(0,0,0,0.5)" }}
      onMouseMove={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {onClose && (
        <button onClick={onClose}
          className="absolute top-3 right-3 z-20 w-9 h-9 rounded-full bg-black/60 hover:bg-black flex items-center justify-center text-white">
          <X size={18} />
        </button>
      )}

      <video
        ref={videoRef}
        className={clsx("w-full h-full object-cover", subtitleStyle.size === 'small' && 'text-[14px]', subtitleStyle.size === 'medium' && 'text-[18px]', subtitleStyle.size === 'large' && 'text-[22px]')}
        crossOrigin="anonymous"
        style={{ color: subtitleStyle.color === 'yellow' ? '#FFD700' : '#FFFFFF' } as any}
      />

      {/* Controls */}
      <div className={clsx("absolute inset-0 flex flex-col justify-between transition-opacity", showControls ? "opacity-100" : "opacity-0")}>
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/80 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/80 to-transparent" />

        {/* Top bar */}
        <div className="relative z-10 flex items-center justify-between px-4 pt-3">
          <div className="text-white text-sm font-semibold">{title}</div>
          <div className="text-[10px] text-gold border border-gold/30 px-2 py-0.5 rounded font-bold uppercase">
            {extension || "stream"}
          </div>
        </div>

        {/* Center play */}
        {!playing && (
          <div className="absolute inset-0 flex items-center justify-center">
            <button onClick={togglePlay}
              className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#f6c15a,#D4AF37,#ff9f1a)", boxShadow: "0 0 30px rgba(212,175,55,0.6)" }}>
              <Play size={22} fill="black" />
            </button>
          </div>
        )}

        {/* Bottom controls */}
        <div className="relative z-10 px-4 pb-3 space-y-2">
          {/* Progress */}
          {type !== "live" && (
            <div className="flex items-center gap-3 text-xs text-white/80">
              <span className="min-w-[44px] text-right">{formatTime(current)}</span>
              <div className="relative flex-1 h-1 cursor-pointer" onClick={seekTo}>
                <div className="absolute top-0 left-0 h-full bg-white/20 rounded-full" style={{ width: `${bufferPct}%` }} />
                <div className="absolute top-0 left-0 h-full rounded-full"
                  style={{ width: `${progress}%`, background: "linear-gradient(90deg,#f6c15a,#ff9f1a)" }} />
                <div className="absolute inset-0 bg-white/10 rounded-full -z-10" />
              </div>
              <span className="min-w-[44px]">{formatTime(duration)}</span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={togglePlay} className="text-white hover:text-gold">
                {playing ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" />}
              </button>
              <button onClick={() => setMuted(!muted)} className="text-white/70 hover:text-gold">
                {muted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={muted ? 0 : volume}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  setVolume(v);
                  setMuted(v === 0);
                  if (videoRef.current) videoRef.current.volume = v;
                }}
                className="w-20 h-1"
              />
            </div>

            <div className="flex items-center gap-3">
              {/* Subtitles */}
              <div className="relative">
                <button onClick={() => { setShowSubs(!showSubs); setShowAudio(false); }}
                  className="text-white/70 hover:text-gold flex items-center gap-1.5 text-xs">
                  <Subtitles size={18} /> Subtitles
                </button>
                {showSubs && (
                  <div className="absolute right-0 mt-2 w-44 bg-black/90 border border-gold/20 rounded-xl p-2 text-xs z-20">
                    <div className="text-white/60 mb-2">Tracks</div>
                    <button onClick={() => applySubtitleTrack(null)} className="w-full text-left px-2 py-1 rounded hover:bg-white/5">
                      Off
                    </button>
                    {subtitleTracks.map(t => (
                      <button key={t.id} onClick={() => applySubtitleTrack(t.id)}
                        className={clsx("w-full text-left px-2 py-1 rounded hover:bg-white/5 flex items-center justify-between",
                          t.selected && "text-gold")}>
                        {t.label}
                        {t.selected && <Check size={12} />}
                      </button>
                    ))}
                    <div className="mt-2 border-t border-white/10 pt-2">
                      <input
                        value={externalSub}
                        onChange={(e) => setExternalSub(e.target.value)}
                        placeholder="External .vtt/.srt URL"
                        className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-[10px] text-white"
                      />
                      <button onClick={loadExternalSubtitle}
                        className="mt-2 w-full text-center text-[10px] gold-btn py-1 rounded">
                        Add Subtitle
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Audio */}
              <div className="relative">
                <button onClick={() => { setShowAudio(!showAudio); setShowSubs(false); }}
                  className="text-white/70 hover:text-gold flex items-center gap-1.5 text-xs">
                  <Settings size={18} /> Audio
                </button>
                {showAudio && (
                  <div className="absolute right-0 mt-2 w-44 bg-black/90 border border-gold/20 rounded-xl p-2 text-xs z-20">
                    <div className="text-white/60 mb-2">Languages</div>
                    {audioTracks.length === 0 && (
                      <div className="text-white/40 px-2 py-1">No tracks</div>
                    )}
                    {audioTracks.map(t => (
                      <button key={t.id} onClick={() => applyAudioTrack(t.id)}
                        className={clsx("w-full text-left px-2 py-1 rounded hover:bg-white/5 flex items-center justify-between",
                          t.selected && "text-gold")}>
                        {t.label}
                        {t.selected && <Check size={12} />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick (Speed / Quality) */}
              <div className="relative">
                <button onClick={() => { setShowQuick(!showQuick); }}
                  className="text-white/70 hover:text-gold flex items-center gap-1.5 text-xs">
                  <Settings size={18} /> Quick
                </button>
                {showQuick && (
                  <div className="absolute right-0 mt-2 w-56 bg-black/90 border border-gold/20 rounded-xl p-2 text-xs z-20">
                    <div className="text-white/60 mb-2">Playback Speed</div>
                    <div className="flex gap-1">
                      {[0.75,1,1.25,1.5].map(r => (
                        <button key={r} onClick={() => setRate(r)}
                          className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-white/80">
                          {r}x
                        </button>
                      ))}
                    </div>
                    <div className="text-white/60 mt-3 mb-1">Quality (HLS)</div>
                    <div className="max-h-40 overflow-auto">
                      <button onClick={() => setLevel('auto')}
                        className="w-full text-left px-2 py-1 rounded hover:bg-white/5">Auto</button>
                      {levels.map((lv, i) => (
                        <button key={i} onClick={() => setLevel(i)}
                          className="w-full text-left px-2 py-1 rounded hover:bg-white/5">
                          {lv.height ? `${lv.height}p` : `${Math.round((lv.bitrate||0)/1000)} kbps`}
                        </button>
                      ))}
                    </div>
                    <div className="text-white/60 mt-3 mb-1">Subtitle Style</div>
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1">
                        {(['small','medium','large'] as const).map(s => (
                          <button key={s} onClick={() => setSubtitleStyle(s as any, subtitleStyle.color)}
                            className={clsx("px-2 py-1 rounded", subtitleStyle.size===s ? "bg-gold text-black" : "bg-white/5 text-white/80")}>
                            {s}
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-1">
                        {(['white','yellow'] as const).map(c => (
                          <button key={c} onClick={() => setSubtitleStyle(subtitleStyle.size, c as any)}
                            className={clsx("px-2 py-1 rounded", subtitleStyle.color===c ? "bg-gold text-black" : "bg-white/5 text-white/80")}>
                            {c}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {qualityToast && (
        <div className="absolute top-3 right-3 z-30">
          <div className="px-3 py-1.5 rounded-lg bg-black/80 border border-white/15 text-white text-xs">
            {qualityToast}
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/70">
          <div className="bg-black/60 border border-gold/30 rounded-xl p-4 text-center max-w-sm">
            <div className="text-white font-semibold mb-2">Stream unavailable</div>
            <div className="text-white/60 text-xs mb-3">{errorMsg}</div>
            <div className="flex gap-2 justify-center">
              <button onClick={() => { setErrorMsg(null); }}
                className="gold-btn px-3 py-1.5 rounded text-xs font-bold">Retry</button>
              <button onClick={async () => {
                const w: any = window as any;
                try {
                  if (w?.ipcRenderer?.invoke) await w.ipcRenderer.invoke('mpv:play', { url, title, fs: true });
                  else {
                    const ipcr = w?.require?.('electron')?.ipcRenderer;
                    if (ipcr?.invoke) await ipcr.invoke('mpv:play', { url, title, fs: true });
                  }
                } catch {}
              }} className="px-3 py-1.5 rounded border border-white/20 text-white/80 text-xs">Open in MPV</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
