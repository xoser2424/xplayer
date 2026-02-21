import React from "react";
import { Play, Heart, Star } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useContentStore } from "@/store/useContentStore";
import clsx from "clsx";

interface MovieCardProps {
  id: number;
  title: string;
  image: string;
  year?: string;
  rating?: string;
  type?: "movie" | "series" | "live";
  plot?: string;
  cast?: string;
}

export const MovieCard: React.FC<MovieCardProps> = ({ id, title, image, year, rating, type = "movie", plot }) => {
  const navigate = useNavigate();
  const { favorites, addToFavorites, removeFromFavorites } = useContentStore();
  const isFavorite = favorites.some(f => f.stream_id === id || f.series_id === id);

  const handleClick = () => {
    if (type === "live") navigate(`/player/live/${id}`);
    else if (type === "series") navigate(`/series/${id}`);
    else navigate(`/movie/${id}`);
  };

  const toggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFavorite) {
      removeFromFavorites(id);
    } else {
      addToFavorites({
        stream_id: type !== "series" ? id : undefined,
        series_id: type === "series" ? id : undefined,
        name: title,
        stream_icon: type !== "series" ? image : undefined,
        cover: type === "series" ? image : undefined,
        stream_type: type,
        rating,
      });
    }
  };

  const ratingNum = parseFloat(rating || "0");

  return (
    <motion.div
      whileHover={{ scale: 1.04, y: -4 }}
      transition={{ duration: 0.2 }}
      onClick={handleClick}
      className="relative aspect-[2/3] rounded-xl overflow-hidden cursor-pointer group"
      style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.5)" }}
    >
      <img
        src={image}
        alt={title}
        loading="lazy"
        className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110"
        onError={e => { (e.target as HTMLImageElement).src = "https://via.placeholder.com/300x450/111114/333?text=No+Image"; }}
      />

      {/* Rating badge */}
      {rating && rating !== "N/A" && ratingNum > 0 && (
        <div className="absolute top-2 left-2 flex items-center gap-0.5 bg-black/75 backdrop-blur-sm px-1.5 py-0.5 rounded-md text-[10px] font-bold text-gold border border-gold/20">
          <Star size={8} fill="#D4AF37" /> {parseFloat(rating).toFixed(1)}
        </div>
      )}

      {/* Live badge */}
      {type === "live" && (
        <div className="absolute top-2 left-2 flex items-center gap-1 bg-red-600/90 backdrop-blur-sm px-2 py-0.5 rounded text-[9px] font-bold text-white uppercase tracking-wider">
          <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Live
        </div>
      )}

      {/* Favorite */}
      <button
        onClick={toggleFavorite}
        className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all hover:bg-black/80 z-20"
      >
        <Heart size={13} className={clsx("transition-colors", isFavorite ? "fill-gold text-gold" : "text-white")} />
      </button>

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
        <div className="flex justify-center mb-2 transform translate-y-3 group-hover:translate-y-0 transition-transform duration-300">
          <div className="w-9 h-9 rounded-full flex items-center justify-center shadow-gold-glow"
            style={{ background: "linear-gradient(135deg,#f6c15a,#D4AF37,#ff9f1a)" }}>
            <Play size={16} fill="black" className="ml-0.5" />
          </div>
        </div>
        <h3 className="text-white font-semibold text-xs text-center line-clamp-2 font-serif leading-tight">{title}</h3>
        {year && <div className="text-text-dim text-[10px] text-center mt-0.5">{year}</div>}
      </div>

      {/* Gold border glow on hover */}
      <div className="absolute inset-0 rounded-xl border border-gold/0 group-hover:border-gold/40 transition-all duration-300 pointer-events-none" />
    </motion.div>
  );
};
