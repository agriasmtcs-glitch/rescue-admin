import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../supabase';

const Dashboard = () => {
  const { t } = useTranslation();
  
  const [stats, setStats] = useState({
    userCount: 0,
    activeSearches: [],
    loading: true
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Felhasználók száma
      const { count: userCount, error: userError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      if (userError) throw userError;

      // Aktív keresések
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
      
      {/* 1. FIGYELMEZTETÉS - Életmentő rendszer */}
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
          ⚠️ ÉLETMENTŐ RENDSZER ⚠️
        </h2>
        <p style={{ margin: 0, fontWeight: 'bold', fontSize: '1.1rem' }}>
          Kérjük, ne zavarja a rendszer működését! Ez az alkalmazás éles bevetéseken, eltűnt személyek keresésére szolgál.
          Bármilyen illetéktelen beavatkozás vagy tesztelés veszélyeztetheti a mentési folyamatokat.
        </p>
      </div>

      {/* 2. Cím és Leírás - Mire jó az app? */}
      <section style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.5rem', color: '#333', marginBottom: '1rem' }}>Rescue Adminisztrációs Felület</h1>
        
        <div style={{ maxWidth: '800px', margin: '0 auto', color: '#555', lineHeight: '1.6', fontSize: '1.1rem' }}>
          <p>
            Ez a rendszer az <strong>Agria Speciális Mentő és Tűzoltócsoport</strong> műveleti irányítási központja.
            Az alkalmazás célja a mentőcsapatok valós idejű koordinálása, az eltűnt személyek keresési területeinek
            térképes kijelölése, valamint a terepen lévő egységek adatainak (GPS nyomvonalak, POI pontok)
            szinkronizálása a hatékonyabb életmentés érdekében.
          </p>
        </div>
      </section>

      {/* 3. Menü és Statisztikák */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '4rem' }}>
        
        {/* Keresés Kezelő */}
        <Link to="/search-manager" style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <h3 style={{ margin: 0, color: '#0277bd' }}>🔍 Keresés Kezelő</h3>
            <span style={{ fontSize: '2rem' }}>🗺️</span>
          </div>
          <div style={{ marginTop: '15px' }}>
            <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '10px' }}>Aktív műveletek és térképes irányítás.</p>
            <div style={{ borderTop: '1px solid #eee', paddingTop: '10px' }}>
              <strong style={{ display: 'block', marginBottom: '5px', color: '#333' }}>Jelenleg futó keresések:</strong>
              {stats.loading ? (
                <span>Adatok betöltése...</span>
              ) : stats.activeSearches.length > 0 ? (
                <ul style={{ paddingLeft: '20px', margin: '0', color: '#d32f2f', fontWeight: 'bold' }}>
                  {stats.activeSearches.map(search => (
                    <li key={search.id}>{search.name}</li>
                  ))}
                </ul>
              ) : (
                <span style={{ color: '#2e7d32', fontStyle: 'italic' }}>Nincs aktív riasztás.</span>
              )}
            </div>
          </div>
        </Link>

        {/* Felhasználók */}
        <Link to="/user-management" style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <h3 style={{ margin: 0, color: '#0277bd' }}>👥 Felhasználók</h3>
            <span style={{ fontSize: '2rem' }}>users</span>
          </div>
          <div style={{ marginTop: '15px' }}>
             <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '10px' }}>Csapattagok és önkéntesek kezelése.</p>
             <div style={{ borderTop: '1px solid #eee', paddingTop: '10px', display: 'flex', alignItems: 'baseline', gap: '10px' }}>
               <span>Regisztrált tagok:</span>
               {stats.loading ? (
                 <span>...</span>
               ) : (
                 <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#1976d2' }}>
                   {stats.userCount} fő
                 </span>
               )}
             </div>
          </div>
        </Link>

        {/* Súgó */}
        <Link to="/help-editor" style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <h3 style={{ margin: 0, color: '#0277bd' }}>📝 Súgó Szerkesztő</h3>
            <span style={{ fontSize: '2rem' }}>help</span>
          </div>
          <p style={{ marginTop: '15px', color: '#666', fontSize: '0.9rem' }}>
            Az alkalmazás használati útmutatóinak és segédanyagainak karbantartása.
          </p>
        </Link>
      </div>

      {/* 4. Impresszum */}
      <footer style={{ 
        marginTop: 'auto', 
        padding: '2rem', 
        backgroundColor: '#f8f9fa', 
        borderRadius: '8px',
        borderTop: '4px solid #0056b3',
        textAlign: 'center'
      }}>
        <h3 style={{ marginBottom: '1.5rem', color: '#0056b3' }}>A Projekt Háttere</h3>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-around', gap: '2rem' }}>
          <div style={{ flex: '1 1 300px' }}>
            <h4 style={{ marginBottom: '0.5rem', color: '#444' }}>Ötlet és Koncepció</h4>
            <p style={{ fontStyle: 'italic', fontSize: '1.1rem', color: '#555' }}>
              "Az alkalmazást az <strong>Agria Speciális Mentő és Tűzoltócsoport</strong> kezdeményezésére és elképzelései alapján jött létre."
            </p>
          </div>

          <div style={{ flex: '1 1 300px' }}>
            <h4 style={{ marginBottom: '0.5rem', color: '#444' }}>Megvalósítás és Fejlesztés</h4>
            <p style={{ fontStyle: 'italic', fontSize: '1.1rem', color: '#555' }}>
              "A kivitelezésben a <strong>Miskolci Egyetem</strong>,<br />
              Műszaki Föld- és Környezettudományi Kar,<br />
              Földrajz-Geoinformatika Intézet működött közre."
            </p>
          </div>
        </div>
        
        <div style={{ marginTop: '2rem', fontSize: '0.9rem', color: '#888' }}>
          © {new Date().getFullYear()} Minden jog fenntartva.
        </div>
      </footer>

    </div>
  );
};

// Kártya stílus
const cardStyle = {
  padding: '25px',
  backgroundColor: 'white',
  border: '1px solid #e0e0e0',
  borderRadius: '12px',
  textDecoration: 'none',
  color: 'inherit',
  boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
  transition: 'transform 0.2s, box-shadow 0.2s',
  display: 'flex',
  flexDirection: 'column',
  cursor: 'pointer'
};

export default Dashboard;