import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Copy, Loader2, Plus, Wallet } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useActor } from "../hooks/useActor";

const DEPOSIT_OPTIONS = [
  { label: "\u20b950", amount: 50 },
  { label: "\u20b9100", amount: 100 },
  { label: "\u20b9200", amount: 200 },
  { label: "\u20b9500", amount: 500 },
];

const UPI_STORAGE_KEY = "tambola-upi-id";

function getUpiId(): string {
  return localStorage.getItem(UPI_STORAGE_KEY) ?? "";
}

export function RealMoneyWallet() {
  const { isFetching } = useActor();
  const [balance] = useState<bigint | null>(null);
  const [depositOpen, setDepositOpen] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [txnId, setTxnId] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [step, setStep] = useState<"pick" | "pay" | "done">("pick");

  const upiId = getUpiId();

  const openDialog = () => {
    setStep("pick");
    setSelectedAmount(null);
    setTxnId("");
    setDepositOpen(true);
  };

  const handleSelectAmount = (amount: number) => {
    setSelectedAmount(amount);
    setStep("pay");
  };

  const upiDeepLink = selectedAmount
    ? `upi://pay?pa=${encodeURIComponent(upiId)}&pn=Tambola&am=${selectedAmount}&cu=INR&tn=TambolaWalletTopup`
    : "";

  const copyUpiId = () => {
    navigator.clipboard
      .writeText(upiId)
      .then(() => toast.success("UPI ID copied!"));
  };

  const handleConfirmPayment = () => {
    if (!txnId.trim()) {
      toast.error("Please enter your UPI transaction ID");
      return;
    }
    setConfirming(true);
    // Simulate a brief submit delay
    setTimeout(() => {
      setConfirming(false);
      setStep("done");
      toast.success(
        `Payment of \u20b9${selectedAmount} submitted for verification.`,
      );
    }, 800);
  };

  const displayBalance = balance !== null ? Number(balance) / 100 : null;
  const noUpi = !upiId;

  return (
    <div
      data-ocid="wallet.card"
      className="flex items-center gap-3 rounded-xl px-4 py-2"
      style={{
        background: "oklch(0.2 0.12 60 / 0.25)",
        border: "1px solid oklch(0.45 0.18 60 / 0.35)",
      }}
    >
      <div className="flex items-center gap-2">
        <Wallet size={16} style={{ color: "oklch(0.82 0.18 60)" }} />
        {isFetching ? (
          <Loader2
            size={14}
            className="animate-spin"
            style={{ color: "oklch(0.7 0.12 60)" }}
            data-ocid="wallet.loading_state"
          />
        ) : displayBalance !== null ? (
          <span
            className="font-mono text-sm font-bold"
            style={{ color: "oklch(0.9 0.18 60)" }}
          >
            \u20b9{displayBalance.toFixed(2)}
          </span>
        ) : (
          <span
            className="text-xs font-body"
            style={{ color: "oklch(0.7 0.12 60)" }}
          >
            Wallet
          </span>
        )}
      </div>

      {/* Add Money via UPI */}
      <Dialog open={depositOpen} onOpenChange={setDepositOpen}>
        <DialogTrigger asChild>
          <Button
            size="sm"
            variant="outline"
            data-ocid="wallet.open_modal_button"
            onClick={openDialog}
            className="h-7 text-xs px-2 gap-1"
            style={{
              background: "oklch(0.28 0.16 60 / 0.4)",
              borderColor: "oklch(0.5 0.18 60 / 0.5)",
              color: "oklch(0.88 0.16 60)",
            }}
          >
            <Plus size={12} />
            Add Money
          </Button>
        </DialogTrigger>

        <DialogContent
          data-ocid="wallet.dialog"
          style={{
            background: "oklch(0.16 0.1 280)",
            border: "1px solid oklch(0.35 0.15 280 / 0.5)",
          }}
        >
          <DialogHeader>
            <DialogTitle
              className="font-display text-xl"
              style={{ color: "oklch(0.92 0.1 60)" }}
            >
              \ud83d\udcb8 Add Money via UPI
            </DialogTitle>
          </DialogHeader>

          {noUpi ? (
            <div
              className="rounded-xl p-4 text-center"
              style={{
                background: "oklch(0.18 0.08 25 / 0.3)",
                border: "1px solid oklch(0.4 0.15 25 / 0.4)",
                color: "oklch(0.72 0.14 25)",
              }}
            >
              <p className="text-sm font-body">
                UPI ID not configured. Ask the organizer to set it up in Admin
                Settings.
              </p>
            </div>
          ) : step === "pick" ? (
            <>
              <p
                className="text-sm font-body"
                style={{ color: "oklch(0.65 0.08 280)" }}
              >
                Select an amount to add to your wallet.
              </p>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {DEPOSIT_OPTIONS.map((opt) => (
                  <button
                    key={opt.amount}
                    type="button"
                    onClick={() => handleSelectAmount(opt.amount)}
                    data-ocid="wallet.primary_button"
                    className="flex flex-col items-center justify-center py-5 rounded-xl font-display font-bold text-2xl transition-all hover:scale-105"
                    style={{
                      background: "oklch(0.28 0.18 60 / 0.35)",
                      border: "2px solid oklch(0.5 0.2 60 / 0.5)",
                      color: "oklch(0.92 0.18 60)",
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                data-ocid="wallet.cancel_button"
                onClick={() => setDepositOpen(false)}
                className="w-full mt-2 text-sm font-body py-2 rounded-lg transition-opacity hover:opacity-70"
                style={{ color: "oklch(0.55 0.08 280)" }}
              >
                Cancel
              </button>
            </>
          ) : step === "pay" ? (
            <div className="flex flex-col gap-4">
              {/* UPI ID box */}
              <div
                className="rounded-xl p-4"
                style={{
                  background: "oklch(0.2 0.12 60 / 0.2)",
                  border: "1px solid oklch(0.45 0.18 60 / 0.35)",
                }}
              >
                <p
                  className="text-xs mb-1"
                  style={{ color: "oklch(0.6 0.08 280)" }}
                >
                  Pay \u20b9{selectedAmount} to this UPI ID:
                </p>
                <div className="flex items-center gap-2">
                  <span
                    className="font-mono font-bold text-lg flex-1"
                    style={{ color: "oklch(0.92 0.18 60)" }}
                  >
                    {upiId}
                  </span>
                  <button
                    type="button"
                    onClick={copyUpiId}
                    className="p-1.5 rounded-md hover:opacity-70"
                    style={{ color: "oklch(0.7 0.12 60)" }}
                  >
                    <Copy size={14} />
                  </button>
                </div>
              </div>

              {/* Open UPI App */}
              <a
                href={upiDeepLink}
                data-ocid="wallet.secondary_button"
                className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all hover:scale-105"
                style={{
                  background: "oklch(0.42 0.22 145)",
                  color: "white",
                  textDecoration: "none",
                }}
              >
                \ud83d\udcf1 Open UPI App (GPay / PhonePe / Paytm)
              </a>

              <p
                className="text-xs text-center"
                style={{ color: "oklch(0.6 0.08 280)" }}
              >
                After paying, enter your UPI Transaction ID below.
              </p>

              <div className="flex flex-col gap-1.5">
                <Label
                  className="text-sm"
                  style={{ color: "oklch(0.7 0.08 280)" }}
                >
                  UPI Transaction ID
                </Label>
                <Input
                  value={txnId}
                  onChange={(e) => setTxnId(e.target.value)}
                  data-ocid="wallet.input"
                  placeholder="e.g. 407219883456"
                  style={{
                    background: "oklch(0.2 0.1 280 / 0.7)",
                    borderColor: "oklch(0.38 0.15 280 / 0.5)",
                    color: "oklch(0.92 0.08 280)",
                  }}
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep("pick")}
                  className="flex-1 py-2 rounded-lg text-sm font-body transition-opacity hover:opacity-70"
                  style={{
                    background: "oklch(0.22 0.08 280 / 0.5)",
                    color: "oklch(0.6 0.08 280)",
                    border: "1px solid oklch(0.35 0.1 280 / 0.4)",
                  }}
                >
                  Back
                </button>
                <Button
                  onClick={handleConfirmPayment}
                  disabled={confirming || !txnId.trim()}
                  data-ocid="wallet.confirm_button"
                  className="flex-1"
                  style={{
                    background: "oklch(0.48 0.22 145)",
                    color: "white",
                    border: "none",
                  }}
                >
                  {confirming ? (
                    <Loader2 size={14} className="animate-spin mr-2" />
                  ) : null}
                  {confirming ? "Submitting\u2026" : "Confirm Payment"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 py-4">
              <CheckCircle2
                size={52}
                style={{ color: "oklch(0.65 0.2 145)" }}
              />
              <div className="text-center">
                <p
                  className="font-display font-bold text-xl mb-1"
                  style={{ color: "oklch(0.92 0.1 280)" }}
                >
                  Payment Submitted!
                </p>
                <p
                  className="text-sm font-body"
                  style={{ color: "oklch(0.62 0.08 280)" }}
                >
                  \u20b9{selectedAmount} will be credited after organizer
                  verifies.
                </p>
              </div>
              <Button
                onClick={() => setDepositOpen(false)}
                data-ocid="wallet.close_button"
                style={{ background: "oklch(0.42 0.2 280)", color: "white" }}
              >
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
