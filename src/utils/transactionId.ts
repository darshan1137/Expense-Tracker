export function generateTransactionId(date: string): string {
  // Format: EXP-YYYYMMDD-XXXXX
  const dateStr = date.replace(/-/g, '');
  const randomStr = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `EXP-${dateStr}-${randomStr}`;
}
