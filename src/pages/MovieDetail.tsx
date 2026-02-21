import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Play, Heart, Star, Clock, Calendar, Film, Users,
  X, ExternalLink, Loader2, Plus, Check, Tv
} from "lucide-react";
import { useContentStore } from "@/store/useContentStore";
import { useAuthStore } from "@/store/useAuthStore";
import { XtreamService } from "@/services/XtreamService";
import { MovieCard } from "@/components/MovieCard";
import { VideoPlayer } from "@/components/VideoPlayer";
import clsx from "clsx";

const TrailerModal: React.FC<{ trailerKey: string; onClose: () => void }> = ({ trailerKey, onClose }) => (
  <AnimatePresence>
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-6"
      style={{ background: "rgba(0,0,0,0.92)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        className="relative w-full max-w-4xl aspect-video rounded-2xl overflow-hidden"
        style={{ border: "1px solid rgba(212,175,55,0.3)", boxShadow: "0 0 60px rgba(212,175,55,0.15)" }}
        onClick={e => e.stopPropagation()}
      >
        <iframe
          src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&rel=0`}
          allow="autoplay; fullscreen"
          className="w-full h-full"
          frameBorder="0"
        />
        <button onClick={onClose}
          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/70 hover:bg-black flex items-center justify-center text-white transition-all"
          style={{ border: "1px solid rgba(255,255,255,0.2)" }}
        >
          <X size={18} />
        </button>
      </motion.div>
    </motion.div>
  </AnimatePresence>
);

const CastCard: React.FC<{ name: string; img?: string; role?: string }> = ({ name, img, role }) => (
  <div className="flex flex-col items-center gap-2 group cursor-pointer flex-shrink-0 w-20">
    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/10 group-hover:border-gold/50 transition-all"
      style={{ boxShadow: "0 4px 15px rgba(0,0,0,0.5)" }}>
      {img ? (
        <img src={img} alt={name} className="w-full h-full object-cover"
          onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
      ) : (
        <div className="w-full h-full bg-white/5 flex items-center justify-center">
          <Users size={24} className="text-text-dim" />
        </div>
      )}
    </div>
    <div className="text-center">
      <p className="text-white text-[11px] font-medium leading-tight line-clamp-2">{name}</p>
      {role && <p className="text-text-dim text-[10px] mt-0.5 line-clamp-1">{role}</p>}
    </div>
  </div>
);

const MovieDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { movies, movieInfos, setMovieInfo, favorites, addToFavorites, removeFromFavorites, addToHistory } = useContentStore();
  const { credentials } = useAuthStore();

  const [loading, setLoading] = useState(false);
  const [showTrailer, setShowTrailer] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [showInlinePlayer, setShowInlinePlayer] = useState(false);

  const numId = Number(id);
  const movie = movies.find(m => m.stream_id === numId);
  const info = movieInfos[numId];
  const isFavorite = favorites.some(f => f.stream_id === numId);

  // Similar movies (same category, random shuffle)
  const similarMovies = movies
    .filter(m => m.stream_id !== numId && m.category_id === movie?.category_id)
    .slice(0, 12)
    .map(m => ({
      id: m.stream_id, title: m.name,
      image: m.stream_icon || "https://via.placeholder.com/300x450/111114/444?text=No+Image",
      rating: m.rating?.toString(), type: "movie" as const,
    }));

  const fetchInfo = useCallback(async () => {
    if (!credentials.serverUrl || info) return;
    setLoading(true);
    try {
      const svc = new XtreamService({ baseUrl: credentials.serverUrl, username: credentials.username!, password: credentials.password! });
      const data = await svc.getVodInfo(String(numId));
      if (data) setMovieInfo(numId, data);
    } catch {}
    setLoading(false);
  }, [numId, credentials, info]);

  useEffect(() => { fetchInfo(); }, [fetchInfo]);

  const meta = info?.info || info?.movie_data || {};
  const title = meta.name || movie?.name || "Unknown Title";
  const plot = meta.plot || meta.description || "No description available.";
  const rating = meta.rating || movie?.rating || "N/A";
  const duration = meta.duration || meta.duration_secs
    ? `${Math.floor((meta.duration_secs || parseInt(meta.duration || "0")) / 60)}m`
    : meta.duration || "";
  const year = meta.releaseDate ? meta.releaseDate.substring(0, 4) : meta.year || "";
  const genre = meta.genre || "";
  const director = meta.director || "";
  const cast = typeof meta.cast === "string" ? meta.cast.split(",").map((s: string) => s.trim()).filter(Boolean) : [];
  const backdropUrl = (meta.backdrop_path && meta.backdrop_path[0]) || meta.cover_big || meta.movie_image || movie?.stream_icon || "";
  const posterUrl = meta.movie_image || meta.cover_big || movie?.stream_icon || "";
  const trailerYt = meta.youtube_trailer || "";

  const handlePlay = () => {
    if (movie) addToHistory(movie);
    navigate(`/player/movie/${id}`);
  };

  const toggleFav = () => {
    if (isFavorite) removeFromFavorites(numId);
    else if (movie) addToFavorites({ ...movie, stream_type: "movie" });
  };

  if (!movie && !loading) {
    return (
      <div className="flex items-center justify-center h-full flex-col gap-4 text-text-muted">
        <Film size={64} className="opacity-20" />
        <p>Movie not found</p>
        <button onClick={() => navigate(-1)} className="text-gold hover:underline text-sm">Go Back</button>
      </div>
    );
  }

  return (
    <div className="relative min-h-full">
      {showTrailer && trailerYt && <TrailerModal trailerKey={trailerYt} onClose={() => setShowTrailer(false)} />}

      {/* BACKDROP */}
      <div className="absolute inset-x-0 top-0 h-[70vh] -mx-5 -mt-5 overflow-hidden">
        {backdropUrl && !imgError ? (
          <img src={backdropUrl} alt="" className="w-full h-full object-cover object-top"
            onError={() => setImgError(true)} />
        ) : (
          <div className="w-full h-full"
            style={{ background: "linear-gradient(135deg, #1a1a22 0%, #0b0b0c 100%)" }} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/50 to-transparent" />
      </div>

      {/* BACK BUTTON */}
      <div className="relative z-10 mb-6">
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-text-muted hover:text-gold transition-colors text-sm group">
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          Back
        </button>
      </div>

      {/* MAIN CONTENT */}
      <div className="relative z-10 flex gap-8 items-start pt-4">
        {/* Poster */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
          className="hidden lg:block flex-shrink-0 w-52 rounded-2xl overflow-hidden shadow-2xl"
          style={{ border: "1px solid rgba(212,175,55,0.2)", boxShadow: "0 20px 60px rgba(0,0,0,0.7)" }}>
          <img src={posterUrl || movie?.stream_icon || ""} alt={title} className="w-full aspect-[2/3] object-cover"
            onError={e => { (e.target as HTMLImageElement).src = "https://via.placeholder.com/300x450/111114/555?text=No+Poster"; }} />
        </motion.div>

        {/* Info */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex-1 min-w-0 pb-8">
          {/* Genres */}
          {genre && (
            <div className="flex gap-2 flex-wrap mb-3">
              {genre.split(",").map((g: string, i: number) => (
                <span key={i} className="text-[10px] text-text-muted uppercase tracking-wider border border-white/15 px-2 py-0.5 rounded-full">
                  {g.trim()}
                </span>
              ))}
            </div>
          )}

          <h1 className="font-serif text-4xl lg:text-5xl font-bold text-white leading-tight mb-4">
            {title}
          </h1>

          {/* Meta Row */}
          <div className="flex items-center gap-3 flex-wrap mb-5">
            {rating && rating !== "N/A" && parseFloat(rating) > 0 && (
              <span className="flex items-center gap-1.5 bg-gold text-black px-3 py-1 rounded-lg font-bold text-sm shadow-gold-glow-sm">
                <Star size={13} fill="black" /> {rating}
              </span>
            )}
            {duration && (
              <span className="flex items-center gap-1.5 text-text-muted text-sm">
                <Clock size={14} /> {duration}
              </span>
            )}
            {year && (
              <span className="flex items-center gap-1.5 text-text-muted text-sm">
                <Calendar size={14} /> {year}
              </span>
            )}
            <span className="text-[11px] text-gold border border-gold/30 px-2 py-0.5 rounded font-bold">HD</span>
          </div>

          {/* Description */}
          {loading ? (
            <div className="flex items-center gap-3 mb-6">
              <Loader2 className="animate-spin text-gold" size={18} />
              <span className="text-text-dim text-sm">Loading details...</span>
            </div>
          ) : (
            <p className="text-text-muted text-sm leading-relaxed mb-6 max-w-2xl line-clamp-4 lg:line-clamp-none">
              {plot}
            </p>
          )}

          {director && (
            <p className="text-text-dim text-sm mb-4">
              <span className="text-white/70 font-semibold">Director: </span>
              {director}
            </p>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-3 mb-8 flex-wrap">
            <button onClick={handlePlay}
              className="gold-btn px-8 py-3 rounded-full flex items-center gap-2 text-sm font-bold">
              <Play size={18} fill="black" /> Play Now
            </button>

            {trailerYt && (
              <button onClick={() => setShowTrailer(true)}
                className="flex items-center gap-2 px-7 py-3 rounded-full text-white text-sm font-medium border border-white/15 bg-white/5 hover:bg-white/10 transition-all backdrop-blur-sm">
                <Tv size={16} /> Watch Trailer
              </button>
            )}

            <button onClick={toggleFav}
              className={clsx(
                "w-11 h-11 rounded-full flex items-center justify-center transition-all border",
                isFavorite
                  ? "bg-gold/20 border-gold/50 text-gold"
                  : "bg-white/5 border-white/15 text-white hover:border-gold/40 hover:text-gold"
              )}>
              <Heart size={20} className={isFavorite ? "fill-gold" : ""} />
            </button>
            <button onClick={() => navigate(`/player/movie/${id}`)}
              className="flex items-center gap-2 px-6 py-3 rounded-full text-white text-sm font-medium border border-white/15 bg-white/5 hover:bg-white/10 transition-all backdrop-blur-sm">
              <ExternalLink size={16} /> Fullscreen
            </button>
          </div>

          {/* CAST */}
          {cast.length > 0 && (
            <div className="mb-8">
              <h3 className="text-white font-serif font-semibold text-lg mb-4 flex items-center gap-2">
                <Users size={18} className="text-gold" /> Cast
              </h3>
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {cast.slice(0, 15).map((actor: string, i: number) => (
                  <CastCard key={i} name={actor} />
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>

      

      {/* SIMILAR MOVIES */}
      {similarMovies.length > 0 && (
        <div className="relative z-10 mt-4 pb-10">
          <h3 className="text-white font-serif font-semibold text-xl mb-4 flex items-center gap-3">
            <div className="w-1 h-6 rounded-full" style={{ background: "linear-gradient(#f6c15a,#ff9f1a)" }} />
            Similar Movies
          </h3>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {similarMovies.map(m => (
              <div key={m.id} className="flex-shrink-0 w-36">
                <MovieCard {...m} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MovieDetail;
