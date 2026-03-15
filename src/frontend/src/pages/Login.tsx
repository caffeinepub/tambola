import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
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
  };

  const handleLogin = () => {
    setError("");
    if (!password) {
      setError("Please enter your password.");
      return;
    }
    const result = loginWithMobile(mobile, password);
    if (result === "wrong_password") {
      setError("Incorrect password. Please try again.");
    }
    // On success, App.tsx will route to Home via authPlayer state
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{
        background:
          "linear-gradient(135deg, oklch(0.18 0.18 280) 0%, oklch(0.13 0.12 300) 100%)",
      }}
    >
      {/* Background decorative circles */}
      <div
        className="fixed inset-0 overflow-hidden pointer-events-none"
        aria-hidden="true"
      >
        <div
          className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-20 blur-3xl"
          style={{ background: "oklch(0.55 0.25 280)" }}
        />
        <div
          className="absolute -bottom-32 -right-32 w-80 h-80 rounded-full opacity-15 blur-3xl"
          style={{ background: "oklch(0.55 0.22 200)" }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-sm"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <img
            src="/assets/generated/tambola-logo-new-transparent.dim_300x120.png"
            alt="Tambola"
            className="h-14 object-contain mx-auto mb-3 drop-shadow-[0_0_20px_oklch(0.8_0.2_60/0.6)]"
          />
          <p className="text-sm" style={{ color: "oklch(0.75 0.08 280)" }}>
            Sign in to play Housie · Indian Bingo
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-6 shadow-2xl"
          style={{
            background: "oklch(0.16 0.10 280 / 0.85)",
            border: "1px solid oklch(0.35 0.15 280 / 0.4)",
            backdropFilter: "blur(12px)",
          }}
        >
          <AnimatePresence mode="wait">
            {/* ─── Step 1: Mobile ─── */}
            {step === "mobile" && (
              <motion.div
                key="mobile"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
              >
                <h2
                  className="text-2xl font-bold mb-1"
                  style={{ color: "oklch(0.95 0.05 280)" }}
                >
                  Welcome!
                </h2>
                <p
                  className="text-sm mb-6"
                  style={{ color: "oklch(0.65 0.08 280)" }}
                >
                  Enter your mobile number to get started
                </p>

                <div className="space-y-4">
                  <div>
                    <Label
                      htmlFor="mobile"
                      style={{ color: "oklch(0.78 0.08 280)" }}
                    >
                      Mobile Number
                    </Label>
                    <Input
                      id="mobile"
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      placeholder="10-digit mobile number"
                      value={mobile}
                      onChange={(e) =>
                        setMobile(e.target.value.replace(/\D/g, ""))
                      }
                      onKeyDown={(e) => e.key === "Enter" && handleSendOTP()}
                      data-ocid="login.mobile_input"
                      className="mt-1 bg-white/5 border-white/20 text-white placeholder:text-white/30 focus:border-purple-400"
                    />
                  </div>

                  {error && (
                    <p
                      className="text-sm"
                      style={{ color: "oklch(0.7 0.2 25)" }}
                      data-ocid="login.error_state"
                    >
                      {error}
                    </p>
                  )}

                  <Button
                    onClick={handleSendOTP}
                    data-ocid="login.send_otp_button"
                    className="w-full font-bold"
                    style={{
                      background:
                        "linear-gradient(135deg, oklch(0.55 0.22 280), oklch(0.45 0.20 300))",
                      color: "white",
                    }}
                  >
                    Send OTP
                  </Button>
                </div>
              </motion.div>
            )}

            {/* ─── Step 2: OTP ─── */}
            {step === "otp" && (
              <motion.div
                key="otp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
              >
                <h2
                  className="text-2xl font-bold mb-1"
                  style={{ color: "oklch(0.95 0.05 280)" }}
                >
                  Verify OTP
                </h2>
                <p
                  className="text-sm mb-4"
                  style={{ color: "oklch(0.65 0.08 280)" }}
                >
                  OTP sent to +91-{mobile}
                </p>

                {/* Simulated OTP Display */}
                <div
                  className="rounded-xl p-4 mb-5 text-center"
                  style={{
                    background: "oklch(0.25 0.18 150 / 0.3)",
                    border: "1px solid oklch(0.55 0.18 150 / 0.5)",
                  }}
                >
                  <p
                    className="text-xs mb-1"
                    style={{ color: "oklch(0.7 0.12 150)" }}
                  >
                    🔐 Your OTP (demo)
                  </p>
                  <span
                    className="text-4xl font-black tracking-widest"
                    style={{ color: "oklch(0.85 0.22 150)" }}
                  >
                    {generatedOtp}
                  </span>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label
                      htmlFor="otp"
                      style={{ color: "oklch(0.78 0.08 280)" }}
                    >
                      Enter 6-digit OTP
                    </Label>
                    <Input
                      id="otp"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="000000"
                      value={otpInput}
                      onChange={(e) =>
                        setOtpInput(e.target.value.replace(/\D/g, ""))
                      }
                      onKeyDown={(e) => e.key === "Enter" && handleVerifyOTP()}
                      data-ocid="login.otp_input"
                      className="mt-1 bg-white/5 border-white/20 text-white placeholder:text-white/30 focus:border-purple-400 tracking-[0.3em] text-center text-xl"
                    />
                  </div>

                  {error && (
                    <p
                      className="text-sm"
                      style={{ color: "oklch(0.7 0.2 25)" }}
                      data-ocid="login.error_state"
                    >
                      {error}
                    </p>
                  )}

                  <Button
                    onClick={handleVerifyOTP}
                    data-ocid="login.verify_button"
                    className="w-full font-bold"
                    style={{
                      background:
                        "linear-gradient(135deg, oklch(0.55 0.22 280), oklch(0.45 0.20 300))",
                      color: "white",
                    }}
                  >
                    Verify OTP
                  </Button>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={handleResendOTP}
                      className="text-sm underline"
                      style={{ color: "oklch(0.65 0.12 280)" }}
                    >
                      Resend OTP
                    </button>
                    <span
                      className="mx-2 text-sm"
                      style={{ color: "oklch(0.45 0.06 280)" }}
                    >
                      ·
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setStep("mobile");
                        setError("");
                        setOtpInput("");
                      }}
                      className="text-sm underline"
                      style={{ color: "oklch(0.65 0.12 280)" }}
                    >
                      Change Number
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ─── Step 3a: Register ─── */}
            {step === "register" && !showSuccess && (
              <motion.div
                key="register"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
              >
                <h2
                  className="text-2xl font-bold mb-1"
                  style={{ color: "oklch(0.95 0.05 280)" }}
                >
                  Create Account
                </h2>
                <p
                  className="text-sm mb-5"
                  style={{ color: "oklch(0.65 0.08 280)" }}
                >
                  Set up your Tambola profile
                </p>

                <div className="space-y-4">
                  <div>
                    <Label
                      htmlFor="name"
                      style={{ color: "oklch(0.78 0.08 280)" }}
                    >
                      Display Name
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      data-ocid="login.name_input"
                      className="mt-1 bg-white/5 border-white/20 text-white placeholder:text-white/30 focus:border-purple-400"
                    />
                  </div>

                  <div>
                    <Label
                      htmlFor="password"
                      style={{ color: "oklch(0.78 0.08 280)" }}
                    >
                      Password
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Min 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      data-ocid="login.password_input"
                      className="mt-1 bg-white/5 border-white/20 text-white placeholder:text-white/30 focus:border-purple-400"
                    />
                  </div>

                  <div>
                    <Label
                      htmlFor="confirm-password"
                      style={{ color: "oklch(0.78 0.08 280)" }}
                    >
                      Confirm Password
                    </Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="Repeat password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleRegister()}
                      data-ocid="login.confirm_password_input"
                      className="mt-1 bg-white/5 border-white/20 text-white placeholder:text-white/30 focus:border-purple-400"
                    />
                  </div>

                  {error && (
                    <p
                      className="text-sm"
                      style={{ color: "oklch(0.7 0.2 25)" }}
                      data-ocid="login.error_state"
                    >
                      {error}
                    </p>
                  )}

                  <Button
                    onClick={handleRegister}
                    data-ocid="login.register_button"
                    className="w-full font-bold"
                    style={{
                      background:
                        "linear-gradient(135deg, oklch(0.55 0.22 280), oklch(0.45 0.20 300))",
                      color: "white",
                    }}
                  >
                    Create Account
                  </Button>
                </div>
              </motion.div>
            )}

            {/* ─── Step 3a success: show Unique ID ─── */}
            {step === "register" && showSuccess && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.35, type: "spring" }}
                className="text-center"
              >
                <div className="text-5xl mb-3">🎉</div>
                <h2
                  className="text-2xl font-bold mb-1"
                  style={{ color: "oklch(0.95 0.05 280)" }}
                >
                  Account Created!
                </h2>
                <p
                  className="text-sm mb-5"
                  style={{ color: "oklch(0.65 0.08 280)" }}
                >
                  Welcome, {registeredName}!
                </p>

                <div
                  className="rounded-xl p-4 mb-6"
                  style={{
                    background: "oklch(0.22 0.18 60 / 0.35)",
                    border: "1px solid oklch(0.65 0.22 60 / 0.5)",
                  }}
                >
                  <p
                    className="text-xs mb-1"
                    style={{ color: "oklch(0.75 0.12 60)" }}
                  >
                    Your Unique Player ID
                  </p>
                  <p
                    className="text-3xl font-black tracking-widest"
                    style={{ color: "oklch(0.88 0.22 60)" }}
                  >
                    {registeredId}
                  </p>
                  <p
                    className="text-xs mt-2"
                    style={{ color: "oklch(0.6 0.08 60)" }}
                  >
                    Save this ID — it's your identity in Tambola
                  </p>
                </div>

                <Button
                  onClick={() => {
                    /* authPlayer is already set */
                  }}
                  data-ocid="login.primary_button"
                  className="w-full font-bold"
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(0.55 0.22 60), oklch(0.48 0.18 80))",
                    color: "white",
                  }}
                >
                  Continue to Play 🎲
                </Button>
              </motion.div>
            )}

            {/* ─── Step 3b: Login ─── */}
            {step === "login" && (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
              >
                <h2
                  className="text-2xl font-bold mb-1"
                  style={{ color: "oklch(0.95 0.05 280)" }}
                >
                  Welcome Back!
                </h2>
                <p
                  className="text-sm mb-5"
                  style={{ color: "oklch(0.65 0.08 280)" }}
                >
                  Enter your password to continue
                </p>

                <div className="space-y-4">
                  <div>
                    <Label
                      htmlFor="login-password"
                      style={{ color: "oklch(0.78 0.08 280)" }}
                    >
                      Password
                    </Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="Your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                      data-ocid="login.password_input"
                      className="mt-1 bg-white/5 border-white/20 text-white placeholder:text-white/30 focus:border-purple-400"
                    />
                  </div>

                  {error && (
                    <p
                      className="text-sm"
                      style={{ color: "oklch(0.7 0.2 25)" }}
                      data-ocid="login.error_state"
                    >
                      {error}
                    </p>
                  )}

                  <Button
                    onClick={handleLogin}
                    data-ocid="login.login_button"
                    className="w-full font-bold"
                    style={{
                      background:
                        "linear-gradient(135deg, oklch(0.55 0.22 280), oklch(0.45 0.20 300))",
                      color: "white",
                    }}
                  >
                    Login
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <p
          className="text-center text-xs mt-6"
          style={{ color: "oklch(0.45 0.06 280)" }}
        >
          © {new Date().getFullYear()}.{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:opacity-80"
          >
            Built with ❤️ using caffeine.ai
          </a>
        </p>
      </motion.div>
    </div>
  );
}
