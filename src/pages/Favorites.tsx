import React from 'react';
import { useContentStore } from '@/store/useContentStore';
import { MovieCard } from '@/components/MovieCard';
import { Heart } from 'lucide-react';

const Favorites: React.FC = () => {
  const { favorites } = useContentStore();

  return (
    <div className="h-full flex flex-col">
      <div className="mb-8 flex items-center gap-4">
        <div className="p-3 bg-gold/10 rounded-full">
          <Heart className="text-gold" size={32} />
        </div>
        <div>
          <h1 className="text-3xl font-serif font-bold text-white">My Favorites</h1>
          <p className="text-text-muted text-sm">Your personal collection of content</p>
        </div>
      </div>

      {favorites.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6 pb-10">
          {favorites.map((item) => (
            <div key={`${item.stream_id || item.series_id}-${item.name}`}>
              <MovieCard 
                id={item.stream_id || item.series_id}
                title={item.name}
                image={item.stream_icon || item.cover || 'https://via.placeholder.com/300x450?text=No+Image'}
                rating={item.rating?.toString()}
                type={item.stream_type === 'live' ? 'live' : item.series_id ? 'series' : 'movie'}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-text-muted">
          <Heart size={64} className="mb-4 opacity-20" />
          <h2 className="text-xl font-medium mb-2">No Favorites Yet</h2>
          <p>Start adding movies, series, and channels to your favorites list.</p>
        </div>
      )}
    </div>
  );
};

export default Favorites;
