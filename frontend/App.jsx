import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import FileUpload from './components/FileUpload';
import Dashboard from './components/Dashboard';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorAlert from './components/ErrorAlert';
import AuthPage from './components/AuthPage';
import BlogList from './components/BlogList';
import BlogPost from './components/BlogPost';
import BlogAdmin from './components/BlogAdmin';
import { useAuth } from './context/AuthContext';
import './App.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001';

function App() {
  const { isAuthenticated, bootstrapping, user, logout } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fileLoaded, setFileLoaded] = useState(false);
  const [stats, setStats] = useState(null);
  const [summary, setSummary] = useState(null);

  // Configure axios base URL once
  useEffect(() => {
    axios.defaults.baseURL = API_BASE_URL;
  }, []);

  // When auth state flips, reset any previous-session data
  useEffect(() => {
    if (!isAuthenticated) {
      setFileLoaded(false);
      setStats(null);
      setSummary(null);
      setError(null);
    }
  }, [isAuthenticated]);

  const handleFileUpload = async (file) => {
    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      await axios.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      await fetchStatistics();
      setFileLoaded(true);
    } catch (err) {
      setError({
        title: 'Upload Failed',
        message: err.response?.data?.detail || 'Failed to upload file. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const [statsRes, summaryRes] = await Promise.all([
        axios.get('/statistics'),
        axios.get('/summary'),
      ]);
      setStats(statsRes.data);
      setSummary(summaryRes.data);
    } catch (err) {
      setError({
        title: 'Failed to Load Data',
        message: 'Could not fetch statistics. Please try uploading the file again.',
      });
    }
  };

  const handleNewFile = () => {
    setFileLoaded(false);
    setStats(null);
    setSummary(null);
    setError(null);
  };

  if (bootstrapping) {
    return (
      <div className="app">
        <LoadingSpinner message="Loading..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="app">
        {error && <ErrorAlert error={error} onClose={() => setError(null)} />}
        <AuthPage />
      </div>
    );
  }

  return (
    <div className="app">
      {error && <ErrorAlert error={error} onClose={() => setError(null)} />}

      <Routes>
        {/* Blog routes (public, no auth required due to API design) */}
        <Route path="/blog" element={<BlogList />} />
        <Route path="/blog/:slug" element={<BlogPost />} />
        <Route path="/admin/blog" element={<BlogAdmin />} />

        {/* Dashboard routes */}
        <Route
          path="/"
          element={
            !fileLoaded ? (
              <div className="upload-container">
                <div className="upload-wrapper">
                  <div className="upload-header">
                    <div className="upload-header-row">
                      <div>
                        <h1>P&L Report Dashboard</h1>
                        <p>Upload your trading P&L CSV file to get started</p>
                      </div>
                      <div className="user-chip">
                        <span className="user-chip-name">
                          {user?.name || user?.email}
                        </span>
                        <button className="user-chip-btn" onClick={logout}>
                          Sign out
                        </button>
                      </div>
                    </div>
                  </div>
                  <FileUpload onFileUpload={handleFileUpload} isLoading={isLoading} />
                  {isLoading && <LoadingSpinner message="Processing your file..." />}
                </div>
              </div>
            ) : (
              <Dashboard
                stats={stats}
                summary={summary}
                onNewFile={handleNewFile}
                isLoading={isLoading}
                user={user}
                onLogout={logout}
              />
            )
          }
        />

        {/* Catch-all redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
