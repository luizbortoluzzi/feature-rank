import { RouterProvider } from 'react-router-dom'
import { router } from './app/router'
import { AuthProvider } from './app/AuthProvider'

export function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  )
}
