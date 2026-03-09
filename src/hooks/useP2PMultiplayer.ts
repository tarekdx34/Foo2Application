/**
 * useP2PMultiplayer
 * Pure frontend P2P multiplayer using PeerJS (WebRTC data channels).
 * Host holds the authoritative game state and broadcasts to all peers.
 * Peers send actions to host; host validates and rebroadcasts state.
 *
 * No backend required — works on local WiFi/hotspot via PeerJS public STUN/TURN,
 * or can use a local PeerJS server for true offline play.
 */
import { useState, useEffect, useCallback, useRef } from "react";
import Peer, { DataConnection } from "peerjs";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface P2PPlayer {
  id: string; // peerId
  name: string;
  score: number;
  isHost: boolean;
  connected: boolean;
}

export interface P2PSettings {
  categories: string[];
  timePerQuestion: number;
  totalCards: number;
}

export interface P2PCard {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  question: string;
  condition: string;
}

export type GamePhase = "lobby" | "settings" | "game" | "results";

export interface P2PRoomState {
  roomCode: string; // host's peerId (short)
  hostId: string;
  phase: GamePhase;
  players: P2PPlayer[];
  settings: P2PSettings;
  currentPlayerIndex: number;
  cardsPlayed: number;
  currentCard: P2PCard | null;
  cardFlipped: boolean;
  timerRunning: boolean;
  timeLeft: number;
}

type MessageType =
  | { type: "join_request"; name: string }
  | { type: "join_accepted"; state: P2PRoomState; yourId: string }
  | { type: "join_rejected"; reason: string }
  | { type: "state_update"; state: P2PRoomState }
  | { type: "action"; action: P2PAction }
  | { type: "peer_disconnected"; peerId: string };

export type P2PAction =
  | { kind: "update_settings"; settings: Partial<P2PSettings> }
  | { kind: "go_settings" }
  | { kind: "start_game" }
  | { kind: "flip_card" }
  | { kind: "correct" }
  | { kind: "wrong" }
  | { kind: "play_again" };

// ─── Game logic (runs on host) ────────────────────────────────────────────────
import gameData from "../data/data.json";

function generateCard(categoryIds: string[]): P2PCard {
  const available = gameData.categories.filter((c) =>
    categoryIds.includes(c.id),
  );
  const category = available[Math.floor(Math.random() * available.length)];
  const question =
    category.questions[Math.floor(Math.random() * category.questions.length)];
  const pool = [...gameData.conditions, ...question.extraConditions];
  const conditionDef = pool[Math.floor(Math.random() * pool.length)] as {
    type: string;
    template?: string;
    text?: string;
  };
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

// ─── Hook ─────────────────────────────────────────────────────────────────────

export type P2PStatus =
  | "idle"
  | "initializing"
  | "ready"
  | "hosting"
  | "joining"
  | "in_room"
  | "error";

const DEFAULT_SETTINGS: P2PSettings = {
  categories: gameData.categories.slice(0, 4).map((c) => c.id),
  timePerQuestion: 15,
  totalCards: 30,
};

export function useP2PMultiplayer() {
  const [status, setStatus] = useState<P2PStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [myPeerId, setMyPeerId] = useState<string | null>(null);
  const [roomState, setRoomState] = useState<P2PRoomState | null>(null);
  const [myName, setMyName] = useState<string>("");

  const peerRef = useRef<Peer | null>(null);
  // Host: map of peerId -> DataConnection
  const connectionsRef = useRef<Map<string, DataConnection>>(new Map());
  // Guest: single connection to host
  const hostConnRef = useRef<DataConnection | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stateRef = useRef<P2PRoomState | null>(null);

  // Keep stateRef in sync
  useEffect(() => {
    stateRef.current = roomState;
  }, [roomState]);

  const isHost = roomState?.hostId === myPeerId;

  // ── Broadcast (host only) ─────────────────────────────────────────────────
  const broadcastState = useCallback((state: P2PRoomState) => {
    const msg: MessageType = { type: "state_update", state };
    connectionsRef.current.forEach((conn) => {
      if (conn.open) conn.send(msg);
    });
    setRoomState(state);
  }, []);

  // ── Host: handle incoming action ──────────────────────────────────────────
  const handleAction = useCallback(
    (action: P2PAction, fromPeerId: string) => {
      const state = stateRef.current;
      if (!state) return;

      // Only host processes actions
      const isCurrentPlayer =
        state.players[state.currentPlayerIndex]?.id === fromPeerId;
      const senderIsHost = fromPeerId === state.hostId;

      let next = { ...state, players: state.players.map((p) => ({ ...p })) };

      if (action.kind === "update_settings" && senderIsHost) {
        next.settings = { ...next.settings, ...action.settings };
      } else if (action.kind === "go_settings" && senderIsHost) {
        next.phase = "settings";
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      } else if (action.kind === "start_game" && senderIsHost) {
        if (next.settings.categories.length === 0) return;
        next.phase = "game";
        next.cardsPlayed = 0;
        next.currentPlayerIndex = 0;
        next.players = next.players.map((p) => ({ ...p, score: 0 }));
        next.currentCard = generateCard(next.settings.categories);
        next.cardFlipped = false;
        next.timeLeft = next.settings.timePerQuestion;
        next.timerRunning = false;
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      } else if (
        action.kind === "flip_card" &&
        (isCurrentPlayer || senderIsHost) &&
        !next.cardFlipped
      ) {
        next.cardFlipped = true;
        next.timerRunning = next.settings.timePerQuestion > 0;
        next.timeLeft = next.settings.timePerQuestion;

        // Start timer on host
        if (timerRef.current) clearInterval(timerRef.current);
        if (next.settings.timePerQuestion > 0) {
          timerRef.current = setInterval(() => {
            const s = stateRef.current;
            if (!s || !s.timerRunning) {
              clearInterval(timerRef.current!);
              return;
            }
            const newTime = s.timeLeft - 1;
            if (newTime <= 0) {
              clearInterval(timerRef.current!);
              timerRef.current = null;
              handleAction({ kind: "wrong" }, s.hostId); // timeout = wrong
            } else {
              const updated = { ...s, timeLeft: newTime };
              broadcastState(updated);
            }
          }, 1000);
        }
      } else if (
        (action.kind === "correct" || action.kind === "wrong") &&
        senderIsHost
      ) {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        next.timerRunning = false;

        if (action.kind === "correct") {
          const p = next.players[next.currentPlayerIndex];
          if (p) p.score += 1;
        }

        next.cardsPlayed += 1;
        if (next.cardsPlayed >= next.settings.totalCards) {
          next.phase = "results";
        } else {
          next.currentPlayerIndex =
            (next.currentPlayerIndex + 1) % next.players.length;
          next.currentCard = generateCard(next.settings.categories);
          next.cardFlipped = false;
          next.timeLeft = next.settings.timePerQuestion;
        }
      } else if (action.kind === "play_again" && senderIsHost) {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        next.phase = "settings";
        next.cardsPlayed = 0;
        next.currentCard = null;
        next.cardFlipped = false;
        next.timerRunning = false;
        next.players = next.players.map((p) => ({ ...p, score: 0 }));
      } else {
        return; // unauthorized or invalid action
      }

      broadcastState(next);
    },
    [broadcastState],
  );

  // ── Setup incoming connection (host side) ─────────────────────────────────
  const setupHostConnection = useCallback(
    (conn: DataConnection) => {
      conn.on("open", () => {
        connectionsRef.current.set(conn.peer, conn);
      });

      conn.on("data", (raw) => {
        const msg = raw as MessageType;
        const state = stateRef.current;
        if (!state) return;

        if (msg.type === "join_request") {
          if (state.phase !== "lobby") {
            conn.send({
              type: "join_rejected",
              reason: "اللعبة بدأت بالفعل",
            } satisfies MessageType);
            return;
          }
          const newPlayer: P2PPlayer = {
            id: conn.peer,
            name: msg.name,
            score: 0,
            isHost: false,
            connected: true,
          };
          const next = { ...state, players: [...state.players, newPlayer] };
          conn.send({
            type: "join_accepted",
            state: next,
            yourId: conn.peer,
          } satisfies MessageType);
          broadcastState(next);
        } else if (msg.type === "action") {
          handleAction(msg.action, conn.peer);
        }
      });

      conn.on("close", () => {
        connectionsRef.current.delete(conn.peer);
        const state = stateRef.current;
        if (!state) return;
        const next = {
          ...state,
          players: state.players.map((p) =>
            p.id === conn.peer ? { ...p, connected: false } : p,
          ),
        };
        broadcastState(next);
      });

      conn.on("error", () => {
        connectionsRef.current.delete(conn.peer);
      });
    },
    [broadcastState, handleAction],
  );

  // ── Initialize Peer ───────────────────────────────────────────────────────
  const initPeer = useCallback(
    (customId?: string): Promise<string> => {
      return new Promise((resolve, reject) => {
        if (peerRef.current) {
          peerRef.current.destroy();
        }
        setStatus("initializing");

        const peer = customId ? new Peer(customId) : new Peer();
        peerRef.current = peer;

        peer.on("open", (id) => {
          setMyPeerId(id);
          setStatus("ready");
          resolve(id);
        });

        peer.on("error", (err) => {
          // If custom ID is taken, retry with random
          if (
            customId &&
            (err as { type?: string }).type === "unavailable-id"
          ) {
            peer.destroy();
            initPeer().then(resolve).catch(reject);
          } else {
            setError(`خطأ في الاتصال: ${err.message}`);
            setStatus("error");
            reject(err);
          }
        });

        peer.on("connection", (conn) => {
          setupHostConnection(conn);
        });

        peer.on("disconnected", () => {
          peer.reconnect();
        });
      });
    },
    [setupHostConnection],
  );

  // ── Create Room (host) ────────────────────────────────────────────────────
  const createRoom = useCallback(
    async (name: string) => {
      setMyName(name);
      setStatus("hosting");
      try {
        const id = await initPeer();
        // Use last 6 chars of peerId as room code
        const shortCode = id.slice(-6).toUpperCase();
        const hostPlayer: P2PPlayer = {
          id,
          name,
          score: 0,
          isHost: true,
          connected: true,
        };
        const initialState: P2PRoomState = {
          roomCode: shortCode,
          hostId: id,
          phase: "lobby",
          players: [hostPlayer],
          settings: { ...DEFAULT_SETTINGS },
          currentPlayerIndex: 0,
          cardsPlayed: 0,
          currentCard: null,
          cardFlipped: false,
          timerRunning: false,
          timeLeft: DEFAULT_SETTINGS.timePerQuestion,
        };
        stateRef.current = initialState;
        setRoomState(initialState);
        setStatus("in_room");
        return shortCode;
      } catch {
        setStatus("error");
      }
    },
    [initPeer],
  );

  // ── Join Room (guest) ─────────────────────────────────────────────────────
  const joinRoom = useCallback(
    async (hostPeerId: string, name: string) => {
      setMyName(name);
      setStatus("joining");
      setError(null);
      try {
        const myId = await initPeer();
        const conn = peerRef.current!.connect(hostPeerId, { reliable: true });
        hostConnRef.current = conn;

        conn.on("open", () => {
          conn.send({ type: "join_request", name } satisfies MessageType);
        });

        conn.on("data", (raw) => {
          const msg = raw as MessageType;
          if (msg.type === "join_accepted") {
            setRoomState(msg.state);
            setStatus("in_room");
          } else if (msg.type === "join_rejected") {
            setError(msg.reason);
            setStatus("ready");
            conn.close();
          } else if (msg.type === "state_update") {
            setRoomState(msg.state);
          }
        });

        conn.on("close", () => {
          setError("انقطع الاتصال بالمضيف");
          setRoomState(null);
          setStatus("ready");
        });

        conn.on("error", () => {
          setError("تعذر الاتصال. تأكد من الكود أو كون على نفس الشبكة");
          setStatus("ready");
        });

        return myId;
      } catch {
        setStatus("error");
      }
    },
    [initPeer],
  );

  // ── Send action ───────────────────────────────────────────────────────────
  const sendAction = useCallback(
    (action: P2PAction) => {
      if (isHost) {
        // Host processes locally
        handleAction(action, myPeerId!);
      } else {
        // Guest sends to host
        if (hostConnRef.current?.open) {
          hostConnRef.current.send({
            type: "action",
            action,
          } satisfies MessageType);
        }
      }
    },
    [isHost, myPeerId, handleAction],
  );

  // ── Public action helpers ─────────────────────────────────────────────────
  const updateSettings = useCallback(
    (s: Partial<P2PSettings>) =>
      sendAction({ kind: "update_settings", settings: s }),
    [sendAction],
  );
  const goToSettings = useCallback(
    () => sendAction({ kind: "go_settings" }),
    [sendAction],
  );
  const startGame = useCallback(
    () => sendAction({ kind: "start_game" }),
    [sendAction],
  );
  const flipCard = useCallback(
    () => sendAction({ kind: "flip_card" }),
    [sendAction],
  );
  const markCorrect = useCallback(
    () => sendAction({ kind: "correct" }),
    [sendAction],
  );
  const markWrong = useCallback(
    () => sendAction({ kind: "wrong" }),
    [sendAction],
  );
  const playAgain = useCallback(
    () => sendAction({ kind: "play_again" }),
    [sendAction],
  );

  const leaveRoom = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    peerRef.current?.destroy();
    connectionsRef.current.clear();
    hostConnRef.current = null;
    setRoomState(null);
    setStatus("idle");
    setMyPeerId(null);
    setError(null);
  }, []);

  // Cleanup
  useEffect(
    () => () => {
      if (timerRef.current) clearInterval(timerRef.current);
      peerRef.current?.destroy();
    },
    [],
  );

  const myPlayer = roomState?.players.find((p) => p.id === myPeerId) ?? null;
  const currentPlayer = roomState
    ? roomState.players[roomState.currentPlayerIndex]
    : null;
  const isMyTurn = currentPlayer?.id === myPeerId;

  return {
    status,
    error,
    myPeerId,
    myName,
    roomState,
    isHost,
    myPlayer,
    currentPlayer,
    isMyTurn,
    createRoom,
    joinRoom,
    leaveRoom,
    updateSettings,
    goToSettings,
    startGame,
    flipCard,
    markCorrect,
    markWrong,
    playAgain,
  };
}
