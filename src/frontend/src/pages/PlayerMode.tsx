import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { NumberBoard } from "../components/NumberBoard";
import { PvpBetStatus } from "../components/PvpBetStatus";
import { TambolaTicket } from "../components/TambolaTicket";
import {
  PRIZE_EMOJI,
  PRIZE_LABELS,
  PRIZE_PERCENTAGES,
  type Player,
  type PrizeType,
  useGame,
} from "../context/GameContext";

const SESSION_KEY = "tambola-session";

const TICKET_PRICES = [10, 20, 50, 100, 500];

let speechUnlocked = false;
function unlockSpeech() {
  if (
    speechUnlocked ||
    typeof window === "undefined" ||
    !window.speechSynthesis
  )
    return;
  const u = new SpeechSynthesisUtterance("");
  u.volume = 0;
  window.speechSynthesis.speak(u);
  speechUnlocked = true;
}

function announceNumber(num: number) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();

  const doSpeak = (voices: SpeechSynthesisVoice[]) => {
    const utterance = new SpeechSynthesisUtterance(`Number ${num}`);
    utterance.lang = "en-IN";
    utterance.rate = 0.8;
    utterance.pitch = 1.0;
    utterance.volume = 1;
    const preferred = voices.find(
      (v) =>
        v.lang.startsWith("en") &&
        (v.name.includes("Google") ||
          v.name.includes("Natural") ||
          v.name.includes("UK") ||
          v.name.includes("US") ||
          v.name.includes("Female")),
    );
    if (preferred) utterance.voice = preferred;
    window.speechSynthesis.speak(utterance);
  };

  const voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) {
    setTimeout(() => doSpeak(voices), 50);
  } else {
    window.speechSynthesis.addEventListener(
      "voiceschanged",
      () => {
        const v = window.speechSynthesis.getVoices();
        setTimeout(() => doSpeak(v), 50);
      },
      { once: true },
    );
  }
}

const ALL_PRIZES: PrizeType[] = [
  "earlyFive",
  "corners",
  "topLine",
  "middleLine",
  "bottomLine",
  "fullHouse",
];

// ─── Main PlayerMode ──────────────────────────────────────────────────────────
export function PlayerMode() {
  const {
    gameStatus,
    prizes,
    calledNumbers,
    addPlayer,
    claimPrize,
    setMode,
    players,
    loginPlayer,
    startGame,
    resetGame,
    drawNumber,
    ticketPrice,
    setTicketPrice,
    authPlayer,
    multiplayerRoom,
    createMultiplayerRoom,
  } = useGame();
  const [displayName, setDisplayName] = useState("");
  const [ticketCount, setTicketCount] = useState("1");
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [showNumberBoard, setShowNumberBoard] = useState(false);
  const [autoCall, setAutoCall] = useState(false);
  const autoCallRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const initialized = useRef(false);
  const [isPortrait, setIsPortrait] = useState(
    () => window.innerWidth < window.innerHeight,
  );
  const [copiedRoomCode, setCopiedRoomCode] = useState(false);
  const [hostingRoom, setHostingRoom] = useState(false);

  // Lock landscape orientation for game screen
  useEffect(() => {
    const tryLock = async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ori = screen.orientation as any;
        if (ori && typeof ori.lock === "function") {
          await ori.lock("landscape");
        }
      } catch {
        // Browser may deny — ok
      }
    };
    tryLock();
    return () => {
      try {
        screen.orientation.unlock();
      } catch {
        // ok
      }
    };
  }, []);

  // Portrait detection + overlay
  useEffect(() => {
    const check = () => {
      setIsPortrait(window.innerWidth < window.innerHeight);
    };
    check();
    window.addEventListener("resize", check);
    window.addEventListener("orientationchange", check);
    return () => {
      window.removeEventListener("resize", check);
      window.removeEventListener("orientationchange", check);
    };
  }, []);

  // Check saved session on mount
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    try {
      const saved = localStorage.getItem(SESSION_KEY);
      if (saved) {
        const session = JSON.parse(saved) as { name: string; pin: string };
        if (session.name && session.pin) {
          const result = loginPlayer(session.name, session.pin);
          if (result !== "wrong_pin") {
            setDisplayName(result.name);
            setCurrentPlayer(result);
            return;
          }
        }
      }
    } catch {}
    // No valid session — auto-initialize from authPlayer
    if (authPlayer) {
      const result = loginPlayer(
        authPlayer.name,
        `auto-${authPlayer.uniqueId}`,
      );
      if (result !== "wrong_pin") {
        setDisplayName(result.name);
        setCurrentPlayer(result);
      }
    }
  }, [loginPlayer, authPlayer]);

  useEffect(() => {
    if (autoCall && gameStatus === "inProgress") {
      autoCallRef.current = setInterval(() => {
        drawNumber();
      }, 3000);
    } else {
      if (autoCallRef.current) {
        clearInterval(autoCallRef.current);
        autoCallRef.current = null;
      }
    }
    return () => {
      if (autoCallRef.current) {
        clearInterval(autoCallRef.current);
        autoCallRef.current = null;
      }
    };
  }, [autoCall, gameStatus, drawNumber]);

  useEffect(() => {
    if (gameStatus !== "inProgress") setAutoCall(false);
  }, [gameStatus]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (window.speechSynthesis?.paused) window.speechSynthesis.resume();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const prevCalledLengthRef = useRef(calledNumbers.length);
  useEffect(() => {
    if (calledNumbers.length > prevCalledLengthRef.current) {
      const lastNumber = calledNumbers[calledNumbers.length - 1];
      if (lastNumber !== undefined) announceNumber(lastNumber);
    }
    prevCalledLengthRef.current = calledNumbers.length;
  }, [calledNumbers]);

  const livePlayer = currentPlayer
    ? (players.find((p) => p.id === currentPlayer.id) ?? currentPlayer)
    : null;

  const handleAddTickets = useCallback(() => {
    if (!currentPlayer) return;
    const desired = Number.parseInt(ticketCount);
    const current = livePlayer?.tickets.length ?? 0;
    const extra = desired - current;
    if (extra <= 0) return;
    const result = addPlayer(displayName || "Guest", extra, currentPlayer.id);
    if (result === "insufficient_balance") {
      toast.warning("Insufficient balance for more tickets.");
    } else {
      toast.success("Tickets updated!");
      setCurrentPlayer((prev) =>
        prev ? { ...prev, tickets: result.tickets } : result,
      );
    }
  }, [currentPlayer, livePlayer, ticketCount, addPlayer, displayName]);

  const handleClaim = useCallback(
    (ticketId: string, prizeType: PrizeType) => {
      if (!currentPlayer) return;
      const result = claimPrize(currentPlayer.id, ticketId, prizeType);
      switch (result) {
        case "won":
          toast.success(`${PRIZE_LABELS[prizeType]}! You won!`);
          break;
        case "bogey":
          toast.error("Bogey! Invalid claim. Ticket disqualified.");
          break;
        case "already_claimed":
          toast.info(`${PRIZE_LABELS[prizeType]} already claimed.`);
          break;
        case "game_not_started":
          toast.warning("The game hasn't started yet!");
          break;
      }
    },
    [currentPlayer, claimPrize],
  );

  const lastCalled = calledNumbers[calledNumbers.length - 1];
  const numTickets = Number.parseInt(ticketCount) || 1;
  const totalCost = numTickets * ticketPrice;

  const isGuest = multiplayerRoom?.role === "guest";

  const handleStartGame = async () => {
    unlockSpeech();
    // If no multiplayer room and user is host intent, create room first
    if (!multiplayerRoom && !isGuest) {
      // Just start — solo or auto-host
    }
    startGame();
  };

  const handleCreateHostRoom = async () => {
    setHostingRoom(true);
    try {
      await createMultiplayerRoom();
      toast.success("Room created! Share the code with friends.");
    } catch {
      toast.error("Failed to create room.");
    } finally {
      setHostingRoom(false);
    }
  };

  const handleAutoCallToggle = () => {
    unlockSpeech();
    setAutoCall((v) => !v);
  };

  const handleCopyRoomCode = () => {
    if (multiplayerRoom?.code) {
      navigator.clipboard.writeText(multiplayerRoom.code).catch(() => {});
      setCopiedRoomCode(true);
      setTimeout(() => setCopiedRoomCode(false), 2000);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "oklch(0.12 0.05 160)" }}
    >
      {/* Rotate overlay */}
      <AnimatePresence>
        {isPortrait && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6"
            style={{
              background: "oklch(0.1 0.08 290 / 0.97)",
              backdropFilter: "blur(8px)",
            }}
          >
            <motion.div
              animate={{ rotate: [0, 90, 0] }}
              transition={{
                repeat: Number.POSITIVE_INFINITY,
                duration: 2,
                ease: "easeInOut",
              }}
              className="text-6xl"
            >
              📱
            </motion.div>
            <div className="text-center px-8">
              <p
                className="font-display text-2xl font-bold mb-2"
                style={{ color: "oklch(0.9 0.14 50)" }}
              >
                Rotate Your Device
              </p>
              <p className="font-body text-sm text-muted-foreground">
                Please turn your phone to landscape mode to play Tambola.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header
        className="sticky top-0 z-20 backdrop-blur border-b"
        style={{
          background: "oklch(0.18 0.08 160 / 0.97)",
          borderColor: "oklch(0.3 0.1 160 / 0.4)",
        }}
      >
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMode("home")}
            data-ocid="player.nav.link"
            className="text-muted-foreground hover:text-primary transition-colors text-sm font-body"
          >
            ← Home
          </button>
          <div className="h-4 w-px bg-border" />
          <img
            src="/assets/generated/tambola-logo-colorful-transparent.dim_400x180.png"
            alt="Tambola"
            className="h-8 object-contain drop-shadow-[0_0_12px_rgba(255,140,0,0.5)]"
          />
          {/* Multiplayer room badge */}
          {multiplayerRoom && (
            <div
              className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold"
              style={{
                background:
                  multiplayerRoom.role === "host"
                    ? "oklch(0.3 0.14 50 / 0.4)"
                    : "oklch(0.3 0.14 170 / 0.4)",
                color:
                  multiplayerRoom.role === "host"
                    ? "oklch(0.85 0.2 50)"
                    : "oklch(0.85 0.2 170)",
                border: `1px solid ${
                  multiplayerRoom.role === "host"
                    ? "oklch(0.5 0.2 50 / 0.4)"
                    : "oklch(0.5 0.2 170 / 0.4)"
                }`,
              }}
            >
              {multiplayerRoom.role === "host" ? "🎙️" : "🎮"} Room:{" "}
              {multiplayerRoom.code}
              {multiplayerRoom.role === "host" && (
                <button
                  type="button"
                  onClick={handleCopyRoomCode}
                  className="ml-1 opacity-70 hover:opacity-100"
                  data-ocid="player.room.button"
                >
                  {copiedRoomCode ? "✓" : "📋"}
                </button>
              )}
            </div>
          )}
          <div className="ml-auto flex items-center gap-2">
            {livePlayer && (
              <Badge
                className="text-xs font-mono max-w-[160px] truncate border"
                style={{
                  background: "oklch(0.3 0.1 160 / 0.3)",
                  color: "oklch(0.8 0.14 160)",
                  borderColor: "oklch(0.45 0.15 160 / 0.4)",
                }}
              >
                🪙 {livePlayer.wallet}
              </Badge>
            )}
            <Badge
              className={`text-xs ${
                gameStatus === "notStarted"
                  ? "bg-muted text-muted-foreground"
                  : gameStatus === "inProgress"
                    ? "bg-green-600 text-white"
                    : "bg-destructive text-destructive-foreground"
              }`}
            >
              {gameStatus === "notStarted"
                ? "Waiting"
                : gameStatus === "inProgress"
                  ? "● Live"
                  : "Ended"}
            </Badge>
          </div>
        </div>
      </header>

      {/* Split layout — always horizontal, scrolls on small screens */}
      <main className="flex-1 overflow-x-auto">
        <div className="flex flex-row gap-4 px-3 py-4 min-w-[640px]">
          {/* LEFT — number + controls */}
          <div className="w-72 flex-shrink-0 flex flex-col gap-4">
            {/* Player identity */}
            <div
              className="rounded-xl border p-4 flex items-center gap-3"
              style={{
                background: "oklch(0.17 0.07 160)",
                borderColor: "oklch(0.3 0.1 160 / 0.35)",
              }}
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-black flex-shrink-0"
                style={{ background: "oklch(0.35 0.15 160)" }}
              >
                {displayName ? displayName[0]?.toUpperCase() : "?"}
              </div>
              <div className="min-w-0 flex-1">
                <p
                  className="font-bold text-sm truncate"
                  style={{ color: "oklch(0.9 0.1 160)" }}
                >
                  {displayName || "Guest Player"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {livePlayer?.tickets.length ?? 0} ticket
                  {(livePlayer?.tickets.length ?? 0) !== 1 ? "s" : ""}
                </p>
              </div>
              {livePlayer && (
                <div
                  className="text-xs font-mono px-2 py-1 rounded-lg flex-shrink-0"
                  style={{
                    background: "oklch(0.28 0.12 80 / 0.4)",
                    color: "oklch(0.88 0.18 80)",
                  }}
                >
                  🪙 {livePlayer.wallet}
                </div>
              )}
            </div>

            {/* Big Number */}
            <div
              className="rounded-xl border p-5 flex flex-col items-center"
              style={{
                background: "oklch(0.17 0.07 160)",
                borderColor: "oklch(0.4 0.15 160 / 0.35)",
              }}
            >
              <p className="text-xs font-body text-muted-foreground uppercase tracking-widest mb-4">
                🔊 Current Number
              </p>
              <AnimatePresence mode="wait">
                {lastCalled !== undefined ? (
                  <motion.div
                    key={lastCalled}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 1.3, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 350, damping: 22 }}
                    className="font-display font-black text-8xl w-36 h-36 rounded-full flex items-center justify-center shadow-lg"
                    style={{
                      background:
                        "conic-gradient(from 0deg, oklch(0.65 0.28 50), oklch(0.6 0.28 130), oklch(0.55 0.28 220), oklch(0.6 0.28 290), oklch(0.65 0.28 350), oklch(0.65 0.28 50))",
                      color: "white",
                      boxShadow:
                        "0 0 50px oklch(0.6 0.28 50 / 0.7), 0 0 80px oklch(0.55 0.26 290 / 0.4)",
                      textShadow: "0 2px 8px rgba(0,0,0,0.6)",
                    }}
                  >
                    {lastCalled}
                  </motion.div>
                ) : (
                  <div
                    className="w-36 h-36 rounded-2xl flex items-center justify-center text-4xl text-muted-foreground"
                    style={{ background: "oklch(0.22 0.06 160)" }}
                  >
                    —
                  </div>
                )}
              </AnimatePresence>
              <p className="text-muted-foreground text-xs font-body mt-4">
                {calledNumbers.length} / 90 called
              </p>
            </div>

            {/* Controls */}
            <div
              className="rounded-xl border p-4"
              style={{
                background: "oklch(0.17 0.07 160)",
                borderColor: "oklch(0.3 0.1 160 / 0.35)",
              }}
            >
              <h3
                className="font-display text-sm font-bold mb-3"
                style={{ color: "oklch(0.85 0.12 160)" }}
              >
                🎙️ Game Controls
              </h3>
              <div className="flex flex-col gap-2">
                {gameStatus === "notStarted" && (
                  <>
                    {/* Guest note */}
                    {isGuest && (
                      <div
                        className="rounded-lg p-3 mb-1"
                        style={{
                          background: "oklch(0.22 0.1 170 / 0.3)",
                          border: "1px solid oklch(0.4 0.16 170 / 0.4)",
                        }}
                      >
                        <p
                          className="text-xs font-body"
                          style={{ color: "oklch(0.8 0.14 170)" }}
                        >
                          🎮 Guest — waiting for host (
                          {multiplayerRoom?.hostName}) to start
                        </p>
                      </div>
                    )}

                    {/* Create Host Room button (only if no room and not guest) */}
                    {!multiplayerRoom && !isGuest && (
                      <button
                        type="button"
                        onClick={handleCreateHostRoom}
                        disabled={hostingRoom}
                        data-ocid="player.multiplayer.button"
                        className="text-xs py-1.5 px-3 rounded-lg font-body mb-1 disabled:opacity-50 transition-all"
                        style={{
                          background: "oklch(0.22 0.1 50 / 0.35)",
                          color: "oklch(0.78 0.14 50)",
                          border: "1px solid oklch(0.38 0.14 50 / 0.4)",
                        }}
                      >
                        {hostingRoom
                          ? "Creating room..."
                          : "🌐 Host Multiplayer"}
                      </button>
                    )}

                    {/* Ticket Price Selector */}
                    {!isGuest && (
                      <div
                        className="rounded-lg p-3 mb-1"
                        style={{ background: "oklch(0.2 0.07 160 / 0.6)" }}
                      >
                        <p
                          className="text-xs font-body mb-2"
                          style={{ color: "oklch(0.72 0.1 160)" }}
                        >
                          🎫 Ticket Price (coins)
                        </p>
                        <div className="flex gap-1.5 flex-wrap">
                          {TICKET_PRICES.map((price) => (
                            <button
                              key={price}
                              type="button"
                              data-ocid="player.tickets.select"
                              onClick={() => setTicketPrice(price)}
                              className="flex-1 min-w-[40px] text-xs font-bold py-1.5 px-2 rounded-lg transition-all"
                              style={
                                ticketPrice === price
                                  ? {
                                      background:
                                        "linear-gradient(135deg, oklch(0.55 0.22 80), oklch(0.44 0.2 90))",
                                      color: "white",
                                      boxShadow:
                                        "0 0 12px oklch(0.55 0.22 80 / 0.5)",
                                    }
                                  : {
                                      background: "oklch(0.24 0.07 160 / 0.6)",
                                      color: "oklch(0.65 0.1 160)",
                                      border:
                                        "1px solid oklch(0.32 0.1 160 / 0.4)",
                                    }
                              }
                            >
                              🪙{price}
                            </button>
                          ))}
                        </div>
                        <p
                          className="text-xs font-mono mt-2"
                          style={{ color: "oklch(0.75 0.14 80)" }}
                        >
                          Cost: {numTickets} ticket{numTickets !== 1 ? "s" : ""}{" "}
                          × {ticketPrice} = 🪙{totalCost}
                        </p>
                      </div>
                    )}

                    {!isGuest && (
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="text-xs font-body"
                          style={{ color: "oklch(0.75 0.14 160)" }}
                        >
                          🎟️ Tickets:
                        </span>
                        <Select
                          value={ticketCount}
                          onValueChange={setTicketCount}
                        >
                          <SelectTrigger
                            data-ocid="player.tickets.select"
                            className="font-body flex-1 h-8 text-xs"
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[1, 2, 3, 4, 5, 6].map((n) => (
                              <SelectItem
                                key={n}
                                value={String(n)}
                                className="font-body text-xs"
                              >
                                {n} ticket{n !== 1 ? "s" : ""}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleAddTickets}
                          data-ocid="player.add_tickets.button"
                          className="font-body text-xs h-8 px-2"
                        >
                          Set
                        </Button>
                      </div>
                    )}

                    {!isGuest && (
                      <Button
                        onClick={handleStartGame}
                        data-ocid="player.start.button"
                        className="w-full text-white border-0 font-bold"
                        style={{
                          background:
                            "linear-gradient(135deg, oklch(0.5 0.2 160), oklch(0.4 0.18 170))",
                        }}
                      >
                        ▶ Start Game
                      </Button>
                    )}
                  </>
                )}
                {gameStatus === "inProgress" && (
                  <>
                    {!isGuest && (
                      <Button
                        variant={autoCall ? "destructive" : "default"}
                        onClick={handleAutoCallToggle}
                        data-ocid="player.autocall.toggle"
                        className="w-full font-bold text-sm"
                        style={
                          autoCall
                            ? {}
                            : {
                                background:
                                  "linear-gradient(135deg, oklch(0.5 0.2 160), oklch(0.4 0.18 170))",
                                color: "white",
                                border: "none",
                              }
                        }
                      >
                        {autoCall
                          ? "⏹ Stop Auto Caller"
                          : "🔊 Auto Caller (3s)"}
                      </Button>
                    )}
                    {isGuest && (
                      <div
                        className="rounded-lg p-3"
                        style={{
                          background: "oklch(0.22 0.1 170 / 0.3)",
                          border: "1px solid oklch(0.4 0.16 170 / 0.4)",
                        }}
                      >
                        <p
                          className="text-xs font-body text-center"
                          style={{ color: "oklch(0.8 0.14 170)" }}
                        >
                          🎮 Syncing with host...
                        </p>
                      </div>
                    )}
                    {!isGuest && (
                      <Button
                        onClick={resetGame}
                        variant="destructive"
                        size="sm"
                        data-ocid="player.reset.button"
                        className="w-full"
                      >
                        ↺ Reset Game
                      </Button>
                    )}
                  </>
                )}
                {gameStatus === "completed" && (
                  <>
                    <p className="text-sm font-body text-center text-muted-foreground">
                      🏁 All 90 numbers drawn!
                    </p>
                    {!isGuest && (
                      <Button
                        onClick={resetGame}
                        variant="destructive"
                        size="sm"
                        data-ocid="player.reset.button"
                        className="w-full"
                      >
                        ↺ New Game
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Number board */}
            <div
              className="rounded-xl border overflow-hidden"
              style={{
                background: "oklch(0.17 0.07 160)",
                borderColor: "oklch(0.3 0.1 160 / 0.35)",
              }}
            >
              <button
                type="button"
                onClick={() => setShowNumberBoard((v) => !v)}
                data-ocid="player.board.toggle"
                className="w-full px-4 py-2.5 text-sm font-body text-left flex items-center justify-between"
                style={{ color: "oklch(0.75 0.12 160)" }}
              >
                <span>📋 Number Board</span>
                <span className="text-xs">
                  {showNumberBoard ? "▲ Hide" : "▼ Show"}
                </span>
              </button>
              <AnimatePresence>
                {showNumberBoard && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <NumberBoard calledNumbers={calledNumbers} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* RIGHT — tickets + prizes */}
          <div className="flex-1 min-w-0 flex flex-col gap-4">
            {/* Prize status */}
            <div
              className="rounded-xl border p-3"
              style={{
                background: "oklch(0.17 0.07 160)",
                borderColor: "oklch(0.3 0.1 160 / 0.35)",
              }}
            >
              <p
                className="text-xs font-body mb-2"
                style={{ color: "oklch(0.7 0.1 160)" }}
              >
                🏆 Prizes
              </p>
              <div className="flex flex-wrap gap-1.5">
                {ALL_PRIZES.map((pt) => (
                  <Badge
                    key={pt}
                    className={`text-xs ${
                      prizes[pt].winner
                        ? prizes[pt].winner === livePlayer?.name
                          ? "bg-green-600 text-white"
                          : "bg-muted text-muted-foreground line-through"
                        : "bg-card border border-border text-foreground"
                    }`}
                  >
                    {prizes[pt].winner
                      ? prizes[pt].winner === livePlayer?.name
                        ? `🏆 ${PRIZE_LABELS[pt]} ${PRIZE_PERCENTAGES[pt]}%: ${prizes[pt].winner}`
                        : `✓ ${PRIZE_LABELS[pt]} ${PRIZE_PERCENTAGES[pt]}%: ${prizes[pt].winner}`
                      : `⭕ ${PRIZE_LABELS[pt]} ${PRIZE_PERCENTAGES[pt]}%`}
                  </Badge>
                ))}
              </div>
            </div>
            {/* PvP Bet Status */}
            <PvpBetStatus gameId="current-game" />

            {/* Tickets heading */}
            <div className="flex items-center justify-between px-1">
              <h2
                className="font-display font-bold text-lg"
                style={{ color: "oklch(0.85 0.14 160)" }}
              >
                🎟️ My Tickets
              </h2>
              {livePlayer && (
                <span className="text-xs text-muted-foreground font-body">
                  {livePlayer.tickets.length} ticket
                  {livePlayer.tickets.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>

            {/* Waiting */}
            {gameStatus === "notStarted" && !livePlayer?.tickets.length && (
              <div
                className="text-center py-12 rounded-xl"
                style={{ background: "oklch(0.17 0.05 160 / 0.6)" }}
                data-ocid="player.waiting.panel"
              >
                <div className="text-4xl mb-2">⏳</div>
                <p className="font-body text-muted-foreground">
                  {isGuest
                    ? "Waiting for host to start the game..."
                    : "Set tickets above and press Start Game!"}
                </p>
              </div>
            )}

            {/* Ticket cards */}
            {livePlayer && livePlayer.tickets.length > 0 && (
              <div className="grid sm:grid-cols-1 xl:grid-cols-2 gap-4">
                {livePlayer.tickets.map((ticket, idx) => (
                  <TambolaTicket
                    key={ticket.id}
                    ticket={ticket}
                    playerId={livePlayer.id}
                    playerName={livePlayer.name}
                    ticketIndex={idx}
                    onClaim={handleClaim}
                    showClaims
                  />
                ))}
              </div>
            )}

            {/* No tickets placeholder */}
            {livePlayer && livePlayer.tickets.length === 0 && (
              <div
                className="text-center py-12 rounded-xl border-2 border-dashed"
                style={{
                  borderColor: "oklch(0.3 0.1 160 / 0.4)",
                  background: "oklch(0.15 0.05 160 / 0.5)",
                }}
                data-ocid="player.waiting.panel"
              >
                <div className="text-4xl mb-2">🎫</div>
                <p className="font-body text-muted-foreground text-sm">
                  Your tickets will appear here
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer
        className="py-3 text-center text-xs text-muted-foreground font-body border-t"
        style={{ borderColor: "oklch(0.3 0.1 160 / 0.3)" }}
      >
        © {new Date().getFullYear()}.{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          className="underline hover:text-primary transition-colors"
          target="_blank"
          rel="noreferrer"
        >
          Built with ❤️ using caffeine.ai
        </a>
      </footer>
    </div>
  );
}
