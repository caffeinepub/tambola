import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  KeyRound,
  Lock,
  ShieldCheck,
  ShieldOff,
  Trash2,
  Wallet,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useGame } from "../context/GameContext";

const ADMIN_PIN_KEY = "tambola-admin-pin";
const DEFAULT_PIN = "947261";
const UPI_STORAGE_KEY = "tambola-upi-id";

function getAdminPin() {
  return localStorage.getItem(ADMIN_PIN_KEY) ?? DEFAULT_PIN;
}

export function Admin() {
  const { setMode } = useGame();
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [upiInput, setUpiInput] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinChangeMsg, setPinChangeMsg] = useState("");
  const savedUpi = localStorage.getItem(UPI_STORAGE_KEY) ?? "";

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === getAdminPin()) {
      setUnlocked(true);
      setPinError("");
    } else {
      setPinError("Incorrect PIN. Access denied.");
      setPin("");
    }
  };

  const handleSave = () => {
    const trimmed = upiInput.trim();
    if (!trimmed) {
      toast.error("Please enter a UPI ID.");
      return;
    }
    if (!trimmed.includes("@")) {
      toast.error("Invalid UPI ID. Must contain @");
      return;
    }
    localStorage.setItem(UPI_STORAGE_KEY, trimmed);
    setUpiInput("");
    toast.success("UPI ID saved successfully.");
    window.dispatchEvent(new Event("storage"));
  };

  const handleClear = () => {
    localStorage.removeItem(UPI_STORAGE_KEY);
    setUpiInput("");
    toast.success("UPI ID removed.");
    window.dispatchEvent(new Event("storage"));
  };

  const handleChangePin = (e: React.FormEvent) => {
    e.preventDefault();
    setPinChangeMsg("");
    if (newPin.length < 6) {
      setPinChangeMsg("PIN must be at least 6 digits.");
      return;
    }
    if (!/^\d+$/.test(newPin)) {
      setPinChangeMsg("PIN must contain digits only.");
      return;
    }
    if (newPin !== confirmPin) {
      setPinChangeMsg("PINs do not match.");
      return;
    }
    localStorage.setItem(ADMIN_PIN_KEY, newPin);
    setNewPin("");
    setConfirmPin("");
    toast.success("Admin PIN updated successfully.");
  };

  const isActive = savedUpi.length > 0;

  // PIN Gate
  if (!unlocked) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.12 0.07 280) 0%, oklch(0.08 0.05 300) 100%)",
        }}
      >
        <div className="w-full max-w-sm">
          <button
            type="button"
            data-ocid="admin.back_button"
            onClick={() => setMode("home")}
            className="flex items-center gap-1 text-sm mb-8 hover:opacity-80 transition-opacity"
            style={{ color: "oklch(0.65 0.1 280)" }}
          >
            <ArrowLeft size={16} />
            Back to Home
          </button>

          <div className="text-center mb-8">
            <div
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
              style={{ background: "oklch(0.22 0.14 280)" }}
            >
              <Lock size={28} style={{ color: "oklch(0.75 0.18 280)" }} />
            </div>
            <h1
              className="text-2xl font-bold mb-1"
              style={{
                color: "oklch(0.95 0.05 280)",
                fontFamily: "'Bricolage Grotesque', sans-serif",
              }}
            >
              Admin Access
            </h1>
            <p className="text-sm" style={{ color: "oklch(0.6 0.07 280)" }}>
              Enter your admin PIN to continue
            </p>
          </div>

          <form onSubmit={handlePinSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label
                htmlFor="admin-pin"
                className="text-sm font-medium"
                style={{ color: "oklch(0.75 0.08 280)" }}
              >
                Admin PIN
              </Label>
              <Input
                id="admin-pin"
                data-ocid="admin.pin.input"
                type="password"
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setPinError("");
                }}
                placeholder="Enter PIN"
                maxLength={12}
                autoFocus
                className="text-center tracking-widest text-lg"
                style={{
                  background: "oklch(0.18 0.08 280)",
                  border: `1px solid ${pinError ? "oklch(0.55 0.2 25)" : "oklch(0.32 0.12 280)"}`,
                  color: "oklch(0.95 0.04 280)",
                }}
              />
              {pinError && (
                <p
                  data-ocid="admin.pin.error_state"
                  className="text-xs mt-1"
                  style={{ color: "oklch(0.65 0.2 25)" }}
                >
                  {pinError}
                </p>
              )}
            </div>
            <Button
              type="submit"
              data-ocid="admin.pin.submit_button"
              className="w-full font-semibold"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.45 0.22 280), oklch(0.38 0.2 300))",
                color: "white",
              }}
            >
              Unlock Admin Panel
            </Button>
          </form>
        </div>
      </div>
    );
  }

  // Admin Panel
  return (
    <div
      className="min-h-screen"
      style={{
        background:
          "linear-gradient(135deg, oklch(0.12 0.07 280) 0%, oklch(0.08 0.05 300) 100%)",
      }}
    >
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            type="button"
            data-ocid="admin.back_button"
            onClick={() => setMode("home")}
            className="flex items-center gap-1 text-sm hover:opacity-80 transition-opacity"
            style={{ color: "oklch(0.65 0.1 280)" }}
          >
            <ArrowLeft size={16} />
            Back
          </button>
          <div className="flex-1">
            <h1
              className="text-2xl font-bold"
              style={{
                color: "oklch(0.95 0.05 280)",
                fontFamily: "'Bricolage Grotesque', sans-serif",
              }}
            >
              Admin Settings
            </h1>
            <p className="text-sm" style={{ color: "oklch(0.58 0.07 280)" }}>
              Configure payment settings
            </p>
          </div>
          <div
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-mono"
            style={{
              background: "oklch(0.22 0.1 280 / 0.8)",
              color: "oklch(0.7 0.1 280)",
              border: "1px solid oklch(0.35 0.12 280 / 0.5)",
            }}
          >
            <ShieldCheck size={12} />
            Admin
          </div>
        </div>

        {/* UPI Configuration Card */}
        <Card
          className="mb-6"
          style={{
            background: "oklch(0.16 0.09 280 / 0.9)",
            border: "1px solid oklch(0.28 0.12 280 / 0.6)",
          }}
        >
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="flex items-center justify-center w-10 h-10 rounded-xl"
                  style={{ background: "oklch(0.22 0.14 145)" }}
                >
                  <Wallet size={18} style={{ color: "oklch(0.72 0.18 145)" }} />
                </div>
                <div>
                  <CardTitle
                    className="text-base"
                    style={{ color: "oklch(0.92 0.06 280)" }}
                  >
                    UPI Payment Setup
                  </CardTitle>
                  <CardDescription style={{ color: "oklch(0.56 0.07 280)" }}>
                    Players will pay to this UPI ID to top up their wallet
                  </CardDescription>
                </div>
              </div>
              {isActive ? (
                <Badge
                  data-ocid="admin.upi.success_state"
                  className="flex items-center gap-1 font-semibold"
                  style={{
                    background: "oklch(0.3 0.14 145 / 0.3)",
                    color: "oklch(0.72 0.18 145)",
                    border: "1px solid oklch(0.45 0.18 145 / 0.4)",
                  }}
                >
                  <ShieldCheck size={11} />
                  UPI Active
                </Badge>
              ) : (
                <Badge
                  data-ocid="admin.upi.error_state"
                  className="flex items-center gap-1 font-semibold"
                  style={{
                    background: "oklch(0.28 0.12 25 / 0.3)",
                    color: "oklch(0.68 0.16 25)",
                    border: "1px solid oklch(0.4 0.14 25 / 0.4)",
                  }}
                >
                  <ShieldOff size={11} />
                  Not Configured
                </Badge>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            {isActive && (
              <div
                className="rounded-lg px-4 py-3"
                style={{
                  background: "oklch(0.12 0.06 280 / 0.7)",
                  border: "1px solid oklch(0.25 0.1 280 / 0.5)",
                }}
              >
                <p
                  className="text-xs font-medium mb-1"
                  style={{ color: "oklch(0.6 0.07 280)" }}
                >
                  Current UPI ID
                </p>
                <p
                  className="font-mono text-base font-bold"
                  style={{ color: "oklch(0.88 0.14 145)" }}
                >
                  {savedUpi}
                </p>
              </div>
            )}

            <div className="space-y-1.5">
              <Label
                htmlFor="upi-id"
                className="text-sm font-medium"
                style={{ color: "oklch(0.75 0.08 280)" }}
              >
                {isActive ? "Change UPI ID" : "Your UPI ID"}
              </Label>
              <Input
                id="upi-id"
                data-ocid="admin.upi.input"
                type="text"
                value={upiInput}
                onChange={(e) => setUpiInput(e.target.value)}
                placeholder="yourname@upi or 9876543210@okaxis"
                className="font-mono text-sm"
                style={{
                  background: "oklch(0.13 0.07 280)",
                  border: "1px solid oklch(0.3 0.12 280 / 0.6)",
                  color: "oklch(0.92 0.05 280)",
                }}
              />
              <p className="text-xs" style={{ color: "oklch(0.52 0.07 280)" }}>
                Supported: GPay, PhonePe, Paytm, BHIM, any bank UPI handle
              </p>
            </div>

            <div className="flex gap-3 pt-1">
              <Button
                type="button"
                data-ocid="admin.upi.save_button"
                onClick={handleSave}
                disabled={!upiInput.trim()}
                className="flex-1 font-semibold"
                style={{
                  background: upiInput.trim()
                    ? "linear-gradient(135deg, oklch(0.45 0.22 145), oklch(0.38 0.2 160))"
                    : "oklch(0.22 0.06 280)",
                  color: upiInput.trim() ? "white" : "oklch(0.45 0.06 280)",
                }}
              >
                Save UPI ID
              </Button>
              {isActive && (
                <Button
                  type="button"
                  data-ocid="admin.upi.delete_button"
                  variant="outline"
                  onClick={handleClear}
                  className="flex items-center gap-1.5 font-medium"
                  style={{
                    border: "1px solid oklch(0.38 0.15 25 / 0.5)",
                    color: "oklch(0.68 0.18 25)",
                    background: "transparent",
                  }}
                >
                  <Trash2 size={14} />
                  Remove
                </Button>
              )}
            </div>

            <div
              className="rounded-lg px-4 py-3 text-xs leading-relaxed space-y-1.5"
              style={{
                background: "oklch(0.18 0.1 145 / 0.12)",
                border: "1px solid oklch(0.4 0.14 145 / 0.25)",
                color: "oklch(0.72 0.1 145)",
              }}
            >
              <p className="font-semibold">How UPI payments work:</p>
              <ol
                className="list-decimal list-inside space-y-1 text-xs"
                style={{ color: "oklch(0.65 0.08 280)" }}
              >
                <li>
                  Player selects an amount and taps &quot;Open UPI App&quot;
                </li>
                <li>They complete the payment in GPay / PhonePe / Paytm</li>
                <li>They enter the UPI transaction ID and confirm</li>
                <li>You verify the payment and credit their wallet manually</li>
              </ol>
            </div>
          </CardContent>
        </Card>

        {/* Change Admin PIN Card */}
        <Card
          style={{
            background: "oklch(0.16 0.09 280 / 0.9)",
            border: "1px solid oklch(0.28 0.12 280 / 0.6)",
          }}
        >
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div
                className="flex items-center justify-center w-10 h-10 rounded-xl"
                style={{ background: "oklch(0.22 0.14 280)" }}
              >
                <KeyRound size={18} style={{ color: "oklch(0.75 0.18 280)" }} />
              </div>
              <div>
                <CardTitle
                  className="text-base"
                  style={{ color: "oklch(0.92 0.06 280)" }}
                >
                  Change Admin PIN
                </CardTitle>
                <CardDescription style={{ color: "oklch(0.56 0.07 280)" }}>
                  Set a strong numeric PIN (6+ digits)
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePin} className="space-y-4">
              <div className="space-y-1.5">
                <Label
                  htmlFor="new-pin"
                  className="text-sm font-medium"
                  style={{ color: "oklch(0.75 0.08 280)" }}
                >
                  New PIN
                </Label>
                <Input
                  id="new-pin"
                  data-ocid="admin.newpin.input"
                  type="password"
                  value={newPin}
                  onChange={(e) => {
                    setNewPin(e.target.value);
                    setPinChangeMsg("");
                  }}
                  placeholder="Min 6 digits"
                  maxLength={12}
                  className="tracking-widest text-center"
                  style={{
                    background: "oklch(0.13 0.07 280)",
                    border: "1px solid oklch(0.3 0.12 280 / 0.6)",
                    color: "oklch(0.92 0.05 280)",
                  }}
                />
              </div>
              <div className="space-y-1.5">
                <Label
                  htmlFor="confirm-pin"
                  className="text-sm font-medium"
                  style={{ color: "oklch(0.75 0.08 280)" }}
                >
                  Confirm New PIN
                </Label>
                <Input
                  id="confirm-pin"
                  data-ocid="admin.confirmpin.input"
                  type="password"
                  value={confirmPin}
                  onChange={(e) => {
                    setConfirmPin(e.target.value);
                    setPinChangeMsg("");
                  }}
                  placeholder="Re-enter PIN"
                  maxLength={12}
                  className="tracking-widest text-center"
                  style={{
                    background: "oklch(0.13 0.07 280)",
                    border: "1px solid oklch(0.3 0.12 280 / 0.6)",
                    color: "oklch(0.92 0.05 280)",
                  }}
                />
              </div>
              {pinChangeMsg && (
                <p
                  data-ocid="admin.pinchange.error_state"
                  className="text-xs"
                  style={{ color: "oklch(0.65 0.2 25)" }}
                >
                  {pinChangeMsg}
                </p>
              )}
              <Button
                type="submit"
                data-ocid="admin.pinchange.submit_button"
                className="w-full font-semibold"
                disabled={!newPin || !confirmPin}
                style={{
                  background:
                    newPin && confirmPin
                      ? "linear-gradient(135deg, oklch(0.45 0.22 280), oklch(0.38 0.2 300))"
                      : "oklch(0.22 0.06 280)",
                  color:
                    newPin && confirmPin ? "white" : "oklch(0.45 0.06 280)",
                }}
              >
                Update PIN
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
