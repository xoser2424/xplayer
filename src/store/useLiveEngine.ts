import { create } from 'zustand'
import { useAuthStore } from '@/store/useAuthStore'
import { Channel } from '@/store/useContentStore'
import { useZapHistory } from '@/store/useZapHistory'

interface ZapInfo {
  channel?: Channel;
  ts?: number;
}

interface LiveEngineState {
  visible: boolean;
  url: string;
  title: string;
  channels: Channel[];
  index: number;
  zapInfo: ZapInfo | null;

  openLive: (channels: Channel[], startIndex: number) => void;
  switchTo: (index: number) => void;
  next: () => void;
  prev: () => void;
  close: () => void;
}

const buildUrl = (ch: Channel | undefined): string => {
  const { credentials } = useAuthStore.getState();
  if (!ch || !credentials.serverUrl) return '';
  return `${credentials.serverUrl}/live/${credentials.username}/${credentials.password}/${ch.stream_id}.m3u8`;
}

export const useLiveEngine = create<LiveEngineState>((set, get) => ({
  visible: false,
  url: '',
  title: '',
  channels: [],
  index: 0,
  zapInfo: null,

  openLive: (channels, startIndex) => {
    const hist = useZapHistory.getState();
    const idx = Math.min(Math.max(startIndex, 0), channels.length - 1);
    const ch = channels[idx];
    if (ch) hist.push(ch);
    set({
      visible: true,
      channels,
      index: idx,
      url: buildUrl(ch),
      title: ch?.name || '',
      zapInfo: { channel: ch, ts: Date.now() }
    });
  },
  switchTo: (index) => {
    const hist = useZapHistory.getState();
    const { channels } = get();
    if (channels.length === 0) return;
    const idx = Math.min(Math.max(index, 0), channels.length - 1);
    const ch = channels[idx];
    if (ch) hist.push(ch);
    set({
      index: idx,
      url: buildUrl(ch),
      title: ch?.name || '',
      zapInfo: { channel: ch, ts: Date.now() }
    });
  },
  next: () => {
    const hist = useZapHistory.getState();
    const { channels, index } = get();
    if (channels.length === 0) return;
    const idx = (index + 1) % channels.length;
    const ch = channels[idx];
    if (ch) hist.push(ch);
    set({
      index: idx,
      url: buildUrl(ch),
      title: ch?.name || '',
      zapInfo: { channel: ch, ts: Date.now() }
    });
  },
  prev: () => {
    const hist = useZapHistory.getState();
    const { channels, index } = get();
    if (channels.length === 0) return;
    const idx = (index - 1 + channels.length) % channels.length;
    const ch = channels[idx];
    if (ch) hist.push(ch);
    set({
      index: idx,
      url: buildUrl(ch),
      title: ch?.name || '',
      zapInfo: { channel: ch, ts: Date.now() }
    });
  },
  close: () => set({ visible: false }),
}));
