import { createBrowserRouter, Navigate } from 'react-router-dom'
import { FeatureListPage } from '../pages/FeatureListPage'
import { FeatureDetailPage } from '../pages/FeatureDetailPage'
import { CreateFeaturePage } from '../pages/CreateFeaturePage'
import { EditFeaturePage } from '../pages/EditFeaturePage'
import { LoginPage } from '../pages/LoginPage'
import { CategoriesPage } from '../pages/CategoriesPage'
import { StatusesPage } from '../pages/StatusesPage'
import { UsersPage } from '../pages/UsersPage'
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
    path: '/features/new',
    element: (
      <ProtectedRoute>
        <AppLayout>
          <CreateFeaturePage />
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
