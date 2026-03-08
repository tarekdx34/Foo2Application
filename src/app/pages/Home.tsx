import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useGame } from '../context/GameContext';
import { Header } from '../components/Header';
import { X, Plus, Users, Download, CheckCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { useInstallPrompt } from '../../hooks/useInstallPrompt';

export function Home() {
  const [playerName, setPlayerName] = useState('');
  const { players, addPlayer, removePlayer } = useGame();
  const navigate = useNavigate();
  const { canInstall, isInstalled, triggerInstall } = useInstallPrompt();

  const handleAddPlayer = () => {
    if (playerName.trim()) {
      addPlayer(playerName.trim());
      setPlayerName('');
    }
  };

  const handleStartGame = () => {
    if (players.length >= 2) {
      navigate('/settings');
    }
  };

  return (
    <div className="min-h-screen game-background text-white">
      <Header />
      
      <div className="container mx-auto px-4 pb-12 max-w-3xl">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl p-8 shadow-2xl border-4 border-amber-900"
          style={{ boxShadow: '0 10px 0 rgba(120, 53, 15, 0.5), 0 15px 30px rgba(0,0,0,0.3)' }}
        >
          <div className="text-center mb-6">
            <h2 className="text-3xl font-black text-amber-900 mb-2">لعبة فووق</h2>
            <p className="text-amber-900 font-bold">اختبر سرعة تفكيرك مع تحديات الكروت!</p>
          </div>

          {/* Add Player Section */}
          <div className="bg-white/90 rounded-2xl p-6 border-4 border-amber-900 mb-6">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Users className="w-6 h-6 text-amber-900" />
              <h3 className="text-xl font-black text-amber-900">إضافة اللاعبين</h3>
            </div>
            
            <div className="flex flex-col gap-2 mb-4">
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddPlayer()}
                placeholder="اكتب اسم اللاعب"
                className="w-full px-4 py-3 rounded-xl border-4 border-amber-900 text-amber-900 font-bold text-lg focus:outline-none focus:ring-4 focus:ring-orange-400"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleAddPlayer}
                className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-black rounded-xl border-4 border-amber-900 shadow-lg flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                إضافة لاعب
              </motion.button>
            </div>

            {/* Players List */}
            {players.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {players.map((player, index) => (
                  <motion.div
                    key={player.id}
                    initial={{ scale: 0, rotate: -10 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: 10 }}
                    className="bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl p-4 border-4 border-amber-900 flex items-center justify-between shadow-md"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border-3 border-amber-900">
                        <span className="text-xl font-black text-amber-900">{index + 1}</span>
                      </div>
                      <span className="text-xl font-black text-white">{player.name}</span>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1, rotate: 90 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => removePlayer(player.id)}
                      className="w-8 h-8 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center border-2 border-amber-900"
                    >
                      <X className="w-5 h-5 text-white" />
                    </motion.button>
                  </motion.div>
                ))}
              </div>
            )}

            {players.length < 2 && (
              <p className="text-center text-amber-900 font-bold mt-4">
                أضف على الأقل لاعبين للبدء!
              </p>
            )}
          </div>

          {/* Start Button */}
          <motion.button
            whileHover={{ scale: players.length >= 2 ? 1.05 : 1 }}
            whileTap={{ scale: players.length >= 2 ? 0.95 : 1 }}
            onClick={handleStartGame}
            disabled={players.length < 2}
            className={`w-full py-4 text-2xl font-black rounded-2xl border-4 border-amber-900 shadow-lg transition-all ${
              players.length >= 2
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white cursor-pointer'
                : 'bg-gray-400 text-gray-600 cursor-not-allowed'
            }`}
            style={{ boxShadow: '0 6px 0 rgba(120, 53, 15, 0.5)' }}
          >
            الانتقال للإعدادات
          </motion.button>

          {/* Install Button */}
          {(canInstall || isInstalled) && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: isInstalled ? 1 : 1.03 }}
              whileTap={{ scale: isInstalled ? 1 : 0.97 }}
              onClick={isInstalled ? undefined : triggerInstall}
              disabled={isInstalled}
              className={`w-full py-3 text-lg font-black rounded-2xl border-4 border-amber-900 flex items-center justify-center gap-3 transition-all ${
                isInstalled
                  ? 'bg-white/60 text-amber-900 cursor-default'
                  : 'bg-amber-900 hover:bg-amber-800 text-white cursor-pointer'
              }`}
            >
              {isInstalled ? (
                <>
                  <CheckCircle className="w-6 h-6" />
                  تم تحميل التطبيق ✓
                </>
              ) : (
                <>
                  <Download className="w-6 h-6" />
                  حمّل التطبيق للعب بدون إنترنت
                </>
              )}
            </motion.button>
          )}
        </motion.div>
      </div>
    </div>
  );
}