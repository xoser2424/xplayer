import React, { useMemo } from "react";
import { Play, Info, Star, Clock, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useContentStore } from "@/store/useContentStore";

const FALLBACK = {
  title: "Dune: Part One",
  backdrop: "https://image.tmdb.org/t/p/original/sRLC052ieEafQN95VcKFfIKjkO2.jpg",
  poster: "https://image.tmdb.org/t/p/w500/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg",
  rating: "8.0",
  year: "2021",
  duration: "2h 35m",
  genre: "Sci-Fi, Adventure",
  plot: "Paul Atreides must travel to the most dangerous planet in the universe to ensure the future of his family and his people.",
};

const CAST = [
  { name: "Timothee C.", img: "https://image.tmdb.org/t/p/w185/BE2sdjpgsa2rNTFa66f7upkaOP.jpg" },
  { name: "Zendaya", img: "https://image.tmdb.org/t/p/w185/6TE2AlOUqcrs7CyJiWYgodmee1r.jpg" },
  { name: "Oscar Isaac", img: "https://image.tmdb.org/t/p/w185/dW5U5yrIIPmMjRThR9KT2xP4nTZ.jpg" },
  { name: "Josh Brolin", img: "https://image.tmdb.org/t/p/w185/fHRn0BMKe43hAZVkjzYAXFhO0JB.jpg" },
  { name: "Rebecca F.", img: "https://image.tmdb.org/t/p/w185/lDCIQ5NlAM5A2Pnv0dSKLLPFVH2.jpg" },
];

export const HeroBanner: React.FC = () => {
  const navigate = useNavigate();
  const { movies, movieInfos } = useContentStore();

  // Try to pick a featured movie with a backdrop
  const featured = useMemo(() => {
    const candidates = movies
      .filter(m => parseFloat(m.rating || "0") >= 7 && m.stream_icon)
      .slice(0, 10);
    if (candidates.length === 0) return null;
    const pick = candidates[Math.floor(Math.random() * Math.min(candidates.length, 5))];
    const info = movieInfos[pick.stream_id]?.info || {};
    return { movie: pick, info };
  }, [movies.length]);

  const title = featured?.info?.name || featured?.movie?.name || FALLBACK.title;
  const backdrop = (featured?.info?.backdrop_path?.[0]) || featured?.info?.cover_big || featured?.movie?.stream_icon || FALLBACK.backdrop;
  const rating = featured?.info?.rating || featured?.movie?.rating || FALLBACK.rating;
  const year = featured?.info?.releaseDate?.substring(0, 4) || FALLBACK.year;
  const genre = featured?.info?.genre || FALLBACK.genre;
  const plot = featured?.info?.plot || featured?.info?.description || FALLBACK.plot;
  const movieId = featured?.movie?.stream_id;

  return (
    <div className="relative w-full rounded-2xl overflow-hidden mb-6" style={{ height: "56vh", minHeight: 340 }}>
      {/* Background */}
      <div className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 scale-105"
        style={{ backgroundImage: `url('${backdrop}')` }}>
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/55 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/65 to-transparent" />
      </div>

      {/* Gold glow */}
      <div className="absolute bottom-0 left-0 w-96 h-48 blur-[80px] rounded-full opacity-15"
        style={{ background: "radial-gradient(ellipse, #ff9f1a 0%, transparent 70%)" }} />

      {/* Border */}
      <div className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{ border: "1px solid rgba(212,175,55,0.1)" }} />

      {/* Content */}
      <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}
        className="absolute bottom-0 left-0 p-8 w-full md:w-3/5 z-10">

        {/* Genre badges */}
        {genre && (
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            {genre.split(",").slice(0, 3).map((g: string, i: number) => (
              <span key={i} className="text-[10px] text-text-muted uppercase tracking-wider border border-white/15 px-2.5 py-0.5 rounded-full">
                {g.trim()}
              </span>
            ))}
          </div>
        )}

        <h1 className="font-serif text-4xl lg:text-5xl font-bold text-white mb-3 leading-tight drop-shadow-lg">{title}</h1>

        {/* Meta */}
        <div className="flex items-center gap-3 flex-wrap mb-4">
          {rating && parseFloat(rating) > 0 && (
            <span className="flex items-center gap-1.5 bg-gold text-black px-2.5 py-1 rounded-lg font-bold text-xs shadow-gold-glow-sm">
              <Star size={11} fill="black" /> IMDb {parseFloat(rating).toFixed(1)}
            </span>
          )}
          {year && (
            <span className="flex items-center gap-1.5 text-text-muted text-xs">
              <Calendar size={12} /> {year}
            </span>
          )}
          <span className="text-[10px] text-gold border border-gold/30 px-2 py-0.5 rounded font-bold">HD</span>
        </div>

        <p className="text-text-muted text-sm mb-6 line-clamp-2 max-w-lg leading-relaxed">{plot}</p>

        {/* Buttons */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => movieId ? navigate(`/movie/${movieId}`) : navigate("/movies")}
            className="gold-btn px-7 py-2.5 rounded-full flex items-center gap-2 text-sm font-bold">
            <Play size={16} fill="black" /> Play Now
          </button>
          <button onClick={() => movieId ? navigate(`/movie/${movieId}`) : navigate("/movies")}
            className="flex items-center gap-2 px-6 py-2.5 rounded-full text-white text-sm font-medium border border-white/15 bg-white/5 hover:bg-white/10 transition-all backdrop-blur-sm">
            <Info size={16} /> More Info
          </button>
        </div>

        {/* Cast */}
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-text-dim uppercase tracking-wider mr-1">Cast</span>
          {CAST.map((actor, i) => (
            <div key={i} className="flex flex-col items-center gap-1 cursor-pointer group">
              <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10 group-hover:border-gold/40 transition-all">
                <img src={actor.img} alt={actor.name} className="w-full h-full object-cover"
                  onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
              </div>
              <span className="text-[9px] text-text-dim group-hover:text-gold transition-colors whitespace-nowrap">{actor.name.split(" ")[0]}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};
