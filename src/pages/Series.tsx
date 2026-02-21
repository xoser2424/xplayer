import React, { useState, useMemo, useEffect } from "react";
import { Search, Zap } from "lucide-react";
import { MovieCard } from "@/components/MovieCard";
import { useContentStore } from "@/store/useContentStore";
import { useAuthStore } from "@/store/useAuthStore";
import { XtreamService } from "@/services/XtreamService";
import clsx from "clsx";

const Series: React.FC = () => {
  const { series, seriesCategories, seriesInfos, setSeriesInfo, setSeriesContent } = useContentStore();
  const { credentials } = useAuthStore();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(120);

  const filteredSeries = useMemo(() => {
    let result = series;
    if (selectedCategoryId !== "all") result = result.filter(s => s.category_id === selectedCategoryId);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s => s.name.toLowerCase().includes(q));
    }
    return result;
  }, [series, selectedCategoryId, searchQuery]);

  const visibleSeries = useMemo(() => filteredSeries.slice(0, visibleCount), [filteredSeries, visibleCount]);

  useEffect(() => {
    const loadInfos = async () => {
      if (!credentials.serverUrl) return;
      const service = new XtreamService({ baseUrl: credentials.serverUrl, username: credentials.username!, password: credentials.password! });
      const targets = visibleSeries.slice(0, 40).filter(s => !seriesInfos[s.series_id]);
      for (const s of targets) {
        try {
          const info = await service.getSeriesInfo(String(s.series_id));
          if (info) setSeriesInfo(s.series_id, info);
        } catch {}
      }
    };
    loadInfos();
  }, [visibleSeries, credentials]);

  useEffect(() => {
    if (!credentials.serverUrl) return;
    if (series.length === 0) {
      (async () => {
        try {
          await refreshSeriesList();
        } catch {}
      })();
    }
  }, [series.length, credentials.serverUrl]);

  const refreshSeriesList = async () => {
    if (!credentials.serverUrl) return;
    setRefreshing(true);
    setLoadError(null);
    try {
      const service = new XtreamService({ baseUrl: credentials.serverUrl, username: credentials.username!, password: credentials.password! });
      let cats: any[] = [];
      try { cats = await service.getSeriesCategories() ?? []; } catch {}
      let items: any[] = [];
      try { items = await service.getSeries() ?? []; } catch {}
      if (items.length === 0 && cats.length > 0) {
        const perCat = await Promise.all(cats.map((c: any) => service.getSeries(String(c.category_id))));
        items = perCat.flat().filter(Boolean);
      }
      setSeriesContent(items, cats);
    } catch (e: any) {
      setLoadError(e?.message || "Failed to load series");
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="flex h-full gap-4 overflow-hidden">
      {/* Categories Sidebar */}
      <div className="w-48 shrink-0 flex flex-col gap-1 overflow-y-auto scrollbar-hide">
        <div className="text-[10px] text-text-dim uppercase tracking-widest font-semibold px-2 mb-2">Genres</div>
        <button
          onClick={() => setSelectedCategoryId("all")}
          className={clsx("w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition-all flex justify-between items-center",
            selectedCategoryId === "all" ? "text-black shadow-gold-glow" : "text-text-muted hover:bg-white/5 hover:text-white"
          )}
          style={selectedCategoryId === "all" ? { background: "linear-gradient(135deg,#f6c15a,#D4AF37,#ff9f1a)" } : {}}
        >
          <span>All Series</span>
          <span className="text-[10px] opacity-60">{series.length}</span>
        </button>
        {seriesCategories.map(cat => {
          const isActive = selectedCategoryId === cat.category_id;
          return (
            <button key={cat.category_id} onClick={() => setSelectedCategoryId(cat.category_id)}
              className={clsx("w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition-all truncate",
                isActive ? "text-black shadow-gold-glow" : "text-text-muted hover:bg-white/5 hover:text-white"
              )}
              style={isActive ? { background: "linear-gradient(135deg,#f6c15a,#D4AF37,#ff9f1a)" } : {}}
            >
              {cat.category_name}
            </button>
          );
        })}
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col gap-3 overflow-hidden min-w-0">
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" size={14} />
            <input type="text" placeholder="Search series..." value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/8 rounded-xl pl-9 pr-3 py-2.5 text-white text-sm focus:border-gold/40 outline-none transition-all placeholder:text-white/20" />
          </div>
          <button onClick={refreshSeriesList} disabled={refreshing}
            className="gold-btn px-4 py-2.5 rounded-xl text-xs font-bold disabled:opacity-60">
            {refreshing ? "Loading..." : "Refresh"}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {filteredSeries.length > 0 ? (
            <>
              <div className="grid gap-3 pb-8" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))" }}>
                {visibleSeries.map(s => {
                  const info = seriesInfos[s.series_id];
                  return (
                    <MovieCard key={s.series_id} id={s.series_id} title={s.name}
                      image={s.cover || "https://via.placeholder.com/300x450/111114/444?text=No+Image"}
                      rating={s.rating?.toString() || info?.info?.rating}
                      plot={info?.info?.plot || info?.info?.description}
                      type="series" />
                  );
                })}
              </div>
              {filteredSeries.length > visibleCount && (
                <div className="flex justify-center pb-8">
                  <button onClick={() => setVisibleCount(c => c + 120)}
                    className="gold-btn px-6 py-2.5 rounded-full text-sm font-bold flex items-center gap-2">
                    <Zap size={16} fill="black" /> Load More
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 gap-3 text-text-muted">
              <p>No series found</p>
              {loadError && <p className="text-xs text-error">{loadError}</p>}
              <button onClick={refreshSeriesList} disabled={refreshing}
                className="gold-btn px-4 py-2 rounded-lg text-xs font-bold disabled:opacity-60">
                {refreshing ? "Loading..." : "Try Again"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Series;
