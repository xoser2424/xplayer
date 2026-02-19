import React, { useState, useMemo } from 'react';
import { Play, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useContentStore } from '@/store/useContentStore';
import clsx from 'clsx';

const LiveTV: React.FC = () => {
  const navigate = useNavigate();
  const { liveChannels, liveCategories } = useContentStore();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(120);

  // Filter Channels
  const filteredChannels = useMemo(() => {
    let channels = liveChannels;

    if (selectedCategoryId !== 'all') {
      channels = channels.filter(c => c.category_id === selectedCategoryId);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      channels = channels.filter(c => c.name.toLowerCase().includes(query));
    }

    return channels;
  }, [liveChannels, selectedCategoryId, searchQuery]);

  const visibleChannels = useMemo(() => filteredChannels.slice(0, visibleCount), [filteredChannels, visibleCount]);

  return (
    <div className="flex h-full gap-6 overflow-hidden">
      {/* Categories Sidebar */}
      <div className="w-72 bg-panel/50 rounded-2xl p-4 overflow-hidden flex flex-col border border-white/5 backdrop-blur-sm">
        <h2 className="text-xl font-serif font-bold text-gold mb-6 px-2 sticky top-0 bg-panel/95 z-10 pb-2 border-b border-white/5">
           Categories <span className="text-xs text-text-muted font-normal ml-2">({liveCategories.length})</span>
        </h2>
        
        <div className="space-y-1 overflow-y-auto pr-2 custom-scrollbar flex-1">
          <button
            onClick={() => setSelectedCategoryId('all')}
            className={clsx(
              "w-full text-left px-4 py-2.5 rounded-lg transition-all font-medium text-sm flex justify-between items-center",
              selectedCategoryId === 'all' 
                ? "bg-gold text-black shadow-gold-glow" 
                : "text-text-muted hover:bg-white/5 hover:text-white"
            )}
          >
            <span>All Channels</span>
            <span className="text-xs opacity-70 bg-black/20 px-1.5 py-0.5 rounded">{liveChannels.length}</span>
          </button>

          {liveCategories.map((cat) => (
            <button
              key={cat.category_id}
              onClick={() => setSelectedCategoryId(cat.category_id)}
              className={clsx(
                "w-full text-left px-4 py-2.5 rounded-lg transition-all font-medium text-sm flex justify-between items-center group",
                selectedCategoryId === cat.category_id 
                  ? "bg-gold text-black shadow-gold-glow" 
                  : "text-text-muted hover:bg-white/5 hover:text-white"
              )}
            >
              <span className="truncate pr-2">{cat.category_name}</span>
              {/* Count logic would be expensive here without pre-calculation */}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
         {/* Search Bar */}
         <div className="mb-6 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
            <input 
               type="text" 
               placeholder="Search channels..." 
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="w-full bg-panel/50 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:border-gold/50 focus:ring-1 focus:ring-gold/50 outline-none transition-all placeholder:text-white/20"
            />
         </div>

         {/* Channels Grid */}
         <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {filteredChannels.length > 0 ? (
               <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 pb-10">
                 {visibleChannels.map((channel) => (
                   <div 
                     key={channel.stream_id}
                     onClick={() => navigate(`/player/live/${channel.stream_id}`)}
                     className="group bg-panel rounded-xl p-4 border border-white/5 hover:border-gold/50 transition-all cursor-pointer relative aspect-video flex items-center justify-center hover:shadow-gold-glow hover:-translate-y-1 duration-300"
                   >
                     {channel.stream_icon ? (
                        <img 
                           src={channel.stream_icon} 
                           alt={channel.name} 
                           loading="lazy"
                           className="max-w-[80%] max-h-[70%] object-contain opacity-80 group-hover:opacity-100 transition-opacity" 
                           onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                              (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                           }}
                        />
                     ) : (
                        <span className="text-gold font-serif text-2xl font-bold opacity-50 group-hover:opacity-100">{channel.name.substring(0, 2)}</span>
                     )}
                     
                     {/* Fallback Text if Image Fails */}
                     <span className="hidden text-gold font-serif text-2xl font-bold opacity-50 group-hover:opacity-100">{channel.name.substring(0, 2)}</span>

                     {/* Hover Overlay */}
                     <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center rounded-xl backdrop-blur-sm z-10 p-2 text-center">
                       <div className="w-10 h-10 rounded-full bg-gold flex items-center justify-center shadow-gold-glow mb-2 transform scale-0 group-hover:scale-100 transition-transform delay-75">
                         <Play fill="black" size={20} className="ml-1 text-black" />
                       </div>
                       <span className="text-white font-medium text-sm line-clamp-2">{channel.name}</span>
                     </div>
                   </div>
                 ))}
               </div>
            ) : (
               <div className="flex flex-col items-center justify-center h-64 text-text-muted">
                  <p className="text-lg">No channels found</p>
                  <button onClick={() => {setSearchQuery(''); setSelectedCategoryId('all');}} className="text-gold hover:underline mt-2">Clear filters</button>
               </div>
            )}
            {filteredChannels.length > visibleCount && (
              <div className="flex justify-center py-6">
                <button
                  onClick={() => setVisibleCount((c) => c + 120)}
                  className="px-4 py-2 bg-gold text-black rounded-lg font-bold hover:bg-gold-highlight transition-colors"
                >
                  Load more
                </button>
              </div>
            )}
         </div>
      </div>
    </div>
  );
};

export default LiveTV;
