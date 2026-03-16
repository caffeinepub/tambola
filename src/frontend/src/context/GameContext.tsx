import type React from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useActor } from "../hooks/useActor";
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
  wallet: number;
  bets: Partial<Record<PrizeType, number>>;
  tickets: Ticket[];
  disqualifiedTickets: Set<string>;
};

export type AuthPlayer = {
  mobile: string;
  name: string;
  uniqueId: string;
  balance: number;
  wallet: number;
};

export type GameHistoryEntry = {
  date: string; // ISO string
  prizesWon: string[]; // prize labels won
  ticketCount: number;
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

export type AppMode = "home" | "caller" | "player" | "profile" | "admin";

export type MultiplayerRoom = {
  code: string;
  role: "host" | "guest";
  hostName: string;
};

type GameContextType = {
  calledNumbers: number[];
  remainingNumbers: number[];
  gameStatus: GameStatus;
  prizes: Record<PrizeType, PrizeStatus>;
  players: Player[];
  currentMode: AppMode;
  currentPlayerId: string | null;
  ticketPrice: number;
  setTicketPrice: (price: number) => void;
  totalPool: number;
  authPlayer: AuthPlayer | null;
  gameHistory: GameHistoryEntry[];
  addGameHistoryEntry: (entry: GameHistoryEntry) => void;
  sendOTP: (mobile: string) => string;
  verifyOTP: (mobile: string, otp: string) => boolean;
  isRegistered: (mobile: string) => boolean;
  registerPlayer: (
    mobile: string,
    name: string,
    password: string,
  ) => AuthPlayer;
  loginWithMobile: (
    mobile: string,
    password: string,
  ) => AuthPlayer | "wrong_password";
  logout: () => void;
  drawNumber: () => void;
  startGame: () => void;
  resetGame: () => void;
  setMode: (mode: AppMode) => void;
  addPlayer: (
    name: string,
    ticketCount: number,
    playerId?: string,
  ) => Player | "insufficient_balance";
  loginPlayer: (name: string, pin: string) => Player | "wrong_pin";
  placeBet: (
    playerId: string,
    prizeType: PrizeType,
    amount: number,
  ) => "ok" | "insufficient" | "game_started";
  claimPrize: (
    playerId: string,
    ticketId: string,
    prizeType: PrizeType,
  ) => "won" | "bogey" | "already_claimed" | "game_not_started";
  checkQualification: (ticketId: string, prizeType: PrizeType) => boolean;
  setCurrentPlayer: (id: string | null) => void;
  // Multiplayer
  multiplayerRoom: MultiplayerRoom | null;
  createMultiplayerRoom: () => Promise<string>;
  joinMultiplayerRoom: (code: string) => Promise<"ok" | "not_found" | "error">;
  leaveMultiplayerRoom: () => void;
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

function loadWallet(name: string): number {
  const stored = localStorage.getItem(`tambola-player-${name}`);
  if (!stored) return 1000;
  try {
    const data = JSON.parse(stored);
    return typeof data.wallet === "number" ? data.wallet : 1000;
  } catch {
    return 1000;
  }
}

function saveWallet(name: string, wallet: number) {
  const stored = localStorage.getItem(`tambola-player-${name}`);
  let data: Record<string, unknown> = {};
  if (stored) {
    try {
      data = JSON.parse(stored);
    } catch {}
  }
  data.wallet = wallet;
  localStorage.setItem(`tambola-player-${name}`, JSON.stringify(data));
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

function loadGameHistory(uniqueId: string): GameHistoryEntry[] {
  const stored = localStorage.getItem(`tambola-history-${uniqueId}`);
  if (!stored) return [];
  try {
    return JSON.parse(stored) as GameHistoryEntry[];
  } catch {
    return [];
  }
}

function saveGameHistory(uniqueId: string, history: GameHistoryEntry[]) {
  localStorage.setItem(`tambola-history-${uniqueId}`, JSON.stringify(history));
}

type MobileAccount = {
  mobile: string;
  name: string;
  password: string;
  uniqueId: string;
  balance: number;
  wallet: number;
  lastLoginDate?: string;
};

function loadMobileAccount(mobile: string): MobileAccount | null {
  const stored = localStorage.getItem(`tambola-account-${mobile}`);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

function saveMobileAccount(account: MobileAccount) {
  localStorage.setItem(
    `tambola-account-${account.mobile}`,
    JSON.stringify(account),
  );
}

function generateUniqueId(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let id = "TB-";
  for (let i = 0; i < 6; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

function generateRoomCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function GameProvider({ children }: { children: React.ReactNode }) {
  const { actor } = useActor();

  const [calledNumbers, setCalledNumbers] = useState<number[]>([]);
  const [gameStatus, setGameStatus] = useState<GameStatus>("notStarted");
  const [prizes, setPrizes] =
    useState<Record<PrizeType, PrizeStatus>>(defaultPrizes);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentMode, setCurrentMode] = useState<AppMode>("home");
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);
  const [ticketPrice, setTicketPrice] = useState(50);
  const [authPlayer, setAuthPlayer] = useState<AuthPlayer | null>(() => {
    try {
      const stored = localStorage.getItem("tambola-session");
      if (stored) return JSON.parse(stored) as AuthPlayer;
    } catch {}
    return null;
  });
  const [gameHistory, setGameHistory] = useState<GameHistoryEntry[]>(() => {
    try {
      const stored = localStorage.getItem("tambola-session");
      if (stored) {
        const ap = JSON.parse(stored) as AuthPlayer;
        return loadGameHistory(ap.uniqueId);
      }
    } catch {}
    return [];
  });
  const [multiplayerRoom, setMultiplayerRoom] =
    useState<MultiplayerRoom | null>(null);

  const poolRef = useRef<number[]>([]);
  const calledSetRef = useRef<Set<number>>(new Set());
  const otpStore = useRef<Map<string, string>>(new Map());
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    calledSetRef.current = new Set(calledNumbers);
  }, [calledNumbers]);

  // Guest polling: sync called numbers + prizes from host via backend
  useEffect(() => {
    if (!multiplayerRoom || multiplayerRoom.role !== "guest") return;
    const code = multiplayerRoom.code;

    const poll = () => {
      const doFetch = async () => {
        try {
          const room = await actor?.getRoomState(code);
          if (!room) return;
          const nums = room.calledNumbers.map((n) => Number(n));
          setCalledNumbers(nums);
          if (room.isActive && nums.length > 0) {
            setGameStatus("inProgress");
          } else if (!room.isActive && nums.length > 0) {
            setGameStatus("completed");
          }
          if (room.prizeWinners) {
            try {
              const parsed = JSON.parse(room.prizeWinners) as Partial<
                Record<PrizeType, { winner: string; ticketId: string }>
              >;
              setPrizes((prev) => {
                const updated = { ...prev };
                for (const pt of PRIZE_TYPES) {
                  if (parsed[pt]) {
                    updated[pt] = {
                      winner: parsed[pt]!.winner,
                      ticketId: parsed[pt]!.ticketId,
                    };
                  }
                }
                return updated;
              });
            } catch {}
          }
        } catch {}
      };
      doFetch();
    };

    pollIntervalRef.current = setInterval(poll, 3000);
    poll(); // immediate first fetch

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [multiplayerRoom, actor]);

  const totalPool =
    players.reduce((sum, p) => sum + p.tickets.length, 0) * ticketPrice;

  const addGameHistoryEntry = useCallback(
    (entry: GameHistoryEntry) => {
      if (!authPlayer) return;
      setGameHistory((prev) => {
        const updated = [entry, ...prev].slice(0, 20);
        saveGameHistory(authPlayer.uniqueId, updated);
        return updated;
      });
    },
    [authPlayer],
  );

  const sendOTP = useCallback((mobile: string): string => {
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    otpStore.current.set(mobile, otp);
    return otp;
  }, []);

  const verifyOTP = useCallback((mobile: string, otp: string): boolean => {
    const stored = otpStore.current.get(mobile);
    return stored === otp;
  }, []);

  const isRegistered = useCallback((mobile: string): boolean => {
    return loadMobileAccount(mobile) !== null;
  }, []);

  const registerPlayer = useCallback(
    (mobile: string, name: string, password: string): AuthPlayer => {
      const uniqueId = generateUniqueId();
      const today = new Date().toISOString().slice(0, 10);
      const account: MobileAccount = {
        mobile,
        name,
        password,
        uniqueId,
        balance: 1000,
        wallet: 1000,
        lastLoginDate: today,
      };
      saveMobileAccount(account);
      const ap: AuthPlayer = {
        mobile,
        name,
        uniqueId,
        balance: 1000,
        wallet: 1000,
      };
      setAuthPlayer(ap);
      setGameHistory([]);
      localStorage.setItem("tambola-session", JSON.stringify(ap));
      return ap;
    },
    [],
  );

  const loginWithMobile = useCallback(
    (mobile: string, password: string): AuthPlayer | "wrong_password" => {
      const account = loadMobileAccount(mobile);
      if (!account) return "wrong_password";
      if (account.password !== password) return "wrong_password";

      // Daily login bonus
      const today = new Date().toISOString().slice(0, 10);
      if (account.lastLoginDate !== today) {
        account.balance += 100;
        account.wallet += 100;
        account.lastLoginDate = today;
        saveMobileAccount(account);
      }

      const ap: AuthPlayer = {
        mobile: account.mobile,
        name: account.name,
        uniqueId: account.uniqueId,
        balance: account.balance,
        wallet: account.wallet,
      };
      setAuthPlayer(ap);
      setGameHistory(loadGameHistory(ap.uniqueId));
      localStorage.setItem("tambola-session", JSON.stringify(ap));
      return ap;
    },
    [],
  );

  const logout = useCallback(() => {
    setAuthPlayer(null);
    setGameHistory([]);
    localStorage.removeItem("tambola-session");
    setCurrentMode("home");
    setMultiplayerRoom(null);
  }, []);

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
        tickets: [],
        bets: {},
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
    (
      name: string,
      ticketCount: number,
      existingId?: string,
    ): Player | "insufficient_balance" => {
      const id =
        existingId ||
        `player-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const tickets: Ticket[] = [];
      for (let i = 0; i < ticketCount; i++) {
        tickets.push(generateTicket(`${id}-t${i}-${Date.now()}`));
      }
      const rawBalance = loadBalance(name);
      const cost = ticketPrice * ticketCount;
      const newBalance = Math.max(0, rawBalance - cost);
      saveBalance(name, newBalance);

      if (rawBalance < cost) return "insufficient_balance";

      const wallet = loadWallet(name);

      if (existingId) {
        setPlayers((prev) =>
          prev.map((p) =>
            p.id === existingId
              ? {
                  ...p,
                  tickets: [...p.tickets, ...tickets],
                  balance: newBalance,
                }
              : p,
          ),
        );
        const found = players.find((p) => p.id === existingId);
        if (found) {
          return {
            ...found,
            tickets: [...found.tickets, ...tickets],
            balance: newBalance,
          };
        }
      }

      const player: Player = {
        id,
        name,
        pin: "",
        balance: newBalance,
        wallet,
        bets: {},
        tickets,
        disqualifiedTickets: new Set(),
      };
      setPlayers((prev) => {
        const exists = prev.find((p) => p.id === id);
        if (exists) return prev;
        return [...prev, player];
      });
      return player;
    },
    [ticketPrice, players],
  );

  const loginPlayer = useCallback(
    (name: string, pin: string): Player | "wrong_pin" => {
      const trimmed = name.trim();
      const record = loadPlayerRecord(trimmed);
      if (record) {
        if (record.pin !== pin) return "wrong_pin";
        const balance = loadBalance(trimmed);
        const wallet = loadWallet(trimmed);
        const id = `player-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const player: Player = {
          id,
          name: trimmed,
          pin,
          balance,
          wallet,
          bets: {},
          tickets: [],
          disqualifiedTickets: new Set(),
        };
        setPlayers((prev) => [...prev, player]);
        return player;
      }
      savePlayerRecord(trimmed, pin);
      const balance = 1000;
      const wallet = 1000;
      saveBalance(trimmed, balance);
      saveWallet(trimmed, wallet);
      const id = `player-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const player: Player = {
        id,
        name: trimmed,
        pin,
        balance,
        wallet,
        bets: {},
        tickets: [],
        disqualifiedTickets: new Set(),
      };
      setPlayers((prev) => [...prev, player]);
      return player;
    },
    [],
  );

  const placeBet = useCallback(
    (
      playerId: string,
      prizeType: PrizeType,
      amount: number,
    ): "ok" | "insufficient" | "game_started" => {
      if (gameStatus !== "notStarted") return "game_started";
      const player = players.find((p) => p.id === playerId);
      if (!player) return "insufficient";
      if (player.wallet < amount) return "insufficient";

      setPlayers((prev) =>
        prev.map((p) => {
          if (p.id !== playerId) return p;
          const newWallet = p.wallet - amount;
          const currentBet = p.bets[prizeType] ?? 0;
          const newBets = { ...p.bets, [prizeType]: currentBet + amount };
          saveWallet(p.name, newWallet);
          return { ...p, wallet: newWallet, bets: newBets };
        }),
      );
      return "ok";
    },
    [gameStatus, players],
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

        const payout = Math.floor(
          (PRIZE_PERCENTAGES[prizeType] / 100) * totalPool,
        );

        setPlayers((prev) =>
          prev.map((p) => {
            if (p.id !== playerId) return p;
            let newBalance = p.balance + payout;
            let newWallet = p.wallet;
            const betAmount = p.bets[prizeType] ?? 0;
            if (betAmount > 0) {
              newWallet = p.wallet + betAmount * 2;
              saveWallet(p.name, newWallet);
            }
            if (payout > 0) saveBalance(p.name, newBalance);
            return { ...p, balance: newBalance, wallet: newWallet };
          }),
        );

        // Record prize win in game history
        if (authPlayer) {
          const prizeLabel = PRIZE_LABELS[prizeType];
          const currentPlayer = players.find((p) => p.id === playerId);
          const ticketCount = currentPlayer?.tickets.length ?? 1;
          addGameHistoryEntry({
            date: new Date().toISOString(),
            prizesWon: [prizeLabel],
            ticketCount,
          });
        }

        return "won";
      }

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
    [
      gameStatus,
      prizes,
      players,
      checkQualification,
      totalPool,
      authPlayer,
      addGameHistoryEntry,
    ],
  );

  const setMode = useCallback((mode: AppMode) => {
    setCurrentMode(mode);
  }, []);

  // Multiplayer: create room
  const createMultiplayerRoom = useCallback(async (): Promise<string> => {
    const code = generateRoomCode();
    const hostName = authPlayer?.name ?? "Host";
    try {
      await actor?.createRoom(code, hostName);
    } catch {
      // Backend may fail; still set local room for fallback
    }
    const room: MultiplayerRoom = { code, role: "host", hostName };
    setMultiplayerRoom(room);
    return code;
  }, [authPlayer, actor]);

  // Multiplayer: join room
  const joinMultiplayerRoom = useCallback(
    async (code: string): Promise<"ok" | "not_found" | "error"> => {
      try {
        const result = await actor?.joinRoom(code.toUpperCase());
        if (result === "not_found" || result === "error") {
          return result as "not_found" | "error";
        }
        // Get room state to get host name
        const roomState = await actor?.getRoomState(code.toUpperCase());
        const room: MultiplayerRoom = {
          code: code.toUpperCase(),
          role: "guest",
          hostName: roomState?.hostName ?? "Host",
        };
        setMultiplayerRoom(room);
        return "ok";
      } catch {
        return "error";
      }
    },
    [actor],
  );

  // Multiplayer: leave room
  const leaveMultiplayerRoom = useCallback(() => {
    setMultiplayerRoom(null);
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
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
        authPlayer,
        gameHistory,
        addGameHistoryEntry,
        sendOTP,
        verifyOTP,
        isRegistered,
        registerPlayer,
        loginWithMobile,
        logout,
        drawNumber,
        resetGame,
        startGame,
        setMode,
        addPlayer,
        loginPlayer,
        placeBet,
        claimPrize,
        checkQualification,
        setCurrentPlayer: setCurrentPlayerId,
        multiplayerRoom,
        createMultiplayerRoom,
        joinMultiplayerRoom,
        leaveMultiplayerRoom,
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

export { PRIZE_TYPES };
