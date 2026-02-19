import React from 'react';
import { MovieCard } from './MovieCard';
import { ChevronRight } from 'lucide-react';

interface ContentRowProps {
  title: string;
  items: Array<{ 
    id: number; 
    title: string; 
    image: string; 
    year?: string; 
    rating?: string;
    type?: 'movie' | 'series' | 'live';
  }>;
}

export const ContentRow: React.FC<ContentRowProps> = ({ title, items }) => {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4 px-2">
        <h2 className="text-2xl font-serif font-semibold text-white">{title}</h2>
        <button className="text-text-muted hover:text-gold flex items-center gap-1 text-sm transition-colors">
          View All <ChevronRight size={16} />
        </button>
      </div>
      
      <div className="flex gap-4 overflow-x-auto pb-4 px-2 scrollbar-hide snap-x">
        {items.map((item) => (
          <div key={item.id} className="min-w-[160px] md:min-w-[200px] snap-start">
            <MovieCard {...item} />
          </div>
        ))}
      </div>
    </div>
  );
};
