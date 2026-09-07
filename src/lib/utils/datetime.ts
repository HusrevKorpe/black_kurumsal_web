/** `<input type="datetime-local">` değeri (yerel saat) → ISO (UTC). Boşsa null. */
export function localInputToIso(value: string): string | null {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

/** Date → `<input type="datetime-local">` değeri, tarayıcının yerel saatiyle. */
export function dateToLocalInput(date: Date | null | undefined): string {
  if (!date) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}
