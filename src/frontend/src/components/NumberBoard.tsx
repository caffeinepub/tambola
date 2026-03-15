import { motion } from "motion/react";

type Props = {
  calledNumbers: number[];
};

export function NumberBoard({ calledNumbers }: Props) {
  const calledSet = new Set(calledNumbers);

  return (
    <div className="space-y-1">
      <div
        className="grid gap-1"
        style={{ gridTemplateColumns: "repeat(9, minmax(0, 1fr))" }}
      >
        {Array.from({ length: 90 }, (_, i) => i + 1).map((num) => {
          const isCalled = calledSet.has(num);
          const isLastCalled = calledNumbers[calledNumbers.length - 1] === num;
          return (
            <motion.div
              key={num}
              className={`number-board-cell ${
                isCalled
                  ? "called"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted"
              } ${isLastCalled ? "ring-2 ring-accent ring-offset-1" : ""}`}
              animate={isCalled && isLastCalled ? { scale: [1, 1.25, 1] } : {}}
              transition={{ duration: 0.4 }}
            >
              {num}
            </motion.div>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground text-center">
        {calledNumbers.length} / 90 numbers called
      </p>
    </div>
  );
}
