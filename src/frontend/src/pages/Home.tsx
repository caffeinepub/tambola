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
            "linear-gradient(135deg, oklch(0.3 0.12 35) 0%, oklch(0.22 0.08 25) 100%)",
        }}
      >
        <img
          src="/assets/generated/tambola-hero-pattern.dim_1200x400.png"
          alt="Tambola decorative pattern"
          className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-luminosity"
        />
        <div className="relative z-10 container mx-auto px-6 py-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <div className="text-6xl mb-4">🎱</div>
            <h1 className="font-display text-6xl md:text-8xl font-bold text-tambola-gold mb-3 tracking-tight">
              Tambola
            </h1>
            <p className="text-tambola-gold/70 text-lg md:text-xl font-body mb-2">
              Housie · Indian Bingo
            </p>
            <p className="text-white/50 text-sm font-body max-w-md mx-auto">
              Numbers 1–90 · 3 rows · 9 columns · 15 numbers per ticket
            </p>
          </motion.div>
        </div>
      </div>

      {/* Mode Selection */}
      <main className="flex-1 container mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-center mb-10"
        >
          <h2 className="font-display text-3xl text-foreground mb-2">
            Ready to Play?
          </h2>
          <p className="text-muted-foreground font-body">
            Join the game, draw numbers, and claim prizes!
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
              boxShadow: "0 20px 40px oklch(0.5 0.18 22 / 0.3)",
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
                  "linear-gradient(135deg, oklch(0.5 0.18 22), oklch(0.4 0.15 20))",
              }}
            >
              <div className="text-6xl mb-4">🎫</div>
              <h3 className="font-display text-3xl text-white font-bold mb-2">
                Play Tambola
              </h3>
              <p className="text-white/75 text-sm font-body leading-relaxed">
                Get your tickets, draw numbers as the caller, mark off called
                numbers, and shout out to claim prizes like Early Five or Full
                House!
              </p>
            </div>
            <div className="bg-card px-6 py-4 flex items-center justify-between">
              <span className="text-sm text-muted-foreground font-body">
                Draw numbers · Mark tickets · Claim prizes
              </span>
              <span className="text-secondary font-bold text-xl group-hover:translate-x-1 transition-transform">
                →
              </span>
            </div>
          </motion.button>
        </div>

        {/* Rules Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="mt-12 max-w-3xl mx-auto bg-card rounded-2xl p-6 border border-border shadow-xs"
        >
          <h3 className="font-display text-xl text-foreground mb-4">
            🏆 Winning Combinations
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { emoji: "🌟", name: "Early Five", desc: "First 5 numbers" },
              { emoji: "⬆️", name: "Top Line", desc: "All row 1 numbers" },
              { emoji: "➡️", name: "Middle Line", desc: "All row 2 numbers" },
              { emoji: "⬇️", name: "Bottom Line", desc: "All row 3 numbers" },
              { emoji: "🏆", name: "Full House", desc: "All 15 numbers" },
            ].map((prize) => (
              <div
                key={prize.name}
                className="text-center p-3 bg-muted/40 rounded-xl"
              >
                <div className="text-2xl mb-1">{prize.emoji}</div>
                <div className="font-display text-sm font-bold text-foreground">
                  {prize.name}
                </div>
                <div className="text-xs text-muted-foreground font-body mt-0.5">
                  {prize.desc}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-muted-foreground font-body border-t border-border">
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
