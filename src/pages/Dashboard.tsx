import React from "react";
import { HeroBanner } from "@/components/HeroBanner";
import { ContentRow } from "@/components/ContentRow";
import { useContentStore } from "@/store/useContentStore";
import { useAuthStore } from "@/store/useAuthStore";
import { Loader2 } from "lucide-react";

const Dashboard: React.FC = () => {
  const { movies, series, liveChannels } = useContentStore();
  const { isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 rounded-full flex items-center justify-center animate-pulse-gold"
          style={{ background: "rgba(212,175,55,0.1)", border: "2px solid rgba(212,175,55,0.3)" }}>
          <Loader2 className="animate-spin text-gold w-8 h-8" />
        </div>
        <p className="text-text-dim text-sm">Loading your content...</p>
      </div>
    );
  }

  const toItem = (m: any, isMovie: boolean) => ({
    id: isMovie ? m.stream_id : m.series_id,
    title: m.name,
    image: m.stream_icon || m.cover || "https://via.placeholder.com/300x450/111114/444?text=No+Image",
    rating: m.rating?.toString() || "N/A",
    type: (isMovie ? "movie" : "series") as "movie" | "series",
  });

  const toLiveItem = (c: any) => ({
    id: c.stream_id,
    title: c.name,
    image: c.stream_icon || "https://via.placeholder.com/300x450/111114/444?text=Live",
    type: "live" as const,
  });

  const latestMovies = movies.slice(0, 20).map(m => toItem(m, true));
  const latestSeries = series.slice(0, 20).map(s => toItem(s, false));
  const popularChannels = liveChannels.slice(0, 20).map(toLiveItem);
  const trendingMovies = [...movies].sort(() => Math.random() - 0.5).slice(0, 20).map(m => toItem(m, true));
  const topRated = movies.filter(m => parseFloat(m.rating || "0") >= 7).slice(0, 20).map(m => toItem(m, true));

  return (
    <div className="pb-8">
      <HeroBanner />
      {latestMovies.length > 0 && (
        <ContentRow title="Recommended for You" items={latestMovies} accentColor="linear-gradient(#f6c15a,#ff9f1a)" />
      )}
      {popularChannels.length > 0 && (
        <ContentRow title="Live Sports Today" items={popularChannels} accentColor="#ff4444" />
      )}
      {trendingMovies.length > 0 && (
        <ContentRow title="Trending Now" items={trendingMovies} accentColor="#ff9f1a" />
      )}
      {latestSeries.length > 0 && (
        <ContentRow title="Continue Watching" items={latestSeries} accentColor="#D4AF37" />
      )}
      {topRated.length > 0 && (
        <ContentRow title="Recently Added" items={topRated} accentColor="#f6c15a" />
      )}
      {latestMovies.length === 0 && latestSeries.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="text-6xl font-serif font-bold text-white/5">X</div>
          <p className="text-text-muted">No content loaded. Check your connection or login again.</p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
