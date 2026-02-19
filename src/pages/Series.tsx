import React, { useState, useMemo, useEffect } from 'react';
import { Search } from 'lucide-react';
import { MovieCard } from '@/components/MovieCard';
import { useContentStore } from '@/store/useContentStore';
import { useAuthStore } from '@/store/useAuthStore';
import { XtreamService } from '@/services/XtreamService';
import clsx from 'clsx';

  const { series, seriesCategories, seriesInfos, setSeriesInfo, setSeriesContent } = useContentStore();
  const { series, seriesCategories, seriesInfos, setSeriesInfo } = useContentStore();
  const { credentials } = useAuthStore();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const filteredSeries = useMemo(() => {
    let result = series;
    if (selectedCategoryId !== 'all') {
      result = result.filter(s => s.category_id === selectedCategoryId);
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(s => s.name.toLowerCase().includes(query));
    }
    return result;
  }, [series, selectedCategoryId, searchQuery]);

  const visibleSeries = useMemo(() => filteredSeries.slice(0, visibleCount), [filteredSeries, visibleCount]);

  useEffect(() => {
    const loadInfos = async () => {
      if (!credentials.serverUrl || !credentials.username || !credentials.password) return;
      const service = new XtreamService({ baseUrl: credentials.serverUrl, username: credentials.username, password: credentials.password });
      const targets = visibleSeries.slice(0, 50).filter(s => !seriesInfos[s.series_id]);
      for (const s of targets) {
        try {
          const info = await service.getSeriesInfo(String(s.series_id));
          if (info) setSeriesInfo(s.series_id, info);
        } catch {}
      }
    };
    loadInfos();
  }, [visibleSeries, credentials, seriesInfos, setSeriesInfo]);

  const refreshSeries = async () => {
    if (!credentials.serverUrl || !credentials.username || !credentials.password) return;
    setRefreshing(true);
    setLoadError(null);
    try {
      const service = new XtreamService({ baseUrl: credentials.serverUrl, username: credentials.username, password: credentials.password });
      // Fetch categories with tolerance
      let cats: any[] = [];
      try {
        const res = await service.getSeriesCategories();
        cats = Array.isArray(res) ? res : [];
      } catch {}
      // Fetch series with fallbacks
      let items: any[] = [];
      try {
        const base = await service.getSeries();
        items = Array.isArray(base) ? base : [];
      } catch {}
      if (items.length === 0) {
        try {
          const zero = await service.getSeries('0' as any);
          if (Array.isArray(zero) && zero.length > 0) items = zero;
        } catch {}
      }
      if (items.length === 0 && cats.length > 0) {
        try {
          const perCat = await Promise.all(
            cats.map((c: any) => service.getSeries(String(c.category_id)))
          );
          items = perCat.flat().filter(Boolean);
        } catch (e: any) {
          setLoadError(e?.message || 'Seriler yüklenemedi');
        }
      }
      setSeriesContent(items || [], cats || []);
    } catch (e: any) {
      setLoadError(e?.message || 'Seriler yüklenemedi');
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="flex h-full gap-6 overflow-hidden">
      {/* Categories Sidebar */}
      <div className="w-72 bg-panel/50 rounded-2xl p-4 overflow-hidden flex flex-col border border-white/5 backdrop-blur-sm">
        <h2 className="text-xl font-serif font-bold text-gold mb-6 px-2 sticky top-0 bg-panel/95 z-10 pb-2 border-b border-white/5">
           Genres <span className="text-xs text-text-muted font-normal ml-2">({seriesCategories.length})</span>
        </h2>
        
        <div className="space-y-1 overflow-y-auto pr-2 custom-scrollbar flex-1">
          <button
            onClick={() => setSelectedCategoryId('all')}
            className={clsx(
              "w-full text-left px-4 py-2.5 rounded-lg transition-all font-medium text-sm flex justify-between items-center",
              selectedCategoryId === 'all' 
                ? "bg-gold text-black shadow-gold-glow" 
                : "text-text-muted hover:bg-white/5 hover:text-white"
            )}
          >
            <span>All Series</span>
            <span className="text-xs opacity-70 bg-black/20 px-1.5 py-0.5 rounded">{series.length}</span>
          </button>

          {seriesCategories.map((cat) => (
            <button
              key={cat.category_id}
              onClick={() => setSelectedCategoryId(cat.category_id)}
              className={clsx(
                "w-full text-left px-4 py-2.5 rounded-lg transition-all font-medium text-sm flex justify-between items-center group",
                selectedCategoryId === cat.category_id 
                  ? "bg-gold text-black shadow-gold-glow" 
                  : "text-text-muted hover:bg-white/5 hover:text-white"
              )}
            >
              <span className="truncate pr-2">{cat.category_name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
         <div className="mb-6 relative flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
              <input 
                 type="text" 
                 placeholder="Search series..." 
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className="w-full bg-panel/50 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:border-gold/50 focus:ring-1 focus:ring-gold/50 outline-none transition-all placeholder:text-white/20"
              />
            </div>
            <button
              onClick={refreshSeries}
              disabled={refreshing}
              className="px-4 py-3 rounded-xl bg-gold text-black font-bold hover:bg-gold/90 disabled:opacity-60"
            >
              {refreshing ? 'Yenileniyor...' : 'Yenile'}
            </button>
         </div>

         <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {filteredSeries.length > 0 ? (
               <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 pb-10">
                 {visibleSeries.map((s) => {
                   const info = seriesInfos[s.series_id];
                   const plot = info?.info?.plot || info?.info?.description || '';
                   const cast = info?.info?.cast || '';
                   const rating = s.rating?.toString() || info?.info?.rating;
                   return (
                   <div key={s.series_id}>
                     <MovieCard 
                        id={s.series_id}
                        title={s.name}
                        image={s.cover || 'https://via.placeholder.com/300x450?text=No+Image'}
                        rating={rating}
                        plot={plot}
                        cast={cast}
                        type="series"
                     />
                   </div>
                   );
                 })}
               </div>
            ) : (
               <div className="flex flex-col items-center justify-center h-64 text-text-muted gap-4">
                  <p className="text-lg">Dizi bulunamadı</p>
                  {loadError && <p className="text-xs text-red-400">{loadError}</p>}
                  <button
                    onClick={refreshSeries}
                    disabled={refreshing}
                    className="px-4 py-2 rounded-lg bg-gold text-black font-bold hover:bg-gold/90 disabled:opacity-60"
                  >
                    {refreshing ? 'Yenileniyor...' : 'Yeniden Dene'}
                  </button>
               </div>
            )}
            {filteredSeries.length > visibleCount && (
              <div className="flex justify-center py-6">
                <button
                  onClick={() => setVisibleCount((c) => c + 120)}
                  className="px-4 py-2 bg-gold text-black rounded-lg font-bold hover:bg-gold-highlight transition-colors"
                >
                  Load more
                </button>
              </div>
            )}
         </div>
      </div>
    </div>
  );
};

export default Series;
