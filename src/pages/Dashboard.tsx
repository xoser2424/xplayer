import React from 'react';
import { HeroBanner } from '@/components/HeroBanner';
import { ContentRow } from '@/components/ContentRow';
import { useContentStore } from '@/store/useContentStore';
import { useAuthStore } from '@/store/useAuthStore';
import { Loader2 } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { movies, series, liveChannels } = useContentStore();
  const { isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="animate-spin text-gold w-10 h-10" />
      </div>
    );
  }

  // Transform Xtream data to Component props
  const latestMovies = movies.slice(0, 15).map(m => ({
    id: m.stream_id,
    title: m.name,
    image: m.stream_icon || 'https://via.placeholder.com/300x450?text=No+Image',
    rating: m.rating?.toString() || 'N/A',
    type: 'movie' as const
  }));

  const latestSeries = series.slice(0, 15).map(s => ({
    id: s.series_id,
    title: s.name,
    image: s.cover || 'https://via.placeholder.com/300x450?text=No+Image',
    rating: s.rating?.toString() || 'N/A',
    type: 'series' as const
  }));
  
  const popularChannels = liveChannels.slice(0, 15).map(c => ({
    id: c.stream_id,
    title: c.name,
    image: c.stream_icon || 'https://via.placeholder.com/300x450?text=No+Image',
    type: 'live' as const
  }));

  return (
    <div className="pb-10">
      <HeroBanner />
      
      {latestMovies.length > 0 && <ContentRow title="Latest Movies" items={latestMovies} />}
      {latestSeries.length > 0 && <ContentRow title="New Series" items={latestSeries} />}
      {popularChannels.length > 0 && <ContentRow title="Popular Channels" items={popularChannels} />}
      
      {latestMovies.length === 0 && (
         <div className="text-center text-text-muted mt-20">
            No content found. Please check your subscription or connection.
         </div>
      )}
    </div>
  );
};

export default Dashboard;
