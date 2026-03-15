export type TicketRow = (number | null)[];
export type Ticket = {
  id: string;
  rows: [TicketRow, TicketRow, TicketRow];
  numbers: number[];
};

// Row ranges: each row draws numbers only from its own range
// Row 0: 1-30, Row 1: 31-60, Row 2: 61-90
const ROW_RANGES: [number, number][] = [
  [1, 30],
  [31, 60],
  [61, 90],
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * For a given number in [rowMin, rowMax], compute the proportional column (0-8).
 * Numbers spread naturally left-to-right across the 9 columns.
 */
function proportionalColumn(n: number, rowMin: number, rowMax: number): number {
  return Math.min(8, Math.floor(((n - rowMin) / (rowMax - rowMin + 1)) * 9));
}

export function generateTicket(idPrefix = "ticket"): Ticket {
  const id = `${idPrefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  const grid: (number | null)[][] = [
    Array(9).fill(null),
    Array(9).fill(null),
    Array(9).fill(null),
  ];

  for (let rowIdx = 0; rowIdx < 3; rowIdx++) {
    const [min, max] = ROW_RANGES[rowIdx];

    // Build pool and pick 5 numbers
    const pool: number[] = [];
    for (let n = min; n <= max; n++) pool.push(n);
    const selected = shuffle(pool)
      .slice(0, 5)
      .sort((a, b) => a - b);

    // Place each number in its proportional column; shift right/left on collision
    for (const num of selected) {
      let col = proportionalColumn(num, min, max);
      if (grid[rowIdx][col] === null) {
        grid[rowIdx][col] = num;
      } else {
        // Try right then left
        let placed = false;
        for (let offset = 1; offset < 9 && !placed; offset++) {
          if (col + offset <= 8 && grid[rowIdx][col + offset] === null) {
            grid[rowIdx][col + offset] = num;
            placed = true;
          } else if (col - offset >= 0 && grid[rowIdx][col - offset] === null) {
            grid[rowIdx][col - offset] = num;
            placed = true;
          }
        }
      }
    }
  }

  const rows: [TicketRow, TicketRow, TicketRow] = [grid[0], grid[1], grid[2]];
  const numbers = rows.flat().filter((n): n is number => n !== null);

  return { id, rows, numbers };
}

export function getTicketNumbers(ticket: Ticket): Set<number> {
  return new Set(ticket.numbers);
}

export function getRowNumbers(ticket: Ticket, rowIndex: 0 | 1 | 2): number[] {
  return ticket.rows[rowIndex].filter((n): n is number => n !== null);
}
