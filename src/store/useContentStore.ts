import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Channel {
  num: number;
  name: string;
  stream_type: string;
  stream_id: number;
  stream_icon?: string;
  epg_channel_id?: string;
  added: string;
  category_id: string;
  custom_sid?: string;
  tv_archive?: number;
  direct_source?: string;
  rat_check?: number;
}

export interface Movie {
  num: number;
  name: string;
  stream_type: string;
  stream_id: number;
  stream_icon?: string;
  rating?: string;
  rating_5based?: number;
  added: string;
  category_id: string;
  container_extension?: string;
  custom_sid?: string;
  direct_source?: string;
}

export interface Series {
  num: number;
  name: string;
  series_id: number;
  cover?: string;
  plot?: string;
  cast?: string;
  director?: string;
  genre?: string;
  releaseDate?: string;
  last_modified?: string;
  rating?: string;
  rating_5based?: number;
  backdrop_path?: string[];
  youtube_trailer?: string;
  episode_run_time?: string;
  category_id: string;
}

export interface Category {
  category_id: string;
  category_name: string;
  parent_id: number;
}

interface ContentState {
  liveChannels: Channel[];
  movies: Movie[];
  series: Series[];
  liveCategories: Category[];
  movieCategories: Category[];
  seriesCategories: Category[];
  favorites: any[];
  history: any[];
  movieInfos: Record<number, any>;
  seriesInfos: Record<number, any>;
  
  setLiveContent: (channels: Channel[], categories: Category[]) => void;
  setMovieContent: (movies: Movie[], categories: Category[]) => void;
  setSeriesContent: (series: Series[], categories: Category[]) => void;
  addToFavorites: (item: any) => void;
  removeFromFavorites: (id: number | string) => void;
  addToHistory: (item: any) => void;
  setMovieInfo: (id: number, info: any) => void;
  setSeriesInfo: (id: number, info: any) => void;
}

export const useContentStore = create<ContentState>()(
  persist(
    (set) => ({
      liveChannels: [],
      movies: [],
      series: [],
      liveCategories: [],
      movieCategories: [],
      seriesCategories: [],
      favorites: [],
      history: [],
      movieInfos: {},
      seriesInfos: {},

      setLiveContent: (channels, categories) => set({
        liveChannels: channels.map((c: any) => ({ ...c, category_id: String(c.category_id ?? '') })),
        liveCategories: categories
          .map((cat: any) => ({ ...cat, category_id: String(cat.category_id ?? '') }))
      }),
      setMovieContent: (movies, categories) => set({
        movies: movies.map((m: any) => ({ ...m, category_id: String(m.category_id ?? '') })),
        movieCategories: categories
          .map((cat: any) => ({ ...cat, category_id: String(cat.category_id ?? '') }))
      }),
      setSeriesContent: (series, categories) => set({
        series: series.map((s: any) => ({ ...s, category_id: String(s.category_id ?? '') })),
        seriesCategories: categories
          .map((cat: any) => ({ ...cat, category_id: String(cat.category_id ?? '') }))
      }),

      addToFavorites: (item) => set((state) => ({ favorites: [...state.favorites, item] })),
      removeFromFavorites: (id) => set((state) => ({ favorites: state.favorites.filter((i) => (i.stream_id || i.series_id) !== id) })),
      addToHistory: (item) => set((state) => {
        const newHistory = [item, ...state.history.filter((i) => (i.stream_id || i.series_id) !== (item.stream_id || item.series_id))];
        return { history: newHistory.slice(0, 50) };
      }),
      setMovieInfo: (id, info) => set((state) => ({ movieInfos: { ...state.movieInfos, [id]: info } })),
      setSeriesInfo: (id, info) => set((state) => ({ seriesInfos: { ...state.seriesInfos, [id]: info } })),
    }),
    {
      name: 'content-storage',
    }
  )
)
