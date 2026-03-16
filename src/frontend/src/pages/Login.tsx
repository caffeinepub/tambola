import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useGame } from "../context/GameContext";

type Step = "mobile" | "otp" | "register" | "login";

export function Login() {
  const { sendOTP, verifyOTP, isRegistered, registerPlayer, loginWithMobile } =
    useGame();

  const [step, setStep] = useState<Step>("mobile");
  const [mobile, setMobile] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [registeredId, setRegisteredId] = useState("");
  const [registeredName, setRegisteredName] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSendOTP = () => {
    setError("");
    if (!/^[0-9]{10}$/.test(mobile)) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }
    const otp = sendOTP(mobile);
    setGeneratedOtp(otp);
    setStep("otp");
  };

  const handleVerifyOTP = () => {
    setError("");
    if (otpInput.length !== 6) {
      setError("Please enter the 6-digit OTP.");
      return;
    }
    if (!verifyOTP(mobile, otpInput)) {
      setError("Incorrect OTP. Please try again.");
      return;
    }
    if (isRegistered(mobile)) {
      setStep("login");
    } else {
      setStep("register");
    }
  };

  const handleResendOTP = () => {
    setError("");
    const otp = sendOTP(mobile);
    setGeneratedOtp(otp);
    setOtpInput("");
  };

  const handleRegister = () => {
    setError("");
    if (!name.trim()) {
      setError("Please enter your display name.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    const player = registerPlayer(mobile, name.trim(), password);
    setRegisteredId(player.uniqueId);
    setRegisteredName(player.name);
    setShowSuccess(true);
    toast.success("🎉 Welcome! Your account is ready.");
  };

  const handleLogin = () => {
    setError("");
    if (!password) {
      setError("Please enter your password.");
      return;
    }
    // Check if login bonus will be awarded
    const storedRaw = localStorage.getItem(`tambola-account-${mobile}`);
    let hadBonusToday = false;
    if (storedRaw) {
      try {
        const stored = JSON.parse(storedRaw);
        const today = new Date().toISOString().slice(0, 10);
        hadBonusToday = stored.lastLoginDate === today;
      } catch {}
    }

    const result = loginWithMobile(mobile, password);
    if (result === "wrong_password") {
      setError("Incorrect password. Please try again.");
    } else {
      if (!hadBonusToday) {
        toast.success("🎉 +100 Login Bonus coins!");
      }
    }
    // On success, App.tsx will route to Home via authPlayer state
  };

  // Colorful gradient button style
  const btnStyle = {
    background:
      "linear-gradient(135deg, oklch(0.62 0.28 50) 0%, oklch(0.52 0.28 330) 60%, oklch(0.48 0.24 290) 100%)",
    color: "white",
    border: "none",
  };

  if (showSuccess) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.12 0.06 290), oklch(0.15 0.08 340), oklch(0.12 0.06 290))",
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl p-8 text-center max-w-sm w-full"
          style={{
            background: "oklch(0.17 0.08 290)",
            border: "1px solid oklch(0.32 0.14 290 / 0.5)",
          }}
        >
          <div className="text-5xl mb-4">🎉</div>
          <h2
            className="font-display text-2xl font-bold mb-2"
            style={{ color: "oklch(0.92 0.14 50)" }}
          >
            Welcome, {registeredName}!
          </h2>
          <p
            className="font-mono text-sm mb-1"
            style={{ color: "oklch(0.7 0.1 290)" }}
          >
            Your Unique ID
          </p>
          <p
            className="font-mono text-xl font-bold mb-4 tracking-widest"
            style={{ color: "oklch(0.85 0.2 50)" }}
          >
            {registeredId}
          </p>
          <p className="text-xs text-muted-foreground font-body">
            Save this ID — it's your identifier in Tambola.
          </p>
          <p className="text-xs mt-3" style={{ color: "oklch(0.7 0.18 130)" }}>
            🪙 1000 coins added to your wallet!
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{
        background:
          "linear-gradient(135deg, oklch(0.12 0.06 290), oklch(0.15 0.08 340), oklch(0.12 0.06 290))",
      }}
    >
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 text-center"
      >
        <img
          src="/assets/generated/tambola-logo-colorful-transparent.dim_400x180.png"
          alt="Tambola"
          className="h-20 object-contain mx-auto drop-shadow-[0_0_24px_rgba(255,140,0,0.5)]"
        />
        <p
          className="text-sm font-body mt-2"
          style={{ color: "oklch(0.7 0.08 290)" }}
        >
          Housie · Indian Bingo
        </p>
      </motion.div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.25 }}
          className="rounded-2xl p-8 w-full max-w-sm"
          style={{
            background: "oklch(0.17 0.08 290)",
            border: "1px solid oklch(0.3 0.12 290 / 0.5)",
            boxShadow: "0 8px 40px oklch(0.1 0.1 290 / 0.8)",
          }}
        >
          {step === "mobile" && (
            <div className="space-y-5">
              <div>
                <h2
                  className="font-display text-2xl font-bold mb-1"
                  style={{ color: "oklch(0.92 0.14 50)" }}
                >
                  Login / Sign Up
                </h2>
                <p className="text-xs text-muted-foreground font-body">
                  Enter your mobile number to continue
                </p>
              </div>
              <div className="space-y-2">
                <Label
                  className="text-sm font-body"
                  style={{ color: "oklch(0.75 0.1 290)" }}
                >
                  Mobile Number
                </Label>
                <Input
                  type="tel"
                  placeholder="10-digit mobile"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  data-ocid="login.input"
                  className="font-mono"
                  style={{
                    background: "oklch(0.12 0.06 290)",
                    borderColor: "oklch(0.35 0.12 290 / 0.6)",
                    color: "oklch(0.9 0.06 290)",
                  }}
                  maxLength={10}
                  onKeyDown={(e) => e.key === "Enter" && handleSendOTP()}
                />
              </div>
              {error && (
                <p
                  className="text-xs text-red-400"
                  data-ocid="login.error_state"
                >
                  {error}
                </p>
              )}
              <Button
                className="w-full font-bold"
                style={btnStyle}
                onClick={handleSendOTP}
                data-ocid="login.submit_button"
              >
                Send OTP →
              </Button>
            </div>
          )}

          {step === "otp" && (
            <div className="space-y-5">
              <div>
                <h2
                  className="font-display text-2xl font-bold mb-1"
                  style={{ color: "oklch(0.92 0.14 50)" }}
                >
                  Verify OTP
                </h2>
                <p className="text-xs text-muted-foreground font-body">
                  Enter the 6-digit OTP sent to +91 {mobile}
                </p>
              </div>
              <div
                className="p-3 rounded-lg text-center"
                style={{
                  background: "oklch(0.22 0.1 80 / 0.3)",
                  border: "1px solid oklch(0.4 0.18 80 / 0.4)",
                }}
              >
                <p
                  className="text-xs font-body"
                  style={{ color: "oklch(0.72 0.14 80)" }}
                >
                  Demo OTP (shown for testing)
                </p>
                <p
                  className="font-mono text-2xl font-bold tracking-widest mt-1"
                  style={{ color: "oklch(0.85 0.2 80)" }}
                >
                  {generatedOtp}
                </p>
              </div>
              <div className="space-y-2">
                <Label
                  className="text-sm font-body"
                  style={{ color: "oklch(0.75 0.1 290)" }}
                >
                  Enter OTP
                </Label>
                <Input
                  type="text"
                  placeholder="6-digit OTP"
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value)}
                  data-ocid="login.input"
                  className="font-mono tracking-widest text-center"
                  style={{
                    background: "oklch(0.12 0.06 290)",
                    borderColor: "oklch(0.35 0.12 290 / 0.6)",
                    color: "oklch(0.9 0.06 290)",
                  }}
                  maxLength={6}
                  onKeyDown={(e) => e.key === "Enter" && handleVerifyOTP()}
                />
              </div>
              {error && (
                <p
                  className="text-xs text-red-400"
                  data-ocid="login.error_state"
                >
                  {error}
                </p>
              )}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 font-body text-sm"
                  onClick={handleResendOTP}
                  data-ocid="login.secondary_button"
                >
                  Resend
                </Button>
                <Button
                  className="flex-1 font-bold"
                  style={btnStyle}
                  onClick={handleVerifyOTP}
                  data-ocid="login.submit_button"
                >
                  Verify →
                </Button>
              </div>
            </div>
          )}

          {step === "register" && (
            <div className="space-y-4">
              <div>
                <h2
                  className="font-display text-2xl font-bold mb-1"
                  style={{ color: "oklch(0.92 0.14 50)" }}
                >
                  Create Account
                </h2>
                <p className="text-xs text-muted-foreground font-body">
                  Set up your Tambola profile
                </p>
              </div>
              <div className="space-y-2">
                <Label
                  className="text-sm font-body"
                  style={{ color: "oklch(0.75 0.1 290)" }}
                >
                  Display Name
                </Label>
                <Input
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  data-ocid="register.input"
                  style={{
                    background: "oklch(0.12 0.06 290)",
                    borderColor: "oklch(0.35 0.12 290 / 0.6)",
                    color: "oklch(0.9 0.06 290)",
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label
                  className="text-sm font-body"
                  style={{ color: "oklch(0.75 0.1 290)" }}
                >
                  Password
                </Label>
                <Input
                  type="password"
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  data-ocid="register.input"
                  style={{
                    background: "oklch(0.12 0.06 290)",
                    borderColor: "oklch(0.35 0.12 290 / 0.6)",
                    color: "oklch(0.9 0.06 290)",
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label
                  className="text-sm font-body"
                  style={{ color: "oklch(0.75 0.1 290)" }}
                >
                  Confirm Password
                </Label>
                <Input
                  type="password"
                  placeholder="Repeat password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  data-ocid="register.input"
                  style={{
                    background: "oklch(0.12 0.06 290)",
                    borderColor: "oklch(0.35 0.12 290 / 0.6)",
                    color: "oklch(0.9 0.06 290)",
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleRegister()}
                />
              </div>
              {error && (
                <p
                  className="text-xs text-red-400"
                  data-ocid="register.error_state"
                >
                  {error}
                </p>
              )}
              <Button
                className="w-full font-bold"
                style={btnStyle}
                onClick={handleRegister}
                data-ocid="register.submit_button"
              >
                Create Account →
              </Button>
            </div>
          )}

          {step === "login" && (
            <div className="space-y-5">
              <div>
                <h2
                  className="font-display text-2xl font-bold mb-1"
                  style={{ color: "oklch(0.92 0.14 50)" }}
                >
                  Welcome Back!
                </h2>
                <p className="text-xs text-muted-foreground font-body">
                  Enter your password for +91 {mobile}
                </p>
              </div>
              <div className="space-y-2">
                <Label
                  className="text-sm font-body"
                  style={{ color: "oklch(0.75 0.1 290)" }}
                >
                  Password
                </Label>
                <Input
                  type="password"
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  data-ocid="login.input"
                  style={{
                    background: "oklch(0.12 0.06 290)",
                    borderColor: "oklch(0.35 0.12 290 / 0.6)",
                    color: "oklch(0.9 0.06 290)",
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                />
              </div>
              {error && (
                <p
                  className="text-xs text-red-400"
                  data-ocid="login.error_state"
                >
                  {error}
                </p>
              )}
              <Button
                className="w-full font-bold"
                style={btnStyle}
                onClick={handleLogin}
                data-ocid="login.submit_button"
              >
                Login →
              </Button>
              <button
                type="button"
                className="text-xs text-muted-foreground hover:text-primary w-full text-center transition-colors"
                onClick={() => {
                  setStep("mobile");
                  setPassword("");
                  setError("");
                }}
                data-ocid="login.cancel_button"
              >
                ← Use a different number
              </button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <p className="mt-6 text-xs text-muted-foreground font-body text-center">
        © {new Date().getFullYear()}.{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          className="underline"
          target="_blank"
          rel="noreferrer"
        >
          Built with ❤️ using caffeine.ai
        </a>
      </p>
    </div>
  );
}
