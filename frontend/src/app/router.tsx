import { createBrowserRouter, Navigate } from 'react-router-dom'
import { FeatureListPage } from '../pages/feature-list-page'
import { FeatureDetailPage } from '../pages/feature-detail-page'
import { EditFeaturePage } from '../pages/edit-feature-page'
import { LoginPage } from '../pages/login-page'
import { CategoriesPage } from '../pages/categories-page'
import { StatusesPage } from '../pages/statuses-page'
import { UsersPage } from '../pages/users-page'
import { ProtectedRoute } from './ProtectedRoute'
import { AppLayout } from './AppLayout'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: <Navigate to="/features" replace />,
  },
  {
    path: '/features',
    element: (
      <ProtectedRoute>
        <AppLayout>
          <FeatureListPage />
        </AppLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/features/:id',
    element: (
      <AppLayout>
        <FeatureDetailPage />
      </AppLayout>
    ),
  },
  {
    path: '/features/:id/edit',
    element: (
      <ProtectedRoute>
        <AppLayout title="Edit Feature">
          <EditFeaturePage />
        </AppLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/categories',
    element: (
      <ProtectedRoute>
        <AppLayout>
          <CategoriesPage />
        </AppLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/statuses',
    element: (
      <ProtectedRoute>
        <AppLayout>
          <StatusesPage />
        </AppLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/users',
    element: (
      <ProtectedRoute>
        <AppLayout title="Users">
          <UsersPage />
        </AppLayout>
      </ProtectedRoute>
    ),
  },
])
