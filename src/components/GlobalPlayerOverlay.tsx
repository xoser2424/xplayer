import React, { useEffect, useRef, useState } from "react";
import { useLiveEngine } from "@/store/useLiveEngine";
import { ArrowLeft } from "lucide-react";
import clsx from "clsx";
import { useContentStore } from "@/store/useContentStore";
import { useEPGStore } from "@/store/useEPGStore";
import { useFavoritesStore } from "@/store/useFavoritesStore";
import { useZapHistory } from "@/store/useZapHistory";
import { VeloraPlayer } from "@/player/VeloraPlayer";

export const GlobalPlayerOverlay: React.FC = () => {
  const { visible, url, title, close, next, prev, zapInfo, channels, index, switchTo } = useLiveEngine();
  const { liveCategories } = useContentStore();
  const fav = useFavoritesStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const [fade, setFade] = useState(false);
  const [showCtrls, setShowCtrls] = useState(true);
  const [showList, setShowList] = useState(false);
  const [listIndex, setListIndex] = useState(0);
  const holdRef = useRef<{ t?: any; held?: boolean }>({});
  const [numBuf, setNumBuf] = useState<string>("");
  const numTimer = useRef<any>();
  const epg = useEPGStore();
  const [osdVisible, setOsdVisible] = useState(false);
  const osdTimer = useRef<any>();
  const [toast, setToast] = useState<string>("");
  const [liveError, setLiveError] = useState(false);
  const [nowClock, setNowClock] = useState<Date>(new Date());
  useEffect(() => {
    const t = setInterval(() => setNowClock(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  
  const catNameById = (id?: string) => liveCategories.find(c => c.category_id === id)?.category_name || "";
  const fmtHM = (d?: Date) => d ? d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : "";
  const parseEPGTime = (v?: string): Date | undefined => {
    if (!v) return undefined;
    const num = Number(v);
    if (!Number.isNaN(num)) {
      const ms = num > 1e12 ? num : (num > 1e10 ? num : num * 1000);
      return new Date(ms);
    }
    const t = Date.parse(v);
    if (!Number.isNaN(t)) return new Date(t);
    return undefined;
  };

  useEffect(() => {
    if (!visible) return;
    setFade(true);
    const t = setTimeout(() => setFade(false), 200);
    const onKeyDown = (e: KeyboardEvent) => {
      // numeric zapping
      if (/^[0-9]$/.test(e.key)) {
        const val = (numBuf + e.key).substring(0, 4);
        setNumBuf(val);
        clearTimeout(numTimer.current);
        numTimer.current = setTimeout(() => {
          const targetNum = parseInt(val, 10);
          const idx = channels.findIndex(c => c.num === targetNum);
          if (idx >= 0) switchTo(idx);
          else {
            setToast("Channel not found");
            setTimeout(() => setToast(""), 1800);
          }
          setNumBuf("");
        }, 2000);
        return;
      }
      if (e.key === "Backspace" && numBuf) {
        const val = numBuf.slice(0, -1);
        setNumBuf(val);
        clearTimeout(numTimer.current);
        if (val) {
          numTimer.current = setTimeout(() => {
            const targetNum = parseInt(val, 10);
            const idx = channels.findIndex(c => c.num === targetNum);
          if (idx >= 0) switchTo(idx);
          else {
            setToast("Channel not found");
            setTimeout(() => setToast(""), 1800);
          }
            setNumBuf("");
          }, 2000);
        }
        return;
      }
      // zap history back
      if (e.key === "Backspace" && !numBuf) {
        const prevCh = useZapHistory.getState().back();
        if (prevCh) {
          const idx = channels.findIndex(c => c.stream_id === prevCh.stream_id);
          if (idx >= 0) switchTo(idx);
        }
        return;
      }
      // favorites toggle on player
      if (e.key.toLowerCase() === "f" && zapInfo?.channel) {
        const before = fav.isFavorite(zapInfo.channel.stream_id);
        fav.toggle(zapInfo.channel);
        setToast(before ? "Favorilerden kaldırıldı" : "Favorilere eklendi");
        setTimeout(() => setToast(""), 1500);
        return;
      }
      if (e.key === "Escape" && numBuf) {
        setNumBuf("");
        clearTimeout(numTimer.current);
        return;
      }
      if (e.key === "Escape") {
        if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
        const w: any = window as any;
        try { w?.ipcRenderer?.invoke && w.ipcRenderer.invoke('mpv:stop'); } catch {}
        close();
        return;
      }
      if (showList) {
        if (e.key === "ArrowUp") { setListIndex(i => Math.max(0, i - 1)); e.preventDefault(); }
        else if (e.key === "ArrowDown") { setListIndex(i => Math.min(channels.length - 1, i + 1)); e.preventDefault(); }
        else if (e.key === "Enter") { switchTo(listIndex); setShowList(false); }
        return;
      }
      if (e.key === "ArrowUp") { prev(); return; }
      if (e.key === "ArrowDown") { next(); return; }
      if (e.key === "Enter") {
        holdRef.current.held = false;
        clearTimeout(holdRef.current.t);
        holdRef.current.t = setTimeout(() => {
          holdRef.current.held = true;
          setListIndex(index);
          setShowList(true);
        }, 600);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        const wasHeld = holdRef.current.held;
        clearTimeout(holdRef.current.t);
        holdRef.current.t = undefined;
        holdRef.current.held = false;
        if (!wasHeld && !showList) setShowCtrls(s => !s);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => { clearTimeout(t); window.removeEventListener("keydown", onKeyDown); window.removeEventListener("keyup", onKeyUp); };
  }, [visible, close, next, prev, showList, channels.length, index, switchTo]);

  if (!visible) return null;
  useEffect(() => {
    if (!visible || !zapInfo) return;
    setOsdVisible(true);
    clearTimeout(osdTimer.current);
    osdTimer.current = setTimeout(() => setOsdVisible(false), 3000);
  }, [visible, zapInfo?.ts]);
  const showZap = osdVisible;
  const ch = zapInfo?.channel;
  const nowNext = ch ? epg.getFor(ch.stream_id) : undefined;
  // compute progress
  const nowStartD = parseEPGTime(nowNext?.nowStart);
  const nowEndD = parseEPGTime(nowNext?.nowEnd);
  const nowMs = nowClock.getTime();
  const totalMs = nowStartD && nowEndD ? nowEndD.getTime() - nowStartD.getTime() : 0;
  const elapsedMs = nowStartD ? Math.max(0, nowMs - nowStartD.getTime()) : 0;
  const remainMs = totalMs > 0 ? Math.max(0, totalMs - elapsedMs) : 0;
  const pct = totalMs > 0 ? Math.min(100, Math.max(0, (elapsedMs / totalMs) * 100)) : 0;

  return (
    <div ref={containerRef} className="fixed inset-0 z-[70] pointer-events-none bg-black">
      
      {/* Video Player Layer */}
      <div className="absolute inset-0 z-0 pointer-events-auto">
        <VeloraPlayer 
          url={url || ""} 
          onError={() => setLiveError(true)}
          onPlaying={() => setLiveError(false)}
        />
      </div>

      {/* top-left back */}
      <div className={clsx("absolute top-4 left-4 z-20 transition-opacity pointer-events-auto", showCtrls ? "opacity-100" : "opacity-0")}>
        <button onClick={() => { close(); }} className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white">
          <ArrowLeft size={18} />
        </button>
      </div>

      {/* channel zapping osd */}
      {showZap && ch && (
        <div className="absolute left-6 top-1/2 -translate-y-1/2 z-30 transition-opacity pointer-events-auto" style={{ opacity: showZap ? 1 : 0, transition: "opacity 150ms" }}>
          <div className="bg-black/70 border border-white/15 rounded-xl px-4 py-3 w-80 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 rounded overflow-hidden flex items-center justify-center">
                {ch.stream_icon ? <img src={ch.stream_icon} alt="" className="w-full h-full object-contain" /> : <div className="w-6 h-6 rounded bg-white/10" />}
              </div>
              <div className="flex-1">
                <div className="text-white text-sm font-semibold truncate">
                  {fav.isFavorite(ch.stream_id) && <span className="text-yellow-400 mr-1">★</span>}
                  {ch.name}
                </div>
                <div className="text-[11px] text-white/60">{ch.num ?? ""} · {catNameById(ch.category_id)}</div>
                {nowNext ? (
                  <div className="text-[11px] text-white/70 leading-tight mt-1">
                    <div>NOW: <span className="text-white">{nowNext.nowTitle || "-"}</span> <span className="text-white/60 text-[10px]">({fmtHM(nowStartD)} - {fmtHM(nowEndD)})</span></div>
                    {/* progress */}
                    {totalMs > 0 && (
                      <div className="mt-1">
                        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "linear-gradient(90deg,#f6c15a,#ff9f1a)" }} />
                        </div>
                        <div className="flex justify-between text-[10px] text-white/60 mt-0.5">
                          <span>{Math.floor(elapsedMs / 60000)} min</span>
                          <span>{Math.ceil(remainMs / 60000)} min left</span>
                        </div>
                      </div>
                    )}
                    <div className="mt-1">NEXT: <span className="text-white/80">{nowNext.nextTitle || "-"}</span> <span className="text-white/50 text-[10px]">({fmtHM(parseEPGTime(nowNext.nextStart))} - {fmtHM(parseEPGTime(nowNext.nextEnd))})</span></div>
                  </div>
                ) : (
                  <div className="text-[10px] text-white/60">Switching...</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* channel list (long-press Enter) */}
      {showList && (
        <div className="absolute inset-0 z-40 bg-black/40 pointer-events-auto">
          <div className="absolute left-8 top-1/2 -translate-y-1/2 w-80 max-h-[70vh] overflow-y-auto rounded-2xl bg-black/85 border border-white/10 p-2">
            {channels.map((c, i) => (
              <button
                key={c.stream_id}
                onClick={() => { switchTo(i); setShowList(false); }}
                className={clsx("w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left",
                  i === listIndex ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5")}
              >
                <div className="w-8 h-8 rounded-lg overflow-hidden bg-white/10 flex items-center justify-center">
                  {c.stream_icon ? <img src={c.stream_icon} className="w-full h-full object-contain" /> : <span className="text-xs">{c.name.substring(0,2)}</span>}
                </div>
                <div className="truncate">{c.num ? `${c.num} · ` : ""}{c.name}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* numeric overlay */}
      {numBuf && (
        <div className="absolute top-6 right-6 z-40 pointer-events-auto">
          <div className="px-3 py-1.5 rounded-lg bg-black/70 border border-white/15 text-white text-lg font-bold tracking-widest">
            {numBuf}
          </div>
        </div>
      )}

      {/* short info bar (OK short press) */}
      {showCtrls && ch && (
        <div className="absolute left-0 right-0 bottom-4 z-30 mx-6 pointer-events-auto">
          <div className="bg-black/70 border border-white/10 rounded-2xl px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg overflow-hidden bg-white/10 flex items-center justify-center">
                {ch.stream_icon ? <img src={ch.stream_icon} className="w-full h-full object-contain" /> : <span className="text-xs">{ch.name.substring(0,2)}</span>}
              </div>
              <div>
                <div className="text-white text-sm font-semibold">{ch.name}</div>
                {nowNext && (
                  <div className="text-[11px] text-white/70">
                    {nowNext.nowTitle || "-"} <span className="text-white/50">({fmtHM(nowStartD)} - {fmtHM(nowEndD)})</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex-1 mx-4">
              {totalMs > 0 && (
                <div>
                  <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "linear-gradient(90deg,#f6c15a,#ff9f1a)" }} />
                  </div>
                </div>
              )}
            </div>
            <div className="text-white/70 text-sm">{fmtHM(nowClock)}</div>
          </div>
        </div>
      )}

      {/* live error overlay */}
      {liveError && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 pointer-events-auto">
          <div className="bg-black/70 border border-white/15 rounded-xl px-4 py-3 text-center">
            <div className="text-white font-semibold mb-1">Stream unavailable</div>
            <div className="text-white/60 text-xs">Trying next channel in 5 seconds…</div>
          </div>
        </div>
      )}

      {/* toast */}
      {toast && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 pointer-events-auto">
          <div className="px-3 py-1.5 rounded-lg bg-black/80 border border-white/15 text-white text-xs">
            {toast}
          </div>
        </div>
      )}
    </div>
  );
};
