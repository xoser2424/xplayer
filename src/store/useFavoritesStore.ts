import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Channel } from '@/store/useContentStore'

export interface FavoriteItem {
  channelId: number;
  name: string;
  logo?: string;
  streamUrl?: string;
  group?: string;
  num?: number;
}

interface FavoritesState {
  items: FavoriteItem[];
  isFavorite: (chId: number) => boolean;
  toggle: (ch: Channel, streamUrl?: string, groupName?: string) => void;
  remove: (chId: number) => void;
  list: () => FavoriteItem[];
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      items: [],
      isFavorite: (chId) => !!get().items.find(i => i.channelId === chId),
      list: () => get().items.slice(),
      remove: (chId) => set({ items: get().items.filter(i => i.channelId !== chId) }),
      toggle: (ch, streamUrl, groupName) => {
        const exists = get().items.find(i => i.channelId === ch.stream_id);
        if (exists) {
          set({ items: get().items.filter(i => i.channelId !== ch.stream_id) });
        } else {
          const item: FavoriteItem = {
            channelId: ch.stream_id,
            name: ch.name,
            logo: ch.stream_icon,
            streamUrl,
            group: groupName,
            num: ch.num,
          };
          set({ items: [...get().items, item] });
        }
      },
    }),
    { name: 'xplayer:favorites' }
  )
)
