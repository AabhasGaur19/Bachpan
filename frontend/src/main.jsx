import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import './index.css';
import App from './App.jsx';
import Landing from './pages/Landing.jsx';
import Students from './pages/Students.jsx';
import Teachers from './pages/Teachers.jsx';
import Inventory from './pages/Inventory.jsx';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Landing /> },
      { path: 'students', element: <Students /> },
      { path: 'teachers', element: <Teachers /> },
      { path: 'inventory', element: <Inventory /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
