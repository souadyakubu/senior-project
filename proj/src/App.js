import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { auth, logoutUser } from './services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import Sidebar from './components/Sidebar';
import BookSection from './components/BookSection';
import BookReader from './components/BookReader';
import PDFUploadSection from './components/PDFUploadSection';
import CCELSearch from './components/CCELSearch';
import books from './components/Books';
import Login from './components/Login';
import Signup from './components/Signup';
import './App.css';
import QuizPage from './components/QuizPage';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await logoutUser();
      setIsLoggedIn(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <div className="app">
        {isLoggedIn ? (
          <>
            <div style={styles.logoutContainer}>
              <button onClick={handleLogout} style={styles.logoutButton}>
                Logout
              </button>
            </div>
            <Sidebar />
            <div className="content">
              <Routes>
                <Route
                  path="/"
                  element={
                    <>
                      <h1>Home</h1>
                      <PDFUploadSection />
                      <CCELSearch /> {/* Add the CCEL Search component */}
                      <BookSection title="Your Library" books={books} />
                    </>
                  }
                />
                <Route path="/book/:bookTitle" element={<BookReader />} />
                <Route path="/quiz" element={<QuizPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </>
        ) : (
          <Routes>
            <Route path="/signup" element={<Signup />} />
            <Route path="/" element={<Login onLogin={() => setIsLoggedIn(true)} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        )}
      </div>
    </Router>
  );
}

const styles = {
  logoutContainer: {
    position: 'fixed',
    top: '20px',
    right: '20px',
    zIndex: 1000,
  },
  logoutButton: {
    padding: '8px 16px',
    backgroundColor: '#1e1e1e',
    color: '#fff',
    border: '1px solid #444',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.3s ease',
  }
};

export default App;