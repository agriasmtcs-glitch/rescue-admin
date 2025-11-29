
#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Spyder 6-ban futtatható script a React projekt fájljainak frissítéséhez.
Ez a script frissíti a /Users/szamosiattila/rescue_app/admin_website/rescue-admin mappát,
hozzáadva az új komponenseket: UsersManager, HelpEditor, MissingPersonsEditor.
Frissíti az App.jsx-et új route-okkal, az i18n.js-t új fordításokkal.
Utána terminálban cd a mappába, és futtasd: npm install, majd npm run dev.

Figyelem: A users táblában nincs 'active' mező, így feltételezzük, hogy hozzáadod a Supabase-ben:
ALTER TABLE public.users ADD COLUMN active boolean DEFAULT true;
Hasonlóan, file upload a photo_url-hez opcionális, itt text inputként kezeljük.

@author: Grok 4 (xAI)
"""

import os

# Cél mappa
base_dir = '/Users/szamosiattila/rescue_app/admin_website/rescue-admin'

# Fájlok és tartalmak (frissítve az újakkal)
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
import UsersManager from './components/UsersManager';
import HelpEditor from './components/HelpEditor';
import MissingPersonsEditor from './components/MissingPersonsEditor';
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
          <Link to="/users-manager">{t('nav-users-manager')}</Link>
          <Link to="/help-editor">{t('nav-help-editor')}</Link>
          <Link to="/missing-persons-editor">{t('nav-missing-persons-editor')}</Link>
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
          <Route path="/users-manager" element={<UsersManager />} />
          <Route path="/help-editor" element={<HelpEditor />} />
          <Route path="/missing-persons-editor" element={<MissingPersonsEditor />} />
          <Route path="/" element={<div>{t('select-page')}</div>} />
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
}
.delete-btn {
    background-color: #dc3545;
    color: white;
    border: none;
    padding: 5px 10px;
    cursor: pointer;
}
.delete-btn:hover {
    background-color: #c82333;
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
      'nav-users-manager': 'Users Manager',
      'nav-help-editor': 'Help Editor',
      'nav-missing-persons-editor': 'Missing Persons Editor',
      'select-page': 'Select a page',
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
      'event-create-fail': 'Failed to create event:',
      // Új fordítások
      'users-manager-h2': 'Users Manager',
      'create-user-btn': 'Create User',
      'delete-user-btn': 'Delete',
      'update-user-btn': 'Update',
      'full-name-label': 'Full Name:',
      'phone-label': 'Phone Number:',
      'email-label': 'Email:',
      'password-label': 'Password:',
      'active-label': 'Active:',
      'user-create-success': 'User created successfully',
      'user-create-fail': 'Failed to create user:',
      'user-update-success': 'User updated successfully',
      'user-update-fail': 'Failed to update user:',
      'user-delete-success': 'User deleted successfully',
      'user-delete-fail': 'Failed to delete user:',
      'user-table-phone': 'Phone',
      'user-table-active': 'Active',
      'help-editor-h2': 'Help Content Editor',
      'section-label': 'Section:',
      'text-hu-label': 'Text HU:',
      'text-en-label': 'Text EN:',
      'text-sk-label': 'Text SK:',
      'text-ro-label': 'Text RO:',
      'text-pl-label': 'Text PL:',
      'create-help-btn': 'Create Help Entry',
      'update-help-btn': 'Update',
      'delete-help-btn': 'Delete',
      'help-create-success': 'Help entry created successfully',
      'help-create-fail': 'Failed to create help entry:',
      'help-update-success': 'Help entry updated successfully',
      'help-update-fail': 'Failed to update help entry:',
      'help-delete-success': 'Help entry deleted successfully',
      'help-delete-fail': 'Failed to delete help entry:',
      'help-table-section': 'Section',
      'help-table-text-hu': 'Text HU',
      'missing-persons-editor-h2': 'Missing Persons Editor',
      'event-id-label': 'Event ID:',
      'name-label': 'Name:',
      'age-label': 'Age:',
      'height-label': 'Height (cm):',
      'clothing-label': 'Clothing:',
      'photo-url-label': 'Photo URL:',
      'behavior-category-label': 'Behavior Category:',
      'prob-zones-label': 'Prob Zones (JSON):',
      'create-missing-btn': 'Create Missing Person',
      'update-missing-btn': 'Update',
      'delete-missing-btn': 'Delete',
      'missing-create-success': 'Missing person created successfully',
      'missing-create-fail': 'Failed to create missing person:',
      'missing-update-success': 'Missing person updated successfully',
      'missing-update-fail': 'Failed to update missing person:',
      'missing-delete-success': 'Missing person deleted successfully',
      'missing-delete-fail': 'Failed to delete missing person:',
      'missing-table-name': 'Name',
      'missing-table-age': 'Age',
      'missing-table-height': 'Height',
      'missing-table-clothing': 'Clothing',
      'missing-table-photo': 'Photo URL',
      'missing-table-behavior': 'Behavior',
      'missing-table-prob-zones': 'Prob Zones'
    }
  },
  hu: {
    translation: {
      'header-title': 'Admin Irányítópult',
      'nav-users': 'Felhasználók',
      'nav-events': 'Események',
      'nav-map': 'Térkép',
      'nav-users-manager': 'Felhasználók Kezelő',
      'nav-help-editor': 'Súgó Szerkesztő',
      'nav-missing-persons-editor': 'Eltűnt Személyek Szerkesztő',
      'select-page': 'Válassz egy oldalt',
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
      'event-create-fail': 'Esemény létrehozása sikertelen:',
      // Új fordítások
      'users-manager-h2': 'Felhasználók Kezelő',
      'create-user-btn': 'Felhasználó Létrehozása',
      'delete-user-btn': 'Törlés',
      'update-user-btn': 'Frissítés',
      'full-name-label': 'Teljes Név:',
      'phone-label': 'Telefonszám:',
      'email-label': 'Email:',
      'password-label': 'Jelszó:',
      'active-label': 'Aktív:',
      'user-create-success': 'Felhasználó sikeresen létrehozva',
      'user-create-fail': 'Felhasználó létrehozása sikertelen:',
      'user-update-success': 'Felhasználó sikeresen frissítve',
      'user-update-fail': 'Felhasználó frissítése sikertelen:',
      'user-delete-success': 'Felhasználó sikeresen törölve',
      'user-delete-fail': 'Felhasználó törlése sikertelen:',
      'user-table-phone': 'Telefonszám',
      'user-table-active': 'Aktív',
      'help-editor-h2': 'Súgó Tartalom Szerkesztő',
      'section-label': 'Szakasz:',
      'text-hu-label': 'Szöveg HU:',
      'text-en-label': 'Szöveg EN:',
      'text-sk-label': 'Szöveg SK:',
      'text-ro-label': 'Szöveg RO:',
      'text-pl-label': 'Szöveg PL:',
      'create-help-btn': 'Súgó Bejegyzés Létrehozása',
      'update-help-btn': 'Frissítés',
      'delete-help-btn': 'Törlés',
      'help-create-success': 'Súgó bejegyzés sikeresen létrehozva',
      'help-create-fail': 'Súgó bejegyzés létrehozása sikertelen:',
      'help-update-success': 'Súgó bejegyzés sikeresen frissítve',
      'help-update-fail': 'Súgó bejegyzés frissítése sikertelen:',
      'help-delete-success': 'Súgó bejegyzés sikeresen törölve',
      'help-delete-fail': 'Súgó bejegyzés törlése sikertelen:',
      'help-table-section': 'Szakasz',
      'help-table-text-hu': 'Szöveg HU',
      'missing-persons-editor-h2': 'Eltűnt Személyek Szerkesztő',
      'event-id-label': 'Esemény ID:',
      'name-label': 'Név:',
      'age-label': 'Kor:',
      'height-label': 'Magasság (cm):',
      'clothing-label': 'Ruházat:',
      'photo-url-label': 'Fotó URL:',
      'behavior-category-label': 'Viselkedés Kategória:',
      'prob-zones-label': 'Valószínű Zónák (JSON):',
      'create-missing-btn': 'Eltűnt Személy Létrehozása',
      'update-missing-btn': 'Frissítés',
      'delete-missing-btn': 'Törlés',
      'missing-create-success': 'Eltűnt személy sikeresen létrehozva',
      'missing-create-fail': 'Eltűnt személy létrehozása sikertelen:',
      'missing-update-success': 'Eltűnt személy sikeresen frissítve',
      'missing-update-fail': 'Eltűnt személy frissítése sikertelen:',
      'missing-delete-success': 'Eltűnt személy sikeresen törölve',
      'missing-delete-fail': 'Eltűnt személy törlése sikertelen:',
      'missing-table-name': 'Név',
      'missing-table-age': 'Kor',
      'missing-table-height': 'Magasság',
      'missing-table-clothing': 'Ruházat',
      'missing-table-photo': 'Fotó URL',
      'missing-table-behavior': 'Viselkedés',
      'missing-table-prob-zones': 'Valószínű Zónák'
    }
  },
  sk: {
    translation: {
      'header-title': 'Administrátorský Panel',
      'nav-users': 'Používatelia',
      'nav-events': 'Udalosti',
      'nav-map': 'Mapa',
      'nav-users-manager': 'Správa Používateľov',
      'nav-help-editor': 'Editor Pomoci',
      'nav-missing-persons-editor': 'Editor Chýbajúcich Osôb',
      'select-page': 'Vyberte stránku',
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
      'event-create-fail': 'Vytvorenie udalosti zlyhalo:',
      // Új
      'users-manager-h2': 'Správa Používateľov',
      'create-user-btn': 'Vytvoriť Používateľa',
      'delete-user-btn': 'Vymazať',
      'update-user-btn': 'Aktualizovať',
      'full-name-label': 'Plné Meno:',
      'phone-label': 'Telefónne Číslo:',
      'email-label': 'Email:',
      'password-label': 'Heslo:',
      'active-label': 'Aktívny:',
      'user-create-success': 'Používateľ úspešne vytvorený',
      'user-create-fail': 'Vytvorenie používateľa zlyhalo:',
      'user-update-success': 'Používateľ úspešne aktualizovaný',
      'user-update-fail': 'Aktualizácia používateľa zlyhala:',
      'user-delete-success': 'Používateľ úspešne vymazaný',
      'user-delete-fail': 'Vymazanie používateľa zlyhalo:',
      'user-table-phone': 'Telefón',
      'user-table-active': 'Aktívny',
      'help-editor-h2': 'Editor Obsahu Pomoci',
      'section-label': 'Sekcia:',
      'text-hu-label': 'Text HU:',
      'text-en-label': 'Text EN:',
      'text-sk-label': 'Text SK:',
      'text-ro-label': 'Text RO:',
      'text-pl-label': 'Text PL:',
      'create-help-btn': 'Vytvoriť Záznam Pomoci',
      'update-help-btn': 'Aktualizovať',
      'delete-help-btn': 'Vymazať',
      'help-create-success': 'Záznam pomoci úspešne vytvorený',
      'help-create-fail': 'Vytvorenie záznamu pomoci zlyhalo:',
      'help-update-success': 'Záznam pomoci úspešne aktualizovaný',
      'help-update-fail': 'Aktualizácia záznamu pomoci zlyhala:',
      'help-delete-success': 'Záznam pomoci úspešne vymazaný',
      'help-delete-fail': 'Vymazanie záznamu pomoci zlyhalo:',
      'help-table-section': 'Sekcia',
      'help-table-text-hu': 'Text HU',
      'missing-persons-editor-h2': 'Editor Chýbajúcich Osôb',
      'event-id-label': 'ID Udalosti:',
      'name-label': 'Meno:',
      'age-label': 'Vek:',
      'height-label': 'Výška (cm):',
      'clothing-label': 'Oblečenie:',
      'photo-url-label': 'URL Fotky:',
      'behavior-category-label': 'Kategória Správania:',
      'prob-zones-label': 'Pravdepodobné Zóny (JSON):',
      'create-missing-btn': 'Vytvoriť Chýbajúcu Osobu',
      'update-missing-btn': 'Aktualizovať',
      'delete-missing-btn': 'Vymazať',
      'missing-create-success': 'Chýbajúca osoba úspešne vytvorená',
      'missing-create-fail': 'Vytvorenie chýbajúcej osoby zlyhalo:',
      'missing-update-success': 'Chýbajúca osoba úspešne aktualizovaná',
      'missing-update-fail': 'Aktualizácia chýbajúcej osoby zlyhala:',
      'missing-delete-success': 'Chýbajúca osoba úspešne vymazaná',
      'missing-delete-fail': 'Vymazanie chýbajúcej osoby zlyhalo:',
      'missing-table-name': 'Meno',
      'missing-table-age': 'Vek',
      'missing-table-height': 'Výška',
      'missing-table-clothing': 'Oblečenie',
      'missing-table-photo': 'URL Fotky',
      'missing-table-behavior': 'Správanie',
      'missing-table-prob-zones': 'Pravdepodobné Zóny'
    }
  },
  ro: {
    translation: {
      'header-title': 'Panou de Administrare',
      'nav-users': 'Utilizatori',
      'nav-events': 'Evenimente',
      'nav-map': 'Hartă',
      'nav-users-manager': 'Manager Utilizatori',
      'nav-help-editor': 'Editor Ajutor',
      'nav-missing-persons-editor': 'Editor Persoane Dispărute',
      'select-page': 'Selectați o pagină',
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
      'event-create-fail': 'Crearea evenimentului a eșuat:',
      // Új
      'users-manager-h2': 'Manager Utilizatori',
      'create-user-btn': 'Creare Utilizator',
      'delete-user-btn': 'Ștergere',
      'update-user-btn': 'Actualizare',
      'full-name-label': 'Nume Complet:',
      'phone-label': 'Număr de Telefon:',
      'email-label': 'Email:',
      'password-label': 'Parolă:',
      'active-label': 'Activ:',
      'user-create-success': 'Utilizator creat cu succes',
      'user-create-fail': 'Crearea utilizatorului a eșuat:',
      'user-update-success': 'Utilizator actualizat cu succes',
      'user-update-fail': 'Actualizarea utilizatorului a eșuat:',
      'user-delete-success': 'Utilizator șters cu succes',
      'user-delete-fail': 'Ștergerea utilizatorului a eșuat:',
      'user-table-phone': 'Telefon',
      'user-table-active': 'Activ',
      'help-editor-h2': 'Editor Conținut Ajutor',
      'section-label': 'Secțiune:',
      'text-hu-label': 'Text HU:',
      'text-en-label': 'Text EN:',
      'text-sk-label': 'Text SK:',
      'text-ro-label': 'Text RO:',
      'text-pl-label': 'Text PL:',
      'create-help-btn': 'Creare Intrare Ajutor',
      'update-help-btn': 'Actualizare',
      'delete-help-btn': 'Ștergere',
      'help-create-success': 'Intrare ajutor creată cu succes',
      'help-create-fail': 'Crearea intrării ajutor a eșuat:',
      'help-update-success': 'Intrare ajutor actualizată cu succes',
      'help-update-fail': 'Actualizarea intrării ajutor a eșuat:',
      'help-delete-success': 'Intrare ajutor ștearsă cu succes',
      'help-delete-fail': 'Ștergerea intrării ajutor a eșuat:',
      'help-table-section': 'Secțiune',
      'help-table-text-hu': 'Text HU',
      'missing-persons-editor-h2': 'Editor Persoane Dispărute',
      'event-id-label': 'ID Eveniment:',
      'name-label': 'Nume:',
      'age-label': 'Vârstă:',
      'height-label': 'Înălțime (cm):',
      'clothing-label': 'Îmbrăcăminte:',
      'photo-url-label': 'URL Foto:',
      'behavior-category-label': 'Categorie Comportament:',
      'prob-zones-label': 'Zone Probabile (JSON):',
      'create-missing-btn': 'Creare Persoană Dispărută',
      'update-missing-btn': 'Actualizare',
      'delete-missing-btn': 'Ștergere',
      'missing-create-success': 'Persoană dispărută creată cu succes',
      'missing-create-fail': 'Crearea persoanei dispărute a eșuat:',
      'missing-update-success': 'Persoană dispărută actualizată cu succes',
      'missing-update-fail': 'Actualizarea persoanei dispărute a eșuat:',
      'missing-delete-success': 'Persoană dispărută ștearsă cu succes',
      'missing-delete-fail': 'Ștergerea persoanei dispărute a eșuat:',
      'missing-table-name': 'Nume',
      'missing-table-age': 'Vârstă',
      'missing-table-height': 'Înălțime',
      'missing-table-clothing': 'Îmbrăcăminte',
      'missing-table-photo': 'URL Foto',
      'missing-table-behavior': 'Comportament',
      'missing-table-prob-zones': 'Zone Probabile'
    }
  },
  pl: {
    translation: {
      'header-title': 'Panel Administracyjny',
      'nav-users': 'Użytkownicy',
      'nav-events': 'Wydarzenia',
      'nav-map': 'Mapa',
      'nav-users-manager': 'Manager Użytkowników',
      'nav-help-editor': 'Edytor Pomocy',
      'nav-missing-persons-editor': 'Edytor Osób Zaginionych',
      'select-page': 'Wybierz stronę',
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
      'event-create-fail': 'Utworzenie wydarzenia nie powiodło się:',
      // Új
      'users-manager-h2': 'Manager Użytkowników',
      'create-user-btn': 'Utwórz Użytkownika',
      'delete-user-btn': 'Usuń',
      'update-user-btn': 'Aktualizuj',
      'full-name-label': 'Pełne Imię:',
      'phone-label': 'Numer Telefonu:',
      'email-label': 'Email:',
      'password-label': 'Hasło:',
      'active-label': 'Aktywny:',
      'user-create-success': 'Użytkownik utworzony pomyślnie',
      'user-create-fail': 'Utworzenie użytkownika nie powiodło się:',
      'user-update-success': 'Użytkownik zaktualizowany pomyślnie',
      'user-update-fail': 'Aktualizacja użytkownika nie powiodła się:',
      'user-delete-success': 'Użytkownik usunięty pomyślnie',
      'user-delete-fail': 'Usunięcie użytkownika nie powiodło się:',
      'user-table-phone': 'Telefon',
      'user-table-active': 'Aktywny',
      'help-editor-h2': 'Edytor Treści Pomocy',
      'section-label': 'Sekcja:',
      'text-hu-label': 'Tekst HU:',
      'text-en-label': 'Tekst EN:',
      'text-sk-label': 'Tekst SK:',
      'text-ro-label': 'Tekst RO:',
      'text-pl-label': 'Tekst PL:',
      'create-help-btn': 'Utwórz Wpis Pomocy',
      'update-help-btn': 'Aktualizuj',
      'delete-help-btn': 'Usuń',
      'help-create-success': 'Wpis pomocy utworzony pomyślnie',
      'help-create-fail': 'Utworzenie wpisu pomocy nie powiodło się:',
      'help-update-success': 'Wpis pomocy zaktualizowany pomyślnie',
      'help-update-fail': 'Aktualizacja wpisu pomocy nie powiodło się:',
      'help-delete-success': 'Wpis pomocy usunięty pomyślnie',
      'help-delete-fail': 'Usunięcie wpisu pomocy nie powiodło się:',
      'help-table-section': 'Sekcja',
      'help-table-text-hu': 'Tekst HU',
      'missing-persons-editor-h2': 'Edytor Osób Zaginionych',
      'event-id-label': 'ID Wydarzenia:',
      'name-label': 'Nazwa:',
      'age-label': 'Wiek:',
      'height-label': 'Wzrost (cm):',
      'clothing-label': 'Ubranie:',
      'photo-url-label': 'URL Zdjęcia:',
      'behavior-category-label': 'Kategoria Zachowania:',
      'prob-zones-label': 'Strefy Prawdopodobne (JSON):',
      'create-missing-btn': 'Utwórz Osobę Zaginioną',
      'update-missing-btn': 'Aktualizuj',
      'delete-missing-btn': 'Usuń',
      'missing-create-success': 'Osoba zaginiona utworzona pomyślnie',
      'missing-create-fail': 'Utworzenie osoby zaginionej nie powiodło się:',
      'missing-update-success': 'Osoba zaginiona zaktualizowana pomyślnie',
      'missing-update-fail': 'Aktualizacja osoby zaginionej nie powiodło się:',
      'missing-delete-success': 'Osoba zaginiona usunięta pomyślnie',
      'missing-delete-fail': 'Usunięcie osoby zaginionej nie powiodło się:',
      'missing-table-name': 'Nazwa',
      'missing-table-age': 'Wiek',
      'missing-table-height': 'Wzrost',
      'missing-table-clothing': 'Ubranie',
      'missing-table-photo': 'URL Zdjęcia',
      'missing-table-behavior': 'Zachowanie',
      'missing-table-prob-zones': 'Strefy Prawdopodobne'
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

export default MapComponent;''',

    'src/components/UsersManager.jsx': '''import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../supabase';

const UsersManager = () => {
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('searcher');
  const [active, setActive] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    const { data, error } = await supabase.from('users').select('*');
    if (error) alert('Error: ' + error.message);
    else setUsers(data);
  };

  const createUser = async (e) => {
    e.preventDefault();
    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
    if (authError) {
      alert(`${t('user-create-fail')} ${authError.message}`);
      return;
    }
    const { error } = await supabase.from('users').insert({
      id: authData.user.id,
      full_name: fullName,
      phone_number: phone,
      role,
      email,
      active
    });
    if (error) alert(`${t('user-create-fail')} ${error.message}`);
    else {
      alert(t('user-create-success'));
      loadUsers();
      resetForm();
    }
  };

  const updateUser = async (e) => {
    e.preventDefault();
    const updates = { full_name: fullName, phone_number: phone, role, active };
    if (password) {
      const { error: pwError } = await supabase.auth.updateUser({ password });
      if (pwError) alert(pwError.message);
    }
    const { error } = await supabase.from('users').update(updates).eq('id', selectedUser.id);
    if (error) alert(`${t('user-update-fail')} ${error.message}`);
    else {
      alert(t('user-update-success'));
      loadUsers();
      resetForm();
    }
  };

  const deleteUser = async (id) => {
    if (window.confirm('Biztos törölni?')) {
      const { error } = await supabase.from('users').delete().eq('id', id);
      if (error) alert(`${t('user-delete-fail')} ${error.message}`);
      else {
        alert(t('user-delete-success'));
        loadUsers();
      }
    }
  };

  const selectUser = (user) => {
    setSelectedUser(user);
    setFullName(user.full_name);
    setPhone(user.phone_number);
    setEmail(user.email);
    setRole(user.role);
    setActive(user.active);
    setPassword('');
  };

  const resetForm = () => {
    setSelectedUser(null);
    setFullName('');
    setPhone('');
    setEmail('');
    setPassword('');
    setRole('searcher');
    setActive(true);
  };

  return (
    <section>
      <h2>{t('users-manager-h2')}</h2>
      <table>
        <thead>
          <tr>
            <th>{t('user-table-id')}</th>
            <th>{t('user-table-email')}</th>
            <th>{t('user-table-fullname')}</th>
            <th>{t('user-table-phone')}</th>
            <th>{t('user-table-role')}</th>
            <th>{t('user-table-active')}</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id}>
              <td>{user.id}</td>
              <td>{user.email}</td>
              <td>{user.full_name}</td>
              <td>{user.phone_number}</td>
              <td>{user.role}</td>
              <td>{user.active ? 'Yes' : 'No'}</td>
              <td>
                <button onClick={() => selectUser(user)}>{t('update-user-btn')}</button>
                <button className="delete-btn" onClick={() => deleteUser(user.id)}>{t('delete-user-btn')}</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <form onSubmit={selectedUser ? updateUser : createUser}>
        <label>{t('full-name-label')}</label>
        <input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        <label>{t('phone-label')}</label>
        <input value={phone} onChange={(e) => setPhone(e.target.value)} required />
        <label>{t('email-label')}</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required={!selectedUser} disabled={!!selectedUser} />
        <label>{t('password-label')}</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required={!selectedUser} />
        <label>{t('role-label')}</label>
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="searcher">{t('role-searcher')}</option>
          <option value="coordinator">{t('role-coordinator')}</option>
        </select>
        <label>{t('active-label')}</label>
        <select value={active} onChange={(e) => setActive(e.target.value === 'true')}>
          <option value={true}>Yes</option>
          <option value={false}>No</option>
        </select>
        <button type="submit">{selectedUser ? t('update-user-btn') : t('create-user-btn')}</button>
        {selectedUser && <button type="button" onClick={resetForm}>Cancel</button>}
      </form>
    </section>
  );
};

export default UsersManager;''',

    'src/components/HelpEditor.jsx': '''import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../supabase';

const HelpEditor = () => {
  const { t } = useTranslation();
  const [helpItems, setHelpItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [section, setSection] = useState('');
  const [textHu, setTextHu] = useState('');
  const [textEn, setTextEn] = useState('');
  const [textSk, setTextSk] = useState('');
  const [textRo, setTextRo] = useState('');
  const [textPl, setTextPl] = useState('');

  useEffect(() => {
    loadHelp();
  }, []);

  const loadHelp = async () => {
    const { data, error } = await supabase.from('help_content').select('*');
    if (error) alert('Error: ' + error.message);
    else setHelpItems(data);
  };

  const createHelp = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('help_content').insert({
      section,
      text_hu: textHu,
      text_en: textEn,
      text_sk: textSk,
      text_ro: textRo,
      text_pl: textPl
    });
    if (error) alert(`${t('help-create-fail')} ${error.message}`);
    else {
      alert(t('help-create-success'));
      loadHelp();
      resetForm();
    }
  };

  const updateHelp = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('help_content').update({
      section,
      text_hu: textHu,
      text_en: textEn,
      text_sk: textSk,
      text_ro: textRo,
      text_pl: textPl
    }).eq('id', selectedItem.id);
    if (error) alert(`${t('help-update-fail')} ${error.message}`);
    else {
      alert(t('help-update-success'));
      loadHelp();
      resetForm();
    }
  };

  const deleteHelp = async (id) => {
    if (window.confirm('Biztos törölni?')) {
      const { error } = await supabase.from('help_content').delete().eq('id', id);
      if (error) alert(`${t('help-delete-fail')} ${error.message}`);
      else {
        alert(t('help-delete-success'));
        loadHelp();
      }
    }
  };

  const selectItem = (item) => {
    setSelectedItem(item);
    setSection(item.section);
    setTextHu(item.text_hu);
    setTextEn(item.text_en);
    setTextSk(item.text_sk);
    setTextRo(item.text_ro);
    setTextPl(item.text_pl);
  };

  const resetForm = () => {
    setSelectedItem(null);
    setSection('');
    setTextHu('');
    setTextEn('');
    setTextSk('');
    setTextRo('');
    setTextPl('');
  };

  return (
    <section>
      <h2>{t('help-editor-h2')}</h2>
      <table>
        <thead>
          <tr>
            <th>{t('user-table-id')}</th>
            <th>{t('help-table-section')}</th>
            <th>{t('help-table-text-hu')}</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {helpItems.map(item => (
            <tr key={item.id}>
              <td>{item.id}</td>
              <td>{item.section}</td>
              <td>{item.text_hu}</td>
              <td>
                <button onClick={() => selectItem(item)}>{t('update-help-btn')}</button>
                <button className="delete-btn" onClick={() => deleteHelp(item.id)}>{t('delete-help-btn')}</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <form onSubmit={selectedItem ? updateHelp : createHelp}>
        <label>{t('section-label')}</label>
        <input value={section} onChange={(e) => setSection(e.target.value)} required />
        <label>{t('text-hu-label')}</label>
        <input value={textHu} onChange={(e) => setTextHu(e.target.value)} />
        <label>{t('text-en-label')}</label>
        <input value={textEn} onChange={(e) => setTextEn(e.target.value)} />
        <label>{t('text-sk-label')}</label>
        <input value={textSk} onChange={(e) => setTextSk(e.target.value)} />
        <label>{t('text-ro-label')}</label>
        <input value={textRo} onChange={(e) => setTextRo(e.target.value)} />
        <label>{t('text-pl-label')}</label>
        <input value={textPl} onChange={(e) => setTextPl(e.target.value)} />
        <button type="submit">{selectedItem ? t('update-help-btn') : t('create-help-btn')}</button>
        {selectedItem && <button type="button" onClick={resetForm}>Cancel</button>}
      </form>
    </section>
  );
};

export default HelpEditor;''',

    'src/components/MissingPersonsEditor.jsx': '''import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../supabase';

const MissingPersonsEditor = () => {
  const { t } = useTranslation();
  const [missingPersons, setMissingPersons] = useState([]);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [eventId, setEventId] = useState('');
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [clothing, setClothing] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [behaviorCategory, setBehaviorCategory] = useState('');
  const [probZones, setProbZones] = useState('');

  useEffect(() => {
    loadMissing();
  }, []);

  const loadMissing = async () => {
    const { data, error } = await supabase.from('missing_persons').select('*');
    if (error) alert('Error: ' + error.message);
    else setMissingPersons(data);
  };

  const createMissing = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('missing_persons').insert({
      event_id: eventId,
      name,
      age: parseInt(age),
      height_cm: parseInt(height),
      clothing,
      photo_url: photoUrl,
      behavior_category: behaviorCategory,
      prob_zones: JSON.parse(probZones)
    });
    if (error) alert(`${t('missing-create-fail')} ${error.message}`);
    else {
      alert(t('missing-create-success'));
      loadMissing();
      resetForm();
    }
  };

  const updateMissing = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('missing_persons').update({
      event_id: eventId,
      name,
      age: parseInt(age),
      height_cm: parseInt(height),
      clothing,
      photo_url: photoUrl,
      behavior_category: behaviorCategory,
      prob_zones: JSON.parse(probZones)
    }).eq('id', selectedPerson.id);
    if (error) alert(`${t('missing-update-fail')} ${error.message}`);
    else {
      alert(t('missing-update-success'));
      loadMissing();
      resetForm();
    }
  };

  const deleteMissing = async (id) => {
    if (window.confirm('Biztos törölni?')) {
      const { error } = await supabase.from('missing_persons').delete().eq('id', id);
      if (error) alert(`${t('missing-delete-fail')} ${error.message}`);
      else {
        alert(t('missing-delete-success'));
        loadMissing();
      }
    }
  };

  const selectPerson = (person) => {
    setSelectedPerson(person);
    setEventId(person.event_id);
    setName(person.name);
    setAge(person.age || '');
    setHeight(person.height_cm || '');
    setClothing(person.clothing || '');
    setPhotoUrl(person.photo_url || '');
    setBehaviorCategory(person.behavior_category || '');
    setProbZones(JSON.stringify(person.prob_zones || {}));
  };

  const resetForm = () => {
    setSelectedPerson(null);
    setEventId('');
    setName('');
    setAge('');
    setHeight('');
    setClothing('');
    setPhotoUrl('');
    setBehaviorCategory('');
    setProbZones('');
  };

  return (
    <section>
      <h2>{t('missing-persons-editor-h2')}</h2>
      <table>
        <thead>
          <tr>
            <th>{t('user-table-id')}</th>
            <th>{t('event-id-label')}</th>
            <th>{t('missing-table-name')}</th>
            <th>{t('missing-table-age')}</th>
            <th>{t('missing-table-height')}</th>
            <th>{t('missing-table-clothing')}</th>
            <th>{t('missing-table-photo')}</th>
            <th>{t('missing-table-behavior')}</th>
            <th>{t('missing-table-prob-zones')}</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {missingPersons.map(person => (
            <tr key={person.id}>
              <td>{person.id}</td>
              <td>{person.event_id}</td>
              <td>{person.name}</td>
              <td>{person.age}</td>
              <td>{person.height_cm}</td>
              <td>{person.clothing}</td>
              <td>{person.photo_url}</td>
              <td>{person.behavior_category}</td>
              <td>{JSON.stringify(person.prob_zones)}</td>
              <td>
                <button onClick={() => selectPerson(person)}>{t('update-missing-btn')}</button>
                <button className="delete-btn" onClick={() => deleteMissing(person.id)}>{t('delete-missing-btn')}</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <form onSubmit={selectedPerson ? updateMissing : createMissing}>
        <label>{t('event-id-label')}</label>
        <input value={eventId} onChange={(e) => setEventId(e.target.value)} required />
        <label>{t('name-label')}</label>
        <input value={name} onChange={(e) => setName(e.target.value)} required />
        <label>{t('age-label')}</label>
        <input type="number" value={age} onChange={(e) => setAge(e.target.value)} />
        <label>{t('height-label')}</label>
        <input type="number" value={height} onChange={(e) => setHeight(e.target.value)} />
        <label>{t('clothing-label')}</label>
        <input value={clothing} onChange={(e) => setClothing(e.target.value)} />
        <label>{t('photo-url-label')}</label>
        <input value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} />
        <label>{t('behavior-category-label')}</label>
        <input value={behaviorCategory} onChange={(e) => setBehaviorCategory(e.target.value)} />
        <label>{t('prob-zones-label')}</label>
        <input value={probZones} onChange={(e) => setProbZones(e.target.value)} />
        <button type="submit">{selectedPerson ? t('update-missing-btn') : t('create-missing-btn')}</button>
        {selectedPerson && <button type="button" onClick={resetForm}>Cancel</button>}
      </form>
    </section>
  );
};

export default MissingPersonsEditor;'''
}

# Fájlok írása
for rel_path, content in files.items():
    full_path = os.path.join(base_dir, rel_path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, 'w', encoding='utf-8') as f:
        f.write(content)

print(f"Projekt fájlok frissítve a {base_dir} mappában.")
print("Most nyisd meg a terminált, cd a mappába, és futtasd: npm install")
print("Majd: npm run dev a fejlesztéshez.")
print("Ne felejtsd hozzáadni az 'active' oszlopot a users táblához Supabase-ben!")