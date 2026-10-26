export function ErrorMessage({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <p className="status error" role="alert">
      {message}
    </p>
  )
}
