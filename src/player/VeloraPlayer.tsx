import React, { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import { Loader2, AlertCircle } from 'lucide-react';
import clsx from 'clsx';

interface VeloraPlayerProps {
  url: string;
  className?: string;
  autoPlay?: boolean;
  muted?: boolean;
  onError?: (err: any) => void;
  onReady?: () => void;
  onWaiting?: () => void;
  onPlaying?: () => void;
}

export const VeloraPlayer: React.FC<VeloraPlayerProps> = ({ 
  url, 
  className, 
  autoPlay = true, 
  muted = false,
  onError,
  onReady,
  onWaiting,
  onPlaying
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const retryCountRef = useRef(0);
  const maxRetries = 3;
  const retryTimeoutRef = useRef<NodeJS.Timeout>();

  const handleRetry = useCallback(() => {
    if (retryCountRef.current < maxRetries) {
      retryCountRef.current++;
      console.log(`[VeloraPlayer] Retrying playback (${retryCountRef.current}/${maxRetries})...`);
      setError(null);
      setLoading(true);
      
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = setTimeout(() => {
        initPlayer();
      }, 2000);
    } else {
      const msg = "Playback failed after multiple attempts";
      console.error(`[VeloraPlayer] ${msg}`);
      setError(msg);
      setLoading(false);
      onError?.(new Error(msg));
    }
  }, [onError]); // initPlayer is circular if added here, handled via ref or simplified structure

  const initPlayer = useCallback(() => {
    if (!url) return;
    
    const video = videoRef.current;
    if (!video) return;

    setLoading(true);
    setError(null);

    // Cleanup existing HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
        maxBufferLength: 30,
        liveSyncDurationCount: 3,
        liveMaxLatencyDurationCount: 10,
        maxMaxBufferLength: 600,
        manifestLoadingTimeOut: 15000,
        manifestLoadingMaxRetry: 2,
        levelLoadingTimeOut: 15000,
        levelLoadingMaxRetry: 2,
        fragLoadingTimeOut: 15000,
        fragLoadingMaxRetry: 2,
      });

      hlsRef.current = hls;
      hls.loadSource(url);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (autoPlay) {
          video.play().catch(e => console.warn("[VeloraPlayer] Autoplay blocked:", e));
        }
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.warn("[VeloraPlayer] Network error, trying to recover...");
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.warn("[VeloraPlayer] Media error, trying to recover...");
              hls.recoverMediaError();
              break;
            default:
              console.error("[VeloraPlayer] Fatal error:", data);
              hls.destroy();
              handleRetry();
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (Safari)
      video.src = url;
      video.addEventListener('loadedmetadata', () => {
        if (autoPlay) {
          video.play().catch(e => console.warn("[VeloraPlayer] Autoplay blocked:", e));
        }
      });
      video.addEventListener('error', (e) => {
        console.error("[VeloraPlayer] Native video error:", e);
        handleRetry();
      });
    } else {
      // Try standard playback (mp4 etc)
      video.src = url;
      video.addEventListener('loadedmetadata', () => {
         if (autoPlay) video.play().catch(() => {});
      });
      video.addEventListener('error', (e) => {
        console.error("[VeloraPlayer] Standard video error:", e);
        handleRetry();
      });
    }
  }, [url, autoPlay, handleRetry]);

  useEffect(() => {
    retryCountRef.current = 0;
    initPlayer();

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      if (videoRef.current) {
        videoRef.current.removeAttribute('src');
        videoRef.current.load();
      }
    };
  }, [initPlayer]);

  // Event listeners for video element state
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => {
      setLoading(false);
      onPlaying?.();
    };
    
    const onWaitingHandler = () => {
      setLoading(true);
      onWaiting?.();
    };

    const onCanPlay = () => {
        setLoading(false);
        onReady?.();
    }

    video.addEventListener('play', onPlay);
    video.addEventListener('playing', onPlay);
    video.addEventListener('waiting', onWaitingHandler);
    video.addEventListener('canplay', onCanPlay);

    return () => {
      video.removeEventListener('play', onPlay);
      video.removeEventListener('playing', onPlay);
      video.removeEventListener('waiting', onWaitingHandler);
      video.removeEventListener('canplay', onCanPlay);
    };
  }, [onPlaying, onWaiting, onReady]);

  return (
    <div className={clsx("relative w-full h-full bg-black flex items-center justify-center overflow-hidden", className)}>
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        muted={muted}
        controls={false}
        playsInline
      />
      
      {loading && !error && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/40 pointer-events-none">
          <Loader2 className="w-12 h-12 text-white animate-spin opacity-80" />
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-black/90 text-white">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <p className="text-lg font-semibold mb-2">Playback Failed</p>
          <button 
            onClick={() => { retryCountRef.current = 0; initPlayer(); }}
            className="mt-4 px-6 py-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors font-medium"
          >
            Retry Connection
          </button>
        </div>
      )}
    </div>
  );
};
