import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useGame } from '../context/GameContext';
import { Header } from '../components/Header';
import { Clock, Layers, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import gameData from '../../data/data.json';
import { useSoundManager } from '../../hooks/useSoundManager';

const CARD_OPTIONS = [20, 30, 50, 100];

export function Settings() {
  const { settings, updateSettings } = useGame();
  const navigate = useNavigate();
  const [selectedCategories, setSelectedCategories] = useState<string[]>(settings.categories);
  const [selectedTime, setSelectedTime] = useState(settings.timePerQuestion);
  const [selectedCards, setSelectedCards] = useState(settings.totalCards);
  const { playBackgroundMusic, stopBackgroundMusic, playButtonClick } = useSoundManager();

  useEffect(() => {
    playBackgroundMusic('settings');
    return () => stopBackgroundMusic();
  }, []);

  const toggleCategory = (category: string) => {
    playButtonClick();
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter(c => c !== category));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  const handleStartGame = () => {
    if (selectedCategories.length > 0) {
      playButtonClick();
      updateSettings({
        categories: selectedCategories,
        timePerQuestion: selectedTime,
        totalCards: selectedCards,
      });
      navigate('/game');
    }
  };

  return (
    <div className="min-h-screen game-background text-white">
      <Header />
      
      <div className="container mx-auto px-4 pb-12 max-w-4xl">
        <div className="space-y-6">
          {/* Categories Card */}
          <motion.div
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl p-6 border-4 border-amber-900 shadow-2xl"
            style={{ boxShadow: '0 10px 0 rgba(120, 53, 15, 0.5), 0 15px 30px rgba(0,0,0,0.3)' }}
          >
            <div className="flex items-center justify-center gap-3 mb-6">
              <Layers className="w-8 h-8 text-amber-900" />
              <h2 className="text-3xl font-black text-amber-900">أنواع الأسئلة</h2>
            </div>
            
            <div className="max-h-80 overflow-y-auto game-scrollbar pr-1">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {gameData.categories.map((category) => {
                  const isSelected = selectedCategories.includes(category.id);
                  return (
                    <motion.button
                      key={category.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => toggleCategory(category.id)}
                      className={`relative py-3 px-3 rounded-2xl border-4 border-amber-900 font-black text-base transition-all flex flex-col items-center gap-1 ${
                        isSelected
                          ? 'bg-emerald-500 text-white shadow-lg'
                          : 'bg-white/90 text-amber-900'
                      }`}
                    >
                      <span className="text-2xl">{category.icon}</span>
                      <span className="text-sm leading-tight text-center">{category.name}</span>
                      {isSelected && (
                        <CheckCircle2 className="absolute top-1 left-1 w-5 h-5 text-white" />
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>
            
            {selectedCategories.length === 0 && (
              <p className="text-center text-amber-900 font-bold mt-4">
                اختر على الأقل فئة واحدة!
              </p>
            )}
          </motion.div>

          {/* Time Card */}
          <motion.div
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl p-6 border-4 border-amber-900 shadow-2xl"
            style={{ boxShadow: '0 10px 0 rgba(120, 53, 15, 0.5), 0 15px 30px rgba(0,0,0,0.3)' }}
          >
            <div className="flex items-center justify-center gap-3 mb-6">
              <Clock className="w-8 h-8 text-amber-900" />
              <h2 className="text-3xl font-black text-amber-900">وقت السؤال</h2>
            </div>

            <div className="flex flex-col items-center gap-6">
              {/* Big time display */}
              <motion.div
                key={selectedTime}
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="w-28 h-28 rounded-full border-8 border-amber-900 flex flex-col items-center justify-center bg-amber-900 shadow-xl"
                style={{ boxShadow: '0 6px 0 rgba(60,20,0,0.4)' }}
              >
                <span className="text-4xl font-black text-white leading-none">{selectedTime}</span>
                <span className="text-sm font-bold text-amber-300">ثانية</span>
              </motion.div>

              {/* Slider */}
              <div className="w-full px-4">
                <div className="flex justify-between text-amber-900 font-black text-sm mb-3">
                  <span>100 ثانية</span>
                  <span>0 ثانية</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(Number(e.target.value))}
                  className="game-slider w-full"
                  style={{
                    '--track-empty': `${100 - selectedTime}%`,
                  } as React.CSSProperties}
                />
                {/* Tick marks for reference */}
                <div className="flex justify-between mt-2 px-1">
                  {[0, 25, 50, 75, 100].map((tick) => (
                    <button
                      key={tick}
                      onClick={() => setSelectedTime(tick)}
                      className={`text-xs font-black px-2 py-1 rounded-lg border-2 border-amber-900 transition-all ${
                        selectedTime === tick
                          ? 'bg-amber-900 text-white'
                          : 'bg-white/70 text-amber-900 hover:bg-white'
                      }`}
                    >
                      {tick}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Cards Count */}
          <motion.div
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl p-6 border-4 border-amber-900 shadow-2xl"
            style={{ boxShadow: '0 10px 0 rgba(120, 53, 15, 0.5), 0 15px 30px rgba(0,0,0,0.3)' }}
          >
            <div className="flex items-center justify-center gap-3 mb-6">
              <Layers className="w-8 h-8 text-amber-900" />
              <h2 className="text-3xl font-black text-amber-900">عدد الكروت</h2>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {CARD_OPTIONS.map((cards) => (
                <motion.button
                  key={cards}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedCards(cards)}
                  className={`py-4 px-4 rounded-2xl border-4 border-amber-900 font-black text-lg transition-all ${
                    selectedCards === cards
                      ? 'bg-emerald-500 text-white shadow-lg'
                      : 'bg-white/90 text-amber-900'
                  }`}
                >
                  {cards} كارت
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Start Game Button */}
          <motion.button
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: selectedCategories.length > 0 ? 1.05 : 1 }}
            whileTap={{ scale: selectedCategories.length > 0 ? 0.95 : 1 }}
            onClick={handleStartGame}
            disabled={selectedCategories.length === 0}
            className={`w-full py-6 text-3xl font-black rounded-3xl border-4 border-amber-900 shadow-2xl transition-all ${
              selectedCategories.length > 0
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white cursor-pointer'
                : 'bg-gray-400 text-gray-600 cursor-not-allowed'
            }`}
            style={{ boxShadow: '0 8px 0 rgba(120, 53, 15, 0.5)' }}
          >
            ابدأ اللعبة 🎮
          </motion.button>
        </div>
      </div>
    </div>
  );
}