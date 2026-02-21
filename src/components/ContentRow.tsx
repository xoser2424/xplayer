import React, { useRef } from "react";
import { MovieCard } from "./MovieCard";
import { ChevronRight, ChevronLeft } from "lucide-react";

interface ContentRowProps {
  title: string;
  items: Array<{
    id: number;
    title: string;
    image: string;
    year?: string;
    rating?: string;
    type?: "movie" | "series" | "live";
  }>;
  accentColor?: string;
}

export const ContentRow: React.FC<ContentRowProps> = ({ title, items, accentColor }) => {
  const rowRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (rowRef.current) {
      rowRef.current.scrollBy({ left: dir === "left" ? -600 : 600, behavior: "smooth" });
    }
  };

  return (
    <div className="mb-7 group/row">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-3">
          {accentColor && <div className="w-1 h-5 rounded-full" style={{ background: accentColor }} />}
          <h2 className="text-lg font-serif font-semibold text-white">{title}</h2>
          <span className="text-[10px] text-text-dim font-medium">{items.length} titles</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => scroll("left")}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-text-dim hover:text-gold transition-all opacity-0 group-hover/row:opacity-100"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => scroll("right")}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-text-dim hover:text-gold transition-all opacity-0 group-hover/row:opacity-100"
          >
            <ChevronRight size={16} />
          </button>
          <button className="flex items-center gap-1 text-xs text-text-dim hover:text-gold transition-colors ml-1">
            View All <ChevronRight size={14} />
          </button>
        </div>
      </div>

      <div
        ref={rowRef}
        className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x"
      >
        {items.map(item => (
          <div key={item.id} className="flex-shrink-0 w-36 snap-start">
            <MovieCard {...item} />
          </div>
        ))}
      </div>
    </div>
  );
};
