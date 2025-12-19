import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../supabase';

// --- ÚJ: Képek importálása ---
// FONTOS: Győződj meg róla, hogy a fájlnevek egyeznek a src/assets/ mappában lévőkkel!
import agriaLogo from '../assets/agria_logo.png'; 
import miskolcLogo from '../assets/miskolc_logo.png';

const Dashboard = ({ session }) => {
  const { t } = useTranslation();
  
  const [stats, setStats] = useState({
    userCount: 0,
    activeSearches: [],
    loading: false
  });

  useEffect(() => {
    if (session) {
      setStats(prev => ({ ...prev, loading: true }));
      fetchDashboardData();
    }
  }, [session]);

  const fetchDashboardData = async () => {
    try {
      const { count: userCount, error: userError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      if (userError) throw userError;

      const { data: activeSearches, error: searchError } = await supabase
        .from('search_events')
        .select('id, name')
        .eq('status', 'active');

      if (searchError) throw searchError;

      setStats({
        userCount: userCount || 0,
        activeSearches: activeSearches || [],
        loading: false
      });

    } catch (error) {
      console.error('Hiba az adatok betöltésekor:', error);
      setStats(prev => ({ ...prev, loading: false }));
    }
  };

  return (
    <div className="dashboard-container" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
      
      {/* 1. FIGYELMEZTETÉS */}
      <div style={{ 
        backgroundColor: '#fff3cd', 
        color: '#856404', 
        border: '1px solid #ffeeba', 
        borderRadius: '8px', 
        padding: '1.5rem', 
        marginBottom: '2rem',
        textAlign: 'center',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ margin: '0 0 10px 0', fontSize: '1.5rem', color: '#856404', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
          ⚠️ {t('dashboard.warning_title')} ⚠️
        </h2>
        <p style={{ margin: 0, fontWeight: 'bold', fontSize: '1.1rem' }}>
          {t('dashboard.warning_text')}
        </p>
      </div>

      {/* 2. Cím */}
      <section style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.5rem', color: '#333', marginBottom: '1rem' }}>{t('dashboard.title')}</h1>
        <p style={{ maxWidth: '800px', margin: '0 auto', color: '#555', lineHeight: '1.6', fontSize: '1.1rem' }}>
          {t('dashboard.description')}
        </p>
      </section>

      {/* 3. Menü vagy Bejelentkezés Gomb */}
      {session ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '4rem' }}>
          
          {/* Keresés kártya */}
          <Link to="/search-manager" style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <h3 style={{ margin: 0, color: '#0277bd' }}>🔍 {t('nav-search-manager')}</h3>
              <span style={{ fontSize: '2rem' }}>🗺️</span>
            </div>
            <div style={{ marginTop: '15px' }}>
              <strong style={{ display: 'block', marginBottom: '5px', color: '#333' }}>{t('dashboard.active_searches')}:</strong>
              {stats.loading ? (
                <span>{t('loading')}...</span>
              ) : stats.activeSearches.length > 0 ? (
                <ul style={{ paddingLeft: '20px', margin: '0', color: '#d32f2f', fontWeight: 'bold' }}>
                  {stats.activeSearches.map(search => (
                    <li key={search.id}>{search.name}</li>
                  ))}
                </ul>
              ) : (
                <span style={{ color: '#2e7d32', fontStyle: 'italic' }}>{t('dashboard.no_active_searches')}</span>
              )}
            </div>
          </Link>

          {/* Felhasználók kártya */}
          <Link to="/user-management" style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <h3 style={{ margin: 0, color: '#0277bd' }}>👥 {t('nav-user-management')}</h3>
              <span style={{ fontSize: '2rem' }}>users</span>
            </div>
            <div style={{ marginTop: '15px' }}>
               <div style={{ borderTop: '1px solid #eee', paddingTop: '10px', display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                 <span>{t('dashboard.registered_members')}:</span>
                 {stats.loading ? (
                   <span>...</span>
                 ) : (
                   <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#1976d2' }}>
                     {stats.userCount} {t('dashboard.people_unit')}
                   </span>
                 )}
               </div>
            </div>
          </Link>

          {/* Súgó kártya */}
          <Link to="/help-editor" style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <h3 style={{ margin: 0, color: '#0277bd' }}>📝 {t('nav-help-editor')}</h3>
              <span style={{ fontSize: '2rem' }}>help</span>
            </div>
            <p style={{ marginTop: '15px', color: '#666', fontSize: '0.9rem' }}>
              {t('dashboard.help_desc')}
            </p>
          </Link>
        </div>
      ) : (
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <p style={{ marginBottom: '20px', fontSize: '1.2rem', color: '#666' }}>
            {t('dashboard.login_required')}
          </p>
          <Link to="/login" style={{
            display: 'inline-block',
            padding: '15px 40px',
            fontSize: '1.2rem',
            backgroundColor: '#007bff',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '50px',
            boxShadow: '0 4px 15px rgba(0,123,255,0.4)',
            transition: 'transform 0.2s, background-color 0.2s'
          }}
          onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
          onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
          >
            🔐 {t('login-login')}
          </Link>
        </div>
      )}

      {/* 4. Impresszum */}
      <footer style={{ 
        marginTop: 'auto', 
        padding: '2rem', 
        backgroundColor: '#f8f9fa', 
        borderRadius: '8px',
        borderTop: '4px solid #0056b3',
        textAlign: 'center'
      }}>
        <h3 style={{ marginBottom: '2.5rem', color: '#0056b3' }}>{t('dashboard.project_background')}</h3>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-around', gap: '2rem' }}>
          
          {/* Agria rész logóval */}
          <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* LOGÓ LINKKEL */}
            <a href="https://www.agriaspecmento.hu/" target="_blank" rel="noopener noreferrer" style={{ display: 'block', marginBottom: '1.5rem', transition: 'transform 0.2s' }} onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'} onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}>
               <img src={agriaLogo} alt="Agria Speciális Mentő" style={{ maxHeight: '100px', maxWidth: '100%', objectFit: 'contain' }} />
            </a>
            
            <h4 style={{ marginBottom: '0.5rem', color: '#444' }}>{t('dashboard.concept_title')}</h4>
            <p style={{ fontStyle: 'italic', fontSize: '1.1rem', color: '#555' }} dangerouslySetInnerHTML={{ __html: t('dashboard.concept_text') }} />
          </div>

          {/* Miskolci Egyetem rész logóval */}
          <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* LOGÓ LINKKEL */}
            <a href="https://mfk.uni-miskolc.hu/" target="_blank" rel="noopener noreferrer" style={{ display: 'block', marginBottom: '1.5rem', transition: 'transform 0.2s' }} onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'} onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}>
               <img src={miskolcLogo} alt="Miskolci Egyetem" style={{ maxHeight: '100px', maxWidth: '100%', objectFit: 'contain' }} />
            </a>

            <h4 style={{ marginBottom: '0.5rem', color: '#444' }}>{t('dashboard.development_title')}</h4>
            <p style={{ fontStyle: 'italic', fontSize: '1.1rem', color: '#555' }} dangerouslySetInnerHTML={{ __html: t('dashboard.development_text') }} />
          </div>
        </div>
        
        {/* Kapcsolat és Copyright rész */}
        <div style={{ marginTop: '3rem', fontSize: '0.9rem', color: '#888', borderTop: '1px solid #ddd', paddingTop: '1rem' }}>
          <div style={{ marginBottom: '10px' }}>
            <strong>{t('dashboard.contact_label')}:</strong> <a href="mailto:attila.szamosi@uni-miskolc.hu" style={{ color: '#0056b3', textDecoration: 'none' }}>attila.szamosi@uni-miskolc.hu</a>
          </div>
          © {new Date().getFullYear()} {t('dashboard.rights_reserved')}
        </div>
      </footer>

    </div>
  );
};

const cardStyle = {
  padding: '25px',
  backgroundColor: 'white',
  border: '1px solid #e0e0e0',
  borderRadius: '12px',
  textDecoration: 'none',
  color: 'inherit',
  boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
  transition: 'transform 0.2s',
  display: 'flex',
  flexDirection: 'column',
  cursor: 'pointer'
};

export default Dashboard;