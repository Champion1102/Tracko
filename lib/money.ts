/** Indian digit grouping: ₹49,900 not ₹49,900 the western way at higher digits. */
export function money(amount: number, symbol = "₹"): string {
  const rounded = Math.round(amount);
  return symbol + rounded.toLocaleString("en-IN");
}

export function moneyPrecise(amount: number, symbol = "₹"): string {
  if (amount >= 100) return money(amount, symbol);
  return symbol + amount.toFixed(amount >= 10 ? 0 : 1);
}
