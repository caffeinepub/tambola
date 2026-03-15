import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { TambolaTicket } from "../components/TambolaTicket";
import {
  PRIZE_EMOJI,
  PRIZE_LABELS,
  type Player,
  type PrizeType,
  useGame,
} from "../context/GameContext";

const GUEST_ID_KEY = "tambola-guest-id";
const GUEST_NAME_KEY = "tambola-guest-name";
const GUEST_ADJECTIVES = [
  "Lucky",
  "Bold",
  "Swift",
  "Bright",
  "Happy",
  "Sunny",
  "Brave",
  "Cool",
  "Wild",
  "Sharp",
  "Quick",
  "Wise",
  "Calm",
  "Keen",
  "Proud",
];
const GUEST_ANIMALS = [
  "Tiger",
  "Eagle",
  "Panda",
  "Lion",
  "Fox",
  "Wolf",
  "Bear",
  "Hawk",
  "Deer",
  "Horse",
  "Shark",
  "Whale",
  "Cobra",
  "Parrot",
  "Cheetah",
];

function getOrCreateGuestIdentity(): { guestId: string; guestName: string } {
  let guestId = localStorage.getItem(GUEST_ID_KEY);
  let guestName = localStorage.getItem(GUEST_NAME_KEY);
  if (!guestId) {
    const suffix = Math.floor(1000 + Math.random() * 9000);
    guestId = `guest-${suffix}-${Date.now().toString(36)}`;
    localStorage.setItem(GUEST_ID_KEY, guestId);
  }
  if (!guestName) {
    const adj =
      GUEST_ADJECTIVES[Math.floor(Math.random() * GUEST_ADJECTIVES.length)];
    const animal =
      GUEST_ANIMALS[Math.floor(Math.random() * GUEST_ANIMALS.length)];
    const num = Math.floor(10 + Math.random() * 90);
    guestName = `${adj}${animal}${num}`;
    localStorage.setItem(GUEST_NAME_KEY, guestName);
  }
  return { guestId: guestId!, guestName: guestName! };
}

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
  const speak = () => {
    const utterance = new SpeechSynthesisUtterance(`Number ${num}`);
    utterance.lang = "en-IN";
    utterance.rate = 0.75;
    utterance.pitch = 1.1;
    utterance.volume = 1;
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(
      (v) =>
        v.lang.startsWith("en") &&
        (v.name.includes("Google") ||
          v.name.includes("Natural") ||
          v.name.includes("UK") ||
          v.name.includes("US")),
    );
    if (preferred) utterance.voice = preferred;
    window.speechSynthesis.speak(utterance);
  };
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) {
    window.speechSynthesis.onvoiceschanged = () => {
      setTimeout(speak, 100);
    };
  } else {
    setTimeout(speak, 100);
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

export function PlayerMode() {
  const {
    gameStatus,
    prizes,
    calledNumbers,
    addPlayer,
    claimPrize,
    setMode,
    players,
    startGame,
    resetGame,
    drawNumber,
  } = useGame();
  const [displayName, setDisplayName] = useState("");
  const [ticketCount, setTicketCount] = useState("1");
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [showNumberBoard, setShowNumberBoard] = useState(false);
  const [autoCall, setAutoCall] = useState(false);
  const autoCallRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const addPlayerRef = useRef(addPlayer);
  addPlayerRef.current = addPlayer;
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    const { guestName } = getOrCreateGuestIdentity();
    const result = addPlayerRef.current(guestName, 1);
    if (result !== "insufficient_balance") {
      setDisplayName(guestName);
      setCurrentPlayer(result);
    }
  }, []);

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
    const extra =
      Number.parseInt(ticketCount) - (livePlayer?.tickets.length ?? 0);
    if (extra <= 0) return;
    const result = addPlayer(displayName || "Guest", extra);
    if (result === "insufficient_balance") {
      toast.warning("Insufficient balance for more tickets.");
    } else {
      toast.success("Tickets updated!");
      setCurrentPlayer(result);
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
  const handleStartGame = () => {
    unlockSpeech();
    startGame();
  };
  const handleAutoCallToggle = () => {
    unlockSpeech();
    setAutoCall((v) => !v);
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "oklch(0.12 0.05 160)" }}
    >
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
          <span
            className="font-display text-lg font-bold"
            style={{ color: "oklch(0.75 0.18 160)" }}
          >
            🎫 Tambola
          </span>
          <div className="ml-auto flex items-center gap-2">
            {displayName && (
              <Badge
                className="text-xs font-mono max-w-[160px] truncate border"
                style={{
                  background: "oklch(0.3 0.1 160 / 0.3)",
                  color: "oklch(0.8 0.14 160)",
                  borderColor: "oklch(0.45 0.15 160 / 0.4)",
                }}
              >
                👤 {displayName}
              </Badge>
            )}
            <Badge
              className={`text-xs ${gameStatus === "notStarted" ? "bg-muted text-muted-foreground" : gameStatus === "inProgress" ? "bg-green-600 text-white" : "bg-destructive text-destructive-foreground"}`}
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

      {/* Split layout */}
      <main className="flex-1 container mx-auto px-3 py-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* LEFT — number + controls */}
          <div className="lg:w-80 xl:w-96 flex-shrink-0 flex flex-col gap-4">
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
              <div className="min-w-0">
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
                    className="font-display font-black text-8xl w-36 h-36 rounded-2xl flex items-center justify-center shadow-lg"
                    style={{
                      background:
                        "linear-gradient(135deg, oklch(0.5 0.22 160), oklch(0.38 0.18 175))",
                      color: "white",
                      boxShadow: "0 0 50px oklch(0.5 0.22 160 / 0.6)",
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
                  </>
                )}
                {gameStatus === "inProgress" && (
                  <>
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
                      {autoCall ? "⏹ Stop Auto Caller" : "🔊 Auto Caller (3s)"}
                    </Button>
                    <Button
                      onClick={resetGame}
                      variant="destructive"
                      size="sm"
                      data-ocid="player.reset.button"
                      className="w-full"
                    >
                      ↺ Reset Game
                    </Button>
                  </>
                )}
                {gameStatus === "completed" && (
                  <>
                    <p className="text-sm font-body text-center text-muted-foreground">
                      🏁 All 90 numbers drawn!
                    </p>
                    <Button
                      onClick={resetGame}
                      variant="destructive"
                      size="sm"
                      data-ocid="player.reset.button"
                      className="w-full"
                    >
                      ↺ New Game
                    </Button>
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
          <div className="flex-1 flex flex-col gap-4 min-w-0">
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
                    className={`text-xs ${prizes[pt].winner ? (prizes[pt].winner === livePlayer?.name ? "bg-green-600 text-white" : "bg-muted text-muted-foreground line-through") : "bg-card border border-border text-foreground"}`}
                  >
                    {prizes[pt].winner
                      ? `${prizes[pt].winner === livePlayer?.name ? "🏆" : "✓"} ${PRIZE_LABELS[pt]}: ${prizes[pt].winner}`
                      : `⭕ ${PRIZE_LABELS[pt]}`}
                  </Badge>
                ))}
              </div>
            </div>

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
                  Press Start Game to begin!
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
