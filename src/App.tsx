import { Link, Route, Routes } from 'react-router-dom'
import { PublicLayout } from './layouts/PublicLayout'
import { AccountPage } from './pages/AccountPage'
import { LoginPage } from './pages/LoginPage'
import { PackagesPage } from './pages/PackagesPage'
import { ProtectedRoute } from './routes/ProtectedRoute'

function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<PackagesPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="account" element={<AccountPage />} />
        </Route>
        <Route
          path="*"
          element={
            <main className="page">
              <h1>הדף לא נמצא</h1>
              <Link to="/">חזרה לדף הבית</Link>
            </main>
          }
        />
      </Route>
    </Routes>
  )
}

export default App
