import React from "react";
import { useContentStore } from "@/store/useContentStore";
import { MovieCard } from "@/components/MovieCard";
import { Heart } from "lucide-react";
import { motion } from "framer-motion";

const Favorites: React.FC = () => {
  const { favorites } = useContentStore();

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6 flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
          style={{ background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.2)" }}>
          <Heart className="text-gold" size={22} />
        </div>
        <div>
          <h1 className="font-serif text-2xl font-bold text-white">My Favorites</h1>
          <p className="text-text-dim text-xs">{favorites.length} titles in your collection</p>
        </div>
      </div>

      {favorites.length > 0 ? (
        <div className="overflow-y-auto scrollbar-hide flex-1">
          <div className="grid gap-3 pb-10" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))" }}>
            {favorites.map((item, i) => (
              <motion.div key={`${item.stream_id || item.series_id}-${i}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.03 }}>
                <MovieCard
                  id={item.stream_id || item.series_id}
                  title={item.name}
                  image={item.stream_icon || item.cover || "https://via.placeholder.com/300x450/111114/444?text=No+Image"}
                  rating={item.rating?.toString()}
                  type={item.stream_type === "live" ? "live" : item.series_id ? "series" : "movie"}
                />
              </motion.div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-text-muted gap-4">
          <div className="w-24 h-24 rounded-full flex items-center justify-center"
            style={{ background: "rgba(212,175,55,0.05)", border: "2px solid rgba(212,175,55,0.1)" }}>
            <Heart size={40} className="opacity-20 text-gold" />
          </div>
          <div className="text-center">
            <h2 className="text-lg font-serif font-semibold text-white/40 mb-1">No Favorites Yet</h2>
            <p className="text-sm text-text-dim">Browse movies and series to add them here.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Favorites;
