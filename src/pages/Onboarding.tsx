import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Check, ArrowRight } from 'lucide-react';
import clsx from 'clsx';

// Categories for selection
const GENRES = [
  'Action', 'Comedy', 'Horror', 'Sci-Fi', 'Drama', 'Documentary', 'Anime', 'Thriller', 'Romance', 'Fantasy'
];

const LIVE_PREFS = [
  'Sports', 'News', 'Documentary', 'Kids', 'Local TV', '4K Channels'
];

const WATCHING_HABITS = [
  { id: 'movies', label: 'Movie Buff', desc: 'I love watching movies' },
  { id: 'series', label: 'Binge Watcher', desc: 'I marathon series' },
  { id: 'live', label: 'Live TV', desc: 'I prefer live channels' },
  { id: 'night', label: 'Night Owl', desc: 'I watch mostly at night' }
];

export const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedLive, setSelectedLive] = useState<string[]>([]);
  const [selectedHabit, setSelectedHabit] = useState<string | null>(null);

  const toggleSelection = (list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>, item: string) => {
    if (list.includes(item)) {
      setList(list.filter(i => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      // Save preferences (in a real app)
      localStorage.setItem('onboarding_complete', 'true');
      navigate('/dashboard');
    }
  };

  return (
    <div className="h-screen w-screen bg-background flex items-center justify-center relative overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-[#1a1a24] to-background" />
      <div className="absolute top-0 left-0 w-full h-1 bg-white/10">
        <motion.div 
          className="h-full bg-gold shadow-gold-glow"
          initial={{ width: '0%' }}
          animate={{ width: `${(step / 3) * 100}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      <motion.div 
        key={step}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="z-10 w-full max-w-4xl p-8"
      >
        <div className="text-center mb-12">
          <h1 className="font-serif text-4xl font-bold text-white mb-4">
            {step === 1 && "What do you like to watch?"}
            {step === 2 && "Live TV Preferences"}
            {step === 3 && "Your Viewing Style"}
          </h1>
          <p className="text-text-muted text-lg">
            {step === 1 && "Select genres to personalize your recommendations."}
            {step === 2 && "Choose the type of live content you follow."}
            {step === 3 && "Help us tailor the experience to your habits."}
          </p>
        </div>

        {/* Step 1: Genres */}
        {step === 1 && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-12">
            {GENRES.map((genre) => (
              <button
                key={genre}
                onClick={() => toggleSelection(selectedGenres, setSelectedGenres, genre)}
                className={clsx(
                  "h-32 rounded-2xl flex flex-col items-center justify-center gap-3 transition-all duration-300 border",
                  selectedGenres.includes(genre)
                    ? "bg-gold text-black border-gold shadow-gold-glow scale-105"
                    : "bg-panel border-white/5 text-text-muted hover:bg-white/5 hover:text-white"
                )}
              >
                <span className="text-lg font-bold">{genre}</span>
                {selectedGenres.includes(genre) && <Check size={20} />}
              </button>
            ))}
          </div>
        )}

        {/* Step 2: Live TV */}
        {step === 2 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-12">
            {LIVE_PREFS.map((pref) => (
              <button
                key={pref}
                onClick={() => toggleSelection(selectedLive, setSelectedLive, pref)}
                className={clsx(
                  "h-24 rounded-2xl flex items-center justify-between px-8 transition-all duration-300 border",
                  selectedLive.includes(pref)
                    ? "bg-gold text-black border-gold shadow-gold-glow scale-105"
                    : "bg-panel border-white/5 text-text-muted hover:bg-white/5 hover:text-white"
                )}
              >
                <span className="text-xl font-bold">{pref}</span>
                {selectedLive.includes(pref) && <Check size={24} />}
              </button>
            ))}
          </div>
        )}

        {/* Step 3: Habits */}
        {step === 3 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 max-w-2xl mx-auto">
            {WATCHING_HABITS.map((habit) => (
              <button
                key={habit.id}
                onClick={() => setSelectedHabit(habit.id)}
                className={clsx(
                  "p-6 rounded-2xl text-left transition-all duration-300 border",
                  selectedHabit === habit.id
                    ? "bg-gold text-black border-gold shadow-gold-glow scale-105"
                    : "bg-panel border-white/5 hover:bg-white/5"
                )}
              >
                <h3 className={clsx("text-xl font-bold mb-2", selectedHabit === habit.id ? "text-black" : "text-white")}>
                  {habit.label}
                </h3>
                <p className={clsx("text-sm", selectedHabit === habit.id ? "text-black/80" : "text-text-muted")}>
                  {habit.desc}
                </p>
              </button>
            ))}
          </div>
        )}

        <div className="flex justify-center">
          <button
            onClick={handleNext}
            className="bg-gold hover:bg-gold-highlight text-black font-bold py-4 px-12 rounded-full shadow-gold-glow hover:shadow-gold-glow-hover transition-all duration-300 flex items-center gap-3 text-lg"
          >
            {step === 3 ? "Finish Setup" : "Next Step"}
            <ArrowRight size={24} />
          </button>
        </div>
      </motion.div>
    </div>
  );
};
