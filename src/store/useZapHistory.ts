import { create } from 'zustand'
import { Channel } from '@/store/useContentStore'

interface ZapHistoryState {
  stack: Channel[];
  push: (ch: Channel) => void;
  back: () => Channel | null;
  clear: () => void;
}

export const useZapHistory = create<ZapHistoryState>((set, get) => ({
  stack: [],
  push: (ch) => {
    const s = get().stack.slice(0);
    // avoid pushing duplicates consecutively
    if (s[0]?.stream_id === ch.stream_id) return;
    s.unshift(ch);
    // keep last 10
    if (s.length > 10) s.pop();
    set({ stack: s });
  },
  back: () => {
    const s = get().stack.slice(0);
    // current is s[0], previous is s[1]
    if (s.length < 2) return null;
    const prev = s[1];
    // move prev to top, remove duplicates
    const filtered = s.filter(x => x.stream_id !== prev.stream_id);
    filtered.unshift(prev);
    set({ stack: filtered });
    return prev;
  },
  clear: () => set({ stack: [] }),
}));
