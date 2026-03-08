import { createContext, useContext, useState, ReactNode } from 'react';
import gameData from '../../data/data.json';

export interface Player {
  id: string;
  name: string;
  score: number;
}

export interface GameSettings {
  categories: string[];
  timePerQuestion: number;
  totalCards: number;
}

interface GameContextType {
  players: Player[];
  addPlayer: (name: string) => void;
  removePlayer: (id: string) => void;
  updatePlayerScore: (id: string, points: number) => void;
  settings: GameSettings;
  updateSettings: (settings: Partial<GameSettings>) => void;
  currentPlayerIndex: number;
  nextPlayer: () => void;
  resetGame: () => void;
  cardsPlayed: number;
  incrementCardsPlayed: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [settings, setSettings] = useState<GameSettings>({
    categories: gameData.categories.slice(0, 4).map(c => c.id),
    timePerQuestion: 15,
    totalCards: 30,
  });
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [cardsPlayed, setCardsPlayed] = useState(0);

  const addPlayer = (name: string) => {
    const newPlayer: Player = {
      id: Date.now().toString(),
      name,
      score: 0,
    };
    setPlayers([...players, newPlayer]);
  };

  const removePlayer = (id: string) => {
    setPlayers(players.filter(p => p.id !== id));
  };

  const updatePlayerScore = (id: string, points: number) => {
    setPlayers(players.map(p => 
      p.id === id ? { ...p, score: p.score + points } : p
    ));
  };

  const updateSettings = (newSettings: Partial<GameSettings>) => {
    setSettings({ ...settings, ...newSettings });
  };

  const nextPlayer = () => {
    setCurrentPlayerIndex((prevIndex) => (prevIndex + 1) % players.length);
  };

  const incrementCardsPlayed = () => {
    setCardsPlayed(prev => prev + 1);
  };

  const resetGame = () => {
    setPlayers(players.map(p => ({ ...p, score: 0 })));
    setCurrentPlayerIndex(0);
    setCardsPlayed(0);
  };

  return (
    <GameContext.Provider
      value={{
        players,
        addPlayer,
        removePlayer,
        updatePlayerScore,
        settings,
        updateSettings,
        currentPlayerIndex,
        nextPlayer,
        resetGame,
        cardsPlayed,
        incrementCardsPlayed,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within GameProvider');
  }
  return context;
}
