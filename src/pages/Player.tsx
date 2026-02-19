import React, { useRef, useState, useEffect } from 'react';
import ReactPlayer from 'react-player';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Play, Pause, Volume2, VolumeX, Maximize, Minimize, SkipForward, SkipBack, Settings, Subtitles, Heart } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useContentStore } from '@/store/useContentStore';
import clsx from 'clsx';

const Player: React.FC = () => {
  const navigate = useNavigate();
  const { type, id } = useParams();
  const { credentials } = useAuthStore();
  const { movies, series, liveChannels, addToHistory, addToFavorites, removeFromFavorites, favorites } = useContentStore();
  
  const playerRef = useRef<ReactPlayer>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Player State
  const [url, setUrl] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [playing, setPlaying] = useState(true);
  const [volume, setVolume] = useState(1.0); // 0 to 1
  const [muted, setMuted] = useState(false);
  const [played, setPlayed] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [buffer, setBuffer] = useState(0);
  
  // Current Item Data
  const [currentItem, setCurrentItem] = useState<any>(null);
  
  let controlsTimeout: NodeJS.Timeout;

  const isFavorite = currentItem && favorites.some((fav) => (fav.stream_id === currentItem.stream_id || fav.series_id === currentItem.series_id));

  useEffect(() => {
    if (!credentials.serverUrl || !credentials.username || !credentials.password) {
       console.error("Missing credentials");
       return;
    }

    let streamUrl = '';
    let contentTitle = '';
    let extension = '';
    let itemData = null;

    const numId = Number(id);

    if (type === 'movie') {
       const movie = movies.find(m => m.stream_id === numId);
       if (movie) {
          contentTitle = movie.name;
          extension = movie.container_extension || 'mp4';
          streamUrl = `${credentials.serverUrl}/movie/${credentials.username}/${credentials.password}/${id}.${extension}`;
          itemData = movie;
       }
    } else if (type === 'series') {
       // Assuming ID is series_id for now, but typically it would be episode_id
       // For this demo, we'll try to find the series info
       const s = series.find(s => s.series_id === numId);
       if (s) {
          streamUrl = `${credentials.serverUrl}/series/${credentials.username}/${credentials.password}/${id}.mp4`; 
          contentTitle = s.name; // Playing Series Episode
          itemData = s;
       }
    } else if (type === 'live') {
       const channel = liveChannels.find(c => c.stream_id === numId);
       if (channel) {
          contentTitle = channel.name;
          streamUrl = `${credentials.serverUrl}/live/${credentials.username}/${credentials.password}/${id}.m3u8`; 
          itemData = channel;
       }
    }

    setTitle(contentTitle);
    setUrl(streamUrl);
    setCurrentItem(itemData);
    
    if (itemData) {
       addToHistory(itemData);
    }

    console.log("Playing URL:", streamUrl);

  }, [type, id, credentials, movies, series, liveChannels]);

  const handleMouseMove = () => {
    setShowControls(true);
    clearTimeout(controlsTimeout);
    controlsTimeout = setTimeout(() => setShowControls(false), 3000);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const toggleFavorite = () => {
     if (!currentItem) return;
     
     if (isFavorite) {
        removeFromFavorites(currentItem.stream_id || currentItem.series_id);
     } else {
        addToFavorites(currentItem);
     }
  };

  const formatTime = (seconds: number) => {
    const date = new Date(seconds * 1000);
    const hh = date.getUTCHours();
    const mm = date.getUTCMinutes();
    const ss = date.getUTCSeconds().toString().padStart(2, '0');
    if (hh) {
      return `${hh}:${mm.toString().padStart(2, '0')}:${ss}`;
    }
    return `${mm}:${ss}`;
  };

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 bg-black z-50 flex items-center justify-center overflow-hidden font-sans"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setShowControls(false)}
    >
      <ReactPlayer
        ref={playerRef}
        url={url}
        width="100%"
        height="100%"
        playing={playing}
        volume={volume}
        muted={muted}
        onProgress={(state) => {
           setPlayed(state.playedSeconds);
           setBuffer(state.loadedSeconds);
        }}
        onDuration={setDuration}
        onError={(e) => console.error("Player Error:", e)}
        config={{
          file: {
            forceHLS: type === 'live' || url.endsWith('.m3u8'),
            attributes: {
               crossOrigin: "anonymous"
            }
          }
        }}
      />

      {/* Overlay Controls */}
      <div 
        className={clsx(
          "absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/60 transition-opacity duration-300 flex flex-col justify-between p-8",
          showControls ? "opacity-100" : "opacity-0 cursor-none"
        )}
      >
        {/* Top Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
               <h1 className="text-xl font-bold text-white shadow-black drop-shadow-md">{title}</h1>
               {type === 'live' && <span className="bg-red-600 text-white text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider">Live</span>}
            </div>
          </div>
          
          <button 
             onClick={toggleFavorite}
             className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
             <Heart size={24} className={clsx("transition-colors", isFavorite ? "fill-gold text-gold" : "text-white")} />
          </button>
        </div>

        {/* Center Play Button (Large) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {!playing && (
            <div className="w-24 h-24 rounded-full bg-gold/80 flex items-center justify-center backdrop-blur-sm shadow-[0_0_30px_rgba(212,175,55,0.6)] animate-fade-in pointer-events-auto cursor-pointer hover:scale-110 transition-transform" onClick={() => setPlaying(true)}>
              <Play fill="black" size={48} className="ml-2 text-black" />
            </div>
          )}
        </div>

        {/* Bottom Bar */}
        <div className="space-y-4 mb-4">
          {/* Progress Bar */}
          {type !== 'live' && (
             <div className="flex items-center gap-4 text-sm font-medium text-white/90">
               <span className="min-w-[50px] text-right">{formatTime(played)}</span>
               <div className="relative flex-1 h-1.5 group cursor-pointer">
                  {/* Buffer Bar */}
                  <div 
                     className="absolute top-0 left-0 h-full bg-white/20 rounded-full"
                     style={{ width: `${(buffer / duration) * 100}%` }}
                  />
                  <input 
                    type="range" 
                    min={0} 
                    max={duration} 
                    value={played} 
                    onChange={(e) => playerRef.current?.seekTo(parseFloat(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  {/* Played Bar */}
                  <div 
                     className="absolute top-0 left-0 h-full bg-gold rounded-full pointer-events-none"
                     style={{ width: `${(played / duration) * 100}%` }}
                  >
                     <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg scale-0 group-hover:scale-100 transition-transform" />
                  </div>
               </div>
               <span className="min-w-[50px]">{formatTime(duration)}</span>
             </div>
          )}

          {/* Controls Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <button onClick={() => setPlaying(!playing)} className="text-white hover:text-gold transition-colors">
                {playing ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" />}
              </button>
              
              {type !== 'live' && (
                 <>
                   <button className="text-white hover:text-gold transition-colors" onClick={() => playerRef.current?.seekTo(played - 10)}>
                     <SkipBack size={24} />
                   </button>
                   
                   <button className="text-white hover:text-gold transition-colors" onClick={() => playerRef.current?.seekTo(played + 10)}>
                     <SkipForward size={24} />
                   </button>
                 </>
              )}

              <div className="flex items-center gap-3 group relative">
                <button onClick={() => setMuted(!muted)} className="text-white hover:text-gold transition-colors">
                  {muted || volume === 0 ? <VolumeX size={24} /> : <Volume2 size={24} />}
                </button>
                <div className="w-0 overflow-hidden group-hover:w-24 transition-all duration-300 flex items-center">
                   <input 
                     type="range" 
                     min={0} 
                     max={1} 
                     step={0.1} 
                     value={volume} 
                     onChange={(e) => setVolume(parseFloat(e.target.value))}
                     className="w-24 h-1.5 bg-white/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gold"
                   />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6">
               <button className="text-white hover:text-gold transition-colors flex items-center gap-2 group relative">
                 <Subtitles size={24} />
                 <span className="text-xs font-medium max-w-0 overflow-hidden group-hover:max-w-[100px] transition-all whitespace-nowrap">Subtitles</span>
               </button>
               
               <button className="text-white hover:text-gold transition-colors flex items-center gap-2 group relative">
                 <Settings size={24} />
                 <span className="text-xs font-medium max-w-0 overflow-hidden group-hover:max-w-[100px] transition-all whitespace-nowrap">Quality</span>
               </button>

               <button onClick={toggleFullscreen} className="text-white hover:text-gold transition-colors">
                 {isFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}
               </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Player;
