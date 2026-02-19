import React from 'react';
import { Play, Info } from 'lucide-react';

export const HeroBanner: React.FC = () => {
  return (
    <div className="relative w-full h-[60vh] rounded-3xl overflow-hidden mb-10 group">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
        style={{ backgroundImage: `url('https://image.tmdb.org/t/p/original/sRLC052ieEafQN95VcKFfIKjkO2.jpg')` }} // Example: Dune
      >
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" />
      </div>

      {/* Content */}
      <div className="absolute bottom-0 left-0 p-12 w-full md:w-2/3 lg:w-1/2 z-10">
        <h1 className="text-6xl font-serif font-bold text-white mb-4 drop-shadow-lg">
          Dune: Part One
        </h1>
        
        <div className="flex items-center gap-4 text-sm text-text-muted mb-6">
          <span className="bg-gold text-black px-2 py-0.5 rounded font-bold">IMDb 8.0</span>
          <span>2021</span>
          <span>2h 35m</span>
          <span>Sci-Fi, Adventure</span>
        </div>

        <p className="text-text-dim text-lg mb-8 line-clamp-3">
          Paul Atreides, a brilliant and gifted young man born into a great destiny beyond his understanding, must travel to the most dangerous planet in the universe to ensure the future of his family and his people.
        </p>

        <div className="flex items-center gap-4">
          <button className="bg-gold hover:bg-gold-highlight text-black font-bold px-8 py-3 rounded-full flex items-center gap-2 transition-all shadow-gold-glow hover:shadow-gold-glow-hover">
            <Play fill="black" size={20} />
            <span>Play Now</span>
          </button>
          
          <button className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-medium px-8 py-3 rounded-full flex items-center gap-2 transition-all border border-white/10">
            <Info size={20} />
            <span>More Info</span>
          </button>
        </div>
      </div>
    </div>
  );
};