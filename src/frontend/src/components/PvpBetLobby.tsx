import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, RefreshCw, Swords } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { Bet } from "../backend.d";
import { Variant_won_lost_open_refunded_matched } from "../backend.d";
import { useActor } from "../hooks/useActor";

const PRIZE_OPTIONS = [
  { value: "early_five", label: "Early Five" },
  { value: "corners", label: "Corners" },
  { value: "top_line", label: "Top Line" },
  { value: "middle_line", label: "Middle Line" },
  { value: "bottom_line", label: "Bottom Line" },
  { value: "full_house", label: "Full House" },
];

function shortPrincipal(p: string): string {
  return p ? `${p.slice(0, 6)}…` : "???";
}

function formatInr(paise: bigint): string {
  return `₹${(Number(paise) / 100).toFixed(0)}`;
}

interface PvpBetLobbyProps {
  gameId: string;
}

export function PvpBetLobby({ gameId }: PvpBetLobbyProps) {
  const { actor, isFetching } = useActor();
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(false);
  const [accepting, setAccepting] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [prize, setPrize] = useState("full_house");
  const [stakeStr, setStakeStr] = useState("100");
  const [creating, setCreating] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchBets = useCallback(async () => {
    if (!actor) return;
    setLoading(true);
    try {
      const result = await actor.listOpenBets(gameId);
      setBets(result);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [actor, gameId]);

  useEffect(() => {
    void fetchBets();
    intervalRef.current = setInterval(() => void fetchBets(), 10000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchBets]);

  const handleAccept = async (betId: string) => {
    if (!actor) {
      toast.error("Please log in to accept bets");
      return;
    }
    setAccepting(betId);
    try {
      await actor.acceptBet(betId);
      toast.success("Bet accepted! Good luck 🤞");
      await fetchBets();
    } catch {
      toast.error("Failed to accept bet");
    } finally {
      setAccepting(null);
    }
  };

  const handleCreate = async () => {
    if (!actor) {
      toast.error("Please log in to create bets");
      return;
    }
    const amt = Number.parseInt(stakeStr, 10);
    if (Number.isNaN(amt) || amt < 10) {
      toast.error("Minimum stake is ₹10");
      return;
    }
    setCreating(true);
    try {
      await actor.createBet(prize, BigInt(amt * 100), gameId);
      toast.success("Bet created! Waiting for opponent…");
      setCreateOpen(false);
      await fetchBets();
    } catch {
      toast.error("Failed to create bet");
    } finally {
      setCreating(false);
    }
  };

  const openBets = bets.filter(
    (b) => b.status === Variant_won_lost_open_refunded_matched.open,
  );
  const matchedBets = bets.filter(
    (b) => b.status === Variant_won_lost_open_refunded_matched.matched,
  );

  const prizeLabel = (val: string) =>
    PRIZE_OPTIONS.find((p) => p.value === val)?.label ?? val;

  return (
    <div
      data-ocid="pvp.section"
      className="rounded-2xl p-5"
      style={{
        background: "oklch(0.16 0.1 280 / 0.85)",
        border: "1px solid oklch(0.38 0.18 280 / 0.4)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Swords size={18} style={{ color: "oklch(0.82 0.18 280)" }} />
          <h3
            className="font-display text-lg font-bold"
            style={{ color: "oklch(0.92 0.1 280)" }}
          >
            💰 Real Money PvP Bets
          </h3>
          {loading && !isFetching && (
            <Loader2
              size={14}
              className="animate-spin"
              style={{ color: "oklch(0.65 0.1 280)" }}
              data-ocid="pvp.loading_state"
            />
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void fetchBets()}
            data-ocid="pvp.secondary_button"
            className="p-1.5 rounded-lg transition-opacity hover:opacity-70"
            style={{
              background: "oklch(0.24 0.1 280 / 0.5)",
              color: "oklch(0.7 0.1 280)",
            }}
          >
            <RefreshCw size={13} />
          </button>

          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                data-ocid="pvp.open_modal_button"
                className="h-8 text-xs gap-1.5 font-body"
                style={{
                  background: "oklch(0.48 0.22 280)",
                  color: "white",
                  border: "none",
                }}
              >
                <Swords size={13} />
                Create Bet
              </Button>
            </DialogTrigger>
            <DialogContent
              data-ocid="pvp.dialog"
              style={{
                background: "oklch(0.15 0.1 280)",
                border: "1px solid oklch(0.35 0.15 280 / 0.5)",
              }}
            >
              <DialogHeader>
                <DialogTitle
                  className="font-display text-xl"
                  style={{ color: "oklch(0.92 0.1 280)" }}
                >
                  ⚔️ Challenge a Player
                </DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-4 py-2">
                <div className="flex flex-col gap-1.5">
                  <Label
                    className="text-sm font-body"
                    style={{ color: "oklch(0.7 0.08 280)" }}
                  >
                    Prize Category
                  </Label>
                  <Select value={prize} onValueChange={setPrize}>
                    <SelectTrigger
                      data-ocid="pvp.select"
                      style={{
                        background: "oklch(0.2 0.1 280 / 0.7)",
                        borderColor: "oklch(0.38 0.15 280 / 0.5)",
                        color: "oklch(0.88 0.08 280)",
                      }}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent
                      style={{
                        background: "oklch(0.18 0.1 280)",
                        borderColor: "oklch(0.35 0.15 280 / 0.5)",
                      }}
                    >
                      {PRIZE_OPTIONS.map((opt) => (
                        <SelectItem
                          key={opt.value}
                          value={opt.value}
                          style={{ color: "oklch(0.85 0.08 280)" }}
                        >
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label
                    className="text-sm font-body"
                    style={{ color: "oklch(0.7 0.08 280)" }}
                  >
                    Stake Amount (₹ minimum ₹10)
                  </Label>
                  <Input
                    type="number"
                    min={10}
                    value={stakeStr}
                    onChange={(e) => setStakeStr(e.target.value)}
                    data-ocid="pvp.input"
                    placeholder="e.g. 100"
                    style={{
                      background: "oklch(0.2 0.1 280 / 0.7)",
                      borderColor: "oklch(0.38 0.15 280 / 0.5)",
                      color: "oklch(0.92 0.08 280)",
                    }}
                  />
                </div>
                <p
                  className="text-xs font-body"
                  style={{ color: "oklch(0.55 0.08 280)" }}
                >
                  Winner takes both stakes (2× your bet). Funds are held in
                  escrow until the prize is won.
                </p>
              </div>
              <DialogFooter className="gap-2">
                <Button
                  variant="ghost"
                  data-ocid="pvp.cancel_button"
                  onClick={() => setCreateOpen(false)}
                  style={{ color: "oklch(0.6 0.08 280)" }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={creating}
                  data-ocid="pvp.confirm_button"
                  style={{
                    background: "oklch(0.48 0.22 280)",
                    color: "white",
                  }}
                >
                  {creating ? (
                    <Loader2 size={14} className="animate-spin mr-2" />
                  ) : null}
                  {creating ? "Creating…" : "Create Bet"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Open bets */}
      {openBets.length === 0 && matchedBets.length === 0 ? (
        <div
          data-ocid="pvp.empty_state"
          className="text-center py-8"
          style={{
            background: "oklch(0.18 0.08 280 / 0.4)",
            borderRadius: "12px",
            border: "1px dashed oklch(0.35 0.12 280 / 0.4)",
          }}
        >
          <div className="text-3xl mb-2">⚔️</div>
          <p
            className="font-body text-sm"
            style={{ color: "oklch(0.6 0.08 280)" }}
          >
            No open bets — be the first to challenge!
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {openBets.map((bet, i) => (
            <div
              key={bet.id}
              data-ocid={`pvp.item.${i + 1}`}
              className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl"
              style={{
                background: "oklch(0.2 0.12 280 / 0.55)",
                border: "1px solid oklch(0.38 0.16 280 / 0.35)",
              }}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <Badge
                    className="text-xs px-2 py-0"
                    style={{
                      background: "oklch(0.38 0.2 280 / 0.5)",
                      color: "oklch(0.88 0.12 280)",
                      border: "1px solid oklch(0.5 0.2 280 / 0.4)",
                    }}
                  >
                    {prizeLabel(bet.prizeType)}
                  </Badge>
                  <Badge
                    className="text-xs px-2 py-0"
                    style={{
                      background: "oklch(0.35 0.18 60 / 0.4)",
                      color: "oklch(0.88 0.18 60)",
                      border: "1px solid oklch(0.5 0.2 60 / 0.4)",
                    }}
                  >
                    {formatInr(bet.stakeAmount)}
                  </Badge>
                </div>
                <p
                  className="text-xs font-mono truncate"
                  style={{ color: "oklch(0.58 0.08 280)" }}
                >
                  by {shortPrincipal(bet.creatorId.toString())}
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => void handleAccept(bet.id)}
                disabled={accepting === bet.id}
                data-ocid={"pvp.button"}
                className="h-8 text-xs shrink-0"
                style={{
                  background: "oklch(0.52 0.2 160)",
                  color: "white",
                  border: "none",
                }}
              >
                {accepting === bet.id ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  "Accept"
                )}
              </Button>
            </div>
          ))}
          {matchedBets.map((bet, i) => (
            <div
              key={bet.id}
              data-ocid={`pvp.item.${openBets.length + i + 1}`}
              className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl opacity-70"
              style={{
                background: "oklch(0.18 0.08 280 / 0.4)",
                border: "1px solid oklch(0.32 0.1 280 / 0.25)",
              }}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <Badge className="text-xs px-2 py-0 bg-muted text-muted-foreground">
                    {prizeLabel(bet.prizeType)}
                  </Badge>
                  <Badge
                    className="text-xs px-2 py-0"
                    style={{
                      background: "oklch(0.35 0.18 60 / 0.4)",
                      color: "oklch(0.82 0.14 60)",
                    }}
                  >
                    {formatInr(bet.stakeAmount)}
                  </Badge>
                  <Badge
                    className="text-xs px-2 py-0"
                    style={{
                      background: "oklch(0.3 0.15 280 / 0.5)",
                      color: "oklch(0.78 0.12 280)",
                    }}
                  >
                    Matched
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
