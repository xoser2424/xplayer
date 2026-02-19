import React from 'react';
import { useContentStore } from '@/store/useContentStore';
import { MovieCard } from '@/components/MovieCard';
import { Clock, Trash2 } from 'lucide-react';

const History: React.FC = () => {
  const { history } = useContentStore();

  // We might want to add a clear history function to the store later
  const clearHistory = () => {
    // Implement clear history logic in store
    console.log("Clear history clicked");
  };

  return (
    <div className="h-full flex flex-col">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gold/10 rounded-full">
            <Clock className="text-gold" size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-serif font-bold text-white">Watch History</h1>
            <p className="text-text-muted text-sm">Continue where you left off</p>
          </div>
        </div>
        
        {history.length > 0 && (
          <button 
            onClick={clearHistory}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-red-500/20 hover:text-red-400 transition-colors text-text-muted text-sm"
          >
            <Trash2 size={16} />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {history.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6 pb-10">
          {history.map((item, index) => (
            <div key={`${item.stream_id || item.series_id}-${index}`}>
              <MovieCard 
                id={item.stream_id || item.series_id}
                title={item.name}
                image={item.stream_icon || item.cover || 'https://via.placeholder.com/300x450?text=No+Image'}
                rating={item.rating?.toString()}
                type={item.stream_type === 'live' ? 'live' : item.series_id ? 'series' : 'movie'}
              />
              <div className="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-gold w-1/2" /> {/* Mock progress for now */}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-text-muted">
          <Clock size={64} className="mb-4 opacity-20" />
          <h2 className="text-xl font-medium mb-2">No History Found</h2>
          <p>Your watch history will appear here.</p>
        </div>
      )}
    </div>
  );
};

export default History;
