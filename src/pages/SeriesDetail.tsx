import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Play, Heart, Star, Clock, Calendar, Clapperboard,
  Users, X, ChevronDown, Loader2, Film, Tv
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
          style={{ border: "1px solid rgba(255,255,255,0.2)" }}>
          <X size={18} />
        </button>
      </motion.div>
    </motion.div>
  </AnimatePresence>
);

interface Episode {
  id: number;
  episode_num: number;
  title: string;
  container_extension: string;
  info?: {
    movie_image?: string;
    plot?: string;
    duration_secs?: number;
    duration?: string;
    rating?: string;
  };
  added?: string;
}

const EpisodeCard: React.FC<{
  episode: Episode;
  seasonNum: string;
  seriesId: string;
  credentials: any;
}> = ({ episode }) => {
  const navigate = useNavigate();
  const thumb = episode.info?.movie_image;
  const dur = episode.info?.duration || (episode.info?.duration_secs ? `${Math.floor(episode.info.duration_secs / 60)}m` : "");
  const plot = episode.info?.plot || "";

  const handlePlay = () => {
    navigate(`/player/episode/${episode.id}`);
  };

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      className="flex gap-4 p-3 rounded-xl cursor-pointer group transition-all"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
      onClick={handlePlay}
    >
      {/* Thumbnail */}
      <div className="relative flex-shrink-0 w-36 aspect-video rounded-lg overflow-hidden bg-black/40"
        style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
        {thumb ? (
          <img src={thumb} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Film size={24} className="text-text-dim" />
          </div>
        )}
        {/* Play overlay */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
          <div className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,#f6c15a,#D4AF37)" }}>
            <Play size={18} fill="black" className="ml-0.5" />
          </div>
        </div>
        {dur && (
          <div className="absolute bottom-1 right-1 bg-black/80 text-white text-[9px] px-1.5 py-0.5 rounded font-medium backdrop-blur-sm">
            {dur}
          </div>
        )}
      </div>

      {/* Meta */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-gold text-xs font-bold font-serif">Ep {episode.episode_num}</span>
          <h4 className="text-white text-sm font-semibold truncate group-hover:text-gold transition-colors">{episode.title || `Episode ${episode.episode_num}`}</h4>
        </div>
        {plot && <p className="text-text-dim text-xs line-clamp-2 leading-relaxed">{plot}</p>}
        {episode.info?.rating && (
          <div className="flex items-center gap-1 mt-1.5">
            <Star size={10} fill="#D4AF37" className="text-gold" />
            <span className="text-gold text-[10px] font-semibold">{episode.info.rating}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

const SeriesDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { series, seriesInfos, setSeriesInfo, favorites, addToFavorites, removeFromFavorites } = useContentStore();
  const { credentials } = useAuthStore();

  const [loading, setLoading] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState<string>("");
  const [showTrailer, setShowTrailer] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [showInlinePlayer, setShowInlinePlayer] = useState(false);
  const [inlineEpisodeId, setInlineEpisodeId] = useState<number | null>(null);

  const numId = Number(id);
  const show = series.find(s => s.series_id === numId);
  const info = seriesInfos[numId];
  const isFavorite = favorites.some(f => f.series_id === numId);

  const similarSeries = series
    .filter(s => s.series_id !== numId && s.category_id === show?.category_id)
    .slice(0, 12)
    .map(s => ({
      id: s.series_id, title: s.name,
      image: s.cover || "https://via.placeholder.com/300x450/111114/444?text=No+Image",
      rating: s.rating?.toString(), type: "series" as const,
    }));

  const fetchInfo = useCallback(async () => {
    if (!credentials.serverUrl || info) return;
    setLoading(true);
    try {
      const svc = new XtreamService({ baseUrl: credentials.serverUrl, username: credentials.username!, password: credentials.password! });
      const data = await svc.getSeriesInfo(String(numId));
      if (data) setSeriesInfo(numId, data);
    } catch {}
    setLoading(false);
  }, [numId, credentials, info]);

  useEffect(() => { fetchInfo(); }, [fetchInfo]);

  // Season keys
  const episodes: Record<string, Episode[]> = info?.episodes || {};
  const seasonKeys = Object.keys(episodes).sort((a, b) => Number(a) - Number(b));
  
  useEffect(() => {
    if (seasonKeys.length > 0 && !selectedSeason) {
      setSelectedSeason(seasonKeys[0]);
    }
  }, [seasonKeys.length]);

  const meta = info?.info || {};
  const title = meta.name || show?.name || "Unknown";
  const plot = meta.plot || meta.description || show?.plot || "No description available.";
  const rating = meta.rating || show?.rating || "N/A";
  const genre = meta.genre || show?.genre || "";
  const cast = typeof meta.cast === "string" ? meta.cast.split(",").map((s: string) => s.trim()).filter(Boolean) : [];
  const trailerYt = meta.youtube_trailer || show?.youtube_trailer || "";
  const backdropUrl = (meta.backdrop_path && meta.backdrop_path[0]) ||
    (show?.backdrop_path && show.backdrop_path[0]) || meta.cover || show?.cover || "";
  const posterUrl = meta.cover || show?.cover || "";
  const releaseDate = meta.releaseDate || show?.releaseDate || "";
  const year = releaseDate ? releaseDate.substring(0, 4) : "";

  const currentEpisodes: Episode[] = selectedSeason ? (episodes[selectedSeason] || []) : [];

  const toggleFav = () => {
    if (isFavorite) removeFromFavorites(numId);
    else if (show) addToFavorites({ ...show, stream_type: "series" });
  };

  if (!show && !loading) {
    return (
      <div className="flex items-center justify-center h-full flex-col gap-4 text-text-muted">
        <Clapperboard size={64} className="opacity-20" />
        <p>Series not found</p>
        <button onClick={() => navigate(-1)} className="text-gold hover:underline text-sm">Go Back</button>
      </div>
    );
  }

  return (
    <div className="relative min-h-full">
      {showTrailer && trailerYt && <TrailerModal trailerKey={trailerYt} onClose={() => setShowTrailer(false)} />}

      {/* BACKDROP */}
      <div className="absolute inset-x-0 top-0 h-[65vh] -mx-5 -mt-5 overflow-hidden">
        {backdropUrl && !imgError ? (
          <img src={backdropUrl} alt="" className="w-full h-full object-cover object-top"
            onError={() => setImgError(true)} />
        ) : (
          <div className="w-full h-full" style={{ background: "linear-gradient(135deg, #1a1a22 0%, #0b0b0c 100%)" }} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/50 to-transparent" />
      </div>

      {/* BACK */}
      <div className="relative z-10 mb-6">
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-text-muted hover:text-gold transition-colors text-sm group">
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          Back
        </button>
      </div>

      {/* HEADER INFO */}
      <div className="relative z-10 flex gap-8 items-start pt-4">
        {/* Poster */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
          className="hidden lg:block flex-shrink-0 w-48 rounded-2xl overflow-hidden shadow-2xl"
          style={{ border: "1px solid rgba(212,175,55,0.2)", boxShadow: "0 20px 60px rgba(0,0,0,0.7)" }}>
          <img src={posterUrl} alt={title} className="w-full aspect-[2/3] object-cover"
            onError={e => { (e.target as HTMLImageElement).src = "https://via.placeholder.com/300x450/111114/555?text=No+Poster"; }} />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex-1 min-w-0 pb-6">
          {genre && (
            <div className="flex gap-2 flex-wrap mb-3">
              {genre.split(",").map((g: string, i: number) => (
                <span key={i} className="text-[10px] text-text-muted uppercase tracking-wider border border-white/15 px-2 py-0.5 rounded-full">
                  {g.trim()}
                </span>
              ))}
            </div>
          )}

          <h1 className="font-serif text-4xl lg:text-5xl font-bold text-white leading-tight mb-4">{title}</h1>

          <div className="flex items-center gap-3 flex-wrap mb-5">
            {rating && rating !== "N/A" && parseFloat(rating) > 0 && (
              <span className="flex items-center gap-1.5 bg-gold text-black px-3 py-1 rounded-lg font-bold text-sm shadow-gold-glow-sm">
                <Star size={13} fill="black" /> {rating}
              </span>
            )}
            {year && (
              <span className="flex items-center gap-1.5 text-text-muted text-sm">
                <Calendar size={14} /> {year}
              </span>
            )}
            {seasonKeys.length > 0 && (
              <span className="flex items-center gap-1.5 text-text-muted text-sm">
                <Clapperboard size={14} /> {seasonKeys.length} Season{seasonKeys.length > 1 ? "s" : ""}
              </span>
            )}
          </div>

          {loading ? (
            <div className="flex items-center gap-3 mb-6">
              <Loader2 className="animate-spin text-gold" size={18} />
              <span className="text-text-dim text-sm">Loading details...</span>
            </div>
          ) : (
            <p className="text-text-muted text-sm leading-relaxed mb-6 max-w-2xl line-clamp-3">{plot}</p>
          )}

          <div className="flex items-center gap-3 mb-6 flex-wrap">
            {trailerYt && (
              <button onClick={() => setShowTrailer(true)}
                className="flex items-center gap-2 px-7 py-3 rounded-full text-white text-sm font-medium border border-white/15 bg-white/5 hover:bg-white/10 transition-all backdrop-blur-sm">
                <Tv size={16} /> Watch Trailer
              </button>
            )}
            <button onClick={toggleFav}
              className={clsx(
                "w-11 h-11 rounded-full flex items-center justify-center transition-all border",
                isFavorite ? "bg-gold/20 border-gold/50 text-gold" : "bg-white/5 border-white/15 text-white hover:border-gold/40 hover:text-gold"
              )}>
              <Heart size={20} className={isFavorite ? "fill-gold" : ""} />
            </button>
          </div>

          {/* Cast */}
          {cast.length > 0 && (
            <div>
              <h3 className="text-white font-serif font-semibold text-base mb-3 flex items-center gap-2">
                <Users size={16} className="text-gold" /> Cast
              </h3>
              <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
                {cast.slice(0, 10).map((actor: string, i: number) => (
                  <div key={i} className="flex flex-col items-center gap-1.5 flex-shrink-0 w-16">
                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                      <Users size={20} className="text-text-dim" />
                    </div>
                    <p className="text-white text-[10px] text-center line-clamp-2">{actor}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>

      

      {/* SEASONS & EPISODES */}
      {seasonKeys.length > 0 && (
        <div className="relative z-10 mt-2">
          {/* Season Tabs */}
          <div className="flex items-center gap-2 mb-5 flex-wrap">
            <span className="text-white font-serif font-semibold text-lg mr-2">Episodes</span>
            {seasonKeys.map(s => (
              <button
                key={s}
                onClick={() => setSelectedSeason(s)}
                className={clsx(
                  "px-4 py-1.5 rounded-full text-sm font-semibold transition-all",
                  selectedSeason === s
                    ? "text-black shadow-gold-glow-sm"
                    : "text-text-muted border border-white/10 bg-white/5 hover:border-gold/30 hover:text-white"
                )}
                style={selectedSeason === s ? { background: "linear-gradient(135deg,#f6c15a,#D4AF37,#ff9f1a)" } : {}}
              >
                Season {s}
              </button>
            ))}
          </div>

          {/* Episode Count */}
          {currentEpisodes.length > 0 && (
            <p className="text-text-dim text-xs mb-4">{currentEpisodes.length} episodes</p>
          )}

          {/* Episodes Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 pb-8">
            <AnimatePresence mode="wait">
              {currentEpisodes.map((ep, i) => (
                <motion.div key={ep.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}>
                  <EpisodeCard
                    episode={ep}
                    seasonNum={selectedSeason}
                    seriesId={id!}
                    credentials={credentials}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* SIMILAR SERIES */}
      {similarSeries.length > 0 && (
        <div className="relative z-10 mt-2 pb-10">
          <h3 className="text-white font-serif font-semibold text-xl mb-4 flex items-center gap-3">
            <div className="w-1 h-6 rounded-full" style={{ background: "linear-gradient(#f6c15a,#ff9f1a)" }} />
            Similar Series
          </h3>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {similarSeries.map(s => (
              <div key={s.id} className="flex-shrink-0 w-36">
                <MovieCard {...s} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SeriesDetail;
