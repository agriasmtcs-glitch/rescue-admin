import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './index.css';
import 'leaflet/dist/leaflet.css';
import Dashboard from './components/Dashboard';
import UserManagement from './components/UserManagement';
import SearchManager from './components/SearchManager';
//import MapComponent from './components/Map';
import HelpEditor from './components/HelpEditor';
import Login from './components/Login';
import { supabase } from './supabase';
import i18n from './i18n';

function App() {
  const { t } = useTranslation();
  const [language, setLanguage] = useState(i18n.language);
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  const changeLanguage = async (lng) => {
    i18n.changeLanguage(lng);
    setLanguage(lng);
    localStorage.setItem('language', lng);
    if (session) {
      try {
        await supabase.from('users').update({ language: lng }).eq('id', session.user.id);
      } catch (err) {
        console.error('Error updating language:', err);
      }
    }
  };

  if (!session) {
    return <Login />;
  }

  return (
    <Router basename="/">
      <header>
        <h1>{t('header-title')}</h1>
        <nav>
          <Link to="/user-management">{t('nav-user-management')}</Link>
          <Link to="/search-manager">{t('nav-search-manager')}</Link>
          <Link to="/help-editor">{t('nav-help-editor')}</Link>
          <select value={language} onChange={(e) => changeLanguage(e.target.value)}>
            <option value="hu">Magyar</option>
            <option value="en">English</option>
            <option value="sk">Slovenský</option>
            <option value="ro">Română</option>
            <option value="pl">Polski</option>
          </select>
          <button onClick={() => supabase.auth.signOut()}>{t('logout')}</button>
        </nav>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/user-management" element={<UserManagement />} />
          <Route path="/search-manager" element={<SearchManager />} />
          <Route path="/help-editor" element={<HelpEditor />} />
          <Route path="/" element={<Navigate to="/search-manager" />} />
        </Routes>
      </main>
    </Router>
  );
}

export default App;