import { create } from 'zustand'
import { Channel } from '@/store/useContentStore'
import { useAuthStore } from '@/store/useAuthStore'

export interface EPGItem {
  nowTitle?: string;
  nowStart?: string;
  nowEnd?: string;
  nextTitle?: string;
  nextStart?: string;
  nextEnd?: string;
  ts: number;
}

interface EPGState {
  byStreamId: Record<number, EPGItem>;
  lastPreload: number;
  preload: (channels: Channel[]) => Promise<void>;
  getFor: (streamId: number) => EPGItem | undefined;
  refresh: (channels: Channel[]) => Promise<void>;
}

const TEN_MIN = 10 * 60 * 1000;

const fetchEPG = async (baseUrl: string, username: string, password: string, streamId: number) => {
  const url = `${baseUrl}/player_api.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&action=get_simple_data_table&stream_id=${streamId}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`EPG ${streamId} ${res.status}`);
  const data = await res.json();
  // Many panels return array of events; take first two as now/next
  const events = Array.isArray(data) ? data : (data?.epg_listings || []);
  const now = events[0];
  const next = events[1];
  const fmt = (e: any) => {
    if (!e) return undefined;
    // prefer formatted times if provided, else parse start/stop
    const title = e.title || e.name;
    const start = e.start || e.start_timestamp || e.start_time;
    const end = e.end || e.stop_timestamp || e.end_time;
    return { title, start, end };
  };
  const n = fmt(now);
  const nx = fmt(next);
  const item: EPGItem = {
    nowTitle: n?.title,
    nowStart: n?.start,
    nowEnd: n?.end,
    nextTitle: nx?.title,
    nextStart: nx?.start,
    nextEnd: nx?.end,
    ts: Date.now(),
  };
  return item;
}

export const useEPGStore = create<EPGState>((set, get) => ({
  byStreamId: {},
  lastPreload: 0,

  getFor: (sid) => get().byStreamId[sid],

  preload: async (channels) => {
    const { credentials } = useAuthStore.getState();
    if (!credentials.serverUrl || !credentials.username || !credentials.password) return;
    const now = Date.now();
    if (now - get().lastPreload < TEN_MIN) return;
    set({ lastPreload: now });
    const baseUrl = credentials.serverUrl;
    const u = credentials.username!;
    const p = credentials.password!;
    const byId: Record<number, EPGItem> = { ...get().byStreamId };

    const list = channels.slice(0); // clone
    const concurrency = 6;
    let idx = 0;
    await Promise.all(Array.from({ length: concurrency }).map(async () => {
      while (idx < list.length) {
        const i = idx++;
        const ch = list[i];
        if (!ch) break;
        try {
          const item = await fetchEPG(baseUrl, u, p, ch.stream_id);
          byId[ch.stream_id] = item;
        } catch {
          // ignore failures; keep fallback to name/logo only
        }
      }
    }));

    set({ byStreamId: byId, lastPreload: Date.now() });
  },

  refresh: async (channels) => {
    const { credentials } = useAuthStore.getState();
    if (!credentials.serverUrl || !credentials.username || !credentials.password) return;
    const baseUrl = credentials.serverUrl;
    const u = credentials.username!;
    const p = credentials.password!;
    const byId: Record<number, EPGItem> = { ...get().byStreamId };
    const list = channels.slice(0);
    const concurrency = 6;
    let idx = 0;
    await Promise.all(Array.from({ length: concurrency }).map(async () => {
      while (idx < list.length) {
        const i = idx++;
        const ch = list[i];
        if (!ch) break;
        try {
          const item = await fetchEPG(baseUrl, u, p, ch.stream_id);
          byId[ch.stream_id] = item;
        } catch {}
      }
    }));
    set({ byStreamId: byId, lastPreload: Date.now() });
  },
}));
