import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from './providers/AuthProvider.jsx';
import { SocketProvider } from './providers/SocketProvider.jsx';
import { router } from './routes.jsx';

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <RouterProvider router={router} />
      </SocketProvider>
    </AuthProvider>
  );
}
