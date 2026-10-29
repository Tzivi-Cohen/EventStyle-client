export function fieldProps(id: string, error?: string, hasHint = false) {
  return {
    id,
    'aria-invalid': error ? ('true' as const) : ('false' as const),
    'aria-describedby': error ? `${id}-error` : hasHint ? `${id}-hint` : undefined,
  }
}
