import React, { useState, useMemo, useEffect } from "react";
import { Search, SlidersHorizontal, Star, Zap } from "lucide-react";
import { MovieCard } from "@/components/MovieCard";
import { useContentStore } from "@/store/useContentStore";
import { useAuthStore } from "@/store/useAuthStore";
import { XtreamService } from "@/services/XtreamService";
import clsx from "clsx";

const QUALITY_FILTERS = ["All", "4K", "HD", "FHD"];
const RATING_FILTERS = ["All", "9+", "8+", "7+", "6+"];
const YEAR_FILTERS = ["All", "2024", "2023", "2022", "2021", "2020", "2019", "Older"];

const Movies: React.FC = () => {
  const { movies, movieCategories, movieInfos, setMovieInfo } = useContentStore();
  const { credentials } = useAuthStore();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [qualityFilter, setQualityFilter] = useState("All");
  const [ratingFilter, setRatingFilter] = useState("All");
  const [yearFilter, setYearFilter] = useState("All");
  const [visibleCount, setVisibleCount] = useState(120);

  const filteredMovies = useMemo(() => {
    let result = movies;
    if (selectedCategoryId !== "all") result = result.filter(m => m.category_id === selectedCategoryId);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(m => m.name.toLowerCase().includes(q));
    }
    if (ratingFilter !== "All") {
      const minRating = parseFloat(ratingFilter.replace("+", ""));
      result = result.filter(m => parseFloat(m.rating || "0") >= minRating);
    }
    if (qualityFilter !== "All") {
      const q = qualityFilter.toLowerCase();
      result = result.filter(m => m.name.toLowerCase().includes(q));
    }
    return result;
  }, [movies, selectedCategoryId, searchQuery, ratingFilter, qualityFilter]);

  const visibleMovies = useMemo(() => filteredMovies.slice(0, visibleCount), [filteredMovies, visibleCount]);

  useEffect(() => {
    const loadInfos = async () => {
      if (!credentials.serverUrl) return;
      const service = new XtreamService({ baseUrl: credentials.serverUrl, username: credentials.username!, password: credentials.password! });
      const targets = visibleMovies.slice(0, 40).filter(m => !movieInfos[m.stream_id]);
      for (const m of targets) {
        try {
          const info = await service.getVodInfo(String(m.stream_id));
          if (info) setMovieInfo(m.stream_id, info);
        } catch {}
      }
    };
    loadInfos();
  }, [visibleMovies, credentials]);

  return (
    <div className="flex h-full gap-4 overflow-hidden">
      {/* Categories Sidebar */}
      <div className="w-48 shrink-0 flex flex-col gap-1 overflow-y-auto scrollbar-hide">
        <div className="text-[10px] text-text-dim uppercase tracking-widest font-semibold px-2 mb-2">Genres</div>
        <button
          onClick={() => setSelectedCategoryId("all")}
          className={clsx(
            "w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition-all flex justify-between items-center",
            selectedCategoryId === "all" ? "text-black shadow-gold-glow" : "text-text-muted hover:bg-white/5 hover:text-white"
          )}
          style={selectedCategoryId === "all" ? { background: "linear-gradient(135deg,#f6c15a,#D4AF37,#ff9f1a)" } : {}}
        >
          <span>All Movies</span>
          <span className="text-[10px] opacity-60">{movies.length}</span>
        </button>
        {movieCategories.map(cat => {
          const isActive = selectedCategoryId === cat.category_id;
          return (
            <button
              key={cat.category_id}
              onClick={() => setSelectedCategoryId(cat.category_id)}
              className={clsx(
                "w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition-all truncate",
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
        {/* Filter Bar */}
        <div className="flex items-center gap-3 flex-wrap shrink-0">
          {/* Search */}
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" size={14} />
            <input
              type="text"
              placeholder="Search movies..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/8 rounded-xl pl-9 pr-3 py-2.5 text-white text-sm focus:border-gold/40 outline-none transition-all placeholder:text-white/20"
            />
          </div>

          {/* IMDb Filter */}
          <div className="flex items-center gap-1 bg-white/5 border border-white/8 rounded-xl p-1">
            <Star size={12} className="text-gold ml-1.5" />
            {RATING_FILTERS.map(r => (
              <button key={r} onClick={() => setRatingFilter(r)}
                className={clsx("px-2.5 py-1 rounded-lg text-xs font-medium transition-all",
                  ratingFilter === r ? "text-black" : "text-text-muted hover:text-white"
                )}
                style={ratingFilter === r ? { background: "linear-gradient(135deg,#f6c15a,#D4AF37)" } : {}}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Quality */}
          <div className="flex items-center gap-1 bg-white/5 border border-white/8 rounded-xl p-1">
            {QUALITY_FILTERS.map(q => (
              <button key={q} onClick={() => setQualityFilter(q)}
                className={clsx("px-2.5 py-1 rounded-lg text-xs font-bold transition-all",
                  qualityFilter === q ? "text-black" : "text-text-muted hover:text-white"
                )}
                style={qualityFilter === q ? { background: "linear-gradient(135deg,#f6c15a,#D4AF37)" } : {}}
              >
                {q}
              </button>
            ))}
          </div>

          <div className="text-text-dim text-xs">{filteredMovies.length} results</div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {filteredMovies.length > 0 ? (
            <>
              <div className="grid gap-3 pb-8" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))" }}>
                {visibleMovies.map(movie => {
                  const info = movieInfos[movie.stream_id];
                  return (
                    <MovieCard
                      key={movie.stream_id}
                      id={movie.stream_id}
                      title={movie.name}
                      image={movie.stream_icon || "https://via.placeholder.com/300x450/111114/444?text=No+Image"}
                      rating={movie.rating?.toString() || info?.info?.rating}
                      plot={info?.info?.plot || info?.info?.description}
                      type="movie"
                    />
                  );
                })}
              </div>
              {filteredMovies.length > visibleCount && (
                <div className="flex justify-center pb-8">
                  <button onClick={() => setVisibleCount(c => c + 120)}
                    className="gold-btn px-6 py-2.5 rounded-full text-sm font-bold flex items-center gap-2">
                    <Zap size={16} fill="black" /> Load More
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-48 text-text-muted">No movies found</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Movies;
