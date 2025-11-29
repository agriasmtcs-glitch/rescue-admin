#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Tue Aug 26 20:20:50 2025

@author: szamosiattila
"""


import os

# Cél mappa
base_dir = '/Users/szamosiattila/rescue_app/admin_website/rescue-admin'

# Mappák létrehozása
os.makedirs(os.path.join(base_dir, 'src', 'components'), exist_ok=True)

# Fájlok és tartalmak
files = {
    'package.json': '''{
  "name": "rescue-admin",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "deploy": "gh-pages -d dist"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.45.4",
    "i18next": "^23.15.1",
    "leaflet": "^1.9.4",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-i18next": "^15.0.2",
    "react-leaflet": "^4.2.1",
    "react-router-dom": "^6.26.2"
  },
  "devDependencies": {
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "gh-pages": "^6.1.1",
    "vite": "^5.4.1"
  }
}''',

    'vite.config.js': '''import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/rescue-admin/'  // Cseréld a repo nevedre, pl. '/repo-name/' GitHub Pages-hez
})''',

    'index.html': '''<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Admin Dashboard - SAR Coord App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>''',

    'src/main.jsx': '''import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import i18n from './i18n'; // Inicializálás

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);''',

    'src/App.jsx': '''import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './index.css'; // A stílusod
import Users from './components/Users';
import Events from './components/Events';
import MapComponent from './components/Map';
import { supabase } from './supabase';
import i18n from './i18n';

function App() {
  const { t } = useTranslation();
  const [language, setLanguage] = useState(i18n.language);

  const changeLanguage = async (lng) => {
    i18n.changeLanguage(lng);
    setLanguage(lng);
    localStorage.setItem('language', lng);
    // Opcionális: Frissítsd a user language-t Supabase-ben
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('users').update({ language: lng }).eq('id', user.id);
    }
  };

  return (
    <Router basename="/rescue-admin">  {/* GitHub Pages basename */}
      <header>
        <h1>{t('header-title')}</h1>
        <nav>
          <Link to="/users">{t('nav-users')}</Link>
          <Link to="/events">{t('nav-events')}</Link>
          <Link to="/map">{t('nav-map')}</Link>
          <select value={language} onChange={(e) => changeLanguage(e.target.value)}>
            <option value="hu">Magyar</option>
            <option value="en">English</option>
            <option value="sk">Slovenský</option>
            <option value="ro">Română</option>
            <option value="pl">Polski</option>
          </select>
        </nav>
      </header>
      <main>
        <Routes>
          <Route path="/users" element={<Users />} />
          <Route path="/events" element={<Events />} />
          <Route path="/map" element={<MapComponent />} />
          <Route path="/" element={<div>Válassz egy oldalt</div>} />
        </Routes>
      </main>
    </Router>
  );
}

export default App;''',

    'src/index.css': '''body {
    font-family: Arial, sans-serif;
    margin: 0;
    padding: 0;
    background-color: #f4f4f4;
}
header {
    background-color: #007bff;
    color: white;
    padding: 10px 20px;
    text-align: center;
}
nav a {
    color: white;
    margin: 0 15px;
    text-decoration: none;
    font-size: 18px;
}
nav a:hover {
    text-decoration: underline;
}
main {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
}
section {
    margin-bottom: 40px;
}
h2 {
    color: #333;
}
table {
    width: 100%;
    border-collapse: collapse;
}
th, td {
    border: 1px solid #ddd;
    padding: 8px;
    text-align: left;
}
th {
    background-color: #007bff;
    color: white;
}
form {
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-width: 400px;
}
form label {
    font-weight: bold;
}
form input, form select {
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
}
form button {
    background-color: #007bff;
    color: white;
    padding: 10px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}
form button:hover {
    background-color: #0056b3;
}
.leaflet-container {
    width: 100%;
    height: 500px;
}''',

    'src/supabase.js': '''import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://opwwrcfsbqlcxnuhxshp.supabase.co'; // Cseréld a sajátodra
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wd3dyY2ZzYnFsY3hudWh4c2hwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2NzMxNTIsImV4cCI6MjA3MTI0OTE1Mn0.wehFwM69ob0rAj0MteWLueKVrq9Rq2bh_HYvKs448lw'; // Cseréld a sajátodra
export const supabase = createClient(supabaseUrl, supabaseKey);''',

    'src/i18n.js': '''import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      'header-title': 'Admin Dashboard',
      'nav-users': 'Users',
      'nav-events': 'Events',
      'nav-map': 'Map',
      'users-h2': 'User Management',
      'user-id-label': 'User ID:',
      'role-label': 'Role:',
      'update-role-btn': 'Update Role',
      'events-h2': 'Event Management',
      'event-name-label': 'Event Name:',
      'create-event-btn': 'Create Event',
      'map-h2': 'Live Map',
      'role-searcher': 'Searcher',
      'role-coordinator': 'Coordinator',
      'user-table-id': 'ID',
      'user-table-email': 'Email',
      'user-table-fullname': 'Full Name',
      'user-table-role': 'Role',
      'event-table-id': 'ID',
      'event-table-name': 'Name',
      'event-table-status': 'Status',
      'event-table-starttime': 'Start Time',
      'role-update-success': 'Role updated successfully',
      'role-update-fail': 'Failed to update role:',
      'event-create-success': 'Event created successfully',
      'event-create-fail': 'Failed to create event:'
    }
  },
  hu: {
    translation: {
      'header-title': 'Admin Irányítópult',
      'nav-users': 'Felhasználók',
      'nav-events': 'Események',
      'nav-map': 'Térkép',
      'users-h2': 'Felhasználó Kezelés',
      'user-id-label': 'Felhasználó ID:',
      'role-label': 'Szerep:',
      'update-role-btn': 'Szerep Frissítése',
      'events-h2': 'Esemény Kezelés',
      'event-name-label': 'Esemény Neve:',
      'create-event-btn': 'Esemény Létrehozása',
      'map-h2': 'Élő Térkép',
      'role-searcher': 'Kereső',
      'role-coordinator': 'Koordinátor',
      'user-table-id': 'ID',
      'user-table-email': 'Email',
      'user-table-fullname': 'Teljes Név',
      'user-table-role': 'Szerep',
      'event-table-id': 'ID',
      'event-table-name': 'Név',
      'event-table-status': 'Állapot',
      'event-table-starttime': 'Kezdési Idő',
      'role-update-success': 'Szerep sikeresen frissítve',
      'role-update-fail': 'Szerep frissítése sikertelen:',
      'event-create-success': 'Esemény sikeresen létrehozva',
      'event-create-fail': 'Esemény létrehozása sikertelen:'
    }
  },
  sk: {
    translation: {
      'header-title': 'Administrátorský Panel',
      'nav-users': 'Používatelia',
      'nav-events': 'Udalosti',
      'nav-map': 'Mapa',
      'users-h2': 'Správa Používateľov',
      'user-id-label': 'ID Používateľa:',
      'role-label': 'Rola:',
      'update-role-btn': 'Aktualizovať Rolu',
      'events-h2': 'Správa Udalostí',
      'event-name-label': 'Názov Udalosti:',
      'create-event-btn': 'Vytvoriť Udalosť',
      'map-h2': 'Živá Mapa',
      'role-searcher': 'Hľadač',
      'role-coordinator': 'Koordinátor',
      'user-table-id': 'ID',
      'user-table-email': 'Email',
      'user-table-fullname': 'Plné Meno',
      'user-table-role': 'Rola',
      'event-table-id': 'ID',
      'event-table-name': 'Názov',
      'event-table-status': 'Stav',
      'event-table-starttime': 'Čas Začiatku',
      'role-update-success': 'Rola úspešne aktualizovaná',
      'role-update-fail': 'Aktualizácia roly zlyhala:',
      'event-create-success': 'Udalosť úspešne vytvorená',
      'event-create-fail': 'Vytvorenie udalosti zlyhalo:'
    }
  },
  ro: {
    translation: {
      'header-title': 'Panou de Administrare',
      'nav-users': 'Utilizatori',
      'nav-events': 'Evenimente',
      'nav-map': 'Hartă',
      'users-h2': 'Gestionare Utilizatori',
      'user-id-label': 'ID Utilizator:',
      'role-label': 'Rol:',
      'update-role-btn': 'Actualizare Rol',
      'events-h2': 'Gestionare Evenimente',
      'event-name-label': 'Nume Eveniment:',
      'create-event-btn': 'Creare Eveniment',
      'map-h2': 'Hartă Live',
      'role-searcher': 'Căutător',
      'role-coordinator': 'Coordonator',
      'user-table-id': 'ID',
      'user-table-email': 'Email',
      'user-table-fullname': 'Nume Complet',
      'user-table-role': 'Rol',
      'event-table-id': 'ID',
      'event-table-name': 'Nume',
      'event-table-status': 'Stare',
      'event-table-starttime': 'Timp de Început',
      'role-update-success': 'Rol actualizat cu succes',
      'role-update-fail': 'Actualizarea rolului a eșuat:',
      'event-create-success': 'Eveniment creat cu succes',
      'event-create-fail': 'Crearea evenimentului a eșuat:'
    }
  },
  pl: {
    translation: {
      'header-title': 'Panel Administracyjny',
      'nav-users': 'Użytkownicy',
      'nav-events': 'Wydarzenia',
      'nav-map': 'Mapa',
      'users-h2': 'Zarządzanie Użytkownikami',
      'user-id-label': 'ID Użytkownika:',
      'role-label': 'Rola:',
      'update-role-btn': 'Aktualizuj Rolę',
      'events-h2': 'Zarządzanie Wydarzeniami',
      'event-name-label': 'Nazwa Wydarzenia:',
      'create-event-btn': 'Utwórz Wydarzenie',
      'map-h2': 'Mapa Na Żywo',
      'role-searcher': 'Szukający',
      'role-coordinator': 'Koordynator',
      'user-table-id': 'ID',
      'user-table-email': 'Email',
      'user-table-fullname': 'Pełne Imię',
      'user-table-role': 'Rola',
      'event-table-id': 'ID',
      'event-table-name': 'Nazwa',
      'event-table-status': 'Status',
      'event-table-starttime': 'Czas Rozpoczęcia',
      'role-update-success': 'Rola zaktualizowana pomyślnie',
      'role-update-fail': 'Aktualizacja roli nie powiodła się:',
      'event-create-success': 'Wydarzenie utworzone pomyślnie',
      'event-create-fail': 'Utworzenie wydarzenia nie powiodło się:'
    }
  }
};

i18n.use(initReactI18next).init({
  resources,
  lng: localStorage.getItem('language') || 'hu',
  fallbackLng: 'en',
  interpolation: { escapeValue: false }
});

export default i18n;''',

    'src/components/Users.jsx': '''import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../supabase';

const Users = () => {
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState('searcher');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    const { data, error } = await supabase.from('users').select('*');
    if (error) alert('Error: ' + error.message);
    else setUsers(data);
  };

  const updateRole = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('users').update({ role }).eq('id', userId);
    if (error) alert(`${t('role-update-fail')} ${error.message}`);
    else {
      alert(t('role-update-success'));
      loadUsers();
    }
  };

  return (
    <section>
      <h2>{t('users-h2')}</h2>
      <table>
        <thead>
          <tr>
            <th>{t('user-table-id')}</th>
            <th>{t('user-table-email')}</th>
            <th>{t('user-table-fullname')}</th>
            <th>{t('user-table-role')}</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id}>
              <td>{user.id}</td>
              <td>{user.email}</td>
              <td>{user.full_name}</td>
              <td>{user.role}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <form onSubmit={updateRole}>
        <label>{t('user-id-label')}</label>
        <input value={userId} onChange={(e) => setUserId(e.target.value)} required />
        <label>{t('role-label')}</label>
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="searcher">{t('role-searcher')}</option>
          <option value="coordinator">{t('role-coordinator')}</option>
        </select>
        <button type="submit">{t('update-role-btn')}</button>
      </form>
    </section>
  );
};

export default Users;''',

    'src/components/Events.jsx': '''import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../supabase';

const Events = () => {
  const { t } = useTranslation();
  const [events, setEvents] = useState([]);
  const [eventName, setEventName] = useState('');

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    const { data, error } = await supabase.from('search_events').select('*');
    if (error) alert('Error: ' + error.message);
    else setEvents(data);
  };

  const createEvent = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('search_events').insert({
      name: eventName,
      status: 'active',
      start_time: new Date().toISOString(),
      coordinator_id: 'your_admin_user_id' // Cseréld a sajátodra
    });
    if (error) alert(`${t('event-create-fail')} ${error.message}`);
    else {
      alert(t('event-create-success'));
      loadEvents();
      setEventName('');
    }
  };

  return (
    <section>
      <h2>{t('events-h2')}</h2>
      <table>
        <thead>
          <tr>
            <th>{t('event-table-id')}</th>
            <th>{t('event-table-name')}</th>
            <th>{t('event-table-status')}</th>
            <th>{t('event-table-starttime')}</th>
          </tr>
        </thead>
        <tbody>
          {events.map(event => (
            <tr key={event.id}>
              <td>{event.id}</td>
              <td>{event.name}</td>
              <td>{event.status}</td>
              <td>{new Date(event.start_time).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <form onSubmit={createEvent}>
        <label>{t('event-name-label')}</label>
        <input value={eventName} onChange={(e) => setEventName(e.target.value)} required />
        <button type="submit">{t('create-event-btn')}</button>
      </form>
    </section>
  );
};

export default Events;''',

    'src/components/Map.jsx': '''import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useTranslation } from 'react-i18next';
import { supabase } from '../supabase';

const MapComponent = () => {
  const { t } = useTranslation();
  const [markers, setMarkers] = useState([]);

  useEffect(() => {
    loadMarkers();
  }, []);

  const loadMarkers = async () => {
    const { data, error } = await supabase.from('markers').select('*');
    if (error) console.error('Error loading markers:', error);
    else setMarkers(data);
  };

  return (
    <section>
      <h2>{t('map-h2')}</h2>
      <MapContainer center={[47.4979, 19.0402]} zoom={13} style={{ height: '500px' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap" />
        {markers.map(marker => {
          if (marker.lat_lng && marker.lat_lng.coordinates) {
            const [lng, lat] = marker.lat_lng.coordinates; // GeoJSON formátum feltételezve
            return (
              <Marker key={marker.id} position={[lat, lng]}>
                <Popup>Marker ID: {marker.id}<br />Type: {marker.type || 'N/A'}</Popup>
              </Marker>
            );
          }
          return null;
        })}
      </MapContainer>
    </section>
  );
};

export default MapComponent;'''
}

# Fájlok írása
for rel_path, content in files.items():
    full_path = os.path.join(base_dir, rel_path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, 'w', encoding='utf-8') as f:
        f.write(content)

print(f"Projekt fájlok létrehozva a {base_dir} mappában.")
print("Most nyisd meg a terminált, cd a mappába, és futtasd: npm install")
print("Majd: npm run dev a fejlesztéshez, vagy npm run build && npm run deploy a GitHub Pages-hez.")