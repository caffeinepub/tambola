import { LogOut, Settings, User } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { PvpBetLobby } from "../components/PvpBetLobby";
import { RealMoneyWallet } from "../components/RealMoneyWallet";
import { useGame } from "../context/GameContext";

export function Home() {
  const {
    setMode,
    authPlayer,
    logout,
    multiplayerRoom,
    createMultiplayerRoom,
    joinMultiplayerRoom,
    leaveMultiplayerRoom,
  } = useGame();

  const [showMultiplayer, setShowMultiplayer] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joinStatus, setJoinStatus] = useState<
    "idle" | "joining" | "joined" | "error"
  >("idle");
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Lock portrait orientation on home screen
  useState(() => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ori = (screen as any).orientation;
      if (ori && typeof ori.lock === "function") {
        ori.lock("portrait").catch(() => {});
      }
    } catch {}
  });

  const handleCreateRoom = async () => {
    setCreatingRoom(true);
    try {
      const code = await createMultiplayerRoom();
      toast.success(`Room created! Code: ${code}`);
    } catch {
      toast.error("Failed to create room. Try again.");
    } finally {
      setCreatingRoom(false);
    }
  };

  const handleCopyCode = () => {
    if (multiplayerRoom?.code) {
      navigator.clipboard.writeText(multiplayerRoom.code).catch(() => {});
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleJoinRoom = async () => {
    if (joinCode.trim().length !== 6) {
      toast.error("Enter a 6-character room code.");
      return;
    }
    setJoinStatus("joining");
    const result = await joinMultiplayerRoom(joinCode.trim());
    if (result === "ok") {
      setJoinStatus("joined");
      toast.success("Joined the room! Press Play to start.");
    } else if (result === "not_found") {
      setJoinStatus("error");
      toast.error("Room not found. Check the code.");
    } else {
      setJoinStatus("error");
      toast.error("Could not join room. Try again.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero — vibrant multi-color gradient */}
      <div
        className="relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.28 0.22 290) 0%, oklch(0.32 0.24 340) 40%, oklch(0.38 0.22 50) 100%)",
        }}
      >
        {/* Decorative glowing circles */}
        <div
          aria-hidden="true"
          className="absolute -top-20 -left-20 w-72 h-72 rounded-full opacity-30 blur-3xl pointer-events-none"
          style={{ background: "oklch(0.65 0.3 300)" }}
        />
        <div
          aria-hidden="true"
          className="absolute top-10 right-10 w-48 h-48 rounded-full opacity-25 blur-2xl pointer-events-none"
          style={{ background: "oklch(0.7 0.28 50)" }}
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-10 left-1/3 w-56 h-56 rounded-full opacity-20 blur-3xl pointer-events-none"
          style={{ background: "oklch(0.65 0.28 170)" }}
        />

        <div className="relative z-10 container mx-auto px-6 py-14 text-center">
          {/* Player badge + actions */}
          {authPlayer && (
            <div className="absolute top-4 right-4 flex items-center gap-2 flex-wrap justify-end">
              <span
                data-ocid="home.player_badge"
                className="text-xs px-3 py-1 rounded-full font-mono"
                style={{
                  background: "oklch(0.22 0.12 300 / 0.7)",
                  color: "oklch(0.9 0.12 300)",
                  border: "1px solid oklch(0.5 0.18 300 / 0.4)",
                }}
              >
                {authPlayer.name} · {authPlayer.uniqueId}
              </span>
              <button
                type="button"
                data-ocid="home.profile_button"
                onClick={() => setMode("profile")}
                className="flex items-center gap-1 text-xs px-3 py-1 rounded-full hover:opacity-80 transition-opacity"
                style={{
                  background: "oklch(0.28 0.2 170 / 0.6)",
                  color: "oklch(0.85 0.18 170)",
                  border: "1px solid oklch(0.5 0.2 170 / 0.4)",
                }}
              >
                <User size={12} />
                <span>Profile</span>
              </button>
              <button
                type="button"
                data-ocid="home.logout_button"
                onClick={logout}
                className="flex items-center gap-1 text-xs px-3 py-1 rounded-full hover:opacity-80 transition-opacity"
                style={{
                  background: "oklch(0.28 0.15 25 / 0.6)",
                  color: "oklch(0.82 0.14 25)",
                  border: "1px solid oklch(0.5 0.18 25 / 0.4)",
                }}
              >
                <LogOut size={12} />
                <span>Logout</span>
              </button>
            </div>
          )}
          {authPlayer && (
            <div className="flex justify-end mt-2 mr-4">
              <RealMoneyWallet />
            </div>
          )}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            {/* Colorful Logo */}
            <div className="flex justify-center mb-4">
              <img
                src="/assets/generated/tambola-logo-colorful-transparent.dim_400x180.png"
                alt="Tambola Logo"
                className="h-24 md:h-32 object-contain drop-shadow-[0_0_32px_rgba(255,140,0,0.6)]"
              />
            </div>
            <p
              className="text-lg md:text-xl font-body mb-2"
              style={{ color: "oklch(0.95 0.1 50)" }}
            >
              Housie · Indian Bingo
            </p>
            <p className="text-white/60 text-sm font-body max-w-md mx-auto">
              Numbers 1–90 · 3 rows · 9 columns · 15 numbers per ticket
            </p>
          </motion.div>
        </div>
      </div>

      {/* Main content */}
      <main
        className="flex-1 container mx-auto px-6 py-12"
        style={{
          background:
            "linear-gradient(180deg, oklch(0.13 0.06 290) 0%, oklch(0.12 0.05 300) 100%)",
        }}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-center mb-10"
        >
          <h2
            className="font-display text-3xl mb-2"
            style={{ color: "oklch(0.92 0.1 300)" }}
          >
            Ready to Play?
          </h2>
          <p className="text-muted-foreground font-body">
            Jump in and play — claim prizes like Early Five or Full House!
          </p>
        </motion.div>

        <div className="flex justify-center">
          {/* Play Now card */}
          <motion.button
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5, type: "spring" }}
            whileHover={{
              y: -6,
              boxShadow: "0 24px 48px oklch(0.55 0.28 40 / 0.45)",
            }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setMode("player")}
            data-ocid="home.player.button"
            className="group rounded-2xl overflow-hidden text-left cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-secondary w-full max-w-md"
            style={{
              boxShadow: "0 8px 32px oklch(0.5 0.25 40 / 0.3)",
            }}
          >
            <div
              className="p-8"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.58 0.26 50) 0%, oklch(0.48 0.28 330) 60%, oklch(0.42 0.24 290) 100%)",
              }}
            >
              <div className="text-6xl mb-4">🎫</div>
              <h3 className="font-display text-3xl text-white font-bold mb-2">
                Play Now
              </h3>
              <p className="text-white/80 text-sm font-body leading-relaxed">
                Get your tickets and let the 🔊 Auto Caller draw numbers. Mark
                off called numbers and shout to claim prizes like Early Five or
                Full House!
              </p>
            </div>
            <div
              className="px-6 py-4 flex items-center justify-between"
              style={{
                background: "oklch(0.17 0.08 300)",
              }}
            >
              <span className="text-sm text-muted-foreground font-body">
                🎫 Get tickets · 🏆 Win prizes · 🎰 Place bets
              </span>
              <span
                className="font-bold text-xl group-hover:translate-x-1 transition-transform"
                style={{ color: "oklch(0.82 0.22 50)" }}
              >
                →
              </span>
            </div>
          </motion.button>
        </div>

        {/* Prize info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="mt-10 max-w-md mx-auto"
        >
          <h3
            className="text-center text-sm font-body mb-4 uppercase tracking-widest"
            style={{ color: "oklch(0.65 0.1 300)" }}
          >
            Prizes
          </h3>
          <div className="flex flex-wrap gap-2 justify-center">
            {(
              [
                {
                  label: "Early Five",
                  color: "oklch(0.55 0.28 50)",
                  emoji: "⭐",
                },
                { label: "Corners", color: "oklch(0.5 0.26 170)", emoji: "🔲" },
                { label: "Top Row", color: "oklch(0.5 0.26 220)", emoji: "⬆️" },
                { label: "Mid Row", color: "oklch(0.5 0.26 290)", emoji: "➡️" },
                { label: "Bot Row", color: "oklch(0.5 0.24 330)", emoji: "⬇️" },
                {
                  label: "Full House",
                  color: "oklch(0.55 0.28 60)",
                  emoji: "🏆",
                },
              ] as { label: string; color: string; emoji: string }[]
            ).map((p) => (
              <span
                key={p.label}
                className="text-xs px-3 py-1 rounded-full text-white font-bold"
                style={{ background: p.color }}
              >
                {p.emoji} {p.label}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Multiplayer Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="mt-8 max-w-md mx-auto"
        >
          <button
            type="button"
            onClick={() => setShowMultiplayer((v) => !v)}
            data-ocid="home.multiplayer.toggle"
            className="w-full flex items-center justify-between px-5 py-3 rounded-xl font-body text-sm font-bold transition-all"
            style={{
              background: showMultiplayer
                ? "oklch(0.22 0.12 290)"
                : "oklch(0.18 0.09 290)",
              border: "1px solid oklch(0.35 0.14 290 / 0.5)",
              color: "oklch(0.82 0.16 290)",
            }}
          >
            <span>🌐 Multiplayer</span>
            <span className="text-xs opacity-70">
              {showMultiplayer ? "▲ Hide" : "▼ Show"}
            </span>
          </button>

          <AnimatePresence>
            {showMultiplayer && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div
                  className="rounded-b-xl p-5 space-y-5"
                  style={{
                    background: "oklch(0.17 0.08 290)",
                    border: "1px solid oklch(0.3 0.12 290 / 0.4)",
                    borderTop: "none",
                  }}
                >
                  {/* Host Section */}
                  <div>
                    <p
                      className="text-xs font-bold uppercase tracking-widest mb-3"
                      style={{ color: "oklch(0.7 0.12 50)" }}
                    >
                      🎙️ Host a Game
                    </p>
                    {multiplayerRoom?.role === "host" ? (
                      <div className="space-y-3">
                        <p className="text-xs text-muted-foreground font-body">
                          Share this code with friends:
                        </p>
                        <div className="flex items-center gap-2">
                          <span
                            className="font-mono text-2xl font-black tracking-widest px-4 py-2 rounded-lg flex-1 text-center"
                            style={{
                              background: "oklch(0.22 0.14 50 / 0.3)",
                              color: "oklch(0.88 0.22 50)",
                              border: "1px solid oklch(0.45 0.2 50 / 0.5)",
                            }}
                          >
                            {multiplayerRoom.code}
                          </span>
                          <button
                            type="button"
                            onClick={handleCopyCode}
                            data-ocid="home.multiplayer.button"
                            className="text-xs px-3 py-2 rounded-lg font-bold transition-all"
                            style={{
                              background: copiedCode
                                ? "oklch(0.4 0.18 130)"
                                : "oklch(0.28 0.14 50 / 0.6)",
                              color: copiedCode
                                ? "white"
                                : "oklch(0.8 0.16 50)",
                              border: "1px solid oklch(0.4 0.16 50 / 0.4)",
                            }}
                          >
                            {copiedCode ? "✓ Copied" : "📋 Copy"}
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={leaveMultiplayerRoom}
                          data-ocid="home.multiplayer.cancel_button"
                          className="text-xs text-muted-foreground hover:text-red-400 transition-colors"
                        >
                          × Close Room
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={handleCreateRoom}
                        disabled={creatingRoom}
                        data-ocid="home.multiplayer.primary_button"
                        className="w-full py-2 rounded-lg text-sm font-bold transition-all disabled:opacity-50"
                        style={{
                          background:
                            "linear-gradient(135deg, oklch(0.5 0.22 50), oklch(0.42 0.22 60))",
                          color: "white",
                        }}
                      >
                        {creatingRoom ? "Creating..." : "🎙️ Create Room"}
                      </button>
                    )}
                  </div>

                  <div
                    className="border-t"
                    style={{ borderColor: "oklch(0.3 0.1 290 / 0.3)" }}
                  />

                  {/* Join Section */}
                  <div>
                    <p
                      className="text-xs font-bold uppercase tracking-widest mb-3"
                      style={{ color: "oklch(0.7 0.12 170)" }}
                    >
                      🎮 Join a Game
                    </p>
                    {multiplayerRoom?.role === "guest" ? (
                      <div className="space-y-3">
                        <div
                          className="flex items-center gap-2 p-3 rounded-lg"
                          style={{
                            background: "oklch(0.22 0.12 170 / 0.3)",
                            border: "1px solid oklch(0.4 0.16 170 / 0.4)",
                          }}
                        >
                          <span className="text-green-400 text-lg">✓</span>
                          <div>
                            <p
                              className="text-xs font-bold"
                              style={{ color: "oklch(0.8 0.16 170)" }}
                            >
                              Joined Room: {multiplayerRoom.code}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Host: {multiplayerRoom.hostName}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setMode("player")}
                            data-ocid="home.multiplayer.primary_button"
                            className="flex-1 py-2 rounded-lg text-sm font-bold"
                            style={{
                              background:
                                "linear-gradient(135deg, oklch(0.5 0.22 170), oklch(0.42 0.2 180))",
                              color: "white",
                            }}
                          >
                            ▶ Play
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              leaveMultiplayerRoom();
                              setJoinStatus("idle");
                              setJoinCode("");
                            }}
                            data-ocid="home.multiplayer.cancel_button"
                            className="px-3 py-2 rounded-lg text-sm font-body"
                            style={{
                              background: "oklch(0.22 0.08 0 / 0.4)",
                              color: "oklch(0.7 0.08 0)",
                              border: "1px solid oklch(0.35 0.1 0 / 0.4)",
                            }}
                          >
                            Leave
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="6-char code (e.g. AB12CD)"
                          value={joinCode}
                          onChange={(e) =>
                            setJoinCode(e.target.value.toUpperCase())
                          }
                          maxLength={6}
                          data-ocid="home.multiplayer.input"
                          className="flex-1 px-3 py-2 rounded-lg text-sm font-mono uppercase tracking-widest outline-none"
                          style={{
                            background: "oklch(0.12 0.06 290)",
                            border: "1px solid oklch(0.35 0.12 290 / 0.6)",
                            color: "oklch(0.9 0.06 290)",
                          }}
                          onKeyDown={(e) =>
                            e.key === "Enter" && handleJoinRoom()
                          }
                        />
                        <button
                          type="button"
                          onClick={handleJoinRoom}
                          disabled={joinStatus === "joining"}
                          data-ocid="home.multiplayer.secondary_button"
                          className="px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-50 transition-all"
                          style={{
                            background:
                              "linear-gradient(135deg, oklch(0.5 0.22 170), oklch(0.42 0.2 180))",
                            color: "white",
                          }}
                        >
                          {joinStatus === "joining" ? "..." : "Join"}
                        </button>
                      </div>
                    )}
                    {joinStatus === "error" && (
                      <p
                        className="text-xs text-red-400 mt-2"
                        data-ocid="home.multiplayer.error_state"
                      >
                        Could not join room. Check the code and try again.
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <div className="mt-8 max-w-lg mx-auto">
          <PvpBetLobby gameId="current-game" />
        </div>
      </main>

      {/* Footer */}
      <footer
        className="relative py-4 text-center text-xs text-muted-foreground font-body border-t"
        style={{
          background:
            "linear-gradient(90deg, oklch(0.14 0.07 290), oklch(0.16 0.08 340), oklch(0.14 0.07 290))",
          borderColor: "oklch(0.25 0.1 300 / 0.4)",
        }}
      >
        © {new Date().getFullYear()}.{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          className="underline hover:text-primary transition-colors"
          target="_blank"
          rel="noreferrer"
        >
          Built with ❤️ using caffeine.ai
        </a>
        {/* Discrete Admin button */}
        <button
          type="button"
          data-ocid="admin.button"
          onClick={() => setMode("admin")}
          className="absolute bottom-3 right-4 flex items-center gap-1 opacity-30 hover:opacity-60 transition-opacity text-xs"
          style={{ color: "oklch(0.6 0.06 280)" }}
        >
          <Settings size={11} />
          Admin
        </button>
      </footer>
    </div>
  );
}
