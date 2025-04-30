# Costume College Agenda Builder

A web application to help attendees plan their schedules for the annual Costume College costuming arts conference.

## Features

- Browse and search available classes
- Filter by day and class type (Workshop/Lecture)
- Save sessions to multiple schedules (Primary + 2 Alternates)
- Priority tagging for saved sessions
- Timeline view to visualize your schedule
- Conflict detection when scheduling overlapping sessions
- High contrast and large text modes for accessibility
- Export and print functionality
- Responsive design for all screen sizes
- Local storage to save your data

## Setup

1. Clone or download this repository
2. Open `index.html` in a modern web browser
   - For local development, you'll need to serve the files through a local web server due to CORS restrictions when loading the JSON file
   - You can use Python's built-in server: `python -m http.server` or any other local server solution

## Usage

1. Browse available sessions in the left panel
   - Use the search box to find specific topics or instructors
   - Filter by day and session type
   - Click on a session card to see full details

2. Save sessions to your schedule
   - Click "Add to Schedule" to save a session
   - Set priority levels (1-3) for your saved sessions
   - The app will warn you about time conflicts

3. Manage multiple schedules
   - Switch between Primary and Alternate schedules using the tabs
   - Perfect for planning backup options if workshops are full

4. View your schedule
   - See your saved sessions in a list view
   - Check the timeline view for a visual representation
   - Export or print your schedule

## Accessibility Features

- High contrast mode toggle (🌓 button)
- Large text mode toggle (Aa button)
- Keyboard navigation support
- ARIA labels for screen readers
- Mobile responsive design

## Data Storage

All user data (saved sessions, preferences) is stored in your browser's localStorage. This means:
- Your data persists between sessions
- No account required
- Data stays private on your device
- Clear your browser data to reset

## Browser Support

Tested and supported on:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

Feel free to submit issues and enhancement requests!

## License

MIT License - feel free to use and modify for your own purposes. 