import React from 'react';
import { Play, Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useContentStore } from '@/store/useContentStore';
import clsx from 'clsx';

interface MovieCardProps {
  id: number;
  title: string;
  image: string;
  year?: string;
  rating?: string;
  type?: 'movie' | 'series' | 'live';
  plot?: string;
  cast?: string;
}

export const MovieCard: React.FC<MovieCardProps> = ({ id, title, image, year, rating, type = 'movie', plot, cast }) => {
  const navigate = useNavigate();
  const { favorites, addToFavorites, removeFromFavorites } = useContentStore();

  const isFavorite = favorites.some((fav) => (fav.stream_id === id || fav.series_id === id));

  const handleClick = () => {
     if (type === 'live') {
        navigate(`/player/live/${id}`);
     } else if (type === 'series') {
        navigate(`/series/${id}`); 
     } else {
        navigate(`/player/movie/${id}`);
     }
  };

  const toggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFavorite) {
      removeFromFavorites(id);
    } else {
      const item = {
        stream_id: type !== 'series' ? id : undefined,
        series_id: type === 'series' ? id : undefined,
        name: title,
        stream_icon: type !== 'series' ? image : undefined,
        cover: type === 'series' ? image : undefined,
        stream_type: type,
        rating: rating,
      };
      addToFavorites(item);
    }
  };

  return (
    <motion.div 
      whileHover={{ scale: 1.05, y: -5 }}
      onClick={handleClick}
      className="relative aspect-[2/3] rounded-xl overflow-hidden cursor-pointer group shadow-lg bg-panel"
    >
      <img 
         src={image} 
         alt={title} 
         loading="lazy"
         className="w-full h-full object-cover transition-opacity duration-300 group-hover:opacity-40" 
         onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x450?text=No+Image';
         }}
      />
      
      {/* Favorite Button (Visible on Hover) */}
      <div className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={toggleFavorite}
          className="p-2 rounded-full bg-black/50 hover:bg-black/80 transition-colors backdrop-blur-sm"
        >
          <Heart 
            size={20} 
            className={clsx("transition-colors", isFavorite ? "fill-gold text-gold" : "text-white")} 
          />
        </button>
      </div>
      
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center p-4 text-center">
        <div className="w-12 h-12 rounded-full bg-gold flex items-center justify-center mb-4 shadow-gold-glow scale-0 group-hover:scale-100 transition-transform duration-300 delay-100">
          <Play fill="black" className="ml-1" size={24} />
        </div>
        
        <h3 className="text-white font-bold font-serif mb-1 line-clamp-2 text-sm">{title}</h3>
        
        <div className="flex items-center gap-2 text-xs text-text-muted mt-2">
          {year && <span>{year}</span>}
          {rating && rating !== 'N/A' && <span className="bg-white/10 px-1.5 py-0.5 rounded">{rating}</span>}
        </div>
        {plot && <div className="text-[11px] text-text-muted mt-2 line-clamp-3">{plot}</div>}
        {cast && <div className="text-[11px] text-text-muted mt-1 line-clamp-1">{cast}</div>}
      </div>
      
      {/* Border Glow on Hover */}
      <div className="absolute inset-0 border-2 border-gold opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl pointer-events-none" />
    </motion.div>
  );
};
