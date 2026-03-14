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

type CellData = {
  cell: number | null;
  cellKey: string;
  isCalled: boolean;
  isBlank: boolean;
};

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

  // Manual marking state — players tap called numbers to mark them
  const [markedCells, setMarkedCells] = useState<Set<number>>(new Set());

  const player = players.find((p) => p.id === playerId);
  const isDisqualified = player?.disqualifiedTickets.has(ticket.id) ?? false;

  const claimedByThis = Object.entries(prizes)
    .filter(([, s]) => s.ticketId === ticket.id)
    .map(([k]) => k as PrizeType);

  const flatCells: CellData[] = ticket.rows.flatMap((row, rowIdx) =>
    row.map((cell, colIdx) => ({
      cell,
      cellKey: `r${rowIdx}c${colIdx}`,
      isCalled: cell !== null && calledSet.has(cell),
      isBlank: cell === null,
    })),
  );

  const handleCellClick = (cell: number | null) => {
    if (cell === null || !calledSet.has(cell)) return;
    setMarkedCells((prev) => {
      const next = new Set(prev);
      if (next.has(cell)) {
        next.delete(cell);
      } else {
        next.add(cell);
      }
      return next;
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: isDisqualified ? 0.45 : 1, y: 0 }}
      transition={{ delay: ticketIndex * 0.1 }}
      className={`rounded-xl overflow-hidden shadow-ticket border-2 ${
        isDisqualified ? "border-gray-400 grayscale" : "border-black"
      }`}
    >
      {/* Ticket Header — black background, white text */}
      <div className="bg-black px-3 py-2 flex items-center justify-between gap-2">
        <span className="font-display text-white font-bold text-sm tracking-wide">
          🎫 Ticket #{ticketIndex + 1}
        </span>
        <span className="text-white/70 text-xs font-body flex-1 truncate">
          {playerName}
        </span>

        {isDisqualified && (
          <Badge variant="destructive" className="text-xs">
            Disqualified
          </Badge>
        )}
      </div>

      {/* Ticket Grid — white background */}
      <div className="p-3 bg-white">
        <div
          className="grid gap-1"
          style={{ gridTemplateColumns: "repeat(9, minmax(0, 1fr))" }}
        >
          {flatCells.map(({ cell, cellKey, isCalled, isBlank }) => {
            const isMarked = cell !== null && markedCells.has(cell);
            const canMark = isCalled && !isMarked;

            let cellClass = "tambola-ticket-cell ";
            if (isBlank) {
              cellClass += "bg-gray-100 border border-gray-200 cursor-default";
            } else if (isMarked) {
              cellClass +=
                "bg-black text-white line-through border border-black cursor-pointer";
            } else if (canMark) {
              cellClass +=
                "bg-white border-2 border-green-500 text-black cursor-pointer hover:bg-green-50 transition-colors";
            } else {
              cellClass +=
                "bg-white border border-gray-300 text-gray-400 cursor-default";
            }

            return (
              <div
                key={cellKey}
                className={cellClass}
                style={{ borderRadius: "3px" }}
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
        <p className="text-center text-xs text-gray-400 font-body mt-2">
          Tap called numbers (green border) to mark them
        </p>
      </div>

      {/* Prize Claim Buttons */}
      {showClaims && !isDisqualified && gameStatus === "inProgress" && (
        <div className="bg-gray-50 px-3 py-2 flex flex-wrap gap-1.5 border-t border-gray-200">
          {PRIZE_TYPES.map((pt) => {
            const alreadyClaimed = prizes[pt].winner !== null;
            const wonByThis = claimedByThis.includes(pt);
            const qualified =
              !alreadyClaimed && checkQualification(ticket.id, pt);

            if (wonByThis) {
              return (
                <Badge
                  key={pt}
                  className="bg-green-600 text-white text-xs px-2 py-1"
                >
                  {PRIZE_EMOJI[pt]} Won!
                </Badge>
              );
            }

            if (alreadyClaimed && !wonByThis) {
              return null;
            }

            return (
              <Button
                key={pt}
                size="sm"
                variant={qualified ? "default" : "outline"}
                disabled={!qualified}
                className={`text-xs h-7 px-2 ${
                  qualified
                    ? "bg-black text-white hover:bg-gray-800 border-0"
                    : ""
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
