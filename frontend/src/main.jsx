import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import './index.css';
import App from './App.jsx';
import Landing from './pages/Landing.jsx';
import Students from './pages/Students.jsx';
import Teachers from './pages/Teachers.jsx';
import Inventory from './pages/Inventory.jsx';
import Login from './pages/Login.jsx';
import { AuthProvider, useAuth } from './lib/auth.jsx';

// Must be logged in.
function RequireAuth({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

// Must be logged in AND have the given feature (else back to home).
function RequireFeature({ feature, children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!user.features?.includes(feature)) return <Navigate to="/" replace />;
  return children;
}

const router = createBrowserRouter([
  { path: '/login', element: <Login /> },
  {
    path: '/',
    element: <RequireAuth><App /></RequireAuth>,
    children: [
      { index: true, element: <Landing /> },
      { path: 'students', element: <RequireFeature feature="students"><Students /></RequireFeature> },
      { path: 'teachers', element: <RequireFeature feature="teachers"><Teachers /></RequireFeature> },
      { path: 'inventory', element: <RequireFeature feature="inventory"><Inventory /></RequireFeature> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>
);
