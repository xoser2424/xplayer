import { create } from 'zustand'

interface PlayerState {
  isPlaying: boolean;
  currentStreamUrl: string | null;
  currentStreamType: 'live' | 'movie' | 'series' | null;
  currentMetadata: any | null;
  volume: number;
  isMuted: boolean;
  isFullscreen: boolean;
  
  play: (url: string, type: 'live' | 'movie' | 'series', metadata?: any) => void;
  stop: () => void;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
  toggleFullscreen: () => void;
  setIsPlaying: (playing: boolean) => void;
}

export const usePlayerStore = create<PlayerState>((set) => ({
  isPlaying: false,
  currentStreamUrl: null,
  currentStreamType: null,
  currentMetadata: null,
  volume: 1,
  isMuted: false,
  isFullscreen: false,

  play: (url, type, metadata) => set({ 
    currentStreamUrl: url, 
    currentStreamType: type, 
    currentMetadata: metadata, 
    isPlaying: true 
  }),
  stop: () => set({ 
    currentStreamUrl: null, 
    currentStreamType: null, 
    currentMetadata: null, 
    isPlaying: false 
  }),
  setVolume: (vol) => set({ volume: vol }),
  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
  toggleFullscreen: () => set((state) => ({ isFullscreen: !state.isFullscreen })),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
}))