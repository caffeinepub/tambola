import type React from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { type Ticket, generateTicket } from "../utils/ticketGenerator";

export type PrizeType =
  | "earlyFive"
  | "corners"
  | "topLine"
  | "middleLine"
  | "bottomLine"
  | "fullHouse";

export const PRIZE_LABELS: Record<PrizeType, string> = {
  earlyFive: "Early Five",
  corners: "Corners",
  topLine: "Top Line",
  middleLine: "Middle Line",
  bottomLine: "Bottom Line",
  fullHouse: "Full House",
};

export const PRIZE_EMOJI: Record<PrizeType, string> = {
  earlyFive: "🌟",
  corners: "🔲",
  topLine: "⬆️",
  middleLine: "➡️",
  bottomLine: "⬇️",
  fullHouse: "🏆",
};

export const PRIZE_PERCENTAGES: Record<PrizeType, number> = {
  earlyFive: 10,
  corners: 10,
  topLine: 10,
  middleLine: 10,
  bottomLine: 10,
  fullHouse: 40,
};

export const OPERATOR_COMMISSION = 10;

export type PrizeStatus = {
  winner: string | null;
  ticketId: string | null;
};

export type Player = {
  id: string;
  name: string;
  pin: string;
  balance: number;
  tickets: Ticket[];
  disqualifiedTickets: Set<string>;
};

export type GameStatus = "notStarted" | "inProgress" | "completed";

const PRIZE_TYPES: PrizeType[] = [
  "earlyFive",
  "corners",
  "topLine",
  "middleLine",
  "bottomLine",
  "fullHouse",
];

type GameContextType = {
  calledNumbers: number[];
  remainingNumbers: number[];
  gameStatus: GameStatus;
  prizes: Record<PrizeType, PrizeStatus>;
  players: Player[];
  currentMode: "home" | "caller" | "player";
  currentPlayerId: string | null;
  ticketPrice: number;
  setTicketPrice: (price: number) => void;
  totalPool: number;
  drawNumber: () => void;
  startGame: () => void;
  resetGame: () => void;
  setMode: (mode: "home" | "caller" | "player") => void;
  addPlayer: (
    name: string,
    ticketCount: number,
  ) => Player | "insufficient_balance";
  loginPlayer: (
    name: string,
    pin: string,
  ) => Player | "wrong_pin" | "new_player";
  claimPrize: (
    playerId: string,
    ticketId: string,
    prizeType: PrizeType,
  ) => "won" | "bogey" | "already_claimed" | "game_not_started";
  checkQualification: (ticketId: string, prizeType: PrizeType) => boolean;
  setCurrentPlayer: (id: string | null) => void;
};

const defaultPrizes: Record<PrizeType, PrizeStatus> = {
  earlyFive: { winner: null, ticketId: null },
  corners: { winner: null, ticketId: null },
  topLine: { winner: null, ticketId: null },
  middleLine: { winner: null, ticketId: null },
  bottomLine: { winner: null, ticketId: null },
  fullHouse: { winner: null, ticketId: null },
};

const GameContext = createContext<GameContextType | null>(null);

function createNumberPool(): number[] {
  const nums: number[] = [];
  for (let i = 1; i <= 90; i++) nums.push(i);
  for (let i = nums.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [nums[i], nums[j]] = [nums[j], nums[i]];
  }
  return nums;
}

function loadBalance(name: string): number {
  const stored = localStorage.getItem(`player-${name}-balance`);
  return stored !== null ? Number(stored) : 1000;
}

function saveBalance(name: string, balance: number) {
  localStorage.setItem(`player-${name}-balance`, String(balance));
}

function loadPlayerRecord(name: string): { pin: string } | null {
  const stored = localStorage.getItem(`player-${name}-record`);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

function savePlayerRecord(name: string, pin: string) {
  localStorage.setItem(`player-${name}-record`, JSON.stringify({ pin }));
}

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [calledNumbers, setCalledNumbers] = useState<number[]>([]);
  const [gameStatus, setGameStatus] = useState<GameStatus>("notStarted");
  const [prizes, setPrizes] =
    useState<Record<PrizeType, PrizeStatus>>(defaultPrizes);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentMode, setCurrentMode] = useState<"home" | "caller" | "player">(
    "home",
  );
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);
  const [ticketPrice, setTicketPrice] = useState(50);
  const poolRef = useRef<number[]>([]);
  const calledSetRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    calledSetRef.current = new Set(calledNumbers);
  }, [calledNumbers]);

  const totalPool =
    players.reduce((sum, p) => sum + p.tickets.length, 0) * ticketPrice;

  const startGame = useCallback(() => {
    const newPool = createNumberPool();
    poolRef.current = newPool;
    setCalledNumbers([]);
    calledSetRef.current = new Set();
    setPrizes({ ...defaultPrizes });
    setGameStatus("inProgress");
  }, []);

  const resetGame = useCallback(() => {
    poolRef.current = [];
    setCalledNumbers([]);
    calledSetRef.current = new Set();
    setPrizes({ ...defaultPrizes });
    setPlayers((prev) =>
      prev.map((p) => ({
        ...p,
        disqualifiedTickets: new Set(),
      })),
    );
    setGameStatus("notStarted");
    setCurrentPlayerId(null);
  }, []);

  const drawNumber = useCallback(() => {
    const pool = poolRef.current;
    if (pool.length === 0) {
      setGameStatus("completed");
      return;
    }
    const [drawn, ...rest] = pool;
    poolRef.current = rest;
    setCalledNumbers((c) => [...c, drawn]);
  }, []);

  const addPlayer = useCallback(
    (name: string, ticketCount: number): Player | "insufficient_balance" => {
      const id = `player-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const tickets: Ticket[] = [];
      for (let i = 0; i < ticketCount; i++) {
        tickets.push(generateTicket(`${id}-t${i}`));
      }
      const rawBalance = loadBalance(name);
      const cost = ticketPrice * ticketCount;
      const newBalance = Math.max(0, rawBalance - cost);
      saveBalance(name, newBalance);

      const player: Player = {
        id,
        name,
        pin: "",
        balance: newBalance,
        tickets,
        disqualifiedTickets: new Set(),
      };
      setPlayers((prev) => [...prev, player]);

      if (rawBalance < cost) return "insufficient_balance";
      return player;
    },
    [ticketPrice],
  );

  const loginPlayer = useCallback(
    (name: string, pin: string): Player | "wrong_pin" | "new_player" => {
      const trimmed = name.trim();
      const record = loadPlayerRecord(trimmed);
      if (record) {
        if (record.pin !== pin) return "wrong_pin";
        const balance = loadBalance(trimmed);
        const id = `player-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const player: Player = {
          id,
          name: trimmed,
          pin,
          balance,
          tickets: [],
          disqualifiedTickets: new Set(),
        };
        setPlayers((prev) => [...prev, player]);
        return player;
      }
      // New player — register
      savePlayerRecord(trimmed, pin);
      const balance = 1000;
      saveBalance(trimmed, balance);
      const id = `player-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const player: Player = {
        id,
        name: trimmed,
        pin,
        balance,
        tickets: [],
        disqualifiedTickets: new Set(),
      };
      setPlayers((prev) => [...prev, player]);
      return "new_player";
    },
    [],
  );

  const checkQualification = useCallback(
    (ticketId: string, prizeType: PrizeType): boolean => {
      let ticket: Ticket | null = null;
      for (const p of players) {
        const t = p.tickets.find((t) => t.id === ticketId);
        if (t) {
          ticket = t;
          break;
        }
      }
      if (!ticket) return false;

      const called = calledSetRef.current;

      switch (prizeType) {
        case "earlyFive": {
          const markedCount = ticket.numbers.filter((n) =>
            called.has(n),
          ).length;
          return markedCount >= 5;
        }
        case "corners": {
          const row0 = ticket.rows[0].filter((n): n is number => n !== null);
          const row2 = ticket.rows[2].filter((n): n is number => n !== null);
          const corners = [
            row0[0],
            row0[row0.length - 1],
            row2[0],
            row2[row2.length - 1],
          ];
          return corners.every((n) => called.has(n));
        }
        case "topLine": {
          const row0 = ticket.rows[0].filter((n): n is number => n !== null);
          return row0.every((n) => called.has(n));
        }
        case "middleLine": {
          const row1 = ticket.rows[1].filter((n): n is number => n !== null);
          return row1.every((n) => called.has(n));
        }
        case "bottomLine": {
          const row2 = ticket.rows[2].filter((n): n is number => n !== null);
          return row2.every((n) => called.has(n));
        }
        case "fullHouse": {
          return ticket.numbers.every((n) => called.has(n));
        }
      }
    },
    [players],
  );

  const claimPrize = useCallback(
    (
      playerId: string,
      ticketId: string,
      prizeType: PrizeType,
    ): "won" | "bogey" | "already_claimed" | "game_not_started" => {
      if (gameStatus !== "inProgress") return "game_not_started";
      if (prizes[prizeType].winner !== null) return "already_claimed";

      const player = players.find((p) => p.id === playerId);
      if (!player) return "bogey";
      if (player.disqualifiedTickets.has(ticketId)) return "bogey";

      const qualified = checkQualification(ticketId, prizeType);

      if (qualified) {
        setPrizes((prev) => ({
          ...prev,
          [prizeType]: { winner: player.name, ticketId },
        }));

        // Pool-based payout
        const payout = Math.floor(
          (PRIZE_PERCENTAGES[prizeType] / 100) * totalPool,
        );
        if (payout > 0) {
          setPlayers((prev) =>
            prev.map((p) => {
              if (p.id !== playerId) return p;
              const newBalance = p.balance + payout;
              saveBalance(p.name, newBalance);
              return { ...p, balance: newBalance };
            }),
          );
        }

        return "won";
      }

      // Bogey — disqualify ticket
      setPlayers((prev) =>
        prev.map((p) =>
          p.id === playerId
            ? {
                ...p,
                disqualifiedTickets: new Set([
                  ...p.disqualifiedTickets,
                  ticketId,
                ]),
              }
            : p,
        ),
      );
      return "bogey";
    },
    [gameStatus, prizes, players, checkQualification, totalPool],
  );

  const setMode = useCallback((mode: "home" | "caller" | "player") => {
    setCurrentMode(mode);
  }, []);

  const remainingNumbers: number[] = [];
  for (let i = 1; i <= 90; i++) {
    if (!calledNumbers.includes(i)) remainingNumbers.push(i);
  }

  return (
    <GameContext.Provider
      value={{
        calledNumbers,
        remainingNumbers,
        gameStatus,
        prizes,
        players,
        currentMode,
        currentPlayerId,
        ticketPrice,
        setTicketPrice,
        totalPool,
        drawNumber,
        startGame,
        resetGame,
        setMode,
        addPlayer,
        loginPlayer,
        claimPrize,
        checkQualification,
        setCurrentPlayer: setCurrentPlayerId,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame(): GameContextType {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within GameProvider");
  return ctx;
}

// Re-export for external usage
export { PRIZE_TYPES };
