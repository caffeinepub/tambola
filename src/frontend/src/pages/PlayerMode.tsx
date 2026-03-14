import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { TambolaTicket } from "../components/TambolaTicket";
import {
  OPERATOR_COMMISSION,
  PRIZE_EMOJI,
  PRIZE_LABELS,
  PRIZE_PERCENTAGES,
  type Player,
  type PrizeType,
  useGame,
} from "../context/GameContext";

// ── Guest identity helpers ──────────────────────────────────────────────
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
  return { guestId, guestName };
}
// ────────────────────────────────────────────────────────────────────────

function announceNumber(num: number) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  setTimeout(() => {
    const utterance = new SpeechSynthesisUtterance(`Number ${num}. ${num}.`);
    utterance.lang = "en-IN";
    utterance.rate = 0.8;
    utterance.pitch = 1.0;
    utterance.volume = 1;
    window.speechSynthesis.speak(utterance);
  }, 150);
}

const ALL_PRIZES: PrizeType[] = [
  "earlyFive",
  "corners",
  "topLine",
  "middleLine",
  "bottomLine",
  "fullHouse",
];

type PoolRow = {
  label: string;
  pct: number;
  amount: number;
  isCommission?: boolean;
};

function PrizePoolTable({
  totalPool,
  compact,
}: { totalPool: number; compact?: boolean }) {
  const rows: PoolRow[] = [
    ...ALL_PRIZES.map((pt) => ({
      label: `${PRIZE_EMOJI[pt]} ${PRIZE_LABELS[pt]}`,
      pct: PRIZE_PERCENTAGES[pt],
      amount: Math.floor(totalPool * (PRIZE_PERCENTAGES[pt] / 100)),
    })),
    {
      label: "🏢 Operator Commission",
      pct: OPERATOR_COMMISSION,
      amount: Math.floor(totalPool * (OPERATOR_COMMISSION / 100)),
      isCommission: true,
    },
  ];

  return (
    <div
      className={`w-full rounded-lg overflow-hidden border border-emerald-500/20 ${
        compact ? "text-xs" : "text-sm"
      }`}
    >
      <div className="grid grid-cols-3 bg-emerald-500/10 text-emerald-400 font-bold px-3 py-1.5">
        <span>Prize</span>
        <span className="text-center">%</span>
        <span className="text-right">Amount</span>
      </div>
      {rows.map((row) => (
        <div
          key={row.label}
          className={`grid grid-cols-3 px-3 py-1.5 border-t border-emerald-500/10 ${
            row.isCommission
              ? "text-muted-foreground italic"
              : "text-foreground"
          }`}
        >
          <span className="font-body truncate pr-2">{row.label}</span>
          <span className="text-center">
            <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-mono px-1.5">
              {row.pct}%
            </Badge>
          </span>
          <span className="text-right font-bold font-mono">
            ₹{row.amount.toLocaleString("en-IN")}
          </span>
        </div>
      ))}
    </div>
  );
}

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
    ticketPrice,
    setTicketPrice,
    totalPool,
    drawNumber,
  } = useGame();

  const [displayName, setDisplayName] = useState("");
  const [ticketCount, setTicketCount] = useState("1");
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [showPoolBreakdown, setShowPoolBreakdown] = useState(false);
  const [showNumberBoard, setShowNumberBoard] = useState(false);
  const [autoCall, setAutoCall] = useState(false);
  const autoCallRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const addPlayerRef = useRef(addPlayer);
  addPlayerRef.current = addPlayer;

  // Auto-assign guest identity on mount
  useEffect(() => {
    const { guestName } = getOrCreateGuestIdentity();
    const result = addPlayerRef.current(guestName, 1);
    if (result !== "insufficient_balance") {
      setDisplayName(guestName);
      setCurrentPlayer(result);
    }
  }, []);

  // Auto call interval — fixed at 3 seconds
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

  // Stop auto call when game completes
  useEffect(() => {
    if (gameStatus !== "inProgress") setAutoCall(false);
  }, [gameStatus]);

  // Chrome speechSynthesis resume workaround
  useEffect(() => {
    const interval = setInterval(() => {
      if (window.speechSynthesis?.paused) window.speechSynthesis.resume();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Voice announcement for new numbers
  const prevCalledLengthRef = useRef(calledNumbers.length);
  useEffect(() => {
    if (calledNumbers.length > prevCalledLengthRef.current) {
      const lastNumber = calledNumbers[calledNumbers.length - 1];
      if (lastNumber !== undefined) announceNumber(lastNumber);
    }
    prevCalledLengthRef.current = calledNumbers.length;
  }, [calledNumbers]);

  // Keep livePlayer in sync with players array
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
      toast.warning("⚠️ Insufficient balance for more tickets.");
    } else {
      toast.success("🎟️ Tickets updated!");
      setCurrentPlayer(result);
    }
  }, [currentPlayer, livePlayer, ticketCount, addPlayer, displayName]);

  const handleClaim = useCallback(
    (ticketId: string, prizeType: PrizeType) => {
      if (!currentPlayer) return;
      const result = claimPrize(currentPlayer.id, ticketId, prizeType);
      const prizeAmount = Math.floor(
        (PRIZE_PERCENTAGES[prizeType] / 100) * totalPool,
      );
      switch (result) {
        case "won":
          toast.success(
            `🎉 ${PRIZE_LABELS[prizeType]}! You won ₹${prizeAmount.toLocaleString("en-IN")}! Congratulations!`,
          );
          break;
        case "bogey":
          toast.error(
            "❌ Bogey! Invalid claim. Your ticket has been disqualified from further prizes.",
          );
          break;
        case "already_claimed":
          toast.info(`${PRIZE_LABELS[prizeType]} has already been claimed.`);
          break;
        case "game_not_started":
          toast.warning("The game hasn't started yet!");
          break;
      }
    },
    [currentPlayer, claimPrize, totalPool],
  );

  const lastCalled = calledNumbers[calledNumbers.length - 1];

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
                className="text-xs font-mono max-w-[140px] truncate border"
                style={{
                  background: "oklch(0.3 0.1 160 / 0.3)",
                  color: "oklch(0.8 0.14 160)",
                  borderColor: "oklch(0.45 0.15 160 / 0.4)",
                }}
              >
                👤 {displayName}
              </Badge>
            )}
            {totalPool > 0 && (
              <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-mono">
                Pool: ₹{totalPool.toLocaleString("en-IN")}
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

      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="space-y-4">
          {/* ── Game Controls ── */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border p-4"
            style={{
              background: "oklch(0.17 0.07 160)",
              borderColor: "oklch(0.3 0.1 160 / 0.35)",
            }}
          >
            <h3
              className="font-display text-base font-bold mb-3 flex items-center gap-2"
              style={{ color: "oklch(0.85 0.12 160)" }}
            >
              🎙️ Game Controls
            </h3>
            <div className="flex flex-wrap gap-3 items-center">
              {gameStatus === "notStarted" && (
                <Button
                  onClick={startGame}
                  data-ocid="player.start.button"
                  className="text-white border-0 font-bold"
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(0.5 0.2 160), oklch(0.4 0.18 170))",
                  }}
                >
                  ▶ Start Game
                </Button>
              )}

              {gameStatus === "inProgress" && (
                <>
                  <Button
                    size="sm"
                    variant={autoCall ? "destructive" : "default"}
                    onClick={() => setAutoCall((v) => !v)}
                    data-ocid="player.autocall.toggle"
                    className="font-bold text-xs"
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
                  >
                    ↺ Reset
                  </Button>
                </>
              )}

              {gameStatus === "completed" && (
                <>
                  <span className="text-sm font-body text-muted-foreground">
                    🏁 All 90 numbers drawn!
                  </span>
                  <Button
                    onClick={resetGame}
                    variant="destructive"
                    size="sm"
                    data-ocid="player.reset.button"
                  >
                    ↺ New Game
                  </Button>
                </>
              )}
            </div>
          </motion.div>

          {/* ── Pre-game setup (ticket count + prize pool) ── */}
          {gameStatus === "notStarted" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card
                className="shadow-lg border"
                style={{
                  background: "oklch(0.17 0.07 160)",
                  borderColor: "oklch(0.4 0.15 160 / 0.4)",
                }}
                data-ocid="setup.prize_pool.card"
              >
                <CardHeader className="pb-3">
                  <CardTitle className="font-display text-base flex items-center gap-2 text-emerald-400">
                    🏆 Prize Pool Setup
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Label className="font-body text-sm whitespace-nowrap">
                      Ticket Price
                    </Label>
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400 font-bold text-sm">
                        ₹
                      </span>
                      <Input
                        type="number"
                        min={1}
                        value={ticketPrice}
                        onChange={(e) =>
                          setTicketPrice(
                            Math.max(1, Number.parseInt(e.target.value) || 1),
                          )
                        }
                        data-ocid="setup.ticket_price.input"
                        className="pl-7 font-mono text-center font-bold text-lg"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Label className="font-body text-sm whitespace-nowrap">
                      My Tickets
                    </Label>
                    <Select value={ticketCount} onValueChange={setTicketCount}>
                      <SelectTrigger
                        data-ocid="player.tickets.select"
                        className="font-body flex-1"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6].map((n) => (
                          <SelectItem
                            key={n}
                            value={String(n)}
                            className="font-body"
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
                      className="font-body text-xs"
                    >
                      Apply
                    </Button>
                  </div>

                  <div
                    className="border rounded-lg px-4 py-2 text-center"
                    style={{
                      background: "oklch(0.25 0.1 160 / 0.3)",
                      borderColor: "oklch(0.45 0.15 160 / 0.3)",
                    }}
                  >
                    <p className="text-emerald-400 text-xs font-body">
                      Total Pool
                    </p>
                    <p className="text-emerald-300 text-2xl font-black font-mono">
                      ₹{totalPool.toLocaleString("en-IN")}
                    </p>
                    <p className="text-muted-foreground text-xs font-body">
                      {players.reduce((s, p) => s + p.tickets.length, 0)}{" "}
                      ticket(s) sold × ₹{ticketPrice}
                    </p>
                  </div>

                  <PrizePoolTable totalPool={totalPool} />
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ── Prize Pool summary during game ── */}
          {gameStatus !== "notStarted" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card
                className="border"
                style={{
                  background: "oklch(0.17 0.07 160)",
                  borderColor: "oklch(0.4 0.15 160 / 0.3)",
                }}
                data-ocid="setup.prize_pool.card"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="font-display text-base flex items-center gap-2 text-emerald-400">
                      🏆 Prize Pool
                      <span className="text-emerald-300 font-mono text-lg font-black">
                        ₹{totalPool.toLocaleString("en-IN")}
                      </span>
                    </CardTitle>
                    <button
                      type="button"
                      onClick={() => setShowPoolBreakdown((v) => !v)}
                      data-ocid="game.prize_pool.toggle"
                      className="text-xs text-muted-foreground hover:text-emerald-400 transition-colors font-body"
                    >
                      {showPoolBreakdown ? "▲ Hide" : "▼ Breakdown"}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground font-body">
                    {players.reduce((s, p) => s + p.tickets.length, 0)} tickets
                    × ₹{ticketPrice} per ticket
                  </p>
                </CardHeader>
                <AnimatePresence>
                  {showPoolBreakdown && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <CardContent className="pt-0">
                        <PrizePoolTable totalPool={totalPool} compact />
                      </CardContent>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </motion.div>
          )}

          {/* ── Current Called Number — ONE number only, BIG ── */}
          <AnimatePresence>
            {calledNumbers.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
              >
                <div
                  className="rounded-xl p-6 border flex flex-col items-center"
                  style={{
                    background: "oklch(0.17 0.07 160)",
                    borderColor: "oklch(0.4 0.15 160 / 0.35)",
                  }}
                >
                  <p className="text-xs font-body text-muted-foreground uppercase tracking-widest mb-4">
                    🔊 Current Number
                  </p>
                  {lastCalled !== undefined && (
                    <motion.div
                      key={lastCalled}
                      initial={{ scale: 0, opacity: 0, rotate: -10 }}
                      animate={{ scale: 1, opacity: 1, rotate: 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 20,
                      }}
                      className="font-display font-black text-8xl w-36 h-36 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0"
                      style={{
                        background:
                          "linear-gradient(135deg, oklch(0.5 0.22 160), oklch(0.38 0.18 175))",
                        color: "white",
                        boxShadow: "0 0 40px oklch(0.5 0.22 160 / 0.5)",
                      }}
                    >
                      {lastCalled}
                    </motion.div>
                  )}
                  <p className="text-muted-foreground text-xs font-body mt-4">
                    {calledNumbers.length} / 90 called
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Number Board Toggle ── */}
          <div>
            <button
              type="button"
              onClick={() => setShowNumberBoard((v) => !v)}
              data-ocid="player.board.toggle"
              className="text-sm font-body text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              {showNumberBoard ? "▲ Hide" : "▼ Show"} Number Board
            </button>
            <AnimatePresence>
              {showNumberBoard && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 overflow-hidden"
                >
                  <NumberBoard calledNumbers={calledNumbers} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {gameStatus === "notStarted" && (
            <div
              className="text-center py-8 rounded-xl"
              style={{ background: "oklch(0.17 0.05 160 / 0.6)" }}
              data-ocid="player.waiting.panel"
            >
              <div className="text-4xl mb-2">⏳</div>
              <p className="font-body text-muted-foreground">
                Press Start Game above to begin!
              </p>
              {livePlayer && (
                <p className="font-body text-xs text-muted-foreground mt-1">
                  Your {livePlayer.tickets.length} ticket
                  {livePlayer.tickets.length !== 1 ? "s are" : " is"} ready!
                </p>
              )}
            </div>
          )}

          {/* Prize Status Bar */}
          <div className="flex flex-wrap gap-2">
            {ALL_PRIZES.map((pt) => {
              const prizeAmount = Math.floor(
                (PRIZE_PERCENTAGES[pt] / 100) * totalPool,
              );
              return (
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
                    ? `${prizes[pt].winner === livePlayer?.name ? "🏆" : "✓"} ${PRIZE_LABELS[pt]}: ${prizes[pt].winner}`
                    : `⭕ ${PRIZE_LABELS[pt]}${prizeAmount > 0 ? ` • ₹${prizeAmount.toLocaleString("en-IN")}` : ""}`}
                </Badge>
              );
            })}
          </div>

          {/* Tickets */}
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {(livePlayer?.tickets ?? []).map((ticket, idx) => (
              <TambolaTicket
                key={ticket.id}
                ticket={ticket}
                playerId={livePlayer!.id}
                playerName={livePlayer!.name}
                ticketIndex={idx}
                onClaim={handleClaim}
                showClaims
              />
            ))}
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
