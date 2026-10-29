import { useId, useReducer, useRef } from 'react'
import { useToast } from '../../hooks/useToast'
import { useUploadPhotos } from '../../hooks/usePhotos'
import { getErrorMessage } from '../../utils/errorMessages'
import {
  ALLOWED_IMAGE_TYPES,
  initialUploadState,
  MAX_FILES_PER_REQUEST,
  MAX_PHOTOS_PER_EVENT,
  uploadReducer,
} from '../../utils/uploadReducer'
import { Alert } from '../ui/Alert'

/**
 * העלאת תמונות לאירוע (POST /events/:id/photos, multipart בשדה photos).
 * כל התמונות נשמרות בשרת כפרטיות. כאן: בחירה, בדיקה מוקדמת, התקדמות ושגיאות (כפילות, מגבלת 50, גודל, סוג).
 */
export function PhotoUploader({ eventId, currentCount }: { eventId: number; currentCount: number }) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const toast = useToast()
  const [state, dispatch] = useReducer(uploadReducer, initialUploadState)
  const upload = useUploadPhotos(eventId)
  const remaining = Math.max(MAX_PHOTOS_PER_EVENT - currentCount, 0)
  const uploading = state.status === 'uploading'

  async function onUpload() {
    if (state.files.length === 0 || uploading) return
    dispatch({ type: 'start' })
    try {
      const created = await upload.mutateAsync({
        files: state.files.map((f) => f.file),
        onProgress: (percent) => dispatch({ type: 'progress', percent }),
      })
      dispatch({ type: 'success', count: created.length })
      toast.success(created.length === 1 ? 'התמונה הועלתה' : `${created.length} תמונות הועלו`)
      if (inputRef.current) inputRef.current.value = ''
    } catch (e) {
      dispatch({ type: 'failure', message: getErrorMessage(e) })
    }
  }

  if (remaining === 0) {
    return <Alert kind="info">האירוע הגיע למגבלה של {MAX_PHOTOS_PER_EVENT} תמונות. כדי להעלות תמונות נוספות יש למחוק תמונות קיימות.</Alert>
  }

  return (
    <section className="uploader card card-padded" aria-label="העלאת תמונות">
      <div className="uploader-head">
        <label htmlFor={inputId} className="btn btn-outline">
          בחירת תמונות
        </label>
        <input
          id={inputId}
          ref={inputRef}
          type="file"
          className="sr-only"
          multiple
          accept={ALLOWED_IMAGE_TYPES.join(',')}
          disabled={uploading}
          onChange={(e) => {
            dispatch({ type: 'add', files: Array.from(e.target.files ?? []), remaining })
            e.target.value = ''
          }}
        />
        <p className="muted small">
          JPEG, PNG או WEBP, עד 5MB לקובץ ועד {MAX_FILES_PER_REQUEST} בכל העלאה. נותר מקום ל-{remaining} תמונות באירוע.
          התמונות פרטיות – רק את והסטודיו יכולים לראות אותן.
        </p>
      </div>

      {state.rejected.length > 0 && (
        <Alert kind="warning" title="חלק מהקבצים לא נוספו">
          <ul>
            {state.rejected.map((r) => (
              <li key={r.name + r.reason}>
                {r.name}: {r.reason}
              </li>
            ))}
          </ul>
        </Alert>
      )}

      {state.files.length > 0 && (
        <>
          <ul className="selected-files">
            {state.files.map(({ id, file }) => (
              <li key={id}>
                <span>{file.name}</span>
                <span className="muted small">{(file.size / 1024 / 1024).toFixed(1)}MB</span>
                <button type="button" className="btn-link" onClick={() => dispatch({ type: 'remove', id })} disabled={uploading} aria-label={`הסרת ${file.name}`}>
                  הסרה
                </button>
              </li>
            ))}
          </ul>
          <button type="button" className="btn" onClick={onUpload} disabled={uploading}>
            {uploading ? 'מעלה...' : `העלאת ${state.files.length} תמונות`}
          </button>
        </>
      )}

      {uploading && (
        <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={state.progress} aria-label="התקדמות ההעלאה">
          <span style={{ width: `${state.progress}%` }} />
        </div>
      )}
      {state.status === 'error' && state.message && <Alert kind="error">{state.message}</Alert>}
      {state.status === 'success' && state.message && <Alert kind="success">{state.message}</Alert>}
    </section>
  )
}
