import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  Coins,
  Copy,
  Loader2,
  Ticket,
  Trophy,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import type { Bet } from "../backend.d";
import type { Variant_won_lost_open_refunded_matched } from "../backend.d";
import { useGame } from "../context/GameContext";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

function maskMobile(mobile: string): string {
  if (mobile.length <= 4) return mobile;
  const visible = mobile.slice(-4);
  const masked = "\u2022".repeat(mobile.length - 4);
  return masked + visible;
}

function formatDate(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatInr(paise: bigint): string {
  return `\u20b9${(Number(paise) / 100).toFixed(0)}`;
}

const PRIZE_MAP: Record<string, string> = {
  early_five: "Early Five",
  corners: "Corners",
  top_line: "Top Line",
  middle_line: "Middle Line",
  bottom_line: "Bottom Line",
  full_house: "Full House",
};

const BET_STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; color: string }
> = {
  won: {
    label: "Won",
    bg: "oklch(0.28 0.18 140 / 0.45)",
    color: "oklch(0.82 0.2 140)",
  },
  lost: {
    label: "Lost",
    bg: "oklch(0.25 0.16 25 / 0.4)",
    color: "oklch(0.75 0.16 25)",
  },
  open: {
    label: "Open",
    bg: "oklch(0.32 0.16 280 / 0.4)",
    color: "oklch(0.8 0.12 280)",
  },
  matched: {
    label: "Matched",
    bg: "oklch(0.3 0.16 200 / 0.4)",
    color: "oklch(0.78 0.14 200)",
  },
  refunded: {
    label: "Refunded",
    bg: "oklch(0.22 0.05 280 / 0.4)",
    color: "oklch(0.6 0.05 280)",
  },
};

function PvpBetHistorySection() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!actor || !identity) return;
    setLoading(true);
    actor
      .getUserBets(identity.getPrincipal())
      .then(setBets)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [actor, identity]);

  if (loading) {
    return (
      <div
        data-ocid="profile.bets.loading_state"
        className="flex items-center gap-2 py-6 justify-center"
      >
        <Loader2
          size={18}
          className="animate-spin"
          style={{ color: "oklch(0.65 0.1 280)" }}
        />
        <span
          className="text-sm font-body"
          style={{ color: "oklch(0.6 0.08 280)" }}
        >
          Loading bet history...
        </span>
      </div>
    );
  }

  if (bets.length === 0) {
    return (
      <div
        data-ocid="profile.bets.empty_state"
        className="flex flex-col items-center justify-center text-center py-10"
      >
        <div className="text-4xl mb-3">&#x2694;&#xFE0F;</div>
        <p
          className="font-display text-base font-semibold mb-1"
          style={{ color: "oklch(0.7 0.08 280)" }}
        >
          No PvP bets yet
        </p>
        <p
          className="text-sm font-body"
          style={{ color: "oklch(0.5 0.06 280)" }}
        >
          Join a game and challenge other players to real money bets!
        </p>
      </div>
    );
  }

  return (
    <div
      data-ocid="profile.bets.list"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
    >
      {bets.map((bet, idx) => {
        const statusKey =
          bet.status as unknown as Variant_won_lost_open_refunded_matched;
        const statusStr = String(statusKey);
        const cfg = BET_STATUS_CONFIG[statusStr] ?? BET_STATUS_CONFIG.open;
        return (
          <div
            key={bet.id}
            data-ocid={`profile.bets.item.${idx + 1}`}
            className="rounded-xl px-4 py-3"
            style={{
              background: cfg.bg,
              border: "1px solid oklch(0.38 0.12 280 / 0.3)",
            }}
          >
            <div className="flex items-center justify-between mb-1">
              <span
                className="text-sm font-body font-medium"
                style={{ color: "oklch(0.88 0.1 280)" }}
              >
                {PRIZE_MAP[bet.prizeType] ?? bet.prizeType}
              </span>
              <span
                className="text-xs font-mono font-bold"
                style={{ color: cfg.color }}
              >
                {cfg.label}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span
                className="text-xs font-mono"
                style={{ color: "oklch(0.88 0.18 60)" }}
              >
                {formatInr(bet.stakeAmount)}
              </span>
              {bet.acceptorId && (
                <span
                  className="text-xs font-mono"
                  style={{ color: "oklch(0.55 0.08 280)" }}
                >
                  vs {bet.acceptorId.toString().slice(0, 6)}...
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function Profile() {
  const { setMode, authPlayer, gameHistory } = useGame();
  const [copied, setCopied] = useState(false);

  if (!authPlayer) {
    setMode("home");
    return null;
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(authPlayer.uniqueId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const cardStyle = {
    background: "oklch(0.18 0.1 280 / 0.8)",
    border: "1px solid oklch(0.35 0.15 280 / 0.4)",
  };

  return (
    <div
      data-ocid="profile.page"
      className="min-h-screen flex flex-col"
      style={{
        background:
          "linear-gradient(160deg, oklch(0.16 0.1 280) 0%, oklch(0.12 0.06 300) 100%)",
      }}
    >
      {/* Header */}
      <header
        className="flex items-center gap-4 px-6 py-4 border-b"
        style={{ borderColor: "oklch(0.3 0.12 280 / 0.3)" }}
      >
        <button
          type="button"
          data-ocid="profile.back_button"
          onClick={() => setMode("home")}
          className="flex items-center gap-2 text-sm font-body px-3 py-1.5 rounded-lg hover:opacity-80 transition-opacity"
          style={{
            background: "oklch(0.25 0.12 280 / 0.5)",
            color: "oklch(0.8 0.1 280)",
            border: "1px solid oklch(0.4 0.15 280 / 0.3)",
          }}
        >
          <ArrowLeft size={14} />
          <span>Back</span>
        </button>
        <h1
          className="font-display text-2xl font-bold"
          style={{ color: "oklch(0.92 0.1 280)" }}
        >
          My Profile
        </h1>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto px-6 py-8 max-w-4xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left column: Identity + Wallet */}
            <div className="flex flex-col gap-6">
              {/* Section 1 - Player Identity */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="rounded-2xl p-6"
                style={cardStyle}
              >
                <div className="flex items-center gap-2 mb-4">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                    style={{ background: "oklch(0.45 0.22 280 / 0.4)" }}
                  >
                    &#x1F464;
                  </div>
                  <h2
                    className="font-display text-base font-semibold"
                    style={{ color: "oklch(0.75 0.1 280)" }}
                  >
                    Player Identity
                  </h2>
                </div>

                {/* Player Name */}
                <div className="mb-5">
                  <p
                    className="text-xs uppercase tracking-widest mb-1 font-body"
                    style={{ color: "oklch(0.55 0.08 280)" }}
                  >
                    Name
                  </p>
                  <p
                    className="font-display text-3xl font-bold"
                    style={{ color: "oklch(0.95 0.08 280)" }}
                  >
                    {authPlayer.name}
                  </p>
                </div>

                {/* Unique ID */}
                <div className="mb-5">
                  <p
                    className="text-xs uppercase tracking-widest mb-1 font-body"
                    style={{ color: "oklch(0.55 0.08 280)" }}
                  >
                    Unique ID
                  </p>
                  <div className="flex items-center gap-3">
                    <span
                      className="font-mono text-2xl font-bold tracking-widest"
                      style={{ color: "oklch(0.85 0.18 170)" }}
                    >
                      {authPlayer.uniqueId}
                    </span>
                    <button
                      type="button"
                      data-ocid="profile.copy_button"
                      onClick={handleCopy}
                      className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg transition-all"
                      style={{
                        background: copied
                          ? "oklch(0.35 0.18 140 / 0.4)"
                          : "oklch(0.28 0.12 280 / 0.6)",
                        color: copied
                          ? "oklch(0.8 0.18 140)"
                          : "oklch(0.7 0.1 280)",
                        border: copied
                          ? "1px solid oklch(0.5 0.18 140 / 0.4)"
                          : "1px solid oklch(0.4 0.12 280 / 0.3)",
                      }}
                    >
                      {copied ? (
                        <>
                          <Check size={11} />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy size={11} />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Mobile */}
                <div>
                  <p
                    className="text-xs uppercase tracking-widest mb-1 font-body"
                    style={{ color: "oklch(0.55 0.08 280)" }}
                  >
                    Mobile
                  </p>
                  <p
                    className="font-mono text-lg"
                    style={{ color: "oklch(0.78 0.08 280)" }}
                  >
                    {maskMobile(authPlayer.mobile)}
                  </p>
                </div>
              </motion.div>

              {/* Section 2 - Wallet */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="rounded-2xl p-6"
                style={{
                  background: "oklch(0.2 0.12 160 / 0.35)",
                  border: "1px solid oklch(0.4 0.16 160 / 0.35)",
                }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: "oklch(0.45 0.2 160 / 0.35)" }}
                  >
                    <Coins size={16} style={{ color: "oklch(0.8 0.18 160)" }} />
                  </div>
                  <h2
                    className="font-display text-base font-semibold"
                    style={{ color: "oklch(0.75 0.12 160)" }}
                  >
                    Wallet
                  </h2>
                </div>
                <p
                  className="text-xs uppercase tracking-widest mb-1 font-body"
                  style={{ color: "oklch(0.55 0.1 160)" }}
                >
                  Wallet Balance
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl">&#x1FA99;</span>
                  <span
                    className="font-display text-4xl font-bold"
                    style={{ color: "oklch(0.9 0.18 160)" }}
                  >
                    {authPlayer.wallet.toLocaleString()}
                  </span>
                  <span
                    className="text-sm font-body"
                    style={{ color: "oklch(0.6 0.1 160)" }}
                  >
                    coins
                  </span>
                </div>
              </motion.div>
            </div>

            {/* Right column: Game History */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="rounded-2xl p-6 flex flex-col"
              style={cardStyle}
            >
              <div className="flex items-center gap-2 mb-4">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: "oklch(0.45 0.22 60 / 0.3)" }}
                >
                  <Trophy size={16} style={{ color: "oklch(0.8 0.18 60)" }} />
                </div>
                <h2
                  className="font-display text-base font-semibold"
                  style={{ color: "oklch(0.82 0.12 60)" }}
                >
                  Game History
                </h2>
                {gameHistory.length > 0 && (
                  <span
                    className="ml-auto text-xs font-mono px-2 py-0.5 rounded-full"
                    style={{
                      background: "oklch(0.3 0.12 280 / 0.5)",
                      color: "oklch(0.7 0.1 280)",
                    }}
                  >
                    {gameHistory.length} game
                    {gameHistory.length !== 1 ? "s" : ""}
                  </span>
                )}
              </div>

              {gameHistory.length === 0 ? (
                <div
                  data-ocid="profile.history.empty_state"
                  className="flex-1 flex flex-col items-center justify-center text-center py-12"
                >
                  <div className="text-5xl mb-4">&#x1F3B2;</div>
                  <p
                    className="font-display text-lg font-semibold mb-1"
                    style={{ color: "oklch(0.7 0.08 280)" }}
                  >
                    No games played yet
                  </p>
                  <p
                    className="text-sm font-body"
                    style={{ color: "oklch(0.5 0.06 280)" }}
                  >
                    Play your first game to see your history here!
                  </p>
                </div>
              ) : (
                <ScrollArea
                  className="flex-1 -mr-2 pr-2"
                  style={{ maxHeight: "420px" }}
                >
                  <div
                    data-ocid="profile.history.list"
                    className="flex flex-col gap-2"
                  >
                    {gameHistory.map((entry, idx) => (
                      <div
                        key={`${entry.date}-${idx}`}
                        data-ocid={`profile.history.item.${idx + 1}`}
                        className="rounded-xl px-4 py-3"
                        style={{
                          background: "oklch(0.22 0.1 280 / 0.5)",
                          border: "1px solid oklch(0.32 0.12 280 / 0.3)",
                        }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-1">
                              <CalendarDays
                                size={11}
                                style={{ color: "oklch(0.55 0.08 280)" }}
                              />
                              <span
                                className="text-xs font-body"
                                style={{ color: "oklch(0.6 0.08 280)" }}
                              >
                                {formatDate(entry.date)}
                              </span>
                            </div>
                            <p
                              className="text-sm font-body font-medium truncate"
                              style={{
                                color:
                                  entry.prizesWon.length > 0
                                    ? "oklch(0.85 0.18 80)"
                                    : "oklch(0.65 0.06 280)",
                              }}
                            >
                              {entry.prizesWon.length > 0
                                ? `&#x1F3C6; ${entry.prizesWon.join(", ")}`
                                : "No prizes"}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Ticket
                              size={11}
                              style={{ color: "oklch(0.55 0.08 280)" }}
                            />
                            <span
                              className="text-xs font-mono"
                              style={{ color: "oklch(0.6 0.08 280)" }}
                            >
                              {entry.ticketCount}t
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </motion.div>

            {/* PvP Bet History - full width */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="rounded-2xl p-6 flex flex-col md:col-span-2"
              style={cardStyle}
            >
              <div className="flex items-center gap-2 mb-4">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                  style={{ background: "oklch(0.45 0.22 280 / 0.35)" }}
                >
                  &#x2694;&#xFE0F;
                </div>
                <h2
                  className="font-display text-base font-semibold"
                  style={{ color: "oklch(0.82 0.12 280)" }}
                >
                  PvP Bet History
                </h2>
              </div>
              <PvpBetHistorySection />
            </motion.div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer
        className="py-4 text-center text-xs text-muted-foreground font-body border-t"
        style={{
          borderColor: "oklch(0.3 0.12 280 / 0.3)",
          background: "oklch(0.12 0.06 280)",
        }}
      >
        &copy; {new Date().getFullYear()}.{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          className="underline hover:text-primary transition-colors"
          target="_blank"
          rel="noreferrer"
        >
          Built with &#x2764;&#xFE0F; using caffeine.ai
        </a>
      </footer>
    </div>
  );
}
