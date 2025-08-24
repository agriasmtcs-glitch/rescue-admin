#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Sun Aug 24 16:13:54 2025

@author: szamosiattila
"""

import os

# Create the main directory
os.makedirs('admin_website', exist_ok=True)

# Create subdirectories
os.makedirs('admin_website/css', exist_ok=True)
os.makedirs('admin_website/js', exist_ok=True)

# Create index.html
with open('admin_website/index.html', 'w', encoding='utf-8') as f:
    f.write('''
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Dashboard - SAR Coord App</title>
    <link rel="stylesheet" href="css/style.css">
    <script src="https://unpkg.com/@supabase/supabase-js@2"></script>
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
</head>
<body>
    <header>
        <h1>Admin Dashboard</h1>
        <nav>
            <a href="#users">Users</a>
            <a href="#events">Events</a>
            <a href="#map">Map</a>
        </nav>
    </header>
    <main>
        <section id="users">
            <h2>User Management</h2>
            <div id="user-list"></div>
            <form id="role-form">
                <label for="user-id">User ID:</label>
                <input type="text" id="user-id" required>
                <label for="role">Role:</label>
                <select id="role">
                    <option value="searcher">Searcher</option>
                    <option value="coordinator">Coordinator</option>
                </select>
                <button type="submit">Update Role</button>
            </form>
        </section>
        <section id="events">
            <h2>Event Management</h2>
            <div id="event-list"></div>
            <form id="event-form">
                <label for="event-name">Event Name:</label>
                <input type="text" id="event-name" required>
                <button type="submit">Create Event</button>
            </form>
        </section>
        <section id="map">
            <h2>Live Map</h2>
            <div id="map" style="height: 500px;"></div>
        </section>
    </main>
    <script src="js/script.js"></script>
</body>
</html>
    ''')

# Create css/style.css
with open('admin_website/css/style.css', 'w', encoding='utf-8') as f:
    f.write('''
body {
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
#user-list, #event-list {
    margin-bottom: 20px;
}
#user-list table, #event-list table {
    width: 100%;
    border-collapse: collapse;
}
#user-list table th, #user-list table td, #event-list table th, #event-list table td {
    border: 1px solid #ddd;
    padding: 8px;
    text-align: left;
}
#user-list table th, #event-list table th {
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
#map {
    border: 1px solid #ddd;
    border-radius: 4px;
}
    ''')

# Create js/script.js
with open('admin_website/js/script.js', 'w', encoding='utf-8') as f:
    f.write('''
const supabaseUrl = 'https://opwwrcfsbqlcxnuhxshp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wd3dyY2ZzYnFsY3hudWh4c2hwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2NzMxNTIsImV4cCI6MjA3MTI0OTE1Mn0.wehFwM69ob0rAj0MteWLueKVrq9Rq2bh_HYvKs448lw';
const supabase = Supabase.createClient(supabaseUrl, supabaseKey);

// Function to load users
async function loadUsers() {
    const { data, error } = await supabase.from('users').select('*');
    if (error) {
        console.error('Error loading users:', error);
        return;
    }
    const userList = document.getElementById('user-list');
    userList.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Email</th>
                    <th>Full Name</th>
                    <th>Role</th>
                </tr>
            </thead>
            <tbody>
                ${data.map(user => `
                    <tr>
                        <td>${user.id}</td>
                        <td>${user.email}</td>
                        <td>${user.full_name}</td>
                        <td>${user.role}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// Function to update user role
document.getElementById('role-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const userId = document.getElementById('user-id').value;
    const role = document.getElementById('role').value;
    const { error } = await supabase.from('users').update({ role }).eq('id', userId);
    if (error) {
        console.error('Error updating role:', error);
        alert('Failed to update role: ' + error.message);
    } else {
        alert('Role updated successfully');
        loadUsers();
    }
});

// Function to load events
async function loadEvents() {
    const { data, error } = await supabase.from('search_events').select('*');
    if (error) {
        console.error('Error loading events:', error);
        return;
    }
    const eventList = document.getElementById('event-list');
    eventList.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Status</th>
                    <th>Start Time</th>
                </tr>
            </thead>
            <tbody>
                ${data.map(event => `
                    <tr>
                        <td>${event.id}</td>
                        <td>${event.name}</td>
                        <td>${event.status}</td>
                        <td>${new Date(event.start_time).toLocaleString()}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// Function to create event
document.getElementById('event-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('event-name').value;
    const { error } = await supabase.from('search_events').insert({
        name,
        status: 'active',
        start_time: new Date().toISOString(),
        coordinator_id: 'your_admin_user_id' // Replace with actual admin user ID
    });
    if (error) {
        console.error('Error creating event:', error);
        alert('Failed to create event: ' + error.message);
    } else {
        alert('Event created successfully');
        loadEvents();
    }
});

// Function to initialize map
function initMap() {
    const map = L.map('map').setView([47.4979, 19.0402], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);
    // Add zoom controls
    map.addControl(new L.Control.Zoom({ position: 'bottomright' }));
    // Fetch live data from Supabase
    loadMarkers(map);
}

async function loadMarkers(map) {
    const { data, error } = await supabase.from('markers').select('*');
    if (error) {
        console.error('Error loading markers:', error);
        return;
    }
    data.forEach(marker => {
        if (marker.lat_lng && marker.lat_lng.coordinates) {
            L.marker([marker.lat_lng.coordinates[1], marker.lat_lng.coordinates[0]])
                .addTo(map)
                .bindPopup(`Marker ID: ${marker.id}<br>Type: ${marker.type || 'N/A'}`);
        }
    });
}

// Load data on page load
document.addEventListener('DOMContentLoaded', () => {
    loadUsers();
    loadEvents();
    initMap();
});
    ''')

# Create README.md
with open('admin_website/README.md', 'w', encoding='utf-8') as f:
    f.write('''
# Admin Dashboard - SAR Coord App

This is a static admin dashboard hosted on GitHub Pages for managing the SAR Coord App and Supabase.

## Setup
1. Replace `your_supabase_url` and `your_supabase_key` in `js/script.js` with your Supabase credentials.
2. Replace `your_admin_user_id` in `js/script.js` with the admin user ID from the `users` table.
3. Deploy to GitHub Pages:
   - Create a new GitHub repository.
   - Push the `admin_website` directory to the repository.
   - Enable GitHub Pages in the repository settings (use the `main` branch or `gh-pages` branch).
4. Access the dashboard at `https://<your-username>.github.io/<repository-name>`.

## Features
- **User Management**: View users and update their roles (searcher/coordinator).
- **Event Management**: View and create events.
- **Live Map**: Display markers from the `markers` table using Leaflet.js.

## Dependencies
- Supabase JavaScript client
- Leaflet.js for map rendering
    ''')

print("Admin website structure created in 'admin_website' directory.")