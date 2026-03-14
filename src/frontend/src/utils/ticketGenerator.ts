export type TicketRow = (number | null)[];
export type Ticket = {
  id: string;
  rows: [TicketRow, TicketRow, TicketRow];
  numbers: number[];
};

// Column ranges: col 0 = 1-9, col 1 = 10-19, ..., col 8 = 80-90
const COL_RANGES: [number, number][] = [
  [1, 9],
  [10, 19],
  [20, 29],
  [30, 39],
  [40, 49],
  [50, 59],
  [60, 69],
  [70, 79],
  [80, 90],
];

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function generateTicket(idPrefix = "ticket"): Ticket {
  const id = `${idPrefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  // Each column can have 1, 2, or 3 numbers
  // Total must be 15, across 9 columns
  // Constraint: each row must have exactly 5 numbers

  // Strategy: assign column counts first, then place numbers in rows
  // Column count distribution: sum = 15 across 9 columns
  // min 1 per col, max 3 per col
  const colCounts = generateColCounts();

  // For each column, pick random numbers from its range
  const colNumbers: number[][] = colCounts.map((count, col) => {
    const [min, max] = COL_RANGES[col];
    const pool: number[] = [];
    for (let n = min; n <= max; n++) pool.push(n);
    return shuffle(pool)
      .slice(0, count)
      .sort((a, b) => a - b);
  });

  // Build the 3x9 grid
  // Place column numbers into rows such that each row has exactly 5 numbers
  const grid: (number | null)[][] = [
    Array(9).fill(null),
    Array(9).fill(null),
    Array(9).fill(null),
  ];

  // Place numbers column by column
  for (let col = 0; col < 9; col++) {
    const nums = colNumbers[col];
    if (nums.length === 1) {
      // Will assign to a row later — mark slot
      // Randomly pick a row (will fix counts afterward)
      const r = randInt(0, 2);
      grid[r][col] = nums[0];
    } else if (nums.length === 2) {
      const rows = shuffle([0, 1, 2]).slice(0, 2);
      rows.sort((a, b) => a - b);
      grid[rows[0]][col] = nums[0];
      grid[rows[1]][col] = nums[1];
    } else {
      grid[0][col] = nums[0];
      grid[1][col] = nums[1];
      grid[2][col] = nums[2];
    }
  }

  // Fix row counts — each row must have exactly 5 numbers
  fixRowCounts(grid);

  const rows: [TicketRow, TicketRow, TicketRow] = [grid[0], grid[1], grid[2]];

  const numbers = rows.flat().filter((n): n is number => n !== null);

  return { id, rows, numbers };
}

function generateColCounts(): number[] {
  // Each column gets 1, 2, or 3 numbers; sum = 15
  // Start with all 1s = 9, need 6 more to reach 15
  const counts = Array(9).fill(1);
  let remaining = 6;
  const cols = shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8]);
  for (const col of cols) {
    if (remaining === 0) break;
    const canAdd = Math.min(2, remaining); // max 2 more (total 3)
    const add = randInt(1, canAdd);
    counts[col] += add;
    remaining -= add;
  }
  // If remaining > 0, distribute
  for (let i = 0; i < 9 && remaining > 0; i++) {
    if (counts[i] < 3) {
      counts[i]++;
      remaining--;
    }
  }
  return counts;
}

function fixRowCounts(grid: (number | null)[][]): void {
  // Each row should have exactly 5 numbers
  const target = 5;

  for (let attempt = 0; attempt < 1000; attempt++) {
    const rowCounts = grid.map((row) => row.filter((c) => c !== null).length);
    const overRows = rowCounts
      .map((c, i) => ({ i, c }))
      .filter((r) => r.c > target);
    const underRows = rowCounts
      .map((c, i) => ({ i, c }))
      .filter((r) => r.c < target);

    if (overRows.length === 0 && underRows.length === 0) break;

    if (overRows.length > 0 && underRows.length > 0) {
      const over = overRows[0];
      const under = underRows[0];

      // Find a column in over row that is empty in under row
      for (let col = 0; col < 9; col++) {
        if (grid[over.i][col] !== null && grid[under.i][col] === null) {
          // Move this number to under row
          grid[under.i][col] = grid[over.i][col];
          grid[over.i][col] = null;
          break;
        }
      }
    } else {
      // Can't fix deterministically; regenerate would be better
      // but let's just try to balance by swapping randomly
      break;
    }
  }
}

export function getTicketNumbers(ticket: Ticket): Set<number> {
  return new Set(ticket.numbers);
}

export function getRowNumbers(ticket: Ticket, rowIndex: 0 | 1 | 2): number[] {
  return ticket.rows[rowIndex].filter((n): n is number => n !== null);
}
