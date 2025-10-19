import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { Auth } from './components/Auth';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Flashcards } from './pages/Flashcards';
import { Study } from './pages/Study';
import { Grammar } from './pages/Grammar';
import { Writing } from './pages/Writing';

function App() {
  const { user, initialized, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/flashcards" element={<Flashcards />} />
          <Route path="/study" element={<Study />} />
          <Route path="/grammar" element={<Grammar />} />
          <Route path="/writing" element={<Writing />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
