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
import { TambolaTicket } from "../components/TambolaTicket";
import { PRIZE_LABELS, type PrizeType, useGame } from "../context/GameContext";

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
    drawNumber,
    resetGame,
  } = useGame();
  const [playerName, setPlayerName] = useState("");
  const [ticketCount, setTicketCount] = useState("1");
  const [currentPlayer, setCurrentPlayer] = useState<ReturnType<
    typeof addPlayer
  > | null>(null);
  const [hasJoined, setHasJoined] = useState(false);
  const [showNumberBoard, setShowNumberBoard] = useState(false);
  const [autoCall, setAutoCall] = useState(false);
  const [autoSpeed, setAutoSpeed] = useState("5"); // seconds
  const autoCallRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto call interval
  useEffect(() => {
    if (autoCall && gameStatus === "inProgress") {
      autoCallRef.current = setInterval(() => {
        drawNumber();
      }, Number(autoSpeed) * 1000);
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
  }, [autoCall, gameStatus, autoSpeed, drawNumber]);

  // Stop auto call when game completes
  useEffect(() => {
    if (gameStatus !== "inProgress") {
      setAutoCall(false);
    }
  }, [gameStatus]);

  // Voice announcement for new numbers — spoken once, clearly
  const prevCalledLengthRef = useRef(calledNumbers.length);
  useEffect(() => {
    if (calledNumbers.length > prevCalledLengthRef.current) {
      const lastNumber = calledNumbers[calledNumbers.length - 1];
      if (
        typeof window !== "undefined" &&
        window.speechSynthesis &&
        lastNumber !== undefined
      ) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance();
        utterance.lang = "en-IN";
        utterance.text = `Number ${lastNumber}`;
        utterance.rate = 0.75;
        utterance.pitch = 1.0;
        utterance.volume = 1;
        window.speechSynthesis.speak(utterance);
      }
    }
    prevCalledLengthRef.current = calledNumbers.length;
  }, [calledNumbers]);

  const handleJoin = useCallback(() => {
    if (!playerName.trim()) {
      toast.error("Please enter your name!");
      return;
    }
    const player = addPlayer(playerName.trim(), Number.parseInt(ticketCount));
    setCurrentPlayer(player);
    setHasJoined(true);
    toast.success(`Welcome, ${playerName}! You have ${ticketCount} ticket(s).`);
  }, [playerName, ticketCount, addPlayer]);

  const handleClaim = useCallback(
    (ticketId: string, prizeType: PrizeType) => {
      if (!currentPlayer) return;
      const result = claimPrize(currentPlayer.id, ticketId, prizeType);
      switch (result) {
        case "won":
          toast.success(
            `🎉 ${PRIZE_LABELS[prizeType]}! You won! Congratulations, ${currentPlayer.name}!`,
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
    [currentPlayer, claimPrize],
  );

  const livePlayer = currentPlayer
    ? (players.find((p) => p.id === currentPlayer.id) ?? currentPlayer)
    : null;

  const lastCalled = calledNumbers[calledNumbers.length - 1];
  // Show only the last 5 called numbers (most recent large + previous 4 as small circles)
  const recentOthers = [...calledNumbers].slice(-5).reverse().slice(1);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-20 bg-card/95 backdrop-blur border-b border-border">
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
          <span className="font-display text-lg font-bold text-secondary">
            🎫 Tambola
          </span>
          {hasJoined && livePlayer && (
            <Badge className="ml-2 bg-secondary text-secondary-foreground text-xs">
              {livePlayer.name}
            </Badge>
          )}
          <div className="ml-auto flex items-center gap-2">
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
        {!hasJoined ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md mx-auto"
          >
            <div className="bg-card rounded-2xl p-8 border border-border shadow-festive">
              <div className="text-center mb-6">
                <div className="text-5xl mb-3">🎫</div>
                <h2 className="font-display text-2xl font-bold text-foreground">
                  Join the Game
                </h2>
                <p className="text-muted-foreground text-sm font-body mt-1">
                  Enter your name and get your tickets
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label
                    htmlFor="player-name"
                    className="font-body text-sm mb-1.5 block"
                  >
                    Your Name
                  </Label>
                  <Input
                    id="player-name"
                    placeholder="e.g. Priya Sharma"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                    data-ocid="player.name.input"
                    className="font-body"
                    autoFocus
                  />
                </div>

                <div>
                  <Label
                    htmlFor="ticket-count"
                    className="font-body text-sm mb-1.5 block"
                  >
                    Number of Tickets
                  </Label>
                  <Select value={ticketCount} onValueChange={setTicketCount}>
                    <SelectTrigger
                      id="ticket-count"
                      data-ocid="player.tickets.select"
                      className="font-body"
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
                </div>

                <Button
                  className="w-full festive-gradient text-white border-0 font-bold text-base mt-2"
                  size="lg"
                  onClick={handleJoin}
                  data-ocid="player.join.button"
                >
                  🎲 Get My Tickets!
                </Button>
              </div>
            </div>

            {gameStatus === "notStarted" && (
              <p className="text-center text-sm text-muted-foreground font-body mt-4">
                ⏳ Start the game from Game Controls after joining.
              </p>
            )}
          </motion.div>
        ) : (
          <div className="space-y-4">
            {/* ── Game Controls (Caller section) ── */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-xl border border-border p-4"
            >
              <h3 className="font-display text-base font-bold text-foreground mb-3 flex items-center gap-2">
                🎙️ Game Controls
              </h3>
              <div className="flex flex-wrap gap-3 items-center">
                {gameStatus === "notStarted" && (
                  <Button
                    onClick={startGame}
                    data-ocid="player.start.button"
                    className="festive-gradient text-white border-0 font-bold"
                  >
                    ▶ Start Game
                  </Button>
                )}

                {gameStatus === "inProgress" && (
                  <>
                    <Button
                      onClick={drawNumber}
                      disabled={autoCall}
                      data-ocid="player.draw.button"
                      className="festive-gradient text-white border-0 font-bold disabled:opacity-50"
                    >
                      🎲 Draw Number
                    </Button>

                    {/* Auto Call controls */}
                    <div className="flex items-center gap-2 bg-muted/60 rounded-lg px-3 py-1.5">
                      <Button
                        size="sm"
                        variant={autoCall ? "destructive" : "default"}
                        onClick={() => setAutoCall((v) => !v)}
                        data-ocid="player.autocall.toggle"
                        className="font-bold text-xs h-7 px-3"
                      >
                        {autoCall ? "⏹ Stop Auto" : "▶ Auto Call"}
                      </Button>
                      <Select
                        value={autoSpeed}
                        onValueChange={(v) => {
                          setAutoSpeed(v);
                          // Restart interval with new speed if running
                          if (autoCall) {
                            setAutoCall(false);
                            setTimeout(() => setAutoCall(true), 50);
                          }
                        }}
                        disabled={autoCall}
                      >
                        <SelectTrigger
                          data-ocid="player.autospeed.select"
                          className="h-7 text-xs w-20 font-body"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="3" className="text-xs font-body">
                            3 sec
                          </SelectItem>
                          <SelectItem value="5" className="text-xs font-body">
                            5 sec
                          </SelectItem>
                          <SelectItem value="8" className="text-xs font-body">
                            8 sec
                          </SelectItem>
                          <SelectItem value="10" className="text-xs font-body">
                            10 sec
                          </SelectItem>
                          <SelectItem value="15" className="text-xs font-body">
                            15 sec
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

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

            {/* ── Called Numbers (last 5 only) ── */}
            <AnimatePresence>
              {calledNumbers.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                >
                  <div className="bg-card rounded-xl p-4 border border-border">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-body text-muted-foreground uppercase tracking-wide">
                        Last 5 Called
                      </p>
                      <span className="text-xs font-body text-muted-foreground">
                        {calledNumbers.length} / 90
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      {lastCalled && (
                        <motion.div
                          key={lastCalled}
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="festive-gradient text-white font-display font-black text-3xl w-14 h-14 rounded-xl flex items-center justify-center shadow-festive flex-shrink-0"
                        >
                          {lastCalled}
                        </motion.div>
                      )}
                      <div className="flex gap-1.5 flex-wrap">
                        {recentOthers.map((n) => (
                          <span
                            key={n}
                            className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-muted text-muted-foreground font-bold text-sm font-body"
                          >
                            {n}
                          </span>
                        ))}
                      </div>
                    </div>
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
                className="text-center py-8 bg-muted/40 rounded-xl"
                data-ocid="player.waiting.panel"
              >
                <div className="text-4xl mb-2">⏳</div>
                <p className="font-body text-muted-foreground">
                  Press Start Game above to begin!
                </p>
                <p className="font-body text-xs text-muted-foreground mt-1">
                  Your {livePlayer?.tickets.length} ticket
                  {(livePlayer?.tickets.length ?? 1) !== 1 ? "s are" : " is"}{" "}
                  ready!
                </p>
              </div>
            )}

            {/* Prize Status Bar */}
            <div className="flex flex-wrap gap-2">
              {(
                [
                  "earlyFive",
                  "topLine",
                  "middleLine",
                  "bottomLine",
                  "fullHouse",
                ] as PrizeType[]
              ).map((pt) => (
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
                    ? `${
                        prizes[pt].winner === livePlayer?.name ? "🏆" : "✓"
                      } ${PRIZE_LABELS[pt]}: ${prizes[pt].winner}`
                    : `⭕ ${PRIZE_LABELS[pt]}`}
                </Badge>
              ))}
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
        )}
      </main>

      <footer className="py-3 text-center text-xs text-muted-foreground font-body border-t border-border">
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
