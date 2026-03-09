import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Wifi,
  Users,
  Plus,
  Copy,
  Check,
  ArrowRight,
  RotateCcw,
  Trophy,
  Clock,
  Layers,
  CheckCircle2,
  X,
  LogOut,
} from "lucide-react";
import { useNavigate } from "react-router";
import { Header } from "../components/Header";
import { SoundControls } from "../components/SoundControls";
import { QRCode } from "../components/QRCode";
import { useP2PMultiplayer } from "../../hooks/useP2PMultiplayer";
import logoImage from "../../assets/logo.svg";
import gameData from "../../data/data.json";

const CARD_OPTIONS = [20, 30, 50, 100];

// ─── Utility ────────────────────────────────────────────────────────────────
function PlayerBadge({
  name,
  score,
  isHost,
  isCurrent,
  isMe,
}: {
  name: string;
  score: number;
  isHost: boolean;
  isCurrent?: boolean;
  isMe?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between p-2 rounded-xl border-2 transition-all ${
        isCurrent
          ? "bg-emerald-500 border-emerald-700"
          : isMe
            ? "bg-amber-200 border-amber-500"
            : "bg-white/90 border-amber-900"
      }`}
    >
      <div className="flex items-center gap-2">
        {isHost && <span className="text-xs">👑</span>}
        <span
          className={`text-sm font-black truncate max-w-[90px] ${isCurrent ? "text-white" : "text-amber-900"}`}
        >
          {name}
          {isMe ? " (أنا)" : ""}
        </span>
      </div>
      <span
        className={`text-xl font-black ${isCurrent ? "text-white" : "text-amber-900"}`}
      >
        {score}
      </span>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export function MultiplayerPage() {
  const navigate = useNavigate();
  const mp = useP2PMultiplayer();

  const [view, setView] = useState<"landing" | "create" | "join">("landing");
  const [inputName, setInputName] = useState("");
  const [inputCode, setInputCode] = useState("");
  const [copied, setCopied] = useState(false);

  const phase = mp.roomState?.phase;

  // ── QR join URL ──────────────────────────────────────────────────────────
  const joinUrl = mp.myPeerId
    ? `${window.location.origin}/multiplayer?join=${mp.myPeerId}&code=${mp.roomState?.roomCode}`
    : "";

  const copyCode = () => {
    navigator.clipboard.writeText(joinUrl || mp.roomState?.roomCode || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Route by phase ───────────────────────────────────────────────────────
  if (mp.roomState) {
    if (phase === "lobby")
      return (
        <LobbyView
          mp={mp}
          joinUrl={joinUrl}
          copied={copied}
          onCopy={copyCode}
        />
      );
    if (phase === "settings") return <SettingsView mp={mp} />;
    if (phase === "game") return <GameView mp={mp} />;
    if (phase === "results") return <ResultsView mp={mp} />;
  }

  // ── Join via URL params ──────────────────────────────────────────────────
  if (view === "landing") {
    const params = new URLSearchParams(window.location.search);
    const autoJoinId = params.get("join");
    const autoJoinCode = params.get("code");

    if (autoJoinId && view === "landing") {
      return (
        <div className="min-h-screen game-background text-white flex flex-col">
          <Header />
          <div className="flex-1 flex items-center justify-center px-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl p-8 border-4 border-amber-900 shadow-2xl w-full max-w-md"
            >
              <h2 className="text-3xl font-black text-amber-900 text-center mb-2">
                انضم للغرفة
              </h2>
              {autoJoinCode && (
                <p className="text-amber-900 font-bold text-center mb-6">
                  كود الغرفة:{" "}
                  <span className="text-2xl font-black">{autoJoinCode}</span>
                </p>
              )}
              {mp.error && <ErrorBanner msg={mp.error} />}
              <div className="bg-white/90 rounded-2xl p-6 border-4 border-amber-900 space-y-4">
                <input
                  type="text"
                  value={inputName}
                  onChange={(e) => setInputName(e.target.value)}
                  placeholder="اكتب اسمك"
                  className="w-full px-4 py-3 rounded-xl border-4 border-amber-900 text-amber-900 font-bold text-lg focus:outline-none"
                />
                <GreenButton
                  disabled={!inputName.trim() || mp.status === "joining"}
                  onClick={() => mp.joinRoom(autoJoinId, inputName.trim())}
                >
                  {mp.status === "joining"
                    ? "⏳ جاري الاتصال..."
                    : "انضم للغرفة"}
                </GreenButton>
              </div>
            </motion.div>
          </div>
        </div>
      );
    }
  }

  // ── Create form ──────────────────────────────────────────────────────────
  if (view === "create") {
    return (
      <div className="min-h-screen game-background text-white flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center px-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl p-8 border-4 border-amber-900 shadow-2xl w-full max-w-md"
          >
            <h2 className="text-3xl font-black text-amber-900 text-center mb-6">
              إنشاء غرفة
            </h2>
            {mp.error && <ErrorBanner msg={mp.error} />}
            <div className="bg-white/90 rounded-2xl p-6 border-4 border-amber-900 space-y-4">
              <input
                type="text"
                value={inputName}
                onChange={(e) => setInputName(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" &&
                  inputName.trim() &&
                  mp.createRoom(inputName.trim())
                }
                placeholder="اسمك (المضيف)"
                className="w-full px-4 py-3 rounded-xl border-4 border-amber-900 text-amber-900 font-bold text-lg focus:outline-none"
              />
              <GreenButton
                disabled={
                  !inputName.trim() ||
                  mp.status === "initializing" ||
                  mp.status === "hosting"
                }
                onClick={() => mp.createRoom(inputName.trim())}
              >
                {mp.status === "initializing" || mp.status === "hosting"
                  ? "⏳ جاري الإنشاء..."
                  : "إنشاء الغرفة"}
              </GreenButton>
            </div>
            <BackButton onClick={() => setView("landing")} />
          </motion.div>
        </div>
      </div>
    );
  }

  // ── Join form ────────────────────────────────────────────────────────────
  if (view === "join") {
    return (
      <div className="min-h-screen game-background text-white flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center px-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl p-8 border-4 border-amber-900 shadow-2xl w-full max-w-md"
          >
            <h2 className="text-3xl font-black text-amber-900 text-center mb-6">
              الانضمام لغرفة
            </h2>
            {mp.error && <ErrorBanner msg={mp.error} />}
            <div className="bg-white/90 rounded-2xl p-6 border-4 border-amber-900 space-y-4">
              <input
                type="text"
                value={inputName}
                onChange={(e) => setInputName(e.target.value)}
                placeholder="اسمك"
                className="w-full px-4 py-3 rounded-xl border-4 border-amber-900 text-amber-900 font-bold text-lg focus:outline-none"
              />
              <input
                type="text"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                placeholder="الكود أو الرابط الكامل"
                className="w-full px-4 py-3 rounded-xl border-4 border-amber-900 text-amber-900 font-bold text-base focus:outline-none"
              />
              <GreenButton
                disabled={
                  !inputName.trim() ||
                  !inputCode.trim() ||
                  mp.status === "joining"
                }
                onClick={() => {
                  const raw = inputCode.trim();
                  let peerId = raw;
                  try {
                    const url = new URL(raw);
                    const fromUrl = url.searchParams.get("join");
                    if (fromUrl) peerId = fromUrl;
                  } catch {
                    /* not a URL, use raw as peer ID */
                  }
                  mp.joinRoom(peerId, inputName.trim());
                }}
              >
                {mp.status === "joining" ? "⏳ جاري الاتصال..." : "انضم"}
              </GreenButton>
            </div>
            <BackButton onClick={() => setView("landing")} />
          </motion.div>
        </div>
      </div>
    );
  }

  // ── Landing ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen game-background text-white flex flex-col">
      <Header />
      <div className="flex-1 flex items-center justify-center px-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl p-8 border-4 border-amber-900 shadow-2xl w-full max-w-lg"
          style={{ boxShadow: "0 10px 0 rgba(120,53,15,0.5)" }}
        >
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-amber-900 rounded-full flex items-center justify-center mx-auto mb-3 border-4 border-amber-700">
              <Wifi className="w-10 h-10 text-amber-400" />
            </div>
            <h2 className="text-3xl font-black text-amber-900">لعب شبكي</h2>
            <p className="text-amber-900 font-bold mt-1">
              كل لاعب على جهازه — نفس الشبكة
            </p>
          </div>

          <div className="space-y-4">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setView("create")}
              className="w-full py-5 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-2xl rounded-2xl border-4 border-amber-900 shadow-lg flex items-center justify-center gap-3"
            >
              <Plus className="w-7 h-7" />
              إنشاء غرفة (مضيف)
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setView("join")}
              className="w-full py-5 bg-amber-900 hover:bg-amber-800 text-white font-black text-2xl rounded-2xl border-4 border-amber-700 shadow-lg flex items-center justify-center gap-3"
            >
              <Users className="w-7 h-7" />
              الانضمام (مسح QR أو كود)
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/")}
              className="w-full py-3 bg-white/70 text-amber-900 font-black text-lg rounded-2xl border-4 border-amber-900"
            >
              ← رجوع للرئيسية
            </motion.button>
          </div>

          <div className="mt-6 bg-amber-900/30 rounded-2xl p-4 text-sm text-amber-900 font-bold">
            <p className="font-black mb-1">📶 للعب أوفلاين:</p>
            <p>شغّل Hotspot، الكل يتصل، المضيف ينشئ الغرفة وبيطلع QR.</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ─── Lobby ───────────────────────────────────────────────────────────────────
function LobbyView({
  mp,
  joinUrl,
  copied,
  onCopy,
}: {
  mp: ReturnType<typeof useP2PMultiplayer>;
  joinUrl: string;
  copied: boolean;
  onCopy: () => void;
}) {
  const { roomState, isHost } = mp;
  if (!roomState) return null;

  return (
    <div className="min-h-screen game-background text-white">
      <Header />
      <div className="container mx-auto px-4 pb-12 max-w-2xl">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl p-8 border-4 border-amber-900 shadow-2xl"
          style={{ boxShadow: "0 10px 0 rgba(120,53,15,0.5)" }}
        >
          <div className="text-center mb-6">
            <h2 className="text-3xl font-black text-amber-900">
              انتظار اللاعبين
            </h2>
            <p className="text-amber-900 font-bold mt-1">
              {isHost
                ? "شارك الـ QR أو الكود مع أصدقائك"
                : "في انتظار بدء اللعبة..."}
            </p>
          </div>

          {isHost && (
            <div className="flex flex-col items-center gap-4 mb-6">
              {/* QR Code */}
              <div className="bg-amber-50 rounded-2xl p-4 border-4 border-amber-900">
                <QRCode value={joinUrl} size={200} />
                <p className="text-amber-900 font-bold text-center text-sm mt-2">
                  امسح الـ QR للانضمام مباشرةً
                </p>
              </div>

              {/* Room code */}
              <div className="w-full bg-amber-900 rounded-2xl p-4 border-4 border-amber-700 text-center">
                <p className="text-amber-300 font-bold text-sm mb-1">
                  أو شارك الرابط يدوياً
                </p>
                <div className="flex items-center justify-center gap-3">
                  <span className="text-5xl font-black text-white tracking-widest">
                    {roomState.roomCode}
                  </span>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={onCopy}
                    className="bg-amber-500 hover:bg-amber-400 text-white p-3 rounded-xl border-2 border-amber-300"
                    title="نسخ الرابط الكامل"
                  >
                    {copied ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <Copy className="w-5 h-5" />
                    )}
                  </motion.button>
                </div>
                <p className="text-amber-400 text-xs mt-2">
                  {copied ? "✓ تم نسخ الرابط" : "اضغط لنسخ رابط الدعوة"}
                </p>
              </div>
            </div>
          )}

          {/* Players */}
          <div className="bg-white/90 rounded-2xl p-4 border-4 border-amber-900 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-5 h-5 text-amber-900" />
              <h3 className="font-black text-amber-900">
                اللاعبون ({roomState.players.length})
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {roomState.players.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className={`flex items-center gap-2 p-3 rounded-xl border-2 ${
                    !p.connected
                      ? "bg-gray-100 border-gray-300 opacity-60"
                      : p.isHost
                        ? "bg-amber-100 border-amber-500"
                        : "bg-emerald-50 border-emerald-400"
                  }`}
                >
                  <span className="text-2xl font-black text-amber-900">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-black text-amber-900 text-sm">
                      {p.name}
                    </p>
                    <p className="text-xs font-bold text-amber-600">
                      {p.isHost
                        ? "👑 مضيف"
                        : p.connected
                          ? "✅ متصل"
                          : "⚠️ منقطع"}
                    </p>
                  </div>
                </motion.div>
              ))}
              {roomState.players.length < 2 && (
                <div className="flex items-center gap-2 p-3 rounded-xl border-2 border-dashed border-amber-300 bg-amber-50/50">
                  <Plus className="w-5 h-5 text-amber-400" />
                  <p className="text-amber-400 text-sm font-bold">
                    في انتظار لاعب...
                  </p>
                </div>
              )}
            </div>
          </div>

          {isHost && (
            <GreenButton
              disabled={roomState.players.length < 2}
              onClick={mp.goToSettings}
            >
              <ArrowRight className="w-6 h-6" />
              الانتقال للإعدادات
            </GreenButton>
          )}
          {!isHost && (
            <div className="text-center bg-amber-900/50 rounded-2xl p-4">
              <p className="text-white font-black text-lg">
                ⏳ في انتظار المضيف...
              </p>
            </div>
          )}

          <button
            onClick={mp.leaveRoom}
            className="w-full mt-4 flex items-center justify-center gap-2 text-amber-900 font-bold underline"
          >
            <LogOut className="w-4 h-4" /> مغادرة الغرفة
          </button>
        </motion.div>
      </div>
    </div>
  );
}

// ─── Settings ────────────────────────────────────────────────────────────────
function SettingsView({ mp }: { mp: ReturnType<typeof useP2PMultiplayer> }) {
  const { roomState, isHost } = mp;
  if (!roomState) return null;
  const { settings } = roomState;

  const toggle = (id: string) => {
    if (!isHost) return;
    const cats = settings.categories.includes(id)
      ? settings.categories.filter((c) => c !== id)
      : [...settings.categories, id];
    mp.updateSettings({ categories: cats });
  };

  return (
    <div className="min-h-screen game-background text-white">
      <Header />
      <div className="container mx-auto px-4 pb-12 max-w-4xl space-y-6">
        {!isHost && (
          <div className="bg-amber-900/60 rounded-2xl p-4 text-center border-4 border-amber-700">
            <p className="text-white font-black text-lg">
              ⏳ المضيف يضبط الإعدادات...
            </p>
          </div>
        )}

        {/* Categories */}
        <motion.div
          initial={{ x: -60, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl p-6 border-4 border-amber-900 shadow-2xl"
          style={{ boxShadow: "0 10px 0 rgba(120,53,15,0.5)" }}
        >
          <SectionHeader icon={<Layers />} title="أنواع الأسئلة" />
          <div className="max-h-80 overflow-y-auto game-scrollbar">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {gameData.categories.map((cat) => {
                const sel = settings.categories.includes(cat.id);
                return (
                  <motion.button
                    key={cat.id}
                    whileHover={{ scale: isHost ? 1.05 : 1 }}
                    whileTap={{ scale: isHost ? 0.95 : 1 }}
                    onClick={() => toggle(cat.id)}
                    disabled={!isHost}
                    className={`relative py-3 px-3 rounded-2xl border-4 border-amber-900 flex flex-col items-center gap-1 transition-all ${sel ? "bg-emerald-500 text-white" : "bg-white/90 text-amber-900"} ${!isHost ? "cursor-default" : ""}`}
                  >
                    <span className="text-2xl">{cat.icon}</span>
                    <span className="text-sm font-black leading-tight text-center">
                      {cat.name}
                    </span>
                    {sel && (
                      <CheckCircle2 className="absolute top-1 left-1 w-5 h-5 text-white" />
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Time */}
        <motion.div
          initial={{ x: 60, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl p-6 border-4 border-amber-900 shadow-2xl"
          style={{ boxShadow: "0 10px 0 rgba(120,53,15,0.5)" }}
        >
          <SectionHeader icon={<Clock />} title="وقت السؤال" />
          <div className="flex flex-col items-center gap-4">
            <div className="w-28 h-28 rounded-full border-8 border-amber-900 flex flex-col items-center justify-center bg-amber-900 shadow-xl">
              <span className="text-4xl font-black text-white">
                {settings.timePerQuestion}
              </span>
              <span className="text-sm font-bold text-amber-300">ثانية</span>
            </div>
            {isHost && (
              <div className="w-full px-4">
                <div className="flex justify-between text-amber-900 font-black text-sm mb-2">
                  <span>100</span>
                  <span>0</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={settings.timePerQuestion}
                  onChange={(e) =>
                    mp.updateSettings({
                      timePerQuestion: Number(e.target.value),
                    })
                  }
                  className="game-slider w-full"
                  style={
                    {
                      "--track-empty": `${100 - settings.timePerQuestion}%`,
                    } as React.CSSProperties
                  }
                />
                <div className="flex justify-between mt-2">
                  {[0, 25, 50, 75, 100].map((t) => (
                    <button
                      key={t}
                      onClick={() => mp.updateSettings({ timePerQuestion: t })}
                      className={`text-xs font-black px-2 py-1 rounded-lg border-2 border-amber-900 ${settings.timePerQuestion === t ? "bg-amber-900 text-white" : "bg-white/70 text-amber-900"}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Cards count */}
        <motion.div
          initial={{ x: -60, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl p-6 border-4 border-amber-900 shadow-2xl"
          style={{ boxShadow: "0 10px 0 rgba(120,53,15,0.5)" }}
        >
          <SectionHeader icon={<Layers />} title="عدد الكروت" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {CARD_OPTIONS.map((n) => (
              <motion.button
                key={n}
                whileHover={{ scale: isHost ? 1.05 : 1 }}
                whileTap={{ scale: isHost ? 0.95 : 1 }}
                onClick={() => isHost && mp.updateSettings({ totalCards: n })}
                disabled={!isHost}
                className={`py-4 rounded-2xl border-4 border-amber-900 font-black text-lg transition-all ${settings.totalCards === n ? "bg-emerald-500 text-white" : "bg-white/90 text-amber-900"}`}
              >
                {n} كارت
              </motion.button>
            ))}
          </div>
        </motion.div>

        {isHost && (
          <motion.button
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: settings.categories.length > 0 ? 1.03 : 1 }}
            whileTap={{ scale: 0.97 }}
            onClick={mp.startGame}
            disabled={settings.categories.length === 0}
            className={`w-full py-6 text-3xl font-black rounded-3xl border-4 border-amber-900 shadow-2xl ${settings.categories.length > 0 ? "bg-emerald-500 hover:bg-emerald-600 text-white" : "bg-gray-400 text-gray-600 cursor-not-allowed"}`}
            style={{ boxShadow: "0 8px 0 rgba(120,53,15,0.5)" }}
          >
            ابدأ اللعبة 🎮
          </motion.button>
        )}
      </div>
    </div>
  );
}

// ─── Game ─────────────────────────────────────────────────────────────────────
function GameView({ mp }: { mp: ReturnType<typeof useP2PMultiplayer> }) {
  const { roomState, isHost, isMyTurn, myPlayer } = mp;
  if (!roomState) return null;
  const {
    currentCard,
    cardFlipped,
    timerRunning,
    timeLeft,
    settings,
    players,
  } = roomState;
  const currentPlayer = players[roomState.currentPlayerIndex];
  const progress =
    settings.timePerQuestion > 0
      ? (timeLeft / settings.timePerQuestion) * 100
      : 100;
  const canFlip = (isMyTurn || isHost) && !cardFlipped;

  return (
    <div className="relative min-h-screen md:h-screen md:overflow-hidden game-background text-white flex flex-col">
      <div className="relative z-10 flex-1 container mx-auto px-4 py-4 md:py-0">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 md:h-full md:items-center">
          {/* Left */}
          <div className="lg:col-span-2 flex flex-col items-center justify-center gap-3">
            <div className="bg-amber-500 text-white px-5 py-3 rounded-full border-4 border-amber-900 font-black text-xl shadow-lg text-center">
              {settings.totalCards - roomState.cardsPlayed} كارت
            </div>
            <p className="text-amber-200 font-bold text-sm text-center">
              {roomState.cardsPlayed + 1}/{settings.totalCards}
            </p>
          </div>

          {/* Center — Card */}
          <div className="lg:col-span-7 flex flex-col items-center justify-center">
            <div className="mb-4">
              <motion.div
                className={`relative w-80 h-96 ${canFlip ? "cursor-pointer" : ""}`}
                onClick={() => canFlip && mp.flipCard()}
                style={{ transformStyle: "preserve-3d", perspective: "1000px" }}
              >
                <motion.div
                  className="relative w-full h-full"
                  style={{ transformStyle: "preserve-3d" }}
                  animate={{ rotateY: cardFlipped ? 180 : 0 }}
                  transition={{ duration: 0.6 }}
                >
                  {/* Front */}
                  <div
                    className="absolute w-full h-full rounded-3xl border-4 border-amber-900 shadow-2xl overflow-hidden"
                    style={{
                      backfaceVisibility: "hidden",
                      WebkitBackfaceVisibility: "hidden",
                      background:
                        "repeating-linear-gradient(45deg,#F59E0B,#F59E0B 10px,#FBBF24 10px,#FBBF24 20px)",
                    }}
                  >
                    <div className="w-full h-full flex flex-col items-center justify-center p-6">
                      <div className="bg-white rounded-2xl p-6 border-4 border-amber-900 w-full flex flex-col items-center gap-3">
                        <span className="bg-amber-100 text-amber-800 font-black text-base px-4 py-1 rounded-full border-2 border-amber-400">
                          {currentCard?.categoryIcon}{" "}
                          {currentCard?.categoryName}
                        </span>
                        <p className="text-4xl font-black text-amber-900 text-center leading-tight">
                          {currentCard?.question}
                        </p>
                      </div>
                      <p className="mt-4 text-amber-900 font-bold text-sm opacity-70">
                        {canFlip
                          ? "اضغط على الكارت لمعرفة الشرط"
                          : `⏳ دور ${currentPlayer?.name}`}
                      </p>
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-amber-900 text-white px-6 py-2 rounded-full font-black text-xl">
                        فـووق
                      </div>
                    </div>
                  </div>

                  {/* Back */}
                  <div
                    className="absolute w-full h-full rounded-3xl border-4 border-amber-900 shadow-2xl overflow-hidden"
                    style={{
                      backfaceVisibility: "hidden",
                      WebkitBackfaceVisibility: "hidden",
                      transform: "rotateY(180deg)",
                      background:
                        "repeating-linear-gradient(45deg,#059669,#059669 10px,#10B981 10px,#10B981 20px)",
                    }}
                  >
                    <div className="w-full h-full flex flex-col items-center justify-center p-6">
                      <div className="bg-white rounded-2xl p-6 border-4 border-amber-900 w-full flex flex-col items-center gap-3">
                        <span className="bg-emerald-100 text-emerald-800 font-black text-base px-4 py-1 rounded-full border-2 border-emerald-400">
                          {currentCard?.categoryIcon} {currentCard?.question}
                        </span>
                        <p className="text-3xl font-black text-emerald-900 text-center leading-relaxed">
                          {currentCard?.condition}
                        </p>
                      </div>
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-amber-900 text-white px-6 py-2 rounded-full font-black text-xl">
                        فـووق
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </div>

            {/* Current player */}
            <motion.div
              key={currentPlayer?.id}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`rounded-2xl px-8 py-4 border-4 border-amber-900 shadow-xl ${isMyTurn ? "bg-emerald-500" : "bg-gradient-to-br from-amber-400 to-orange-500"}`}
            >
              <p className="text-2xl font-black text-amber-900 text-center">
                {isMyTurn ? (
                  "🎯 دورك أنت!"
                ) : (
                  <>
                    دور:{" "}
                    <span className="text-white">{currentPlayer?.name}</span>
                  </>
                )}
              </p>
            </motion.div>

            {/* Host buttons */}
            {isHost && cardFlipped && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="flex gap-4 mt-6"
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={mp.markCorrect}
                  className="px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xl rounded-2xl border-4 border-amber-900 shadow-lg"
                >
                  ✓ صح
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={mp.markWrong}
                  className="px-8 py-4 bg-red-500 hover:bg-red-600 text-white font-black text-xl rounded-2xl border-4 border-amber-900 shadow-lg"
                >
                  ✗ غلط
                </motion.button>
              </motion.div>
            )}

            {myPlayer && (
              <div className="mt-3 bg-amber-900/50 rounded-xl px-4 py-2">
                <p className="text-amber-200 text-sm font-bold text-center">
                  أنت: {myPlayer.name} — {myPlayer.score} نقطة
                </p>
              </div>
            )}
          </div>

          {/* Right — Timer + Scores */}
          <div className="lg:col-span-3 flex flex-col items-center gap-4">
            <div className="hidden lg:flex items-center justify-between w-full px-1">
              <motion.img
                src={logoImage}
                alt="فووق"
                className="w-20 h-20 object-contain"
                style={{
                  filter: "drop-shadow(0 4px 8px rgba(120,53,15,0.45))",
                }}
                animate={{ y: [0, -6, 0] }}
                transition={{
                  duration: 2.8,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              <SoundControls />
            </div>

            {settings.timePerQuestion > 0 && (
              <div className="relative w-28 h-28">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="56"
                    cy="56"
                    r="48"
                    stroke="#78350F"
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="56"
                    cy="56"
                    r="48"
                    stroke={timeLeft <= 5 ? "#EF4444" : "#FBBF24"}
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 48}`}
                    strokeDashoffset={`${2 * Math.PI * 48 * (1 - progress / 100)}`}
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span
                    className={`text-3xl font-black ${timeLeft <= 5 ? "text-red-500" : "text-white"}`}
                  >
                    {timeLeft}
                  </span>
                </div>
              </div>
            )}

            <div className="w-full bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl p-3 border-4 border-amber-900 shadow-xl">
              <h3 className="text-xl font-black text-amber-900 text-center mb-3">
                النتائج
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto game-scrollbar">
                {[...players]
                  .sort((a, b) => b.score - a.score)
                  .map((p) => (
                    <PlayerBadge
                      key={p.id}
                      name={p.name}
                      score={p.score}
                      isHost={p.isHost}
                      isCurrent={p.id === currentPlayer?.id}
                      isMe={p.id === myPlayer?.id}
                    />
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Results ──────────────────────────────────────────────────────────────────
function ResultsView({ mp }: { mp: ReturnType<typeof useP2PMultiplayer> }) {
  const { roomState, isHost } = mp;
  if (!roomState) return null;
  const sorted = [...roomState.players].sort((a, b) => b.score - a.score);
  const winner = sorted[0];
  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="min-h-screen game-background text-white relative overflow-hidden">
      {/* Confetti */}
      {Array.from({ length: 40 }, (_, i) => (
        <motion.div
          key={i}
          className="absolute w-3 h-3 rounded-full pointer-events-none"
          style={{
            left: `${(i * 2.5) % 100}%`,
            top: "-20px",
            backgroundColor: ["#F59E0B", "#FBBF24", "#10B981", "#EF4444"][
              i % 4
            ],
          }}
          animate={{ y: "110vh", rotate: 360, opacity: [1, 0] }}
          transition={{
            duration: 3 + (i % 3),
            delay: (i % 20) * 0.1,
            ease: "linear",
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
          <h2
            className="text-5xl font-black text-amber-400 text-center"
            style={{ textShadow: "3px 3px 0 #D97706" }}
          >
            انتهت اللعبة!
          </h2>

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-500 rounded-3xl p-8 border-4 border-amber-900 text-center"
          >
            <Trophy className="w-20 h-20 text-amber-900 mx-auto mb-4" />
            <h3 className="text-3xl font-black text-amber-900 mb-2">الفائز</h3>
            <motion.p
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="text-6xl font-black text-white"
              style={{ textShadow: "3px 3px 0 #78350F" }}
            >
              {winner?.name}
            </motion.p>
            <p className="text-4xl font-black text-amber-900 mt-2">
              {winner?.score} نقطة
            </p>
          </motion.div>

          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl p-6 border-4 border-amber-900"
          >
            <h3 className="text-3xl font-black text-amber-900 text-center mb-4">
              ترتيب اللاعبين
            </h3>
            <div className="space-y-3">
              {sorted.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ x: -80, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.5 + i * 0.08 }}
                  className={`flex items-center justify-between p-4 rounded-2xl border-4 ${
                    i === 0
                      ? "bg-gradient-to-r from-yellow-300 to-amber-400 border-yellow-600"
                      : i === 1
                        ? "bg-gradient-to-r from-gray-300 to-gray-400 border-gray-600"
                        : i === 2
                          ? "bg-gradient-to-r from-orange-300 to-orange-400 border-orange-600"
                          : "bg-white/90 border-amber-900"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-4xl">{medals[i] ?? "🏅"}</span>
                    <span className="text-2xl font-black text-amber-900">
                      {i + 1}. {p.name}
                    </span>
                  </div>
                  <span className="text-3xl font-black text-amber-900">
                    {p.score} نقطة
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {isHost ? (
            <motion.button
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8 }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={mp.playAgain}
              className="w-full py-5 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-2xl rounded-2xl border-4 border-amber-900 flex items-center justify-center gap-3"
              style={{ boxShadow: "0 6px 0 rgba(120,53,15,0.5)" }}
            >
              <RotateCcw className="w-7 h-7" /> إعادة اللعب
            </motion.button>
          ) : (
            <div className="space-y-3">
              <div className="text-center bg-amber-900/50 rounded-2xl p-4">
                <p className="text-white font-black text-lg">
                  ⏳ في انتظار المضيف...
                </p>
              </div>
              <motion.button
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1 }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => { mp.leaveRoom(); window.location.href = "/"; }}
                className="w-full py-4 bg-white/80 text-amber-900 font-black text-xl rounded-2xl border-4 border-amber-900 flex items-center justify-center gap-3"
              >
                <LogOut className="w-6 h-6" /> رجوع للرئيسية
              </motion.button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

// ─── Small reusable bits ──────────────────────────────────────────────────────
function SectionHeader({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <div className="flex items-center justify-center gap-3 mb-6">
      <span className="w-8 h-8 text-amber-900">{icon}</span>
      <h2 className="text-3xl font-black text-amber-900">{title}</h2>
    </div>
  );
}

function GreenButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.03 }}
      whileTap={{ scale: disabled ? 1 : 0.97 }}
      onClick={onClick}
      disabled={disabled}
      className={`w-full py-4 text-2xl font-black rounded-2xl border-4 border-amber-900 flex items-center justify-center gap-3 ${
        disabled
          ? "bg-gray-400 text-gray-600 cursor-not-allowed"
          : "bg-emerald-500 hover:bg-emerald-600 text-white"
      }`}
      style={{ boxShadow: disabled ? "none" : "0 6px 0 rgba(120,53,15,0.5)" }}
    >
      {children}
    </motion.button>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full mt-4 text-amber-900 font-bold underline text-center block"
    >
      ← رجوع
    </button>
  );
}

function ErrorBanner({ msg }: { msg: string }) {
  return (
    <div className="bg-red-100 border-4 border-red-500 rounded-2xl p-3 mb-4 text-center text-red-700 font-bold text-sm">
      ⚠️ {msg}
    </div>
  );
}
