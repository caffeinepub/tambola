import { motion } from "motion/react";
import { useGame } from "../context/GameContext";

export function Home() {
  const { setMode } = useGame();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero */}
      <div
        className="relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.28 0.22 280) 0%, oklch(0.18 0.18 300) 100%)",
        }}
      >
        <img
          src="/assets/generated/tambola-hero-pattern.dim_1200x400.png"
          alt="Tambola decorative pattern"
          className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-luminosity"
        />
        <div className="relative z-10 container mx-auto px-6 py-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            {/* New Logo */}
            <div className="flex justify-center mb-4">
              <img
                src="/assets/generated/tambola-logo-new-transparent.dim_300x120.png"
                alt="Tambola Logo"
                className="h-16 md:h-20 object-contain drop-shadow-[0_0_24px_oklch(0.8_0.2_60/0.7)]"
              />
            </div>
            <p
              className="text-lg md:text-xl font-body mb-2"
              style={{ color: "oklch(0.85 0.08 60 / 0.8)" }}
            >
              Housie · Indian Bingo
            </p>
            <p className="text-white/50 text-sm font-body max-w-md mx-auto">
              Numbers 1–90 · 3 rows · 9 columns · 15 numbers per ticket
            </p>
          </motion.div>
        </div>
      </div>

      {/* Mode Selection */}
      <main
        className="flex-1 container mx-auto px-6 py-12"
        style={{ background: "oklch(0.13 0.06 280)" }}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-center mb-10"
        >
          <h2
            className="font-display text-3xl mb-2"
            style={{ color: "oklch(0.9 0.08 280)" }}
          >
            Ready to Play?
          </h2>
          <p className="text-muted-foreground font-body">
            Jump in and play — claim prizes like Early Five or Full House!
          </p>
        </motion.div>

        <div className="flex justify-center">
          {/* Player Mode */}
          <motion.button
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5, type: "spring" }}
            whileHover={{
              y: -6,
              boxShadow: "0 20px 40px oklch(0.5 0.22 280 / 0.4)",
            }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setMode("player")}
            data-ocid="home.player.button"
            className="group rounded-2xl overflow-hidden text-left cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-secondary shadow-number w-full max-w-md"
          >
            <div
              className="p-8"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.45 0.22 280), oklch(0.35 0.18 300))",
              }}
            >
              <div className="text-6xl mb-4">🎫</div>
              <h3 className="font-display text-3xl text-white font-bold mb-2">
                Play Now
              </h3>
              <p className="text-white/75 text-sm font-body leading-relaxed">
                Get your tickets and let the 🔊 Auto Caller draw numbers. Mark
                off called numbers and shout to claim prizes like Early Five or
                Full House!
              </p>
            </div>
            <div
              className="px-6 py-4 flex items-center justify-between"
              style={{ background: "oklch(0.18 0.08 280)" }}
            >
              <span className="text-sm text-muted-foreground font-body">
                🎫 Get tickets · 🏆 Win prizes · 🎰 Place bets
              </span>
              <span
                className="font-bold text-xl group-hover:translate-x-1 transition-transform"
                style={{ color: "oklch(0.75 0.18 280)" }}
              >
                →
              </span>
            </div>
          </motion.button>
        </div>
      </main>

      {/* Footer */}
      <footer
        className="py-4 text-center text-xs text-muted-foreground font-body border-t border-border"
        style={{ background: "oklch(0.13 0.06 280)" }}
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
      </footer>
    </div>
  );
}
