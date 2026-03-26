import { createBrowserRouter } from 'react-router-dom'
import { FeatureListPage } from '../pages/FeatureListPage'
import { FeatureDetailPage } from '../pages/FeatureDetailPage'
import { CreateFeaturePage } from '../pages/CreateFeaturePage'
import { EditFeaturePage } from '../pages/EditFeaturePage'
import { LoginPage } from '../pages/LoginPage'
import { ProtectedRoute } from './ProtectedRoute'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <FeatureListPage />,
  },
  {
    path: '/features/:id',
    element: <FeatureDetailPage />,
  },
  {
    path: '/features/new',
    element: (
      <ProtectedRoute>
        <CreateFeaturePage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/features/:id/edit',
    element: (
      <ProtectedRoute>
        <EditFeaturePage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
])
