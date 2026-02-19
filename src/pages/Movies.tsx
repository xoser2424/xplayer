import React, { useState, useMemo, useEffect } from 'react';
import { Search } from 'lucide-react';
import { MovieCard } from '@/components/MovieCard';
import { useContentStore } from '@/store/useContentStore';
import { useAuthStore } from '@/store/useAuthStore';
import { XtreamService } from '@/services/XtreamService';
import clsx from 'clsx';

const Movies: React.FC = () => {
  const { movies, movieCategories, movieInfos, setMovieInfo } = useContentStore();
  const { credentials } = useAuthStore();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(120);

  const filteredMovies = useMemo(() => {
    let result = movies;
    if (selectedCategoryId !== 'all') {
      result = result.filter(m => m.category_id === selectedCategoryId);
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(m => m.name.toLowerCase().includes(query));
    }
    return result;
  }, [movies, selectedCategoryId, searchQuery]);

  const visibleMovies = useMemo(() => filteredMovies.slice(0, visibleCount), [filteredMovies, visibleCount]);

  useEffect(() => {
    const loadInfos = async () => {
      if (!credentials.serverUrl || !credentials.username || !credentials.password) return;
      const service = new XtreamService({ baseUrl: credentials.serverUrl, username: credentials.username, password: credentials.password });
      const targets = visibleMovies.slice(0, 50).filter(m => !movieInfos[m.stream_id]);
      for (const m of targets) {
        try {
          const info = await service.getVodInfo(String(m.stream_id));
          if (info) setMovieInfo(m.stream_id, info);
        } catch {}
      }
    };
    loadInfos();
  }, [visibleMovies, credentials, movieInfos, setMovieInfo]);

  return (
    <div className="flex h-full gap-6 overflow-hidden">
      {/* Categories Sidebar */}
      <div className="w-72 bg-panel/50 rounded-2xl p-4 overflow-hidden flex flex-col border border-white/5 backdrop-blur-sm">
        <h2 className="text-xl font-serif font-bold text-gold mb-6 px-2 sticky top-0 bg-panel/95 z-10 pb-2 border-b border-white/5">
           Genres <span className="text-xs text-text-muted font-normal ml-2">({movieCategories.length})</span>
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
            <span>All Movies</span>
            <span className="text-xs opacity-70 bg-black/20 px-1.5 py-0.5 rounded">{movies.length}</span>
          </button>

          {movieCategories.map((cat) => (
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
         <div className="mb-6 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
            <input 
               type="text" 
               placeholder="Search movies..." 
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="w-full bg-panel/50 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:border-gold/50 focus:ring-1 focus:ring-gold/50 outline-none transition-all placeholder:text-white/20"
            />
         </div>

         <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {filteredMovies.length > 0 ? (
               <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 pb-10">
                 {visibleMovies.map((movie) => {
                   const info = movieInfos[movie.stream_id];
                   const plot = info?.info?.plot || info?.info?.description || '';
                   const cast = info?.info?.cast || '';
                   const rating = movie.rating?.toString() || info?.info?.rating;
                   return (
                   <div key={movie.stream_id}>
                     <MovieCard 
                        id={movie.stream_id}
                        title={movie.name}
                        image={movie.stream_icon || 'https://via.placeholder.com/300x450?text=No+Image'}
                        rating={rating}
                        plot={plot}
                        cast={cast}
                        type="movie"
                     />
                   </div>
                   );
                 })}
               </div>
            ) : (
               <div className="flex flex-col items-center justify-center h-64 text-text-muted">
                  <p className="text-lg">No movies found</p>
               </div>
            )}
            {filteredMovies.length > visibleCount && (
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

export default Movies;
