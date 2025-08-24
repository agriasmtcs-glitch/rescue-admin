const supabaseUrl = 'https://opwwrcfsbqlcxnuhxshp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wd3dyY2ZzYnFsY3hudWh4c2hwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2NzMxNTIsImV4cCI6MjA3MTI0OTE1Mn0.wehFwM69ob0rAj0MteWLueKVrq9Rq2bh_HYvKs448lw';
const supabase = Supabase.createClient(supabaseUrl, supabaseKey);

// Function to check if user is admin
async function checkAdmin() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.user_metadata?.role !== 'admin') {
        document.body.innerHTML = '<h1>Please log in as admin</h1>' + document.body.innerHTML;
        showLoginForm();
        return false;
    }
    return true;
}

// Function to show login form
function showLoginForm() {
    const loginDiv = document.createElement('div');
    loginDiv.innerHTML = `
        <form id="login-form">
            <label for="email">Email:</label>
            <input type="email" id="email" required>
            <label for="password">Password:</label>
            <input type="password" id="password" required>
            <button type="submit">Login</button>
        </form>
    `;
    document.body.prepend(loginDiv);
    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            alert('Login failed: ' + error.message);
        } else {
            loginDiv.remove();
            loadUsers();
            loadEvents();
            initMap();
        }
    });
}

// Function to load users
async function loadUsers() {
    const isAdmin = await checkAdmin();
    if (!isAdmin) return;
    const { data, error } = await supabase.from('users').select('*');
    if (error) {
        console.error('Error loading users:', error);
        alert('Failed to load users: ' + error.message);
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
    const isAdmin = await checkAdmin();
    if (!isAdmin) return;
    const userId = document.getElementById('user-id').value;
    const role = document.getElementById('role').value;
    // Update role in users table
    const { error: userError } = await supabase.from('users').update({ role }).eq('id', userId);
    if (userError) {
        console.error('Error updating role in users:', userError);
        alert('Failed to update role in users: ' + userError.message);
        return;
    }
    // Update role in auth.users raw_user_meta_data
    const { error: authError } = await supabase.auth.admin.updateUserById(userId, {
        user_metadata: { role }
    });
    if (authError) {
        console.error('Error updating role in auth.users:', authError);
        alert('Failed to update role in auth.users: ' + authError.message);
    } else {
        alert('Role updated successfully');
        loadUsers();
    }
});

// Function to load events
async function loadEvents() {
    const isAdmin = await checkAdmin();
    if (!isAdmin) return;
    const { data, error } = await supabase.from('search_events').select('*');
    if (error) {
        console.error('Error loading events:', error);
        alert('Failed to load events: ' + error.message);
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
    const isAdmin = await checkAdmin();
    if (!isAdmin) return;
    const name = document.getElementById('event-name').value;
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('search_events').insert({
        name,
        status: 'active',
        start_time: new Date().toISOString(),
        coordinator_id: user.id
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
        alert('Failed to load markers: ' + error.message);
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
    checkAdmin();
});