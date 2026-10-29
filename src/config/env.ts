const apiUrl = import.meta.env.VITE_API_URL?.trim()

if (!apiUrl) {
  throw new Error('VITE_API_URL is missing. Copy .env.example to .env.development and set it (e.g. http://localhost:4000/api)')
}

const optional = (value: string | undefined) => value?.trim() || null

const GOOGLE_CLIENT_ID_PATTERN = /^[\w-]+\.apps\.googleusercontent\.com$/

export function parseGoogleClientId(value: string | undefined): string | null {
  const clientId = optional(value)
  if (clientId && !GOOGLE_CLIENT_ID_PATTERN.test(clientId)) {
    console.warn('VITE_GOOGLE_CLIENT_ID is invalid (expected <id>.apps.googleusercontent.com) – Google sign-in is disabled')
    return null
  }
  return clientId
}

export const DEFAULT_CONTACT = { phone: '0534134130', email: 'tc104130@gmail.com' } as const

export const withDefault = (value: string | undefined, fallback: string) => optional(value) ?? fallback

export const env = {
  apiUrl: apiUrl.replace(/\/+$/, ''),
  googleClientId: parseGoogleClientId(import.meta.env.VITE_GOOGLE_CLIENT_ID),
  contactEmail: withDefault(import.meta.env.VITE_CONTACT_EMAIL, DEFAULT_CONTACT.email),
  contactPhone: withDefault(import.meta.env.VITE_CONTACT_PHONE, DEFAULT_CONTACT.phone),
  mode: import.meta.env.MODE,
} as const
