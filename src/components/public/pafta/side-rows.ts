/**
 * Yan panelli Pafta ızgarasının geniş ekran satırları: sol sütundaki her bölüme bir satır, sonuncusu
 * `1fr`. Sabit satır sayısı boş bölümlerde satır aralığını (64 px) boşuna ekliyordu; panel soldan
 * uzunsa fazlası son satıra gider, bölümlerin arasına dağılmaz.
 */
export function paftaSideRows(leftSections: number): string {
  return [...Array<string>(Math.max(leftSections - 1, 0)).fill('auto'), '1fr'].join(' ')
}
