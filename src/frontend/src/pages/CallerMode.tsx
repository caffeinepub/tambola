import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { NumberBoard } from "../components/NumberBoard";
import {
  PRIZE_EMOJI,
  PRIZE_LABELS,
  type PrizeType,
  useGame,
} from "../context/GameContext";

const PRIZE_TYPES: PrizeType[] = [
  "earlyFive",
  "topLine",
  "middleLine",
  "bottomLine",
  "fullHouse",
];

export function CallerMode() {
  const {
    calledNumbers,
    gameStatus,
    prizes,
    players,
    drawNumber,
    startGame,
    resetGame,
    setMode,
  } = useGame();
  const [autoDraw, setAutoDraw] = useState(false);
  const autoDrawRef = useRef(autoDraw);
  autoDrawRef.current = autoDraw;

  const lastCalled = calledNumbers[calledNumbers.length - 1];
  const [prevNumber, setPrevNumber] = useState<number | undefined>(undefined);
  const [displayKey, setDisplayKey] = useState(0);

  useEffect(() => {
    if (lastCalled !== prevNumber) {
      setPrevNumber(lastCalled);
      setDisplayKey((k) => k + 1);
    }
  }, [lastCalled, prevNumber]);

  const handleDraw = useCallback(() => {
    if (gameStatus === "inProgress" && calledNumbers.length < 90) {
      drawNumber();
    }
  }, [gameStatus, calledNumbers.length, drawNumber]);

  useEffect(() => {
    if (!autoDraw || gameStatus !== "inProgress") return;
    const id = setInterval(() => {
      if (autoDrawRef.current) {
        drawNumber();
      }
    }, 3000);
    return () => clearInterval(id);
  }, [autoDraw, gameStatus, drawNumber]);

  const allPrizesClaimed = PRIZE_TYPES.every(
    (pt) => prizes[pt].winner !== null,
  );

  // Recent numbers (unique, so safe to use as keys)
  const recentNumbers = [...calledNumbers].slice(-8).reverse();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-20 bg-card/95 backdrop-blur border-b border-border">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMode("home")}
            data-ocid="caller.nav.link"
            className="text-muted-foreground hover:text-primary transition-colors text-sm font-body"
          >
            ← Home
          </button>
          <div className="h-4 w-px bg-border" />
          <span className="font-display text-lg font-bold text-primary">
            🎙️ Caller Mode
          </span>
          <div className="ml-auto flex items-center gap-2">
            <Badge
              className={`text-xs ${
                gameStatus === "notStarted"
                  ? "bg-muted text-muted-foreground"
                  : gameStatus === "inProgress"
                    ? "bg-green-600 text-white"
                    : "bg-tambola-crimson text-white"
              }`}
            >
              {gameStatus === "notStarted"
                ? "Not Started"
                : gameStatus === "inProgress"
                  ? "● In Progress"
                  : "Completed"}
            </Badge>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
            {/* Current Number Display */}
            <div
              className="rounded-2xl p-6 text-center shadow-festive"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.25 0.1 30), oklch(0.2 0.08 25))",
              }}
            >
              <p className="text-white/50 text-xs font-body uppercase tracking-widest mb-2">
                Current Number
              </p>
              <AnimatePresence mode="wait">
                {lastCalled ? (
                  <motion.div
                    key={displayKey}
                    initial={{ scale: 0.3, opacity: 0, rotateY: 90 }}
                    animate={{ scale: 1, opacity: 1, rotateY: 0 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="font-display text-8xl font-black text-tambola-gold"
                  >
                    {lastCalled}
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    className="font-display text-7xl text-white/20"
                  >
                    —
                  </motion.div>
                )}
              </AnimatePresence>
              <p className="text-white/40 text-xs font-body mt-3">
                {calledNumbers.length} called · {90 - calledNumbers.length}{" "}
                remaining
              </p>
            </div>

            {/* Recent Numbers */}
            {calledNumbers.length > 0 && (
              <div className="bg-card rounded-xl p-4 border border-border">
                <p className="text-xs font-body text-muted-foreground uppercase tracking-wide mb-2">
                  Recent Numbers
                </p>
                <div className="flex gap-2 flex-wrap">
                  {recentNumbers.map((n, i) => (
                    <span
                      key={n}
                      className={`inline-flex items-center justify-center w-9 h-9 rounded-full font-bold text-sm font-body ${
                        i === 0
                          ? "festive-gradient text-white shadow-md"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {n}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Controls */}
            <div className="bg-card rounded-xl p-4 border border-border space-y-3">
              <p className="text-xs font-body text-muted-foreground uppercase tracking-wide">
                Game Controls
              </p>

              {gameStatus === "notStarted" && (
                <Button
                  className="w-full festive-gradient text-white border-0 font-bold"
                  size="lg"
                  onClick={startGame}
                  data-ocid="caller.start.button"
                >
                  🎲 Start Game
                </Button>
              )}

              {gameStatus === "inProgress" && (
                <>
                  <Button
                    className="w-full festive-gradient text-white border-0 font-bold"
                    size="lg"
                    onClick={handleDraw}
                    disabled={autoDraw || calledNumbers.length >= 90}
                    data-ocid="caller.draw.button"
                  >
                    🎱 Draw Number
                  </Button>

                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="auto-draw"
                      className="text-sm font-body cursor-pointer"
                    >
                      Auto Draw (3s)
                    </Label>
                    <Switch
                      id="auto-draw"
                      checked={autoDraw}
                      onCheckedChange={setAutoDraw}
                      data-ocid="caller.autodraw.switch"
                    />
                  </div>
                </>
              )}

              {(gameStatus === "inProgress" || gameStatus === "completed") && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setAutoDraw(false);
                    resetGame();
                  }}
                  data-ocid="caller.reset.button"
                >
                  🔄 Reset Game
                </Button>
              )}

              {gameStatus === "completed" && (
                <div className="text-center text-sm text-muted-foreground font-body">
                  All 90 numbers called!
                </div>
              )}
            </div>

            {/* Prizes */}
            <div className="bg-card rounded-xl p-4 border border-border">
              <p className="text-xs font-body text-muted-foreground uppercase tracking-wide mb-3">
                Prize Board
              </p>
              <div className="space-y-2">
                {PRIZE_TYPES.map((pt) => {
                  const status = prizes[pt];
                  return (
                    <div
                      key={pt}
                      className={`flex items-center justify-between p-2 rounded-lg ${
                        status.winner
                          ? "bg-green-50 border border-green-200"
                          : "bg-muted/40"
                      }`}
                    >
                      <span className="text-sm font-body">
                        {PRIZE_EMOJI[pt]} {PRIZE_LABELS[pt]}
                      </span>
                      {status.winner ? (
                        <Badge className="bg-green-600 text-white text-xs">
                          {status.winner}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          Unclaimed
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
              {allPrizesClaimed && (
                <p className="text-center text-sm font-bold text-green-600 mt-3">
                  🎉 All prizes claimed!
                </p>
              )}
            </div>
          </div>

          {/* Right — Number Board & Players */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-card rounded-xl p-4 border border-border">
              <p className="text-xs font-body text-muted-foreground uppercase tracking-wide mb-3">
                Number Board
              </p>
              <NumberBoard calledNumbers={calledNumbers} />
            </div>

            <div className="bg-card rounded-xl p-4 border border-border">
              <p className="text-xs font-body text-muted-foreground uppercase tracking-wide mb-3">
                Players ({players.length})
              </p>
              {players.length === 0 ? (
                <div
                  data-ocid="caller.players.empty_state"
                  className="text-center py-8 text-muted-foreground text-sm font-body"
                >
                  No players have joined yet. Players join via Player Mode.
                </div>
              ) : (
                <ScrollArea className="max-h-64">
                  <div className="space-y-2">
                    {players.map((player, idx) => {
                      const wonPrizes = PRIZE_TYPES.filter(
                        (pt) => prizes[pt].winner === player.name,
                      );
                      return (
                        <div
                          key={player.id}
                          data-ocid={`caller.players.row.${idx + 1}`}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/40"
                        >
                          <div>
                            <span className="font-body font-semibold text-sm">
                              {player.name}
                            </span>
                            <span className="text-xs text-muted-foreground ml-2">
                              {player.tickets.length} ticket
                              {player.tickets.length !== 1 ? "s" : ""}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 flex-wrap">
                            {player.disqualifiedTickets.size > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                {player.disqualifiedTickets.size} bogey
                              </Badge>
                            )}
                            {wonPrizes.map((pt) => (
                              <Badge
                                key={pt}
                                className="bg-green-600 text-white text-xs"
                              >
                                {PRIZE_EMOJI[pt]}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </div>
          </div>
        </div>
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
