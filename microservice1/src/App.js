import React from 'react';
import './App.css';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Navigation from './components/Navigation';
import PDFConvertPage from './PDFConvertPage';
import ImageConvertPage from './ImageConvertPage';
import UserCreatePage from './UserCreatePage';
import HomePage from './Home';
import UserLogin from './components/UserLogin';
import Dashboard from './Dashboard';
import { useEffect, useState } from 'react';

export const AuthContext = React.createContext();

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = React.useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  return isAuthenticated ? children : null;
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const verifyAuth = async () => {
      const token = localStorage.getItem('token'); 
      
      if (token) {
        try {
          const isValid = token && token.length > 30; 
          
          if (isValid) {
            setIsAuthenticated(true);
          } else {
            localStorage.removeItem('token');
            setIsAuthenticated(false);
          }
        } catch (error) {
          localStorage.removeItem('token');
          setIsAuthenticated(false);
        }
      }
    };

    verifyAuth();
  }, []);

  const handleLogin = (token) => {
    localStorage.setItem('token', token);
    setIsAuthenticated(true);
    navigate('/dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    navigate('/');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, handleLogin, handleLogout }}>
      <div className="app-container">
        <header className="app-header">
          <h1>Microservice 1</h1>
          <Navigation isAuthenticated={isAuthenticated} onLogout={handleLogout} />
        </header>
        <div className="app-content">
          <main className="app-main">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={
                <div className="page-container">
                  <HomePage />
                </div>
              } />
              <Route path="/login" element={
                <div className="page-container">
                  <UserLogin onLogin={handleLogin} />
                </div>
              } />
              <Route path="/register" element={
                <div className="page-container">
                  <UserCreatePage />
                </div>
              } />

              {/* Protected Routes */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <div className="page-container">
                    <Dashboard />
                  </div>
                </ProtectedRoute>
              } />
              <Route path="/pdfconvert" element={
                <ProtectedRoute>
                  <div className="page-container">
                    <PDFConvertPage />
                  </div>
                </ProtectedRoute>
              } />
              <Route path="/imageconvert" element={
                <ProtectedRoute>
                  <div className="page-container">
                    <ImageConvertPage />
                  </div>
                </ProtectedRoute>
              } />

              {/* Fallback route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
        <footer className="app-footer">
          <p>© {new Date().getFullYear()} Your Company Name. All rights reserved.</p>
        </footer>
      </div>
    </AuthContext.Provider>
  );
}

export default App;