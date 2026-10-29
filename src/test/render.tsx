import { QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router-dom'
import App from '../App'
import { createQueryClient } from '../api/queryClient'
import { ToastProvider } from '../components/ui/Toast'
import { AuthProvider } from '../context/AuthContext'
import { tokenStorage } from '../utils/tokenStorage'
import { TOKENS } from './server'

function LocationProbe() {
  const location = useLocation()
  return <div data-testid="location">{location.pathname + location.search}</div>
}

export function renderApp(path = '/', { as }: { as?: keyof typeof TOKENS } = {}) {
  if (as) tokenStorage.set(TOKENS[as])
  const queryClient = createQueryClient()
  queryClient.setDefaultOptions({ queries: { retry: false, staleTime: 0 }, mutations: { retry: false } })
  const user = userEvent.setup()
  const utils = render(
    <MemoryRouter initialEntries={[path]}>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <AuthProvider>
            <App />
            <LocationProbe />
          </AuthProvider>
        </ToastProvider>
      </QueryClientProvider>
    </MemoryRouter>,
  )
  return { ...utils, user, queryClient }
}
