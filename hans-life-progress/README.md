# Hans' Life Progress Tracker

A beautiful, premium client-side web application designed to track and manage life goals and progress tasks synced directly with your **Craft Docs** workspace.

## Features

- **Dynamic Year Progress Gauge**: Visualizes the percentage of the current year elapsed with motivational, day-by-day subtext.
- **Task Statistics Dashboard**: At-a-glance view of Completed, In Progress, To-Do, and Overdue tasks. Clicking cards filters the main task view.
- **Timeline Roadmap**: A gorgeous vertical roadmap that lists your life events and goals chronologically, pointing out your "Current Focus".
- **Kanban Board**: A classic status columns board with quick action controls to easily move tasks between statuses.
- **Task Directory**: A full list view with title search, status filters, timeframe status filters, table sorting, inline editing, and deletion.
- **Toast Status System**: Fluid, color-coded notification alerts indicating connection syncing states.
- **Dark & Light Themes**: Auto-saves your preferred style aesthetic using browser localStorage.

## File Structure

- [index.html](file:///Users/hanzaw/Documents/Coding/hans-life-progress/index.html): Structure, imports, layouts, modals, and container elements.
- [styles.css](file:///Users/hanzaw/Documents/Coding/hans-life-progress/styles.css): Custom variables, glassmorphic layout styles, circular progress indicators, and keyframe animations.
- [app.js](file:///Users/hanzaw/Documents/Coding/hans-life-progress/app.js): Application state, year calculations, Craft API query handlers, views rendering, and form validation logic.

## Running Locally

Because Python is installed on your computer, you can run a local web server with a single terminal command:

1. Open your terminal.
2. Navigate to the project folder:
   ```bash
   cd /Users/hanzaw/Documents/Coding/hans-life-progress
   ```
3. Start the Python server:
   ```bash
   python3 -m http.server 8000
   ```
4. Open your browser and navigate to:
   [http://localhost:8000](http://localhost:8000)

## Craft Docs Sync Details

This web application syncs in real-time with the Craft Collection database. It uses your unique space connection endpoint:
`https://connect.craft.do/links/G3m5KGCYJN8/api/v1`

Changes made to items (updating titles, moving status, setting due dates, or deleting) will immediately be written back to your Craft document:
- Document: **Life Progress**
- Collection Name: **Timeline**
- Collection ID: `37B620E7-5713-424E-80D3-77F60F2023CD`
