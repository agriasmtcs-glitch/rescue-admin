import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './index.css';
import 'leaflet/dist/leaflet.css';
import Dashboard from './components/Dashboard';
import UserManagement from './components/UserManagement';
import SearchManager from './components/SearchManager';
import HelpEditor from './components/HelpEditor';
import Login from './components/Login';
import { supabase } from './supabase';
import i18n from './i18n';

function App() {
  const { t } = useTranslation();
  const [language, setLanguage] = useState(i18n.language);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Session ellenőrzése induláskor
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Figyeljük a változásokat (login/logout)
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
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

  if (loading) {
    return <div style={{textAlign: 'center', marginTop: '50px'}}>Betöltés...</div>;
  }

  return (
    <Router basename="/">
      <header>
        <h1>{t('header-title')}</h1>
        <nav>
          {/* Csak akkor mutatjuk a menüpontokat, ha be van lépve */}
          {session ? (
            <>
              <Link to="/user-management">{t('nav-user-management')}</Link>
              <Link to="/search-manager">{t('nav-search-manager')}</Link>
              <Link to="/help-editor">{t('nav-help-editor')}</Link>
            </>
          ) : (
            // Ha nincs belépve, akkor Login gomb
            <Link to="/login" style={{ fontWeight: 'bold', color: '#007bff' }}>Bejelentkezés</Link>
          )}

          <select value={language} onChange={(e) => changeLanguage(e.target.value)}>
            <option value="hu">Magyar</option>
            <option value="en">English</option>
            <option value="sk">Slovenský</option>
            <option value="ro">Română</option>
            <option value="pl">Polski</option>
            <option value="uk">Українська</option> {/* ÚJ SOR */}
          </select>

          {session && (
            <button onClick={() => supabase.auth.signOut()}>{t('logout')}</button>
          )}
        </nav>
      </header>
      <main>
        <Routes>
          {/* Publikus kezdőlap - átadjuk a session-t, hogy tudja, be vagyunk-e lépve */}
          <Route path="/" element={<Dashboard session={session} />} />
          
          {/* Login oldal - ha már be van lépve, visszairányítjuk */}
          <Route path="/login" element={!session ? <Login /> : <Navigate to="/search-manager" />} />

          {/* Védett útvonalak - ha nincs session, loginra irányít */}
          <Route 
            path="/user-management" 
            element={session ? <UserManagement /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/search-manager" 
            element={session ? <SearchManager /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/help-editor" 
            element={session ? <HelpEditor /> : <Navigate to="/login" />} 
          />
          
          {/* Ismeretlen útvonalak a főoldalra visznek */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </Router>
  );
}

export default App;