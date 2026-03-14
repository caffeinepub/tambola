import { Toaster } from "@/components/ui/sonner";
import { AnimatePresence, motion } from "motion/react";
import { GameProvider, useGame } from "./context/GameContext";
import { Home } from "./pages/Home";
import { PlayerMode } from "./pages/PlayerMode";

function AppRoutes() {
  const { currentMode } = useGame();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentMode}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.25 }}
      >
        {currentMode === "home" && <Home />}
        {currentMode === "player" && <PlayerMode />}
      </motion.div>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <GameProvider>
      <AppRoutes />
      <Toaster richColors position="top-center" />
    </GameProvider>
  );
}
