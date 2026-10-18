export function normUsername(s: unknown): string {
  return String(s ?? '').normalize('NFKC').toLowerCase().replace(/\s+/g, '');
}
