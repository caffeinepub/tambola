import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import {
  PRIZE_EMOJI,
  PRIZE_LABELS,
  type PrizeType,
  useGame,
} from "../context/GameContext";
import type { Ticket } from "../utils/ticketGenerator";

type Props = {
  ticket: Ticket;
  playerId: string;
  playerName: string;
  ticketIndex: number;
  onClaim?: (ticketId: string, prizeType: PrizeType) => void;
  showClaims?: boolean;
};

const PRIZE_TYPES: PrizeType[] = [
  "earlyFive",
  "topLine",
  "middleLine",
  "bottomLine",
  "fullHouse",
];

const ROW_LABELS = ["1–30", "31–60", "61–90"];

export function TambolaTicket({
  ticket,
  playerId,
  playerName,
  ticketIndex,
  onClaim,
  showClaims = false,
}: Props) {
  const { calledNumbers, prizes, checkQualification, players, gameStatus } =
    useGame();

  const calledSet = useMemo(() => new Set(calledNumbers), [calledNumbers]);
  const [markedCells, setMarkedCells] = useState<Set<number>>(new Set());

  const player = players.find((p) => p.id === playerId);
  const isDisqualified = player?.disqualifiedTickets.has(ticket.id) ?? false;

  const claimedByThis = Object.entries(prizes)
    .filter(([, s]) => s.ticketId === ticket.id)
    .map(([k]) => k as PrizeType);

  const handleCellClick = (cell: number | null) => {
    if (cell === null || !calledSet.has(cell)) return;
    setMarkedCells((prev) => {
      const next = new Set(prev);
      if (next.has(cell)) next.delete(cell);
      else next.add(cell);
      return next;
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: isDisqualified ? 0.45 : 1, y: 0 }}
      transition={{ delay: ticketIndex * 0.1 }}
      className={`rounded-lg overflow-hidden shadow-lg border-2 ${
        isDisqualified ? "border-gray-400 grayscale" : "border-black"
      }`}
    >
      {/* Header — pure black */}
      <div className="bg-black px-3 py-2 flex items-center justify-between gap-2">
        <span className="text-white font-bold text-sm tracking-wide">
          🎫 Ticket #{ticketIndex + 1}
        </span>
        <span className="text-white/70 text-xs flex-1 truncate text-right">
          {playerName}
        </span>
        {isDisqualified && (
          <Badge variant="destructive" className="text-xs ml-2">
            Disqualified
          </Badge>
        )}
      </div>

      {/* Ticket Grid — rows with labels */}
      <div className="bg-white">
        {ticket.rows.map((row, rowIdx) => (
          <div key={ROW_LABELS[rowIdx]} className="flex items-stretch">
            {/* Row range label */}
            <div
              className={`flex items-center justify-center text-white font-bold text-xs writing-mode-vertical shrink-0 ${
                rowIdx < 2 ? "border-b-2 border-black" : ""
              }`}
              style={{
                width: "1.8rem",
                background: "#111",
                fontSize: "0.65rem",
                letterSpacing: "0.05em",
                borderRight: "2px solid black",
                writingMode: "vertical-rl",
                transform: "rotate(180deg)",
                padding: "4px 2px",
              }}
            >
              {ROW_LABELS[rowIdx]}
            </div>

            {/* 9 cells for this row */}
            <div
              className={`flex-1 grid ${
                rowIdx < 2 ? "border-b-2 border-black" : ""
              }`}
              style={{ gridTemplateColumns: "repeat(9, minmax(0, 1fr))" }}
            >
              {row.map((cell, colIdx) => {
                const isCalled = cell !== null && calledSet.has(cell);
                const isBlank = cell === null;
                const isMarked = cell !== null && markedCells.has(cell);
                const canMark = isCalled && !isMarked;

                let cellClass =
                  "aspect-square flex items-center justify-center font-semibold select-none border-r border-gray-300 last:border-r-0 ";

                if (isBlank) {
                  cellClass += "bg-gray-100 cursor-default";
                } else if (isMarked) {
                  cellClass += "bg-black text-white font-black cursor-pointer";
                } else if (canMark) {
                  cellClass +=
                    "bg-white border-2 border-black text-black font-black cursor-pointer ring-2 ring-black ring-offset-1 ring-offset-white";
                } else {
                  cellClass += "bg-white text-gray-800 cursor-default";
                }

                return (
                  <div
                    key={`${ticket.id}-r${rowIdx}c${colIdx}`}
                    className={cellClass}
                    style={{ minHeight: "2.4rem", fontSize: "0.78rem" }}
                    onClick={() => handleCellClick(cell)}
                    role={isCalled && !isBlank ? "button" : undefined}
                    tabIndex={isCalled && !isBlank ? 0 : undefined}
                    onKeyDown={(e) =>
                      e.key === "Enter" || e.key === " "
                        ? handleCellClick(cell)
                        : undefined
                    }
                    aria-pressed={isMarked ? true : undefined}
                    aria-label={
                      cell !== null
                        ? isMarked
                          ? `${cell} marked`
                          : isCalled
                            ? `${cell} called — tap to mark`
                            : `${cell}`
                        : undefined
                    }
                  >
                    {cell !== null ? cell : ""}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        <p className="text-center text-xs text-gray-400 py-1.5 border-t border-gray-200">
          Tap called numbers to mark them
        </p>
      </div>

      {/* Prize Claim Buttons */}
      {showClaims && !isDisqualified && gameStatus === "inProgress" && (
        <div className="bg-gray-100 px-3 py-2 flex flex-wrap gap-1.5 border-t-2 border-black">
          {PRIZE_TYPES.map((pt) => {
            const alreadyClaimed = prizes[pt].winner !== null;
            const wonByThis = claimedByThis.includes(pt);
            const qualified =
              !alreadyClaimed && checkQualification(ticket.id, pt);

            if (wonByThis) {
              return (
                <Badge
                  key={pt}
                  className="bg-black text-white text-xs px-2 py-1"
                >
                  {PRIZE_EMOJI[pt]} Won!
                </Badge>
              );
            }

            if (alreadyClaimed && !wonByThis) return null;

            return (
              <Button
                key={pt}
                size="sm"
                variant={qualified ? "default" : "outline"}
                disabled={!qualified}
                className={`text-xs h-7 px-2 ${
                  qualified
                    ? "bg-black text-white hover:bg-gray-800 border-0"
                    : "border-gray-300 text-gray-400"
                }`}
                data-ocid={`ticket.${pt}.button.${ticketIndex + 1}`}
                onClick={() => onClaim?.(ticket.id, pt)}
              >
                {PRIZE_EMOJI[pt]} {PRIZE_LABELS[pt]}
              </Button>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
