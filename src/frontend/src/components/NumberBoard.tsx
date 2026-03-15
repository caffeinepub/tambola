import { motion } from "motion/react";

type Props = {
  calledNumbers: number[];
};

export function NumberBoard({ calledNumbers }: Props) {
  const calledSet = new Set(calledNumbers);
  const lastCalled = calledNumbers[calledNumbers.length - 1];

  const rows = Array.from({ length: 9 }, (_, rowIdx) => {
    const start = rowIdx * 10 + 1;
    const end = start + 9;
    return {
      label: `${start}–${end}`,
      nums: Array.from({ length: 10 }, (_, i) => start + i),
    };
  });

  return (
    <div className="p-3 space-y-2">
      <div className="flex items-center justify-between mb-1">
        <span
          className="text-xs font-bold uppercase tracking-widest"
          style={{ color: "oklch(0.7 0.1 160)" }}
        >
          Total Board
        </span>
        <span
          className="text-xs font-mono"
          style={{ color: "oklch(0.75 0.14 80)" }}
        >
          {calledNumbers.length} / 90
        </span>
      </div>
      {rows.map(({ label, nums }) => (
        <div key={label} className="flex items-center gap-1">
          <span
            className="text-xs font-mono w-8 text-right flex-shrink-0"
            style={{ color: "oklch(0.55 0.1 160)" }}
          >
            {label}
          </span>
          <div className="flex gap-0.5 flex-1">
            {nums.map((num) => {
              const isCalled = calledSet.has(num);
              const isLast = num === lastCalled;
              return (
                <motion.div
                  key={num}
                  animate={isLast ? { scale: [1, 1.3, 1] } : {}}
                  transition={{ duration: 0.4 }}
                  className="flex-1 aspect-square flex items-center justify-center text-xs font-bold rounded"
                  style={
                    isLast
                      ? {
                          background:
                            "linear-gradient(135deg, oklch(0.55 0.22 80), oklch(0.45 0.2 90))",
                          color: "white",
                          boxShadow: "0 0 10px oklch(0.55 0.22 80 / 0.7)",
                        }
                      : isCalled
                        ? {
                            background: "oklch(0.42 0.18 160)",
                            color: "white",
                          }
                        : {
                            background: "oklch(0.22 0.06 160 / 0.6)",
                            color: "oklch(0.5 0.08 160)",
                          }
                  }
                >
                  {num}
                </motion.div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
