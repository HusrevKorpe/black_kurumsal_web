/** "01 / 07": bilet numarası, süs (aria-hidden); ekran okuyucu listeyi zaten sayar. */
export function ticketNumber(index: number, total: number): string {
  const width = Math.max(2, String(total).length)
  return `${String(index + 1).padStart(width, '0')} / ${String(total).padStart(width, '0')}`
}
