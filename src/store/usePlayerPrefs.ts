import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type SizeOpt = 'small' | 'medium' | 'large'
type ColorOpt = 'white' | 'yellow'

interface PlayerPrefsState {
  audioTrackByKey: Record<string, number>;
  subtitleTrackByKey: Record<string, number | null>;
  playbackRateByKey: Record<string, number>;
  audioDelayByKey: Record<string, number>;
  subDelayByKey: Record<string, number>;
  subtitleStyle: { size: SizeOpt; color: ColorOpt };

  setAudioTrack: (key: string, idx: number) => void;
  setSubtitleTrack: (key: string, idx: number | null) => void;
  setPlaybackRate: (key: string, rate: number) => void;
  setAudioDelay: (key: string, secs: number) => void;
  setSubDelay: (key: string, secs: number) => void;
  setSubtitleStyle: (size: SizeOpt, color: ColorOpt) => void;
}

export const usePlayerPrefs = create<PlayerPrefsState>()(
  persist(
    (set) => ({
      audioTrackByKey: {},
      subtitleTrackByKey: {},
      playbackRateByKey: {},
      audioDelayByKey: {},
      subDelayByKey: {},
      subtitleStyle: { size: 'medium', color: 'white' },

      setAudioTrack: (key, idx) => set((s) => ({ audioTrackByKey: { ...s.audioTrackByKey, [key]: idx } })),
      setSubtitleTrack: (key, idx) => set((s) => ({ subtitleTrackByKey: { ...s.subtitleTrackByKey, [key]: idx } })),
      setPlaybackRate: (key, rate) => set((s) => ({ playbackRateByKey: { ...s.playbackRateByKey, [key]: rate } })),
      setAudioDelay: (key, secs) => set((s) => ({ audioDelayByKey: { ...s.audioDelayByKey, [key]: secs } })),
      setSubDelay: (key, secs) => set((s) => ({ subDelayByKey: { ...s.subDelayByKey, [key]: secs } })),
      setSubtitleStyle: (size, color) => set(() => ({ subtitleStyle: { size, color } })),
    }),
    { name: 'player-prefs' }
  )
)
