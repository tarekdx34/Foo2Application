import { useNavigate } from 'react-router';
import { useGame } from '../context/GameContext';
import { Header } from '../components/Header';
import { Trophy, RotateCcw, Home } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';

export function Results() {
  const { players, resetGame } = useGame();
  const navigate = useNavigate();
  const [confetti, setConfetti] = useState<Array<{ id: number; x: number; delay: number }>>([]);

  useEffect(() => {
    // Generate confetti
    const confettiArray = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 2,
    }));
    setConfetti(confettiArray);
  }, []);

  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const winner = sortedPlayers[0];

  const handlePlayAgain = () => {
    resetGame();
    navigate('/settings');
  };

  const handleBackHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen game-background text-white relative overflow-hidden">
      {/* Confetti */}
      {confetti.map((item) => (
        <motion.div
          key={item.id}
          className="absolute w-3 h-3 rounded-full"
          style={{
            left: `${item.x}%`,
            top: '-20px',
            backgroundColor: ['#F59E0B', '#FBBF24', '#10B981', '#EF4444'][Math.floor(Math.random() * 4)],
          }}
          animate={{
            y: '100vh',
            rotate: 360,
            opacity: [1, 0],
          }}
          transition={{
            duration: 3,
            delay: item.delay,
            ease: 'linear',
            repeat: Infinity,
          }}
        />
      ))}

      <Header />
      
      <div className="container mx-auto px-4 pb-12 max-w-3xl relative z-10">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="space-y-6"
        >
          {/* Game Over Title */}
          <motion.div
            initial={{ y: -50 }}
            animate={{ y: 0 }}
            className="text-center"
          >
            <h2 className="text-5xl font-black text-amber-400 mb-2" 
                style={{ textShadow: '3px 3px 0px #D97706, 6px 6px 0px rgba(0,0,0,0.3)' }}>
              انتهت اللعبة!
            </h2>
          </motion.div>

          {/* Winner Card */}
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-500 rounded-3xl p-8 border-4 border-amber-900 shadow-2xl"
            style={{ boxShadow: '0 15px 0 rgba(120, 53, 15, 0.5), 0 20px 40px rgba(0,0,0,0.4)' }}
          >
            <div className="flex flex-col items-center">
              <Trophy className="w-20 h-20 text-amber-900 mb-4" />
              <h3 className="text-3xl font-black text-amber-900 mb-2">الفائز</h3>
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="text-6xl font-black text-white mb-2"
                style={{ textShadow: '3px 3px 0px #78350F' }}
              >
                {winner.name}
              </motion.div>
              <div className="text-4xl font-black text-amber-900">
                {winner.score} نقطة
              </div>
            </div>
          </motion.div>

          {/* Leaderboard */}
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl p-6 border-4 border-amber-900 shadow-2xl"
            style={{ boxShadow: '0 10px 0 rgba(120, 53, 15, 0.5), 0 15px 30px rgba(0,0,0,0.3)' }}
          >
            <h3 className="text-3xl font-black text-amber-900 text-center mb-6">ترتيب اللاعبين</h3>
            <div className="space-y-3">
              {sortedPlayers.map((player, index) => {
                const medals = ['🥇', '🥈', '🥉'];
                const medal = medals[index] || '🏅';
                
                return (
                  <motion.div
                    key={player.id}
                    initial={{ x: -100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className={`flex items-center justify-between p-4 rounded-2xl border-4 ${
                      index === 0
                        ? 'bg-gradient-to-r from-yellow-300 to-amber-400 border-yellow-600'
                        : index === 1
                        ? 'bg-gradient-to-r from-gray-300 to-gray-400 border-gray-600'
                        : index === 2
                        ? 'bg-gradient-to-r from-orange-300 to-orange-400 border-orange-600'
                        : 'bg-white/90 border-amber-900'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-4xl">{medal}</span>
                      <div>
                        <span className="text-2xl font-black text-amber-900">
                          {index + 1}. {player.name}
                        </span>
                      </div>
                    </div>
                    <div className="text-3xl font-black text-amber-900">
                      {player.score} {player.score === 1 ? 'نقطة' : 'نقاط'}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handlePlayAgain}
              className="flex-1 py-5 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-2xl rounded-2xl border-4 border-amber-900 shadow-lg flex items-center justify-center gap-3"
              style={{ boxShadow: '0 6px 0 rgba(120, 53, 15, 0.5)' }}
            >
              <RotateCcw className="w-7 h-7" />
              إعادة اللعب
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleBackHome}
              className="flex-1 py-5 bg-amber-500 hover:bg-amber-600 text-white font-black text-2xl rounded-2xl border-4 border-amber-900 shadow-lg flex items-center justify-center gap-3"
              style={{ boxShadow: '0 6px 0 rgba(120, 53, 15, 0.5)' }}
            >
              <Home className="w-7 h-7" />
              العودة للبداية
            </motion.button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}