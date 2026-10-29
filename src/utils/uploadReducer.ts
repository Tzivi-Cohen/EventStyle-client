export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024
export const MAX_FILES_PER_REQUEST = 10
export const MAX_PHOTOS_PER_EVENT = 50

export type SelectedFile = { id: string; file: File }

export type UploadState = {
  files: SelectedFile[]
  rejected: { name: string; reason: string }[]
  status: 'idle' | 'uploading' | 'success' | 'error'
  progress: number
  message: string | null
}

export type UploadAction =
  | { type: 'add'; files: File[]; remaining: number }
  | { type: 'remove'; id: string }
  | { type: 'start' }
  | { type: 'progress'; percent: number }
  | { type: 'success'; count: number }
  | { type: 'failure'; message: string }
  | { type: 'reset' }

export const initialUploadState: UploadState = { files: [], rejected: [], status: 'idle', progress: 0, message: null }

let sequence = 0

function rejectReason(file: File): string | null {
  if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type)) return 'סוג קובץ לא נתמך (רק JPEG, PNG או WEBP)'
  if (file.size > MAX_FILE_SIZE_BYTES) return 'הקובץ גדול מ-5MB'
  return null
}

export function uploadReducer(state: UploadState, action: UploadAction): UploadState {
  switch (action.type) {
    case 'add': {
      const limit = Math.min(MAX_FILES_PER_REQUEST, Math.max(action.remaining, 0))
      const files = [...state.files]
      const rejected: UploadState['rejected'] = []
      for (const file of action.files) {
        const reason = rejectReason(file)
        if (reason) rejected.push({ name: file.name, reason })
        else if (files.some((f) => f.file.name === file.name && f.file.size === file.size)) rejected.push({ name: file.name, reason: 'הקובץ כבר נבחר' })
        else if (files.length >= limit) {
          rejected.push({
            name: file.name,
            reason: action.remaining < MAX_FILES_PER_REQUEST ? `נותר מקום ל-${action.remaining} תמונות בלבד באירוע` : `עד ${MAX_FILES_PER_REQUEST} תמונות בכל העלאה`,
          })
        } else files.push({ id: `f${++sequence}`, file })
      }
      return { ...state, files, rejected, status: 'idle', message: null, progress: 0 }
    }
    case 'remove':
      return { ...state, files: state.files.filter((f) => f.id !== action.id) }
    case 'start':
      return { ...state, status: 'uploading', progress: 0, message: null, rejected: [] }
    case 'progress':
      return { ...state, progress: Math.min(Math.max(action.percent, 0), 100) }
    case 'success':
      return { ...initialUploadState, status: 'success', progress: 100, message: action.count === 1 ? 'התמונה הועלתה בהצלחה' : `${action.count} תמונות הועלו בהצלחה` }
    case 'failure':
      return { ...state, status: 'error', progress: 0, message: action.message }
    case 'reset':
      return initialUploadState
  }
}
