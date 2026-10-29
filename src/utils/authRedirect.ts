import type { User } from '../types/user'

export function homeFor(user: User): string {
  return user.role === 'Admin' ? '/admin' : '/my-events'
}

export function afterLoginPath(user: User, from?: string | null): string {
  if (from && from !== '/login' && from !== '/register') return from
  return homeFor(user)
}

export function fromState(state: unknown): string | null {
  return (state as { from?: string } | null)?.from ?? null
}
