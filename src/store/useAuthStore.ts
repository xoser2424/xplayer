import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { XtreamService } from '@/services/XtreamService'
import { useContentStore } from './useContentStore'

interface UserInfo {
  username: string;
  password?: string;
  message?: string;
  auth?: number;
  status?: string;
  exp_date?: string;
  is_trial?: string;
  active_cons?: string;
  created_at?: string;
  max_connections?: string;
  allowed_output_formats?: string[];
}

interface ServerInfo {
  url: string;
  port: string;
  https_port: string;
  server_protocol: string;
  rtmp_port: string;
  timezone: string;
  timestamp_now?: number;
  time_now?: string;
  process?: boolean;
}

interface AuthState {
  isAuthenticated: boolean;
  authType: 'xtream' | 'm3u' | null;
  user: UserInfo | null;
  server: ServerInfo | null;
  credentials: {
    username?: string;
    password?: string;
    serverUrl?: string;
    playlistUrl?: string;
  };
  isLoading: boolean;
  error: string | null;
  
  loginXtream: (url: string, user: string, pass: string) => Promise<void>;
  loginM3U: (url: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      authType: null,
      user: null,
      server: null,
      credentials: {},
      isLoading: false,
      error: null,

      loginXtream: async (url, username, password) => {
        set({ isLoading: true, error: null });
        try {
          const service = new XtreamService({ baseUrl: url, username, password });
          const authData = await service.authenticate();

          if (authData.user_info && authData.user_info.auth === 1) {
            // Success
            set({
              isAuthenticated: true,
              authType: 'xtream',
              user: authData.user_info,
              server: authData.server_info,
              credentials: { serverUrl: url, username, password }
            });

            // Start background sync (don't await to keep UI responsive)
            // In a real app, show a progress bar
            const contentStore = useContentStore.getState();
            
            // Fetch Categories first (tolerant)
            const [liveCatsRes, vodCatsRes, seriesCatsRes] = await Promise.allSettled([
              service.getLiveCategories(),
              service.getVodCategories(),
              service.getSeriesCategories()
            ]);
            const liveCats = liveCatsRes.status === 'fulfilled' ? (liveCatsRes.value ?? []) : [];
            const vodCats = vodCatsRes.status === 'fulfilled' ? (vodCatsRes.value ?? []) : [];
            const seriesCats = seriesCatsRes.status === 'fulfilled' ? (seriesCatsRes.value ?? []) : [];
            
            // Then Fetch Streams (with fallbacks for panels requiring category_id)
            const [liveRes, vodRes, seriesRes] = await Promise.allSettled([
              service.getLiveStreams(),
              service.getVodStreams(),
              service.getSeries()
            ]);
            const toArray = (val: any) => {
              if (Array.isArray(val)) return val;
              if (val && typeof val === 'object') return Object.values(val);
              return [];
            };
            const dedupeBy = (arr: any[], key: string) => {
              const map = new Map<any, any>();
              for (const it of arr) {
                const k = it?.[key];
                if (!map.has(k)) map.set(k, it);
              }
              return Array.from(map.values());
            };
            const initialLive = toArray(liveRes.status === 'fulfilled' ? (liveRes.value ?? []) : []);
            const initialVod = toArray(vodRes.status === 'fulfilled' ? (vodRes.value ?? []) : []);
            const initialSeries = toArray(seriesRes.status === 'fulfilled' ? (seriesRes.value ?? []) : []);

            let liveStreams = initialLive;
            if (liveStreams.length === 0) {
              try {
                const zeroLive = await service.getLiveStreams('0' as any);
                const zArr = toArray(zeroLive);
                if (zArr.length > 0) {
                  liveStreams = zArr;
                } else {
                  const perCatLive = await Promise.all(
                    liveCats.map((cat: any) => service.getLiveStreams(String(cat.category_id)))
                  );
                  liveStreams = perCatLive.flatMap(toArray).filter(Boolean);
                }
              } catch {
                // Silent
              }
            }

            let vodStreams = initialVod;
            if (vodStreams.length === 0) {
              // Try category_id=0 (some panels return all VOD with 0)
              try {
                const zeroVod = await service.getVodStreams('0' as any);
                const zArr = toArray(zeroVod);
                if (zArr.length > 0) {
                  vodStreams = zArr;
                } else {
                  // Fallback: fetch per category and merge
                  const perCatVod = await Promise.all(
                    vodCats.map((cat: any) => service.getVodStreams(String(cat.category_id)))
                  );
                  vodStreams = perCatVod.flatMap(toArray).filter(Boolean);
                }
              } catch {
                // Silent; keep empty if still failing
              }
            }

            let seriesStreams = initialSeries;
            if (seriesStreams.length === 0) {
              try {
                const zeroSeries = await service.getSeries('0' as any);
                const zArr = toArray(zeroSeries);
                if (zArr.length > 0) {
                  seriesStreams = zArr;
                } else {
                  const perCatSeries = await Promise.all(
                    seriesCats.map((cat: any) => service.getSeries(String(cat.category_id)))
                  );
                  seriesStreams = perCatSeries.flatMap(toArray).filter(Boolean);
                }
              } catch {
                // Silent
              }
            }

            contentStore.setLiveContent(dedupeBy(liveStreams || [], 'stream_id'), liveCats);
            contentStore.setMovieContent(dedupeBy(vodStreams || [], 'stream_id'), vodCats);
            contentStore.setSeriesContent(dedupeBy(seriesStreams || [], 'series_id'), seriesCats);

            // Background metadata prefetch (persisted)
            (async () => {
              try {
                const { setMovieInfo, setSeriesInfo, movieInfos, seriesInfos } = useContentStore.getState() as any;
                const svc = new XtreamService({ baseUrl: url, username, password });
                const maxMovies = Math.min((vodStreams || []).length, 300);
                const maxSeries = Math.min((seriesStreams || []).length, 300);
                const movieTargets = (vodStreams || []).slice(0, maxMovies).filter((m: any) => !movieInfos?.[m.stream_id]);
                const seriesTargets = (seriesStreams || []).slice(0, maxSeries).filter((s: any) => !seriesInfos?.[s.series_id]);
                const runLimited = async (items: any[], worker: (x: any) => Promise<void>, concurrency = 4) => {
                  const queue = [...items];
                  const workers = Array(Math.min(concurrency, queue.length)).fill(0).map(async () => {
                    while (queue.length) {
                      const item = queue.shift();
                      if (!item) break;
                      try { await worker(item); } catch {}
                      await new Promise(r => setTimeout(r, 150));
                    }
                  });
                  await Promise.all(workers);
                };
                await runLimited(movieTargets, async (m: any) => {
                  const info = await svc.getVodInfo(String(m.stream_id));
                  if (info) setMovieInfo(m.stream_id, info);
                });
                await runLimited(seriesTargets, async (s: any) => {
                  const info = await svc.getSeriesInfo(String(s.series_id));
                  if (info) setSeriesInfo(s.series_id, info);
                });
              } catch {
                // Silent background
              }
            })();

          } else {
            set({ error: 'Authentication failed. Please check credentials.' });
          }
        } catch (err: any) {
           console.error(err);
           set({ error: err.message || 'Connection error' });
        } finally {
          set({ isLoading: false });
        }
      },

      loginM3U: async (playlistUrl) => {
        set({ isLoading: true, error: null });
        // TODO: Implement M3U parser
        console.log("Logging in via M3U:", playlistUrl);
        set({
          isAuthenticated: true,
          authType: 'm3u',
          user: { username: 'M3U User' },
          server: null,
          credentials: { playlistUrl },
          isLoading: false
        });
      },

      logout: () => {
         set({ isAuthenticated: false, authType: null, user: null, server: null, credentials: {} });
         // Clear content?
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        authType: state.authType,
        user: state.user,
        server: state.server,
        credentials: state.credentials,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        state.isLoading = false;
        state.error = null;
      }
    }
  )
)
