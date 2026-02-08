import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Classroom from './pages/Classroom';
import Layout from './components/Layout';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? children : <Navigate to="/login" />;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  return !isAuthenticated ? children : <Navigate to="/dashboard" />;
};

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" />} />
        
        <Route path="login" element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } />
        
        <Route path="register" element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        } />
        
        <Route path="dashboard" element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        } />
        
        <Route path="room/:roomId" element={
          <PrivateRoute>
            <Classroom />
          </PrivateRoute>
        } />
      </Route>
    </Routes>
  );
}

export default App;