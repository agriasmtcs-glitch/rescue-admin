
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
    