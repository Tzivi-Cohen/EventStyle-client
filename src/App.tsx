import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { LoadingSpinner } from './components/LoadingSpinner'
import { PublicLayout } from './layouts/PublicLayout'
import { AccountPage } from './pages/AccountPage'
import { ContactPage } from './pages/ContactPage'
import { GalleryCategoryPage } from './pages/GalleryCategoryPage'
import { GalleryPage } from './pages/GalleryPage'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { ForbiddenPage, NotFoundPage } from './pages/NotFoundPage'
import { PackagesPage } from './pages/PackagesPage'
import { RegisterPage } from './pages/RegisterPage'
import { EventRequestFormPage } from './pages/client/EventRequestFormPage'
import { MyEventDetailsPage } from './pages/client/MyEventDetailsPage'
import { MyEventsPage } from './pages/client/MyEventsPage'
import { ProtectedRoute } from './routes/ProtectedRoute'

// ממשק הניהול נטען רק כשמנהלת נכנסת אליו (Lazy Loading) – מבקרים ולקוחות לא מורידים את הקוד שלו
const admin = () => import('./pages/admin')
const AdminLayout = lazy(() => admin().then((m) => ({ default: m.AdminLayout })))
const AdminHomePage = lazy(() => admin().then((m) => ({ default: m.AdminHomePage })))
const AdminEventsPage = lazy(() => admin().then((m) => ({ default: m.AdminEventsPage })))
const AdminEventFormPage = lazy(() => admin().then((m) => ({ default: m.AdminEventFormPage })))
const AdminEventDetailsPage = lazy(() => admin().then((m) => ({ default: m.AdminEventDetailsPage })))
const AdminPhotosPage = lazy(() => admin().then((m) => ({ default: m.AdminPhotosPage })))
const AdminGalleryPage = lazy(() => admin().then((m) => ({ default: m.AdminGalleryPage })))
const AdminPackagesPage = lazy(() => admin().then((m) => ({ default: m.AdminPackagesPage })))

function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<HomePage />} />
        <Route path="packages" element={<PackagesPage />} />
        <Route path="gallery" element={<GalleryPage />} />
        <Route path="gallery/:category" element={<GalleryCategoryPage />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="forbidden" element={<ForbiddenPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="account" element={<AccountPage />} />
        </Route>

        <Route element={<ProtectedRoute roles={['Client']} />}>
          <Route path="my-events" element={<MyEventsPage />} />
          <Route path="my-events/new" element={<EventRequestFormPage />} />
          <Route path="my-events/:id" element={<MyEventDetailsPage />} />
          <Route path="my-events/:id/edit" element={<EventRequestFormPage />} />
        </Route>

        <Route element={<ProtectedRoute roles={['Admin']} />}>
          <Route
            path="admin"
            element={
              <Suspense fallback={<LoadingSpinner label="טוען את ממשק הניהול..." />}>
                <AdminLayout />
              </Suspense>
            }
          >
            <Route index element={<AdminHomePage />} />
            <Route path="events" element={<AdminEventsPage />} />
            <Route path="events/new" element={<AdminEventFormPage />} />
            <Route path="events/:id" element={<AdminEventDetailsPage />} />
            <Route path="events/:id/edit" element={<AdminEventFormPage />} />
            <Route path="photos" element={<AdminPhotosPage />} />
            <Route path="gallery" element={<AdminGalleryPage />} />
            <Route path="packages" element={<AdminPackagesPage />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}

export default App
