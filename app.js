// User data structure for storing preferences and saved sessions
let userData = {
    savedSessions: [],
    schedules: {
        schedule1: [],
        schedule2: [],
        schedule3: [],
    },
    sessionPriorities: {},
    sessionNotes: {},
    settings: {
        highContrast: false,
        largeText: false
    }
};

// Load class data
const classData = [
    // This will be populated from the JSON file
];

// DOM Elements
const searchInput = document.getElementById('searchInput');
const dayFilter = document.getElementById('dayFilter');
const typeFilter = document.getElementById('typeFilter');
const sessionsList = document.getElementById('sessionsList');
const savedSessionsList = document.getElementById('savedSessionsList');
const timelineGrid = document.getElementById('timelineGrid');
const highContrastToggle = document.getElementById('highContrastToggle');
const largeTextToggle = document.getElementById('largeTextToggle');

// Initialize the application
async function initializeApp() {
    try {
        // Load class data from JSON file
        const response = await fetch('costume_college_subset_classes.json');
        const data = await response.json();
        classData.push(...data);
        
        // Load user data from localStorage if available
        const savedUserData = localStorage.getItem('costumeCollegeUserData');
        if (savedUserData) {
            userData = JSON.parse(savedUserData);
            applyUserSettings();
        }
        
        // Initialize the UI
        renderSessions();
        renderTimeline();
        setupEventListeners();
        
    } catch (error) {
        console.error('Error initializing app:', error);
        showError('Failed to load class data. Please refresh the page.');
    }
}

// Event Listeners Setup
function setupEventListeners() {
    // Search and filter events
    searchInput.addEventListener('input', renderSessions);
    dayFilter.addEventListener('change', renderSessions);
    typeFilter.addEventListener('change', renderSessions);
    
    // Accessibility toggles
    highContrastToggle.addEventListener('click', toggleHighContrast);
    largeTextToggle.addEventListener('click', toggleLargeText);
    
    // Schedule tab events
    document.querySelectorAll('.schedule-tab').forEach(tab => {
        tab.addEventListener('click', (e) => switchSchedule(e.target.dataset.schedule));
    });
    
    // Export and print buttons
    document.getElementById('exportSchedule').addEventListener('click', exportSchedule);
    document.getElementById('printSchedule').addEventListener('click', () => window.print());
}

// Render session cards
function renderSessions() {
    const searchTerm = searchInput.value.toLowerCase();
    const selectedDay = dayFilter.value;
    const selectedType = typeFilter.value;
    
    const filteredSessions = classData.filter(session => {
        const matchesSearch = session.Title.toLowerCase().includes(searchTerm) ||
                            session.Description.toLowerCase().includes(searchTerm) ||
                            session.Teacher.toLowerCase().includes(searchTerm);
        const matchesDay = selectedDay === 'all' || session.Time.includes(selectedDay);
        const matchesType = selectedType === 'all' || session.Type === selectedType;
        
        return matchesSearch && matchesDay && matchesType;
    });
    
    sessionsList.innerHTML = filteredSessions.map(session => createSessionCard(session)).join('');
    
    // Add event listeners to the new cards
    document.querySelectorAll('.session-card .save-session').forEach(button => {
        button.addEventListener('click', (e) => saveSession(e.target.dataset.sessionId));
    });
}

// Create HTML for a session card
function createSessionCard(session) {
    const isWorkshop = session.Type === 'Workshop';
    const cardClass = isWorkshop ? 'workshop' : 'lecture';
    const kitFeeInfo = session.KitFee ? `Kit Fee: ${session.KitFee}` : 'No kit fee';
    
    return `
        <div class="session-card ${cardClass}">
            <h3>${session.Title}</h3>
            <div class="session-info">
                <p><strong>${session.Time}</strong> | ${session.Location}</p>
                <p><strong>Instructor:</strong> ${session.Teacher}</p>
                <p><strong>Type:</strong> ${session.Type} | ${kitFeeInfo}</p>
            </div>
            <p class="session-description">${session.Description}</p>
            ${session.KitContents ? `<p><strong>Kit Contents:</strong> ${session.KitContents}</p>` : ''}
            ${session.StudentProvides ? `<p><strong>Student Provides:</strong> ${session.StudentProvides}</p>` : ''}
            <div class="session-actions">
                <button class="save-session" data-session-id="${session.Title}">
                    ${isSessionSaved(session.Title) ? 'Remove from Schedule' : 'Add to Schedule'}
                </button>
                <button class="set-priority" data-session-id="${session.Title}">Set Priority</button>
            </div>
        </div>
    `;
}

// Save/remove session from schedule
function saveSession(sessionId) {
    const activeSchedule = document.querySelector('.schedule-tab.active').dataset.schedule;
    const sessionIndex = userData.schedules[activeSchedule].indexOf(sessionId);
    
    if (sessionIndex === -1) {
        // Add to schedule
        if (!checkTimeConflict(sessionId, activeSchedule)) {
            userData.schedules[activeSchedule].push(sessionId);
        } else {
            showError('Time conflict detected! Please check your schedule.');
            return;
        }
    } else {
        // Remove from schedule
        userData.schedules[activeSchedule].splice(sessionIndex, 1);
    }
    
    saveUserData();
    renderSessions();
    renderSavedSessions();
    renderTimeline();
}

// Check for time conflicts
function checkTimeConflict(newSessionId, scheduleId) {
    const newSession = classData.find(s => s.Title === newSessionId);
    const [newStartTime, newEndTime] = parseSessionTime(newSession.Time);
    
    return userData.schedules[scheduleId].some(existingSessionId => {
        const existingSession = classData.find(s => s.Title === existingSessionId);
        const [existingStartTime, existingEndTime] = parseSessionTime(existingSession.Time);
        
        return (newStartTime < existingEndTime && newEndTime > existingStartTime);
    });
}

// Parse session time string into Date objects
function parseSessionTime(timeString) {
    const [day, time] = timeString.split(', ');
    const [startTime, endTime] = time.split(' - ');
    
    const baseDate = new Date();
    const startDate = new Date(baseDate.toDateString() + ' ' + startTime);
    const endDate = new Date(baseDate.toDateString() + ' ' + endTime);
    
    return [startDate, endDate];
}

// Render saved sessions
function renderSavedSessions() {
    const activeSchedule = document.querySelector('.schedule-tab.active').dataset.schedule;
    const savedSessionIds = userData.schedules[activeSchedule];
    
    const savedSessionsHTML = savedSessionIds.map(sessionId => {
        const session = classData.find(s => s.Title === sessionId);
        const priority = userData.sessionPriorities[sessionId] || 'none';
        
        return `
            <div class="saved-session-card priority-${priority}">
                <h4>${session.Title}</h4>
                <p>${session.Time}</p>
                <p>${session.Location}</p>
                <div class="saved-session-actions">
                    <button onclick="removeFromSchedule('${sessionId}')">Remove</button>
                    <select onchange="setPriority('${sessionId}', this.value)">
                        <option value="none" ${priority === 'none' ? 'selected' : ''}>No Priority</option>
                        <option value="1" ${priority === '1' ? 'selected' : ''}>Priority 1</option>
                        <option value="2" ${priority === '2' ? 'selected' : ''}>Priority 2</option>
                        <option value="3" ${priority === '3' ? 'selected' : ''}>Priority 3</option>
                    </select>
                </div>
            </div>
        `;
    }).join('');
    
    savedSessionsList.innerHTML = savedSessionsHTML || '<p>No sessions saved yet.</p>';
}

// Render timeline view
function renderTimeline() {
    const activeSchedule = document.querySelector('.schedule-tab.active').dataset.schedule;
    const savedSessionIds = userData.schedules[activeSchedule];
    
    // Create time slots
    const timeSlots = Array.from({ length: 24 }, (_, i) => {
        const hour = i % 12 || 12;
        const ampm = i < 12 ? 'AM' : 'PM';
        return `<div class="timeline-hour">${hour}:00 ${ampm}</div>`;
    });
    
    // Add saved sessions to timeline
    savedSessionIds.forEach(sessionId => {
        const session = classData.find(s => s.Title === sessionId);
        const [startTime, endTime] = parseSessionTime(session.Time);
        const duration = (endTime - startTime) / (1000 * 60 * 60); // Duration in hours
        const startHour = startTime.getHours();
        
        const sessionElement = document.createElement('div');
        sessionElement.className = `timeline-session ${session.Type.toLowerCase()}`;
        sessionElement.style.gridColumn = `${startHour + 2} / span ${duration}`;
        sessionElement.innerHTML = `
            <div class="timeline-session-content">
                <h4>${session.Title}</h4>
                <p>${session.Time}</p>
            </div>
        `;
        
        timelineGrid.appendChild(sessionElement);
    });
    
    timelineGrid.innerHTML = timeSlots.join('');
}

// Export schedule
function exportSchedule() {
    const activeSchedule = document.querySelector('.schedule-tab.active').dataset.schedule;
    const savedSessionIds = userData.schedules[activeSchedule];
    
    const scheduleData = savedSessionIds.map(sessionId => {
        const session = classData.find(s => s.Title === sessionId);
        return {
            title: session.Title,
            time: session.Time,
            location: session.Location,
            type: session.Type,
            priority: userData.sessionPriorities[sessionId] || 'none'
        };
    });
    
    const blob = new Blob([JSON.stringify(scheduleData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `costume-college-schedule-${activeSchedule}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Accessibility Toggles
function toggleHighContrast() {
    userData.settings.highContrast = !userData.settings.highContrast;
    document.body.dataset.highContrast = userData.settings.highContrast;
    saveUserData();
}

function toggleLargeText() {
    userData.settings.largeText = !userData.settings.largeText;
    document.body.dataset.largeText = userData.settings.largeText;
    saveUserData();
}

// Apply user settings
function applyUserSettings() {
    document.body.dataset.highContrast = userData.settings.highContrast;
    document.body.dataset.largeText = userData.settings.largeText;
}

// Save user data to localStorage
function saveUserData() {
    localStorage.setItem('costumeCollegeUserData', JSON.stringify(userData));
}

// Helper function to check if a session is saved
function isSessionSaved(sessionId) {
    const activeSchedule = document.querySelector('.schedule-tab.active').dataset.schedule;
    return userData.schedules[activeSchedule].includes(sessionId);
}

// Show error message
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
        errorDiv.remove();
    }, 3000);
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp); 