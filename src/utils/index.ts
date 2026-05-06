export function formatCurrency(amount: number): string {
  return `GH\u20B5${amount.toFixed(2)}`;
}

export function maskUserId(id: string): string {
  if (id.length <= 6) return id;
  return id.slice(0, 3) + '***' + id.slice(-3);
}

export function calculateTotalOdds(odds: number[]): number {
  return odds.reduce((acc, odd) => acc * odd, 1);
}

export function calculatePotentialReturn(stake: number, totalOdds: number): number {
  return stake * totalOdds;
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
