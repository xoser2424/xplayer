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
            const initialLive = liveRes.status === 'fulfilled' ? (liveRes.value ?? []) : [];
            const initialVod = vodRes.status === 'fulfilled' ? (vodRes.value ?? []) : [];
            const initialSeries = seriesRes.status === 'fulfilled' ? (seriesRes.value ?? []) : [];

            let liveStreams = Array.isArray(initialLive) ? initialLive : [];
            if (liveStreams.length === 0) {
              try {
                const zeroLive = await service.getLiveStreams('0' as any);
                if (Array.isArray(zeroLive) && zeroLive.length > 0) {
                  liveStreams = zeroLive;
                } else {
                  const perCatLive = await Promise.all(
                    liveCats.map((cat: any) => service.getLiveStreams(String(cat.category_id)))
                  );
                  liveStreams = perCatLive.flat().filter(Boolean);
                }
              } catch {
                // Silent
              }
            }

            let vodStreams = Array.isArray(initialVod) ? initialVod : [];
            if (vodStreams.length === 0) {
              // Try category_id=0 (some panels return all VOD with 0)
              try {
                const zeroVod = await service.getVodStreams('0' as any);
                if (Array.isArray(zeroVod) && zeroVod.length > 0) {
                  vodStreams = zeroVod;
                } else {
                  // Fallback: fetch per category and merge
                  const perCatVod = await Promise.all(
                    vodCats.map((cat: any) => service.getVodStreams(String(cat.category_id)))
                  );
                  vodStreams = perCatVod.flat().filter(Boolean);
                }
              } catch {
                // Silent; keep empty if still failing
              }
            }

            let seriesStreams = Array.isArray(initialSeries) ? initialSeries : [];
            if (seriesStreams.length === 0) {
              try {
                const zeroSeries = await service.getSeries('0' as any);
                if (Array.isArray(zeroSeries) && zeroSeries.length > 0) {
                  seriesStreams = zeroSeries;
                } else {
                  const perCatSeries = await Promise.all(
                    seriesCats.map((cat: any) => service.getSeries(String(cat.category_id)))
                  );
                  seriesStreams = perCatSeries.flat().filter(Boolean);
                }
              } catch {
                // Silent
              }
            }

            contentStore.setLiveContent(liveStreams || [], liveCats);
            contentStore.setMovieContent(vodStreams || [], vodCats);
            contentStore.setSeriesContent(seriesStreams || [], seriesCats);

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
    }
  )
)
