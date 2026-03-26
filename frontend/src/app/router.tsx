import { createBrowserRouter } from 'react-router-dom'
import { FeatureListPage } from '../pages/FeatureListPage'
import { FeatureDetailPage } from '../pages/FeatureDetailPage'
import { CreateFeaturePage } from '../pages/CreateFeaturePage'
import { EditFeaturePage } from '../pages/EditFeaturePage'
import { LoginPage } from '../pages/LoginPage'
import { ProtectedRoute } from './ProtectedRoute'
import { AppLayout } from './AppLayout'

export const router = createBrowserRouter([
  {
    path: '/features',
    element: (
      <AppLayout title="Feature Board" subtitle="Browse and vote on feature requests">
        <FeatureListPage />
      </AppLayout>
    ),
  },
  {
    path: '/features/:id',
    element: (
      <AppLayout title="Feature Detail">
        <FeatureDetailPage />
      </AppLayout>
    ),
  },
  {
    path: '/features/new',
    element: (
      <ProtectedRoute>
        <AppLayout title="Submit Idea" subtitle="Share a new feature request">
          <CreateFeaturePage />
        </AppLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/features/:id/edit',
    element: (
      <ProtectedRoute>
        <AppLayout title="Edit Feature Request">
          <EditFeaturePage />
        </AppLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/',
    element: <LoginPage />,
  },
])
