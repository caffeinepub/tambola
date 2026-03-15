import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Bet } from "../backend.d";
import { Variant_won_lost_open_refunded_matched } from "../backend.d";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

const PRIZE_LABELS: Record<string, string> = {
  early_five: "Early Five",
  corners: "Corners",
  top_line: "Top Line",
  middle_line: "Middle Line",
  bottom_line: "Bottom Line",
  full_house: "Full House",
};

function formatInr(paise: bigint): string {
  return `₹${(Number(paise) / 100).toFixed(0)}`;
}

function shortPrincipal(p: string): string {
  return p ? `${p.slice(0, 6)}…` : "???";
}

function StatusBadge({
  status,
}: { status: Variant_won_lost_open_refunded_matched }) {
  const configs: Record<
    Variant_won_lost_open_refunded_matched,
    { label: string; bg: string; color: string }
  > = {
    [Variant_won_lost_open_refunded_matched.open]: {
      label: "Open",
      bg: "oklch(0.38 0.18 280 / 0.4)",
      color: "oklch(0.85 0.12 280)",
    },
    [Variant_won_lost_open_refunded_matched.matched]: {
      label: "Matched",
      bg: "oklch(0.35 0.18 200 / 0.4)",
      color: "oklch(0.82 0.14 200)",
    },
    [Variant_won_lost_open_refunded_matched.won]: {
      label: "Won 🏆",
      bg: "oklch(0.32 0.2 140 / 0.5)",
      color: "oklch(0.82 0.2 140)",
    },
    [Variant_won_lost_open_refunded_matched.lost]: {
      label: "Lost",
      bg: "oklch(0.28 0.18 25 / 0.45)",
      color: "oklch(0.78 0.16 25)",
    },
    [Variant_won_lost_open_refunded_matched.refunded]: {
      label: "Refunded",
      bg: "oklch(0.25 0.05 280 / 0.5)",
      color: "oklch(0.65 0.05 280)",
    },
  };
  const cfg =
    configs[status] ?? configs[Variant_won_lost_open_refunded_matched.open];
  return (
    <Badge
      className="text-xs px-2 py-0"
      style={{ background: cfg.bg, color: cfg.color }}
    >
      {cfg.label}
    </Badge>
  );
}

interface PvpBetStatusProps {
  gameId: string;
}

export function PvpBetStatus({ gameId }: PvpBetStatusProps) {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchBets = useCallback(async () => {
    if (!actor || !identity) return;
    setLoading(true);
    try {
      const allBets = await actor.getUserBets(identity.getPrincipal());
      setBets(allBets.filter((b) => b.gameId === gameId));
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [actor, identity, gameId]);

  useEffect(() => {
    void fetchBets();
    intervalRef.current = setInterval(() => void fetchBets(), 15000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchBets]);

  if (!identity) return null;

  const activeBets = bets.filter(
    (b) => b.status !== Variant_won_lost_open_refunded_matched.refunded,
  );

  return (
    <div
      data-ocid="pvp-status.panel"
      className="rounded-xl p-3"
      style={{
        background: "oklch(0.17 0.1 160 / 0.35)",
        border: "1px solid oklch(0.38 0.16 160 / 0.35)",
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm">⚔️</span>
        <h4
          className="font-display text-sm font-semibold"
          style={{ color: "oklch(0.82 0.14 160)" }}
        >
          My PvP Bets
        </h4>
        {loading && (
          <Loader2
            size={12}
            className="animate-spin ml-auto"
            style={{ color: "oklch(0.6 0.1 160)" }}
            data-ocid="pvp-status.loading_state"
          />
        )}
      </div>
      {activeBets.length === 0 ? (
        <p
          data-ocid="pvp-status.empty_state"
          className="text-xs font-body text-center py-3"
          style={{ color: "oklch(0.55 0.08 160)" }}
        >
          No active bets for this game
        </p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {activeBets.map((bet, i) => (
            <div
              key={bet.id}
              data-ocid={`pvp-status.item.${i + 1}`}
              className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg"
              style={{
                background:
                  bet.status === Variant_won_lost_open_refunded_matched.won
                    ? "oklch(0.22 0.15 140 / 0.4)"
                    : bet.status === Variant_won_lost_open_refunded_matched.lost
                      ? "oklch(0.2 0.12 25 / 0.35)"
                      : "oklch(0.2 0.1 160 / 0.35)",
                border:
                  bet.status === Variant_won_lost_open_refunded_matched.won
                    ? "1px solid oklch(0.45 0.2 140 / 0.4)"
                    : bet.status === Variant_won_lost_open_refunded_matched.lost
                      ? "1px solid oklch(0.4 0.15 25 / 0.35)"
                      : "1px solid oklch(0.35 0.12 160 / 0.3)",
              }}
            >
              <div className="flex-1 min-w-0">
                <p
                  className="text-xs font-body font-medium"
                  style={{ color: "oklch(0.8 0.1 160)" }}
                >
                  {PRIZE_LABELS[bet.prizeType] ?? bet.prizeType}
                </p>
                {bet.acceptorId && (
                  <p
                    className="text-xs font-mono"
                    style={{ color: "oklch(0.55 0.08 160)" }}
                  >
                    vs {shortPrincipal(bet.acceptorId.toString())}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span
                  className="font-mono text-xs font-bold"
                  style={{ color: "oklch(0.85 0.18 60)" }}
                >
                  {formatInr(bet.stakeAmount)}
                </span>
                <StatusBadge status={bet.status} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
