import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { useGame } from "../context/GameContext";
import { motion, AnimatePresence } from "motion/react";
import gameData from "../../data/data.json";
import logoImage from "../../assets/logo.svg";
import { useSoundManager } from "../../hooks/useSoundManager";
import { SoundControls } from "../components/SoundControls";

const isMobileDevice = () => window.innerWidth < 768;

// ── scattered logo wallpaper — pure CSS animations (no JS per frame) ──
const seed = (n: number, s: number) => ((Math.sin(n * s + 1.7) * 43758.5453) % 1 + 1) % 1;
const LOGOS_DESKTOP = Array.from({ length: 30 }, (_, i) => ({
  top:      `${seed(i, 5)  * 100}%`,
  left:     `${seed(i, 7)  * 100}%`,
  size:     60 + seed(i, 3) * 110,
  opacity:  0.13 + seed(i, 11) * 0.17,
  rotate:   seed(i, 13) * 360 - 180,
  duration: `${(5 + seed(i, 17) * 7).toFixed(1)}s`,
  delay:    `${(seed(i, 19) * -10).toFixed(1)}s`,
}));
// Fewer on mobile
const LOGOS_MOBILE = LOGOS_DESKTOP.filter((_, i) => i % 3 === 0);

function LogoBackground() {
  const isMobile = isMobileDevice();
  const logos = isMobile ? LOGOS_MOBILE : LOGOS_DESKTOP;
  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none select-none"
      style={{ zIndex: 0 }}
    >
      {logos.map((l, i) => (
        <img
          key={i}
          src={logoImage}
          alt=""
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: l.top,
            left: l.left,
            width: l.size,
            height: l.size,
            opacity: l.opacity,
            transform: `rotate(${l.rotate}deg)`,
            filter: 'brightness(1.4) saturate(0.5)',
            animation: `logoBob ${l.duration} ease-in-out ${l.delay} infinite`,
            willChange: 'transform',
          }}
        />
      ))}
    </div>
  );
}

interface Card {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  question: string;
  condition: string;
}

type ConditionDef = { type: string; template?: string; text?: string };

function generateCard(categoryIds: string[]): Card {
  const available = gameData.categories.filter(c => categoryIds.includes(c.id));
  const category = available[Math.floor(Math.random() * available.length)];
  const question = category.questions[Math.floor(Math.random() * category.questions.length)];

  const pool: ConditionDef[] = [...gameData.conditions, ...question.extraConditions];
  const conditionDef = pool[Math.floor(Math.random() * pool.length)];

  let condition: string;
  if (conditionDef.type === "letter") {
    const letter =
      gameData.arabicLetters[
        Math.floor(Math.random() * gameData.arabicLetters.length)
      ];
    condition = conditionDef.template!.replace("{letter}", letter);
  } else {
    condition = conditionDef.text!;
  }

  return {
    categoryId: category.id,
    categoryName: category.name,
    categoryIcon: category.icon,
    question: question.text,
    condition,
  };
}

const CARD_COLORS = [
  "hsl(25, 80%, 22%)",
  "hsl(28, 75%, 28%)",
  "hsl(30, 70%, 34%)",
  "hsl(33, 68%, 40%)",
];

function CardDeck({ count, isDealing }: { count: number; isDealing: boolean }) {
  const LAYERS = 4;
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative w-36 h-52">
        {Array.from({ length: LAYERS }).map((_, i) => {
          const isTop = i === LAYERS - 1;
          const xOff = (i - 1.5) * 3;
          const yOff = -(i * 5);
          const rot = (i - 1.5) * 2;
          const isVisible = i < Math.min(count, LAYERS);

          return (
            <motion.div
              key={i}
              className="absolute inset-0 rounded-2xl border-4 border-amber-900 shadow-lg overflow-hidden"
              style={{ zIndex: i + 1 }}
              initial={false}
              animate={
                isTop && isDealing && !isMobileDevice()
                  ? { x: 240, y: -30, rotate: 22, opacity: 0, scale: 0.88 }
                  : { x: xOff, y: yOff, rotate: rot, opacity: isVisible ? 1 : 0, scale: 1 }
              }
              transition={{
                duration: isTop && isDealing && !isMobileDevice() ? 0.42 : 0.28,
                ease: "easeOut",
              }}
            >
              <div
                className="w-full h-full"
                style={{
                  background: isTop
                    ? "repeating-linear-gradient(45deg, #F59E0B, #F59E0B 10px, #FBBF24 10px, #FBBF24 20px)"
                    : CARD_COLORS[i],
                }}
              />
            </motion.div>
          );
        })}
      </div>

      <div className="bg-amber-500 text-white px-6 py-2 rounded-full border-4 border-amber-900 font-black text-xl shadow-lg">
        {count} كارت
      </div>
    </div>
  );
}

export function Game() {
  const {
    players,
    settings,
    currentPlayerIndex,
    nextPlayer,
    updatePlayerScore,
    cardsPlayed,
    incrementCardsPlayed,
  } = useGame();
  const navigate = useNavigate();
  const {
    playCardFlip, playCorrect, playWrong,
    playTimerTick, playTimerUrgent, playWinner,
  } = useSoundManager();

  const [currentCard, setCurrentCard] = useState<Card | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [timeLeft, setTimeLeft] = useState(settings.timePerQuestion);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [deckCards, setDeckCards] = useState(settings.totalCards);
  const [isDealingCard, setIsDealingCard] = useState(false);
  const [dealCount, setDealCount] = useState(0);
  const prevTimeLeft = useRef(settings.timePerQuestion);

  useEffect(() => {
    if (players.length === 0) { navigate("/"); return; }
    const card = generateCard(settings.categories);
    setCurrentCard(card);
  }, []);

  // Timer countdown + tick sounds
  useEffect(() => {
    if (isTimerRunning && timeLeft > 0) {
      // Play sound only when timeLeft actually decreased (avoid double-fire)
      if (timeLeft < prevTimeLeft.current) {
        if (timeLeft <= 5) playTimerUrgent();
        else               playTimerTick();
      }
      prevTimeLeft.current = timeLeft;
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (isTimerRunning && timeLeft === 0) {
      handleTimeOut();
    }
  }, [timeLeft, isTimerRunning]);

  const handleCardClick = () => {
    if (!isFlipped) {
      playCardFlip();
      setIsFlipped(true);
      setTimeout(() => {
        setIsTimerRunning(true);
        prevTimeLeft.current = settings.timePerQuestion;
      }, 600);
    }
  };

  const handleTimeOut = () => {
    setIsTimerRunning(false);
    nextTurn();
  };

  const handleCorrect = () => {
    setIsTimerRunning(false);
    playCorrect();
    updatePlayerScore(players[currentPlayerIndex].id, 1);
    nextTurn();
  };

  const handleWrong = () => {
    setIsTimerRunning(false);
    playWrong();
    nextTurn();
  };

  const nextTurn = () => {
    incrementCardsPlayed();

    if (cardsPlayed + 1 >= settings.totalCards) {
      playWinner();
      setTimeout(() => navigate("/results"), 1000);
      return;
    }

    setIsFlipped(false);
    setTimeLeft(settings.timePerQuestion);
    prevTimeLeft.current = settings.timePerQuestion;
    setDeckCards((prev) => prev - 1);
    nextPlayer();
    setIsDealingCard(true);

    setTimeout(() => {
      const card = generateCard(settings.categories);
      setCurrentCard(card);
      setDealCount((prev) => prev + 1);
      setIsDealingCard(false);
    }, 500);
  };

  if (!currentCard || players.length === 0) {
    return null;
  }

  const currentPlayer = players[currentPlayerIndex];
  const progress = (timeLeft / settings.timePerQuestion) * 100;

  return (
    <div className="relative min-h-screen md:h-screen md:overflow-hidden game-background text-white flex flex-col">
      <LogoBackground />

      <div className="relative z-10 flex-1 min-h-0 container mx-auto px-4 py-4 md:py-0 md:overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 md:h-full md:items-center">
          {/* Left Side - Deck */}
          <div className="lg:col-span-2 flex flex-col items-center justify-center">
            <CardDeck count={deckCards} isDealing={isDealingCard} />
          </div>

          {/* Center - Card */}
          <div className="lg:col-span-7 flex flex-col items-center justify-center">
            <div className="mb-4 md:mb-3">
              <motion.div
                key={dealCount}
                className="relative w-80 h-96 cursor-pointer"
                onClick={handleCardClick}
                initial={isMobileDevice() ? false : { x: -70, opacity: 0, rotate: -4 }}
                animate={{ x: 0, opacity: 1, rotate: 0 }}
                transition={isMobileDevice() ? { duration: 0 } : { duration: 0.4, ease: "easeOut" }}
                style={{
                  transformStyle: "preserve-3d",
                  perspective: "1000px",
                }}
              >
                <motion.div
                  className="relative w-full h-full"
                  style={{ transformStyle: "preserve-3d" }}
                  animate={{ rotateY: isFlipped ? 180 : 0 }}
                  transition={{ duration: 0.6 }}
                >
                  {/* Front of Card - Question */}
                  <div
                    className="absolute w-full h-full rounded-3xl border-4 border-amber-900 shadow-2xl overflow-hidden"
                    style={{
                      backfaceVisibility: "hidden",
                      WebkitBackfaceVisibility: "hidden",
                      background:
                        "repeating-linear-gradient(45deg, #F59E0B, #F59E0B 10px, #FBBF24 10px, #FBBF24 20px)",
                    }}
                  >
                    <div className="w-full h-full flex flex-col items-center justify-center p-6 relative">
                      <div className="absolute top-4 left-4 text-5xl">📢</div>
                      <div className="absolute top-4 right-4 text-5xl">📢</div>

                      <div className="bg-white rounded-2xl p-6 border-4 border-amber-900 w-full flex flex-col items-center gap-3">
                        <span className="bg-amber-100 text-amber-800 font-black text-base px-4 py-1 rounded-full border-2 border-amber-400">
                          {currentCard.categoryIcon} {currentCard.categoryName}
                        </span>
                        <p className="text-4xl font-black text-amber-900 text-center leading-tight">
                          {currentCard.question}
                        </p>
                      </div>

                      <p className="mt-4 text-amber-900 font-bold text-sm opacity-70">
                        اضغط على الكارت لمعرفة الشرط
                      </p>

                      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-amber-900 text-white px-6 py-2 rounded-full font-black text-xl">
                        فـووق
                      </div>
                    </div>
                  </div>

                  {/* Back of Card - Condition */}
                  <div
                    className="absolute w-full h-full rounded-3xl border-4 border-amber-900 shadow-2xl overflow-hidden"
                    style={{
                      backfaceVisibility: "hidden",
                      WebkitBackfaceVisibility: "hidden",
                      transform: "rotateY(180deg)",
                      background:
                        "repeating-linear-gradient(45deg, #059669, #059669 10px, #10B981 10px, #10B981 20px)",
                    }}
                  >
                    <div className="w-full h-full flex flex-col items-center justify-center p-6 relative">
                      <div className="bg-white rounded-2xl p-6 border-4 border-amber-900 w-full flex flex-col items-center gap-3">
                        <span className="bg-emerald-100 text-emerald-800 font-black text-base px-4 py-1 rounded-full border-2 border-emerald-400">
                          {currentCard.categoryIcon} {currentCard.question}
                        </span>
                        <p className="text-3xl font-black text-emerald-900 text-center leading-relaxed">
                          {currentCard.condition}
                        </p>
                      </div>

                      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-amber-900 text-white px-6 py-2 rounded-full font-black text-xl">
                        فـووق
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </div>

            {/* Current Player */}
            <motion.div
              key={currentPlayer.id}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl px-8 py-4 border-4 border-amber-900 shadow-xl"
            >
              <p className="text-2xl font-black text-amber-900 text-center">
                دور اللاعب:{" "}
                <span className="text-white">{currentPlayer.name}</span>
              </p>
            </motion.div>

            {/* Action Buttons */}
            {isTimerRunning && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="flex gap-4 mt-6"
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCorrect}
                  className="px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xl rounded-2xl border-4 border-amber-900 shadow-lg"
                >
                  ✓ صح
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleWrong}
                  className="px-8 py-4 bg-red-500 hover:bg-red-600 text-white font-black text-xl rounded-2xl border-4 border-amber-900 shadow-lg"
                >
                  ✗ غلط
                </motion.button>
              </motion.div>
            )}
          </div>

          {/* Right Side - Logo, Timer & Scores */}
          <div className="lg:col-span-3 flex flex-col items-center gap-4">
            {/* Logo */}
            <div className="hidden lg:flex items-center justify-between w-full px-1">
              <motion.img
                src={logoImage}
                alt="فووق"
                className="w-20 h-20 object-contain"
                style={{ filter: "drop-shadow(0 4px 8px rgba(120,53,15,0.45))" }}
                animate={{ y: [0, -6, 0], rotate: [-2, 2, -2] }}
                transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
              />
              <SoundControls />
            </div>

            {/* Timer */}
            <div className="relative w-28 h-28">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="56" cy="56" r="48" stroke="#78350F" strokeWidth="8" fill="none" />
                <circle
                  cx="56" cy="56" r="48"
                  stroke={timeLeft <= 5 ? "#EF4444" : "#FBBF24"}
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 48}`}
                  strokeDashoffset={`${2 * Math.PI * 48 * (1 - progress / 100)}`}
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-3xl font-black ${timeLeft <= 5 ? "text-red-500" : "text-white"}`}>
                  {timeLeft}
                </span>
              </div>
            </div>

            {/* Scoreboard */}
            <div className="w-full bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl p-3 border-4 border-amber-900 shadow-xl">
              <h3 className="text-xl font-black text-amber-900 text-center mb-3">
                النتائج
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto game-scrollbar">
                {players.map((player, index) => (
                  <div
                    key={player.id}
                    className={`flex items-center justify-between p-2 rounded-xl border-2 ${
                      player.id === currentPlayer.id
                        ? "bg-emerald-500 border-emerald-700"
                        : "bg-white/90 border-amber-900"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`text-base font-black ${player.id === currentPlayer.id ? "text-white" : "text-amber-900"}`}>
                        {index + 1}.
                      </span>
                      <span className={`text-sm font-black truncate max-w-[80px] ${player.id === currentPlayer.id ? "text-white" : "text-amber-900"}`}>
                        {player.name}
                      </span>
                    </div>
                    <span className={`text-xl font-black ${player.id === currentPlayer.id ? "text-white" : "text-amber-900"}`}>
                      {player.score}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
